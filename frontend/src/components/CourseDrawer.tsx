import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { loadCurriculum } from '../data/loadDataset'
import type { Course, Section } from '../data/schema'
import { formatMinutes, formatNumber, formatSeconds, statusLabels } from '../lib/format'
import { useNotesStore } from '../store/notes'

type Props = { course: Course | null; onClose: () => void }

export function CourseDrawer({ course, onClose }: Props) {
  return (
    <AnimatePresence>
      {course && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/70"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label={course.title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-slate-700 bg-slate-950 p-6"
          >
            <DrawerContent course={course} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerContent({ course, onClose }: { course: Course; onClose: () => void }) {
  const [sections, setSections] = useState<Section[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const note = useNotesStore((state) => state.notes[course.id] ?? '')
  const setNote = useNotesStore((state) => state.setNote)

  useEffect(() => {
    let cancelled = false
    setSections(null)
    setError(null)
    if (!course.hasCurriculum) {
      setSections([])
      return
    }
    loadCurriculum()
      .then((curriculum) => {
        if (!cancelled) setSections(curriculum[course.id] ?? [])
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error('Error desconocido'))
      })
    return () => {
      cancelled = true
    }
  }, [course.id, course.hasCurriculum])

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-violet-300">{course.category}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">{course.title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {course.instructors.join(' · ') || 'Sin instructor'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg border border-slate-700 px-3 py-1 text-slate-400 hover:text-slate-100"
        >
          ✕
        </button>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Meta label="Progreso" value={`${course.progress}%`} />
        <Meta label="Duración" value={formatMinutes(course.durationMinutes)} />
        <Meta label="Lecciones" value={formatNumber(course.lectures)} />
        <Meta label="Estado" value={statusLabels[course.status]} />
      </dl>

      {course.unavailableReason && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
          {course.unavailableReason}
        </p>
      )}

      {course.technologies.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {course.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-200">Mis notas</h3>
        <textarea
          value={note}
          onChange={(event) => setNote(course.id, event.target.value)}
          rows={3}
          placeholder="Notas personales (se guardan en este navegador)"
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500"
        />
      </section>

      {course.practiceExams.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-200">Exámenes de práctica</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {course.practiceExams.map((exam) => (
              <li key={exam.name} className="flex justify-between border-b border-slate-800 py-1">
                <span>{exam.name}</span>
                <span className="tabular-nums text-slate-400">
                  {formatNumber(exam.questions)} preguntas
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.learningObjectives.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-200">Objetivos de aprendizaje</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {course.learningObjectives.slice(0, 12).map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 pb-8">
        <h3 className="text-sm font-semibold text-slate-200">Temario</h3>
        {error && <p className="mt-2 text-sm text-rose-300">{error.message}</p>}
        {!error && sections === null && (
          <p className="mt-2 text-sm text-slate-500">Cargando temario…</p>
        )}
        {!error && sections?.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">Este curso no tiene temario en el export.</p>
        )}
        <div className="mt-3 space-y-2">
          {sections?.map((section) => (
            <SectionItem key={section.title} section={section} />
          ))}
        </div>
      </section>

      <a
        href={course.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-violet-500"
      >
        Abrir en Udemy
      </a>
    </>
  )
}

function SectionItem({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200"
      >
        <span className="truncate">{section.title}</span>
        <span className="ml-3 shrink-0 text-xs text-slate-500">
          {formatNumber(section.lectureCount ?? section.lectures.length)} · {formatMinutes(section.durationMinutes)}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 pb-2 text-xs text-slate-400"
          >
            {section.lectures.map((lecture, index) => (
              <li key={`${lecture.title}-${index}`} className="flex justify-between gap-3 py-1">
                <span className="truncate">
                  {lecture.title}
                  {lecture.freePreview && <span className="ml-2 text-emerald-400">preview</span>}
                </span>
                <span className="tabular-nums">{formatSeconds(lecture.durationSeconds)}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-100">{value}</dd>
    </div>
  )
}
