import { alive, byOrder } from '../base'
import { db } from '../db'
import type { Module, Semester, StudyUnit } from '../types'

/* Lesender Zugriff für Wochen-/Monatsansicht. Bearbeiten kommt in Phase 4. */

export async function getActiveSemester(): Promise<Semester | undefined> {
  const semesters = (await db.semesters.toArray()).filter(alive)
  return semesters.find((s) => s.active) ?? semesters.at(-1)
}

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

export async function listStudyUnits(): Promise<StudyUnit[]> {
  return (await db.studyUnits.toArray()).filter(alive).sort(byOrder)
}
