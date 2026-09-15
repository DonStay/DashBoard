import { motion } from 'motion/react'

export function LoadingView() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-slate-400">Cargando y validando courses.json…</p>
      {[0, 1, 2, 3, 4].map((row) => (
        <motion.div
          key={row}
          className="h-12 rounded-xl bg-slate-800/60"
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: row * 0.12 }}
        />
      ))}
    </div>
  )
}

export function ErrorView({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-6 text-rose-100"
    >
      <h2 className="text-lg font-semibold">No se pudo cargar el dataset</h2>
      <p className="mt-2 text-sm text-rose-200/80">{error.message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-400"
      >
        Reintentar
      </button>
    </div>
  )
}

export function EmptyView({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700 bg-slate-900/60 p-10 text-center"
    >
      <h2 className="text-lg font-semibold text-slate-100">Ningún curso coincide con los filtros</h2>
      <p className="mt-2 text-sm text-slate-400">
        Prueba con otra búsqueda o limpia los filtros activos.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        Limpiar filtros
      </button>
    </motion.div>
  )
}
