import json

import pandas as pd
import pytest

from udemy_etl.pipeline import build_courses, build_dataset, write_outputs


@pytest.fixture
def sheets():
    return {
        "Resumen": pd.DataFrame(
            [
                {
                    "#": 1,
                    "ID Curso": 7014617,
                    "Título": "GO Programming",
                    "Progreso (%)": 100,
                    "Estado": "Activo",
                    "Secciones": 11.0,
                    "Lecciones": 33.0,
                    "Duración Total": "4h 56m",
                    "Estudiantes": "5,541",
                    "Instructor(es)": "Muhammad Riaz Uddin",
                    "Tecnologías / Temas (Udemy)": "Go (programming language) | Programming Languages",
                    "URL": "https://www.udemy.com/course/7014617/",
                },
                {
                    "#": 2,
                    "ID Curso": 6008398,
                    "Título": "Lenguaje C",
                    "Progreso (%)": 2,
                    "Estado": "No disponible (curso eliminado o en borrador)",
                    "Secciones": None,
                    "Lecciones": None,
                    "Duración Total": None,
                    "Estudiantes": None,
                    "Instructor(es)": None,
                    "Tecnologías / Temas (Udemy)": None,
                    "URL": "https://www.udemy.com/course/6008398/",
                },
                {
                    "#": 3,
                    "ID Curso": 7160771,
                    "Título": "TypeScript Practice Test",
                    "Progreso (%)": 0,
                    "Estado": "Examen de práctica (sin video, solo preguntas)",
                    "Secciones": None,
                    "Lecciones": None,
                    "Duración Total": "300 questions",
                    "Estudiantes": "1,000",
                    "Instructor(es)": "Someone",
                    "Tecnologías / Temas (Udemy)": "Typescript",
                    "URL": "https://www.udemy.com/course/7160771/",
                },
            ]
        ),
        "Temario Completo": pd.DataFrame(
            [
                {
                    "ID Curso": 7014617,
                    "Título del Curso": "GO Programming",
                    "Sección": "Introduction to Go",
                    "# Lecciones en Sección": 2.0,
                    "Duración Sección": "19min",
                    "Lección": "What is Go?",
                    "Duración": "4:46",
                    "Preview Gratis": "Sí",
                },
                {
                    "ID Curso": 7014617,
                    "Título del Curso": "GO Programming",
                    "Sección": "Introduction to Go",
                    "# Lecciones en Sección": 2.0,
                    "Duración Sección": "19min",
                    "Lección": "Installing Go",
                    "Duración": "6:08",
                    "Preview Gratis": "No",
                },
            ]
        ),
        "Objetivos de Aprendizaje": pd.DataFrame(
            [
                {
                    "ID Curso": 7014617,
                    "Título del Curso": "GO Programming",
                    "Objetivo de Aprendizaje": "What is Go and Why Use It?",
                }
            ]
        ),
        "Cursos No Disponibles": pd.DataFrame(
            [
                {
                    "ID Curso": 6008398,
                    'Título (según listado "Mis Cursos")': "Lenguaje C",
                    "Progreso (%)": 2,
                    "Motivo": "El curso ya no está disponible",
                    "URL": "https://www.udemy.com/course/6008398/",
                }
            ]
        ),
        "Exámenes de Práctica": pd.DataFrame(
            [
                {
                    "ID Curso": 7160771,
                    "Título": "TypeScript Practice Test",
                    "Total Preguntas (curso)": "300 questions",
                    "Nombre del Examen": "Exam 1",
                    "Preguntas del Examen": "75 questions",
                }
            ]
        ),
    }


def test_build_courses_normalizes_rows(sheets):
    courses, curriculum = build_courses(sheets)
    by_id = {c.id: c for c in courses}

    go = by_id["7014617"]
    assert go.durationMinutes == 296
    assert go.students == 5541
    assert go.status == "active"
    assert go.category == "Lenguajes de programación"
    assert go.learningObjectives == ["What is Go and Why Use It?"]
    assert go.hasCurriculum is True

    unavailable = by_id["6008398"]
    assert unavailable.status == "unavailable"
    assert unavailable.durationMinutes is None
    assert unavailable.technologies == []
    assert unavailable.unavailableReason == "El curso ya no está disponible"

    exam = by_id["7160771"]
    assert exam.status == "practice_exam"
    assert exam.durationMinutes is None
    assert exam.totalQuestions == 300
    assert [e.name for e in exam.practiceExams] == ["Exam 1"]

    sections = curriculum["7014617"]
    assert len(sections) == 1
    assert [lec.durationSeconds for lec in sections[0].lectures] == [286, 368]
    assert sections[0].lectures[0].freePreview is True


def test_build_dataset_stats(sheets):
    courses, _ = build_courses(sheets)
    stats = build_dataset(courses)["stats"]
    assert stats["totalCourses"] == 3
    assert stats["activeCourses"] == 1
    assert stats["completedCourses"] == 1
    assert stats["totalMinutes"] == 296
    assert stats["watchedMinutes"] == 296
    assert stats["remainingMinutes"] == 0


def test_write_outputs_is_reproducible(tmp_path, sheets):
    courses, curriculum = build_courses(sheets)
    write_outputs(tmp_path, courses, curriculum)

    dataset = json.loads((tmp_path / "courses.json").read_text(encoding="utf-8"))
    curriculum_json = json.loads((tmp_path / "curriculum.json").read_text(encoding="utf-8"))

    assert [c["title"] for c in dataset["courses"]] == sorted(
        c["title"] for c in dataset["courses"]
    )
    assert curriculum_json["7014617"][0]["title"] == "Introduction to Go"
