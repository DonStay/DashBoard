import { motion } from 'motion/react'
import type { Course } from '../data/schema'
import { formatMinutes, formatNumber } from '../lib/format'
import { remainingMinutesOf } from '../lib/studyPlan'

type Props = { courses: Course[] }

export function StatsCards({ courses }: Props) {
  const totalMinutes = courses.reduce((sum, c) => sum + (c.durationMinutes ?? 0), 0)
  const remaining = courses.reduce((sum, c) => sum + remainingMinutesOf(c), 0)
  const completed = courses.filter((c) => c.progress === 100).length
  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100).length

  const cards = [
    { label: 'Cursos', value: formatNumber(courses.length) },
    { label: 'Completados', value: `${formatNumber(completed)} · ${formatNumber(inProgress)} en curso` },
    { label: 'Horas de contenido', value: formatMinutes(totalMinutes) },
    { label: 'Horas pendientes', value: formatMinutes(remaining) },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{card.value}</p>
        </motion.div>
      ))}
    </div>
  )
}
