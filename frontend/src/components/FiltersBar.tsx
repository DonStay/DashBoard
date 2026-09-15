import type { CourseStatus, Dataset } from '../data/schema'
import { statusLabels } from '../lib/format'
import { filtersAreEmpty, useFilterStore } from '../store/filters'

const statuses: CourseStatus[] = ['active', 'unavailable', 'practice_exam']

type Props = { stats: Dataset['stats']; topTechnologies: string[]; resultCount: number }

export function FiltersBar({ stats, topTechnologies, resultCount }: Props) {
  const filters = useFilterStore((state) => state.filters)
  const setSearch = useFilterStore((state) => state.setSearch)
  const toggleCategory = useFilterStore((state) => state.toggleCategory)
  const toggleStatus = useFilterStore((state) => state.toggleStatus)
  const toggleTechnology = useFilterStore((state) => state.toggleTechnology)
  const setMinProgress = useFilterStore((state) => state.setMinProgress)
  const reset = useFilterStore((state) => state.reset)

  return (
    <section className="space-y-4 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={filters.search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por título, instructor o tecnología…"
          className="min-w-64 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-500"
        />
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Progreso mínimo
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={filters.minProgress}
            onChange={(event) => setMinProgress(Number(event.target.value))}
            className="accent-violet-500"
          />
          <span className="w-10 text-right text-slate-200">{filters.minProgress}%</span>
        </label>
        <span className="text-xs text-slate-400">{resultCount} resultados</span>
        {!filtersAreEmpty(filters) && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500 hover:text-violet-200"
          >
            Limpiar
          </button>
        )}
      </div>

      <ChipRow
        label="Categoría"
        options={stats.categories}
        selected={filters.categories}
        onToggle={toggleCategory}
      />
      <ChipRow
        label="Estado"
        options={statuses}
        selected={filters.statuses}
        onToggle={(value) => toggleStatus(value as CourseStatus)}
        renderLabel={(value) => statusLabels[value] ?? value}
      />
      <ChipRow
        label="Tecnología"
        options={topTechnologies}
        selected={filters.technologies}
        onToggle={toggleTechnology}
      />
    </section>
  )
}

type ChipRowProps = {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  renderLabel?: (value: string) => string
}

function ChipRow({ label, options, selected, onToggle, renderLabel }: ChipRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-slate-500">{label}</span>
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active
                ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {renderLabel ? renderLabel(option) : option}
          </button>
        )
      })}
    </div>
  )
}
