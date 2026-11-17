import type { DateStr } from '../../lib/dates'
import { alive, byOrder, changed, created } from '../base'
import { db } from '../db'
import type { Project, ProjectLog, ProjectNote } from '../types'

export async function listProjects(): Promise<Project[]> {
  return (await db.projects.toArray()).filter(alive).sort(byOrder)
}

export async function renameProject(id: string, name: string): Promise<void> {
  await db.projects.update(id, changed({ name: name.trim() }))
}

export async function setProjectActive(id: string, active: boolean): Promise<void> {
  await db.projects.update(id, changed({ active }))
}

export const projectLogId = (projectId: string, date: DateStr) => `${projectId}_${date}`

export async function listProjectLogs(from: DateStr, to: DateStr): Promise<ProjectLog[]> {
  return (await db.projectLogs.where('date').between(from, to, true, true).toArray()).filter(alive)
}

export async function setProjectMinutes(projectId: string, date: DateStr, minutes: number): Promise<void> {
  const id = projectLogId(projectId, date)
  const value = Math.max(0, Math.round(minutes))
  await db.transaction('rw', db.projectLogs, async () => {
    const existing = await db.projectLogs.get(id)
    if (existing) await db.projectLogs.update(id, changed({ minutes: value, deletedAt: null }))
    else await db.projectLogs.add(created({ projectId, date, minutes: value }, id))
  })
}

export const projectNoteId = (projectId: string, weekStart: DateStr) => `${projectId}_${weekStart}`

export async function getProjectNote(projectId: string, weekStart: DateStr): Promise<ProjectNote | undefined> {
  const note = await db.projectNotes.get(projectNoteId(projectId, weekStart))
  return note && alive(note) ? note : undefined
}

export async function setProjectNote(projectId: string, weekStart: DateStr, text: string): Promise<void> {
  const id = projectNoteId(projectId, weekStart)
  await db.transaction('rw', db.projectNotes, async () => {
    const existing = await db.projectNotes.get(id)
    if (existing) await db.projectNotes.update(id, changed({ text, deletedAt: null }))
    else await db.projectNotes.add(created({ projectId, weekStart, text }, id))
  })
}
