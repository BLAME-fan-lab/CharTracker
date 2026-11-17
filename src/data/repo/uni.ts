import { todayStr, type DateStr } from '../../lib/dates'
import { alive, byOrder, changed, created } from '../base'
import { db } from '../db'
import type { BaseRecord, Module, Semester, StudyUnit, StudyUnitType } from '../types'

/* ---------- Semester ---------- */

export async function getActiveSemester(): Promise<Semester | undefined> {
  const semesters = (await db.semesters.toArray()).filter(alive)
  return semesters.find((s) => s.active) ?? semesters.at(-1)
}

export async function updateSemester(id: string, patch: Partial<Omit<Semester, keyof BaseRecord>>): Promise<void> {
  await db.semesters.update(id, changed(patch))
}

/* ---------- Module ---------- */

/** Module des aktiven Semesters (ohne archivierte), sortiert. */
export async function listActiveModules(): Promise<Module[]> {
  const semester = await getActiveSemester()
  if (!semester) return []
  const modules = await db.modules.where('semesterId').equals(semester.id).toArray()
  return modules.filter((m) => alive(m) && !m.archived).sort(byOrder)
}

/** Alle Module (auch archivierte/andere Semester) – für Namen in alten Einträgen. */
export async function listAllModules(): Promise<Module[]> {
  return (await db.modules.toArray()).filter(alive).sort(byOrder)
}

export async function createModule(semesterId: string, name: string, shortName: string): Promise<string> {
  const modules = (await listAllModules()).filter((m) => m.semesterId === semesterId)
  const order = modules.reduce((max, m) => Math.max(max, m.order), -1) + 1
  const module = created({
    semesterId,
    name: name.trim(),
    shortName: shortName.trim() || name.trim(),
    examDate: null,
    examTime: null,
    order,
    archived: false,
  })
  await db.modules.add(module)
  return module.id
}

export async function updateModule(
  id: string,
  patch: Partial<Pick<Module, 'name' | 'shortName' | 'examDate' | 'examTime' | 'note' | 'ects' | 'grade'>>,
): Promise<void> {
  const clean = { ...patch }
  if (clean.name !== undefined) clean.name = clean.name.trim()
  if (clean.shortName !== undefined) clean.shortName = clean.shortName.trim()
  await db.modules.update(id, changed(clean))
}

export async function setModuleArchived(id: string, archived: boolean): Promise<void> {
  await db.modules.update(id, changed({ archived }))
}

export async function moveModule(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.modules, db.semesters, async () => {
    const modules = await listActiveModules()
    const index = modules.findIndex((m) => m.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= modules.length) return
    const reordered = [...modules]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const now = Date.now()
    await Promise.all(reordered.map((m, i) => db.modules.update(m.id, { order: i, updatedAt: now })))
  })
}

/* ---------- Lerneinheiten ---------- */

export async function listStudyUnits(): Promise<StudyUnit[]> {
  return (await db.studyUnits.toArray()).filter(alive).sort(byOrder)
}

async function nextUnitOrder(moduleId: string): Promise<number> {
  const units = (await db.studyUnits.where('moduleId').equals(moduleId).toArray()).filter(alive)
  return units.reduce((max, u) => Math.max(max, u.order), -1) + 1
}

export interface StudyUnitInput {
  title: string
  type: StudyUnitType
  dueDate: DateStr | null
}

export async function createStudyUnit(moduleId: string, input: StudyUnitInput): Promise<string> {
  const unit = created({ moduleId, ...input, title: input.title.trim(), doneDate: null, order: await nextUnitOrder(moduleId) })
  await db.studyUnits.add(unit)
  return unit.id
}

/** Mehrere Einheiten auf einmal anlegen (z. B. aus einer eingefügten Liste). */
export async function createStudyUnits(
  moduleId: string,
  items: { title: string; type: StudyUnitType; done: boolean; dueDate?: DateStr | null }[],
  today: DateStr = todayStr(),
): Promise<number> {
  let order = await nextUnitOrder(moduleId)
  const units = items
    .filter((i) => i.title.trim())
    .map((i) =>
      created({
        moduleId,
        title: i.title.trim(),
        type: i.type,
        dueDate: i.dueDate ?? null,
        doneDate: i.done ? today : null,
        order: order++,
      }),
    )
  await db.studyUnits.bulkAdd(units)
  return units.length
}

/** Serie anlegen, z. B. „Übungsblatt 1“ … „Übungsblatt 12“. */
export async function createStudyUnitSeries(
  moduleId: string,
  prefix: string,
  from: number,
  to: number,
  type: StudyUnitType,
): Promise<number> {
  if (to < from || to - from > 99) return 0
  let order = await nextUnitOrder(moduleId)
  const units = []
  for (let i = from; i <= to; i++) {
    units.push(created({ moduleId, title: `${prefix.trim()} ${i}`, type, dueDate: null, doneDate: null, order: order++ }))
  }
  await db.studyUnits.bulkAdd(units)
  return units.length
}

export async function updateStudyUnit(id: string, patch: Partial<StudyUnitInput>): Promise<void> {
  const clean = { ...patch }
  if (clean.title !== undefined) clean.title = clean.title.trim()
  await db.studyUnits.update(id, changed(clean))
}

export async function setStudyUnitDone(id: string, done: boolean, date: DateStr = todayStr()): Promise<void> {
  await db.studyUnits.update(id, changed({ doneDate: done ? date : null }))
}

/** Alle Lerneinheiten eines Moduls entfernen (Soft-Delete), z. B. vor einem Import „ersetzen“. */
export async function deleteStudyUnitsOfModule(moduleId: string): Promise<void> {
  const now = Date.now()
  await db.studyUnits.where('moduleId').equals(moduleId).modify({ deletedAt: now, updatedAt: now })
}

/** Import für mehrere Module in einer Transaktion. */
export async function importStudyUnits(
  sections: { moduleId: string; units: { title: string; type: StudyUnitType; done: boolean; dueDate: DateStr | null }[] }[],
  replaceExisting: boolean,
  today: DateStr = todayStr(),
): Promise<number> {
  let count = 0
  await db.transaction('rw', db.studyUnits, async () => {
    for (const s of sections) {
      if (replaceExisting) await deleteStudyUnitsOfModule(s.moduleId)
      count += await createStudyUnits(s.moduleId, s.units, today)
    }
  })
  return count
}

export async function deleteStudyUnit(id: string): Promise<void> {
  const now = Date.now()
  await db.studyUnits.update(id, { deletedAt: now, updatedAt: now })
}
