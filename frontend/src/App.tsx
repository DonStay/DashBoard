import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { CatalogTable } from './components/CatalogTable'
import { CategoryHoursChart, ProgressChart, TechnologiesChart } from './components/Charts'
import { CourseDrawer } from './components/CourseDrawer'
import { FiltersBar } from './components/FiltersBar'
import { StatsCards } from './components/StatsCards'
import { StudyPlanPanel } from './components/StudyPlanPanel'
import { EmptyView, ErrorView, LoadingView } from './components/StatusViews'
import { loadDataset } from './data/loadDataset'
import type { Course, Dataset } from './data/schema'
import { applyFilters, useFilterStore } from './store/filters'
import { useUrlFilters } from './store/useUrlFilters'

const tabs = ['catalogo', 'analitica'] as const
type Tab = (typeof tabs)[number]
const tabLabels: Record<Tab, string> = { catalogo: 'Catálogo', analitica: 'Analítica' }

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(tabs).withDefault('catalogo'))
  const [selectedId, setSelectedId] = useQueryState('curso')

  useUrlFilters()
  const filters = useFilterStore((state) => state.filters)
  const resetFilters = useFilterStore((state) => state.reset)

  useEffect(() => {
    let cancelled = false
    setDataset(null)
    setError(null)
    loadDataset()
      .then((data) => {
        if (!cancelled) setDataset(data)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error('Error desconocido'))
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const courses = useMemo(
    () => (dataset ? applyFilters(dataset.courses, filters) : []),
    [dataset, filters],
  )

  const topTechnologies = useMemo(() => {
    if (!dataset) return []
    const counts = new Map<string, number>()
    for (const course of dataset.courses) {
      for (const tech of course.technologies) counts.set(tech, (counts.get(tech) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tech]) => tech)
  }, [dataset])

  const selected = useMemo<Course | null>(
    () => dataset?.courses.find((course) => course.id === selectedId) ?? null,
    [dataset, selectedId],
  )

  const closeDrawer = useCallback(() => void setSelectedId(null), [setSelectedId])

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">Udemy Analytics Pipeline</h1>
          <p className="mt-1 text-sm text-slate-400">
            ETL en Python → courses.json → catálogo y analítica en React
            {dataset && ` · dataset del ${dataset.generatedAt.slice(0, 10)}`}
          </p>
        </div>
        <nav className="flex gap-1 rounded-xl border border-slate-700 bg-slate-900/60 p-1">
          {tabs.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => void setTab(value)}
              className="relative rounded-lg px-4 py-1.5 text-sm text-slate-300"
            >
              {tab === value && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-violet-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative ${tab === value ? 'text-white' : ''}`}>
                {tabLabels[value]}
              </span>
            </button>
          ))}
        </nav>
      </header>

      <main className="mt-8 space-y-6">
        {error && <ErrorView error={error} onRetry={() => setReloadToken((value) => value + 1)} />}
        {!error && !dataset && <LoadingView />}

        {dataset && !error && (
          <>
            <StatsCards courses={courses} />
            <FiltersBar
              stats={dataset.stats}
              topTechnologies={topTechnologies}
              resultCount={courses.length}
            />

            {courses.length === 0 ? (
              <EmptyView onReset={resetFilters} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  {tab === 'catalogo' ? (
                    <CatalogTable
                      courses={courses}
                      selectedId={selectedId}
                      onSelect={(course) => void setSelectedId(course.id)}
                    />
                  ) : (
                    <>
                      <StudyPlanPanel courses={courses} />
                      <div className="grid gap-6 lg:grid-cols-2">
                        <TechnologiesChart courses={courses} />
                        <ProgressChart courses={courses} />
                      </div>
                      <CategoryHoursChart courses={courses} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </main>

      <CourseDrawer course={selected} onClose={closeDrawer} />
    </div>
  )
}
