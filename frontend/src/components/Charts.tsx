import { useMemo } from 'react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { motion } from 'motion/react'
import type { Course } from '../data/schema'
import { formatMinutes } from '../lib/format'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

ChartJS.defaults.color = '#94a3b8'
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.15)'

const PALETTE = [
  '#a855f7',
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#f87171',
  '#818cf8',
  '#2dd4bf',
  '#facc15',
  '#fb923c',
]

type Props = { courses: Course[] }

export function TechnologiesChart({ courses }: Props) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const course of courses) {
      for (const tech of course.technologies) {
        counts.set(tech, (counts.get(tech) ?? 0) + 1)
      }
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
    return {
      labels: top.map(([label]) => label),
      datasets: [
        {
          label: 'Cursos',
          data: top.map(([, value]) => value),
          backgroundColor: '#a855f7',
          borderRadius: 6,
        },
      ],
    }
  }, [courses])

  return (
    <ChartCard title="Top 12 tecnologías">
      <Bar
        data={data}
        options={{
          indexAxis: 'y' as const,
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { color: 'rgba(148,163,184,0.1)' } }, y: { grid: { display: false } } },
        }}
      />
    </ChartCard>
  )
}

export function ProgressChart({ courses }: Props) {
  const data = useMemo(() => {
    const buckets = { Completados: 0, 'En curso': 0, 'Sin empezar': 0 }
    for (const course of courses) {
      if (course.progress === 100) buckets.Completados += 1
      else if (course.progress > 0) buckets['En curso'] += 1
      else buckets['Sin empezar'] += 1
    }
    return {
      labels: Object.keys(buckets),
      datasets: [
        {
          data: Object.values(buckets),
          backgroundColor: ['#34d399', '#fbbf24', '#475569'],
          borderWidth: 0,
        },
      ],
    }
  }, [courses])

  return (
    <ChartCard title="Estado de avance">
      <Doughnut
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: { legend: { position: 'bottom' as const } },
        }}
      />
    </ChartCard>
  )
}

export function CategoryHoursChart({ courses }: Props) {
  const data = useMemo(() => {
    const minutes = new Map<string, number>()
    for (const course of courses) {
      minutes.set(course.category, (minutes.get(course.category) ?? 0) + (course.durationMinutes ?? 0))
    }
    const entries = [...minutes.entries()].sort((a, b) => b[1] - a[1])
    return {
      labels: entries.map(([label]) => label),
      datasets: [
        {
          label: 'Horas',
          data: entries.map(([, value]) => Math.round(value / 60)),
          backgroundColor: entries.map((_, index) => PALETTE[index % PALETTE.length]),
          borderRadius: 6,
        },
      ],
    }
  }, [courses])

  return (
    <ChartCard title="Horas de contenido por categoría">
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => formatMinutes(Number(context.parsed.y) * 60),
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 30 } },
            y: { grid: { color: 'rgba(148,163,184,0.1)' } },
          },
        }}
      />
    </ChartCard>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5"
    >
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <div className="mt-4 h-72">{children}</div>
    </motion.div>
  )
}
