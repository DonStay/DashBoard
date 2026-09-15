# Guion de exposición (10 min) — Udemy Analytics Pipeline

App en vivo: https://donstay.github.io/DashBoard/
Repo: https://github.com/DonStay/DashBoard

Estructura sugerida: 1 min de contexto, 6 min recorriendo el cronograma día a día
(mostrando la app en pantalla), 2 min de decisiones técnicas, 1 min de fase 2.

---

## 0. Contexto (1 min)

- Punto de partida: `udemy_biblioteca_completa.xlsx`, export **real** de Udemy con 5 hojas:
  `Resumen` (573 cursos), `Temario Completo`, `Objetivos de Aprendizaje`,
  `Cursos No Disponibles`, `Exámenes de Práctica`.
- Dataset sucio: nulos, texto libre y formatos inconsistentes (`"4h 56m"`, `"19min"`,
  `"4:46"`, `"25,307"`, `"300 questions"`).
- Alcance acordado del sprint: **ETL en Python → JSON limpio → React que lo consume**.
  Sin base de datos ni API (eso es fase 2).

Frase de apertura: *"Convertimos un Excel real y sucio de 573 cursos en un dashboard
que responde preguntas: qué estoy estudiando, cuánto me falta y cuándo termino."*

---

## 1. Lunes 14 — Contrato de datos + scaffold

**Datos/ETL:** se leyeron las 5 hojas y se acordó el *shape* exacto del JSON antes de
escribir código de UI: `docs/data-contract.md`. Ese contrato es lo que permitió que el
frontend no esperara al ETL.

**Frontend:** scaffold Vite + React + TypeScript e instalación de las 7 librerías del
sprint (Zod, Zustand, nuqs, TanStack Table, Chart.js, Temporal, Motion), y el schema Zod
escrito **a partir del contrato**, no del JSON final.

Qué mostrar: `docs/data-contract.md` y `frontend/src/data/schema.ts` uno al lado del otro.

Decisión a mencionar: el contrato define **dos** archivos, no uno —
`courses.json` (catálogo, ~650 KB) y `curriculum.json` (temario completo, ~5 MB).

---

## 2. Martes 15 — Limpieza, categorización y export

**Datos/ETL** (`etl/udemy_etl/cleaning.py`, funciones puras):

- Duraciones: `"4h 56m"` → 296 min, `"19min"` → 19, `"4:46"` → 286 s (lecciones),
  `"300 questions"` → *no es duración* → `null` + se guarda como nº de preguntas.
- Estudiantes: `"25,307"` → `25307`.
- Tecnologías e instructores: split por `|`, `/`, `;` y comas fuera de paréntesis,
  con deduplicación *case-insensitive*.
- Progreso: se acota a 0–100; estados normalizados (Activo / No disponible / Examen de práctica).
- Categoría derivada por reglas de keywords (Desarrollo web, Datos & IA, Ciberseguridad,
  Cloud & DevOps, Bases de datos, Mobile, Lenguajes de programación, Negocios, Otros).
- Salida ordenada por título → el JSON es **reproducible**: mismo Excel, mismo archivo.

Comando único que reconstruye todo (must-have):

```bash
cd etl && python -m udemy_etl        # escribe frontend/public/data/*.json
```

**Tests:** el mínimo eran 2; hay **45** (`pytest`), sobre parser de duración, split de
tecnologías, nulos, progreso fuera de rango, categorización y el pipeline completo.

**Frontend:** carga del JSON validada con Zod y store de filtros en Zustand
(`search`, `categories`, `statuses`, `technologies`, `minProgress`), sincronizado con la
URL vía nuqs.

Qué mostrar en vivo: aplica un par de filtros → **la URL cambia** → copia la URL, ábrela
en otra pestaña y aparece el mismo estado. Ese es el argumento de "vista compartible".

---

## 3. Miércoles 16 — Catálogo + drawer de detalle

- Tabla con TanStack Table: orden por columna, paginación (15 filas, 39 páginas) y las
  columnas curso/categoría/progreso/duración/lecciones/estudiantes/estado.
- Al hacer clic en un curso se abre un **drawer** con metadatos, tecnologías, objetivos de
  aprendizaje, exámenes de práctica y el **temario por secciones colapsables**.
- El temario se pide **solo al abrir el drawer** (lazy + cacheado en memoria): por eso la
  primera carga es rápida aun con 52 272 lecciones.
