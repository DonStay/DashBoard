import { create } from 'zustand'
import type { Course, CourseStatus } from '../data/schema'

export type SortKey = 'title' | 'progress' | 'durationMinutes' | 'students' | 'lectures'

export type Filters = {
  search: string
  categories: string[]
  statuses: CourseStatus[]
  technologies: string[]
  minProgress: number
}

export const emptyFilters: Filters = {
  search: '',
  categories: [],
  statuses: [],
  technologies: [],
  minProgress: 0,
}

type FilterState = {
  filters: Filters
  setSearch: (search: string) => void
  toggleCategory: (category: string) => void
  toggleStatus: (status: CourseStatus) => void
  toggleTechnology: (technology: string) => void
  setMinProgress: (value: number) => void
  setFilters: (filters: Filters) => void
  reset: () => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: emptyFilters,
  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  toggleCategory: (category) =>
    set((state) => ({
      filters: { ...state.filters, categories: toggle(state.filters.categories, category) },
    })),
  toggleStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, statuses: toggle(state.filters.statuses, status) },
    })),
  toggleTechnology: (technology) =>
    set((state) => ({
      filters: { ...state.filters, technologies: toggle(state.filters.technologies, technology) },
    })),
  setMinProgress: (minProgress) => set((state) => ({ filters: { ...state.filters, minProgress } })),
  setFilters: (filters) => set({ filters }),
  reset: () => set({ filters: emptyFilters }),
}))

export function filtersAreEmpty(filters: Filters): boolean {
  return (
    filters.search.trim() === '' &&
    filters.categories.length === 0 &&
    filters.statuses.length === 0 &&
    filters.technologies.length === 0 &&
    filters.minProgress === 0
  )
}

export function applyFilters(courses: Course[], filters: Filters): Course[] {
  const needle = filters.search.trim().toLocaleLowerCase()
  return courses.filter((course) => {
    if (filters.categories.length > 0 && !filters.categories.includes(course.category)) return false
    if (filters.statuses.length > 0 && !filters.statuses.includes(course.status)) return false
    if (
      filters.technologies.length > 0 &&
      !filters.technologies.some((tech) => course.technologies.includes(tech))
    ) {
      return false
    }
    if (course.progress < filters.minProgress) return false
    if (needle === '') return true
    const haystack = [course.title, course.category, ...course.instructors, ...course.technologies]
      .join(' ')
      .toLocaleLowerCase()
    return haystack.includes(needle)
  })
}
