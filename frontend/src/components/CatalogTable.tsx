import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'motion/react'
import type { Course } from '../data/schema'
import { formatMinutes, formatNumber, statusLabels } from '../lib/format'

const columnHelper = createColumnHelper<Course>()

type Props = { courses: Course[]; onSelect: (course: Course) => void; selectedId: string | null }

export function CatalogTable({ courses, onSelect, selectedId }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'title', desc: false }])

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Curso',
        cell: (info) => (
          <div className="max-w-md">
            <p className="truncate font-medium text-slate-100">{info.getValue()}</p>
            <p className="truncate text-xs text-slate-500">
              {info.row.original.instructors.join(' · ') || 'Sin instructor'}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Categoría',
        cell: (info) => <span className="text-xs text-slate-300">{info.getValue()}</span>,
      }),
      columnHelper.accessor('progress', {
        header: 'Progreso',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${info.getValue()}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-slate-400">{info.getValue()}%</span>
          </div>
        ),
      }),
      columnHelper.accessor('durationMinutes', {
        header: 'Duración',
        sortUndefined: 'last',
        cell: (info) => (
          <span className="text-xs tabular-nums text-slate-300">
            {formatMinutes(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('lectures', {
        header: 'Lecciones',
        cell: (info) => (
          <span className="text-xs tabular-nums text-slate-300">{formatNumber(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('students', {
        header: 'Estudiantes',
        cell: (info) => (
          <span className="text-xs tabular-nums text-slate-300">{formatNumber(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              info.getValue() === 'active'
                ? 'bg-emerald-500/15 text-emerald-300'
                : info.getValue() === 'unavailable'
                  ? 'bg-rose-500/15 text-rose-300'
                  : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {statusLabels[info.getValue()]}
          </span>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: courses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/60">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-900/80">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className="flex items-center gap-1 hover:text-slate-200"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className="text-[10px]">
                      {{ asc: '▲', desc: '▼' }[header.column.getIsSorted() as string] ?? ''}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {table.getRowModel().rows.map((row) => (
              <motion.tr
                key={row.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onSelect(row.original)}
                className={`cursor-pointer border-t border-slate-800 transition-colors hover:bg-slate-800/60 ${
                  selectedId === row.original.id ? 'bg-violet-500/10' : ''
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
        <span>
          Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
