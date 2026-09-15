import { useEffect, useRef } from 'react'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import type { CourseStatus } from '../data/schema'
import { emptyFilters, useFilterStore, type Filters } from './filters'

const stringList = parseAsArrayOf(parseAsString).withDefault([])

export const filterQueryParsers = {
  q: parseAsString.withDefault(''),
  cat: stringList,
  status: stringList,
  tech: stringList,
  minProgress: parseAsInteger.withDefault(0),
}

type QueryShape = { q: string; cat: string[]; status: string[]; tech: string[]; minProgress: number }

function queryToFilters(query: QueryShape): Filters {
  return {
    search: query.q,
    categories: query.cat,
    statuses: query.status as CourseStatus[],
    technologies: query.tech,
    minProgress: query.minProgress,
  }
}

function filtersToQuery(filters: Filters): QueryShape {
  return {
    q: filters.search,
    cat: filters.categories,
    status: filters.statuses,
    tech: filters.technologies,
    minProgress: filters.minProgress,
  }
}

const serialize = (filters: Filters) => JSON.stringify(filtersToQuery(filters))

/**
 * Mantiene el store de Zustand y la URL en sync en ambas direcciones:
 * la URL es compartible/recargable y el store es la fuente de verdad para la UI.
 */
export function useUrlFilters() {
  const [query, setQuery] = useQueryStates(filterQueryParsers, { history: 'replace' })
  const filters = useFilterStore((state) => state.filters)
  const setFilters = useFilterStore((state) => state.setFilters)
  const lastSynced = useRef<string>(serialize(emptyFilters))

  useEffect(() => {
    const fromUrl = serialize(queryToFilters(query))
    if (fromUrl !== lastSynced.current) {
      lastSynced.current = fromUrl
      setFilters(queryToFilters(query))
    }
  }, [query, setFilters])

  useEffect(() => {
    const fromStore = serialize(filters)
    if (fromStore !== lastSynced.current) {
      lastSynced.current = fromStore
      void setQuery(filtersToQuery(filters))
    }
  }, [filters, setQuery])
}
