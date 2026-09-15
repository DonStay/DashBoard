# Udemy Analytics Pipeline

### ▶ [Abrir el dashboard](https://donstay.github.io/DashBoard/)

ETL en Python que limpia un export real de Udemy (573 cursos, 5 hojas de Excel con
nulos y formatos inconsistentes) y lo publica como `courses.json`, más un frontend
React que lo consume directamente — sin base de datos ni API.

```
Excel (5 hojas) ──► ETL Python ──► courses.json + curriculum.json ──► React (Vite)
                    pandas          contrato validado con Zod        TanStack Table · Chart.js
```

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `data/` | `udemy_biblioteca_completa.xlsx` (fuente original) |
| `etl/` | paquete `udemy_etl` (limpieza + pipeline) y tests con pytest |
| `frontend/` | app Vite + React + TS que consume el JSON |
| `docs/data-contract.md` | el shape exacto de `courses.json` acordado por el equipo |

## Puesta en marcha

### 1. ETL (reproducible con un comando)

```bash
cd etl
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m udemy_etl                     # reconstruye frontend/public/data/*.json
pytest                                  # 45 tests
```

Opciones: `python -m udemy_etl --excel ../data/otro.xlsx --out ../frontend/public/data`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
npm run lint       # oxlint
```

### 3. Publicar en GitHub Pages

`.github/workflows/deploy.yml` compila el frontend y lo publica en cada push a `main`.
Solo hay que activarlo una vez en **Settings → Pages → Build and deployment → Source:
GitHub Actions**. La app queda en `https://<usuario>.github.io/<repo>/`.

El workflow pasa `VITE_BASE=/<repo>/` para que los assets y los JSON de `public/data`
resuelvan bajo el subdirectorio del repo (`import.meta.env.BASE_URL`).

## Qué hace el ETL

- Lee las 5 hojas (`Resumen`, `Temario Completo`, `Objetivos de Aprendizaje`,
  `Cursos No Disponibles`, `Exámenes de Práctica`) y las une por `ID Curso`.
- Normaliza los formatos sucios del export: duraciones (`"4h 56m"`, `"19min"`,
  `"4:46"`), estudiantes (`"25,307"`), listas separadas por `|`, estados en español,
  preguntas de examen (`"300 questions"`).
- Deriva una categoría por curso con reglas de keywords sobre las tecnologías.
- Calcula las stats agregadas y escribe dos JSON: el catálogo (carga eager) y el
  temario completo (carga lazy al abrir un curso).

Las funciones de limpieza son puras y viven en `etl/udemy_etl/cleaning.py`, que es
donde apunta la mayoría de los tests (parser de duración, split de tecnologías,
progreso fuera de rango, nulos, categorización).

## Qué hace el frontend

- **Validación con Zod** de `courses.json` al cargarlo; si el contrato se rompe la UI
  muestra qué campo falló en vez de romperse.
- **Catálogo** con TanStack Table: orden por columna, paginación y drawer de detalle
  con el temario (secciones colapsables), objetivos, exámenes y notas por curso.
- **Filtros en Zustand** (búsqueda, categoría, estado, tecnología, progreso mínimo)
  sincronizados con la URL vía **nuqs** → cualquier vista filtrada es compartible.
- **Gráficos con Chart.js**: top de tecnologías, estado de avance y horas por categoría.
- **Feature con Temporal**: dado un ritmo de estudio en h/semana, calcula la fecha
  estimada de término del conjunto filtrado y los hitos por curso
  (`frontend/src/lib/studyPlan.ts`).
- **Motion** en tabs, drawer, filas de la tabla y skeletons de carga.
- Estados de **carga / vacío / error** en la vista principal.
- Notas por curso en `localStorage` (sin backend).

## Decisiones técnicas

1. **Dos archivos JSON en vez de uno.** El temario completo son 52 272 lecciones
   (≈5 MB); meterlo en `courses.json` haría lenta la primera carga. El catálogo pesa
   ≈650 KB y el temario se pide solo al abrir el drawer, cacheado en memoria.
2. **Nulos preservados.** El export tiene 12 cursos sin duración/estudiantes; el ETL
   emite `null` (no `0`) para que la UI distinga "sin dato" de "cero" y las medias no
   se contaminen.
3. **Zustand como fuente de verdad y nuqs como espejo.** La sincronización es
   bidireccional con guardas de igualdad (`src/store/useUrlFilters.ts`), así la URL es
   compartible sin provocar loops de render.

## Fase 2 (fuera de alcance de esta semana)

- FastAPI + Postgres: `courses.json` pasa a ser un `seed` y el ETL escribe en la DB.
- Endpoints paginados/filtrados server-side (573 cursos caben en el cliente; 50 000 no).
- Recomendador de "siguiente curso" usando tecnologías + progreso + horas disponibles.
