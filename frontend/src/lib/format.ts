const numberFormatter = new Intl.NumberFormat('es-ES')

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return numberFormatter.format(value)
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${formatNumber(hours)}h` : `${formatNumber(hours)}h ${rest}m`
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export const statusLabels: Record<string, string> = {
  active: 'Activo',
  unavailable: 'No disponible',
  practice_exam: 'Examen de práctica',
}
