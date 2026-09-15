import { curriculumSchema, datasetSchema, type Curriculum, type Dataset } from './schema'

const DATA_BASE = `${import.meta.env.BASE_URL}data`

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path} (HTTP ${response.status})`)
  }
  return response.json()
}

export async function loadDataset(): Promise<Dataset> {
  const raw = await fetchJson(`${DATA_BASE}/courses.json`)
  const parsed = datasetSchema.safeParse(raw)
  if (!parsed.success) {
    const [issue] = parsed.error.issues
    throw new Error(
      `courses.json no cumple el contrato de datos: ${issue.path.join('.')} — ${issue.message}`,
    )
  }
  return parsed.data
}

let curriculumPromise: Promise<Curriculum> | null = null

export function loadCurriculum(): Promise<Curriculum> {
  curriculumPromise ??= fetchJson(`${DATA_BASE}/curriculum.json`).then((raw) => {
    const parsed = curriculumSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error('curriculum.json no cumple el contrato de datos')
    }
    return parsed.data
  })
  return curriculumPromise
}
