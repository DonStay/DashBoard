import { Temporal } from 'temporal-polyfill'
import type { Course } from '../data/schema'

export type Milestone = {
  courseId: string
  title: string
  remainingMinutes: number
  finishDate: Temporal.PlainDate
}

export type StudyPlan = {
  remainingMinutes: number
  weeks: number
  finishDate: Temporal.PlainDate
  duration: Temporal.Duration
  milestones: Milestone[]
}

export function remainingMinutesOf(course: Course): number {
  if (!course.durationMinutes) return 0
  return Math.max(Math.round((course.durationMinutes * (100 - course.progress)) / 100), 0)
}

function daysFromMinutes(minutes: number, hoursPerWeek: number): number {
  if (hoursPerWeek <= 0) return 0
  return Math.ceil((minutes / 60 / hoursPerWeek) * 7)
}

/**
 * Dado un ritmo de estudio (horas por semana), estima con Temporal la fecha de
 * término del conjunto de cursos y la fecha de cada hito intermedio.
 */
export function buildStudyPlan(
  courses: Course[],
  hoursPerWeek: number,
  today: Temporal.PlainDate = Temporal.Now.plainDateISO(),
): StudyPlan {
  const pending = courses
    .filter((course) => course.progress < 100 && remainingMinutesOf(course) > 0)
    .sort((a, b) => remainingMinutesOf(a) - remainingMinutesOf(b))

  const remainingMinutes = pending.reduce((total, course) => total + remainingMinutesOf(course), 0)
  const finishDate = today.add({ days: daysFromMinutes(remainingMinutes, hoursPerWeek) })

  let cumulative = 0
  const milestones = pending.slice(0, 8).map((course) => {
    cumulative += remainingMinutesOf(course)
    return {
      courseId: course.id,
      title: course.title,
      remainingMinutes: remainingMinutesOf(course),
      finishDate: today.add({ days: daysFromMinutes(cumulative, hoursPerWeek) }),
    }
  })

  return {
    remainingMinutes,
    weeks: hoursPerWeek > 0 ? remainingMinutes / 60 / hoursPerWeek : 0,
    finishDate,
    duration: today.until(finishDate, { largestUnit: 'year' }),
    milestones,
  }
}

export function formatPlainDate(date: Temporal.PlainDate): string {
  return date.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDuration(duration: Temporal.Duration): string {
  const parts: string[] = []
  if (duration.years > 0) parts.push(`${duration.years} año${duration.years === 1 ? '' : 's'}`)
  if (duration.months > 0) parts.push(`${duration.months} mes${duration.months === 1 ? '' : 'es'}`)
  if (duration.days > 0) parts.push(`${duration.days} día${duration.days === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(', ') : 'menos de un día'
}
