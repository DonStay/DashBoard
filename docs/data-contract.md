# Contrato de datos (`courses.json`)

Acordado el lunes por todo el equipo: el frontend programa contra este shape sin
esperar a que el ETL termine. Cualquier cambio se avisa en el stand-up.

El ETL escribe dos archivos en `frontend/public/data/`:

| Archivo | Contenido | Carga en el frontend |
| --- | --- | --- |
| `courses.json` | catálogo + stats agregadas (≈650 KB) | eager, al arrancar |
| `curriculum.json` | temario completo por curso (≈5 MB) | lazy, al abrir el drawer |

## `courses.json`

```jsonc
{
  "generatedAt": "2025-09-15T02:41:00+00:00",  // ISO 8601 UTC
  "source": "udemy_biblioteca_completa.xlsx",
  "stats": {
    "totalCourses": 573,
    "activeCourses": 553,
    "completedCourses": 14,
    "inProgressCourses": 21,
    "notStartedCourses": 538,
    "totalMinutes": 426018,
    "watchedMinutes": 12345,
    "remainingMinutes": 413673,
    "categories": ["Bases de datos", "Ciberseguridad", "..."],
    "technologies": ["AWS", "Angular", "..."]
  },
  "courses": [
    {
      "id": "7014617",                       // string, siempre presente
      "title": "GO Programming",
      "url": "https://www.udemy.com/course/7014617/",
      "status": "active",                    // active | unavailable | practice_exam
      "category": "Lenguajes de programación",
      "progress": 100,                       // int 0-100
      "sections": 11,                        // int | null
      "lectures": 33,                        // int | null
      "durationMinutes": 296,                // int | null  ("4h 56m" -> 296)
      "students": 5541,                      // int | null  ("5,541" -> 5541)
      "instructors": ["Muhammad Riaz Uddin"],
      "technologies": ["Go (programming language)", "Programming Languages"],
      "learningObjectives": ["What is Go and Why Use It?"],
      "practiceExams": [{ "name": "Exam 1", "questions": 75 }],
      "totalQuestions": null,                // int | null (solo exámenes)
      "unavailableReason": null,             // string | null
      "hasCurriculum": true                  // si hay entrada en curriculum.json
    }
  ]
}
```

## `curriculum.json`

```jsonc
{
  "7014617": [
    {
      "title": "Introduction to Go",
      "lectureCount": 3,                     // int | null
      "durationMinutes": 19,                 // int | null
      "lectures": [
        { "title": "What is Go?", "durationSeconds": 286, "freePreview": true }
      ]
    }
  ]
}
```

## Reglas de limpieza acordadas

- **Duraciones**: `"4h 56m"`, `"19min"`, `"1:02:03"` → minutos enteros. `"300 questions"` → `null`.
- **Lecciones**: `"4:46"` → 286 segundos.
- **Estudiantes**: `"25,307"` → `25307`; vacío → `null`.
- **Tecnologías / instructores**: separados por `|`, trim, sin duplicados (case-insensitive).
- **Estado**: se mapea del texto en español a `active` / `unavailable` / `practice_exam`.
- **Categoría**: derivada por keywords sobre tecnologías (fallback: título) → 9 categorías + `Otros`.
- **Nulos**: se preservan como `null`, nunca como `0` ni `""`, para que el frontend distinga "sin dato" de "cero".
- **Orden**: `courses` viene ordenado por título (case-insensitive) → salida reproducible.

El frontend valida el archivo completo con Zod (`src/data/schema.ts`) al cargarlo;
si el contrato se rompe, la UI muestra el estado de error con la ruta del campo inválido.