- Notas por curso en `localStorage` (nice-to-have, sin backend).

Qué mostrar: buscar un curso, abrirlo, desplegar una sección del temario, escribir una
nota y recargar la página para que se vea que persiste.

---

## 4. Jueves 17 — Gráficos + feature con Temporal

- Chart.js, 3 gráficos (el mínimo eran 2): top 12 tecnologías, estado de avance
  (completados / en curso / sin empezar) y horas de contenido por categoría.
- **Feature real con Temporal** (`frontend/src/lib/studyPlan.ts`): con las horas
  pendientes de la selección actual y un ritmo en h/semana, calcula la **fecha estimada de
  término** y los hitos curso por curso. Usa `Temporal.PlainDate` + `Temporal.Duration`
  para la aritmética de fechas, no `Date`.

Qué mostrar: mueve el slider de ritmo y que la fecha y los hitos se recalculen. Remátalo
con el dato: a 8 h/semana son ~862 semanas; **el plan responde "¿y si le meto 20 h?"**.

Punto fuerte: el plan respeta los filtros. Filtra por "Datos & IA" y la fecha estimada
cambia, porque calcula sobre la selección, no sobre todo el catálogo.

---

## 5. Viernes 18 — Motion, estados y integración

- Motion en tabs, filas de la tabla, drawer y skeletons.
- Estados de **carga / vacío / error** en la vista principal: si `courses.json` no cumple
  el contrato, la UI dice **qué campo falló** en vez de romperse en blanco.
- Integración final: un solo `npm run dev` levanta todo; el dataset vive en
  `frontend/public/data`.

Qué mostrar: filtra hasta que no haya resultados → estado vacío con botón de limpiar filtros.

---

## 6. Fin de semana — README, demo y publicación

- README con instalación, comando del ETL, tests, decisiones técnicas y fase 2.
- Extra sobre lo pedido: **despliegue automático** con GitHub Actions a GitHub Pages en
  cada push a `main` → https://donstay.github.io/DashBoard/

---

## 7. Decisiones técnicas (las 3 que hay que contar)

1. **Dos JSON en vez de uno.** El temario son ~5 MB / 52 272 lecciones. Meterlo en
   `courses.json` penalizaba la primera carga de todos los usuarios por un dato que solo
   se necesita al abrir un curso → catálogo eager (~650 KB), temario lazy.
2. **Los nulos se preservan como `null`, no como 0.** Hay 12 cursos sin duración o sin
   estudiantes. Convertirlos a 0 hubiera falseado los totales y las medias; la UI muestra
   "—" y distingue "sin dato" de "cero".
3. **Zustand es la fuente de verdad y la URL es su espejo.** La sincronización con nuqs es
   bidireccional con guardas de igualdad (comparando el estado serializado) para no entrar
   en loops de render. Resultado: cualquier vista filtrada es un link compartible.

Bonus si preguntan por el ETL: las funciones de limpieza son **puras** (entrada texto sucio
→ salida tipada), y por eso testearlas cuesta poco; los 45 tests corren en 0.25 s.

---

## 8. Fase 2 (cierre, 1 min)

- **FastAPI + Postgres**: `courses.json` pasa a ser un *seed* y el ETL escribe en la DB;
  el contrato de datos ya definido se convierte en el schema de la API, así el frontend
  casi no cambia.
- Endpoints paginados y filtrados server-side (573 cursos caben en el cliente; 50 000 no).
- **Recomendador** de "siguiente curso" combinando tecnologías, progreso y horas
  disponibles por semana.

---

## Checklist de must-have (para decir en voz alta que están todos)

| Must-have | Dónde se ve |
| --- | --- |
| ETL reproducible con un comando | `cd etl && python -m udemy_etl` |
| Mínimo 2 tests pytest | 45 tests en `etl/tests/` |
| TanStack Table + filtros Zustand reflejados en la URL | pestaña Catálogo |
| Validación con Zod al cargar | `frontend/src/data/loadDataset.ts` |
| Al menos 2 gráficos Chart.js | pestaña Analítica (hay 3) |
| 1 feature real con Temporal | Plan de estudio (fecha estimada de término) |
| Estados de carga / vacío / error | vista principal |
| *Nice-to-have*: Motion, notas en localStorage, mención de fase 2 | hechos |
