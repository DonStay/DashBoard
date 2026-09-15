import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { Course } from '../data/schema'
import { formatMinutes } from '../lib/format'
import { buildStudyPlan, formatDuration, formatPlainDate } from '../lib/studyPlan'

type Props = { courses: Course[] }

export function StudyPlanPanel({ courses }: Props) {
  const [hoursPerWeek, setHoursPerWeek] = useState(8)
  const plan = useMemo(() => buildStudyPlan(courses, hoursPerWeek), [courses, hoursPerWeek])

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Plan de estudio</h3>
          <p className="text-xs text-slate-500">
            Quedan {formatMinutes(plan.remainingMinutes)} de contenido en la selección actual.
          </p>
        </div>
        <label className="flex items-center gap-3 text-xs text-slate-400">
          Ritmo
          <input
            type="range"
            min={1}
            max={40}
            value={hoursPerWeek}
            onChange={(event) => setHoursPerWeek(Number(event.target.value))}
            className="h-1.5 w-56 cursor-pointer accent-violet-500"
          />
          <span className="w-20 text-right text-slate-200">{hoursPerWeek} h/semana</span>
        </label>
      </div>

      <motion.p
        key={plan.finishDate.toString()}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-2xl font-semibold text-violet-200"
      >
        {formatPlainDate(plan.finishDate)}
      </motion.p>
      <p className="text-xs text-slate-500">
        Fecha estimada de término · {formatDuration(plan.duration)} ·{' '}
        {Math.ceil(plan.weeks)} semanas
      </p>

      {plan.milestones.length > 0 && (
        <ol className="mt-5 space-y-1 text-xs text-slate-400">
          {plan.milestones.map((milestone) => (
            <li
              key={milestone.courseId}
              className="flex items-center justify-between gap-4 border-b border-slate-800 py-1.5"
            >
              <span className="truncate text-slate-300">{milestone.title}</span>
              <span className="shrink-0 tabular-nums">
                {formatMinutes(milestone.remainingMinutes)} · {formatPlainDate(milestone.finishDate)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  )
}
