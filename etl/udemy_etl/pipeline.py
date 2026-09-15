"""ETL: Excel de Udemy -> ``courses.json`` + ``curriculum.json``.

Uso:
    python -m udemy_etl --excel ../data/udemy_biblioteca_completa.xlsx \
        --out ../frontend/public/data
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from .cleaning import (
    categorize,
    clean_text,
    normalize_status,
    parse_bool,
    parse_duration_minutes,
    parse_duration_seconds,
    parse_int,
    parse_progress,
    parse_questions,
    parse_students,
    split_instructors,
    split_technologies,
)

SHEET_SUMMARY = "Resumen"
SHEET_CURRICULUM = "Temario Completo"
SHEET_OBJECTIVES = "Objetivos de Aprendizaje"
SHEET_UNAVAILABLE = "Cursos No Disponibles"
SHEET_EXAMS = "Exámenes de Práctica"


@dataclass
class Lecture:
    title: str
    durationSeconds: int | None
    freePreview: bool


@dataclass
class Section:
    title: str
    lectureCount: int | None
    durationMinutes: int | None
    lectures: list[Lecture] = field(default_factory=list)


@dataclass
class PracticeExam:
    name: str
    questions: int | None


@dataclass
class Course:
    id: str
    title: str
    url: str
    status: str
    category: str
    progress: int
    sections: int | None
    lectures: int | None
    durationMinutes: int | None
    students: int | None
    instructors: list[str]
    technologies: list[str]
    learningObjectives: list[str]
    practiceExams: list[PracticeExam]
    totalQuestions: int | None
    unavailableReason: str | None
    hasCurriculum: bool


def _total_questions(status: str, from_exams: int | None, row: dict[str, Any]) -> int | None:
    if from_exams is not None:
        return from_exams
    if status == "practice_exam":
        return parse_questions(row["Duración Total"])
    return None


def _read_sheets(excel_path: Path) -> dict[str, pd.DataFrame]:
    book = pd.ExcelFile(excel_path)
    return {name: book.parse(name) for name in book.sheet_names}


def _build_objectives(df: pd.DataFrame) -> dict[str, list[str]]:
    objectives: dict[str, list[str]] = defaultdict(list)
    for course_id, objective in zip(df["ID Curso"], df["Objetivo de Aprendizaje"]):
        text = clean_text(objective)
        if text:
            objectives[str(parse_int(course_id))].append(text)
    return objectives


def _build_exams(df: pd.DataFrame) -> tuple[dict[str, list[PracticeExam]], dict[str, int | None]]:
    exams: dict[str, list[PracticeExam]] = defaultdict(list)
    totals: dict[str, int | None] = {}
    for row in df.to_dict(orient="records"):
        course_id = str(parse_int(row["ID Curso"]))
        name = clean_text(row["Nombre del Examen"]) or "Examen"
        exams[course_id].append(
            PracticeExam(name=name, questions=parse_questions(row["Preguntas del Examen"]))
        )
        totals[course_id] = parse_questions(row["Total Preguntas (curso)"])
    return exams, totals


def _build_unavailable(df: pd.DataFrame) -> dict[str, str | None]:
    reasons: dict[str, str | None] = {}
    for course_id, reason in zip(df["ID Curso"], df["Motivo"]):
        reasons[str(parse_int(course_id))] = clean_text(reason)
    return reasons


def _build_curriculum(df: pd.DataFrame) -> dict[str, list[Section]]:
    curriculum: dict[str, list[Section]] = defaultdict(list)
    index: dict[tuple[str, str], Section] = {}
    for row in df.to_dict(orient="records"):
        course_id = str(parse_int(row["ID Curso"]))
        section_title = clean_text(row["Sección"]) or "Sin sección"
        key = (course_id, section_title)
        section = index.get(key)
        if section is None:
            section = Section(
                title=section_title,
                lectureCount=parse_int(row["# Lecciones en Sección"]),
                durationMinutes=parse_duration_minutes(row["Duración Sección"]),
            )
            index[key] = section
            curriculum[course_id].append(section)
        lecture_title = clean_text(row["Lección"])
        if lecture_title:
            section.lectures.append(
                Lecture(
                    title=lecture_title,
                    durationSeconds=parse_duration_seconds(row["Duración"]),
                    freePreview=parse_bool(row["Preview Gratis"]),
                )
            )
    return curriculum


def build_courses(sheets: dict[str, pd.DataFrame]) -> tuple[list[Course], dict[str, list[Section]]]:
    summary = sheets[SHEET_SUMMARY]
    objectives = _build_objectives(sheets[SHEET_OBJECTIVES])
    exams, exam_totals = _build_exams(sheets[SHEET_EXAMS])
    reasons = _build_unavailable(sheets[SHEET_UNAVAILABLE])
    curriculum = _build_curriculum(sheets[SHEET_CURRICULUM])

    courses: list[Course] = []
    for row in summary.to_dict(orient="records"):
        course_id = str(parse_int(row["ID Curso"]))
        title = clean_text(row["Título"]) or f"Curso {course_id}"
        technologies = split_technologies(row["Tecnologías / Temas (Udemy)"])
        status = normalize_status(row["Estado"])
        duration = parse_duration_minutes(row["Duración Total"])
        courses.append(
            Course(
                id=course_id,
                title=title,
                url=clean_text(row["URL"]) or f"https://www.udemy.com/course/{course_id}/",
                status=status,
                category=categorize(technologies, title),
                progress=parse_progress(row["Progreso (%)"]),
                sections=parse_int(row["Secciones"]),
                lectures=parse_int(row["Lecciones"]),
                durationMinutes=duration,
                students=parse_students(row["Estudiantes"]),
                instructors=split_instructors(row["Instructor(es)"]),
                technologies=technologies,
                learningObjectives=objectives.get(course_id, []),
                practiceExams=exams.get(course_id, []),
                totalQuestions=_total_questions(status, exam_totals.get(course_id), row),
                unavailableReason=reasons.get(course_id),
                hasCurriculum=course_id in curriculum,
            )
        )
    courses.sort(key=lambda c: c.title.casefold())
    return courses, curriculum


def build_dataset(courses: list[Course]) -> dict[str, Any]:
    active = [c for c in courses if c.status == "active"]
    total_minutes = sum(c.durationMinutes or 0 for c in courses)
    watched_minutes = sum(
        round((c.durationMinutes or 0) * c.progress / 100) for c in courses
    )
    categories = sorted({c.category for c in courses})
    technologies = sorted({t for c in courses for t in c.technologies})
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "udemy_biblioteca_completa.xlsx",
        "stats": {
            "totalCourses": len(courses),
            "activeCourses": len(active),
            "completedCourses": sum(1 for c in courses if c.progress == 100),
            "inProgressCourses": sum(1 for c in courses if 0 < c.progress < 100),
            "notStartedCourses": sum(1 for c in courses if c.progress == 0),
            "totalMinutes": total_minutes,
            "watchedMinutes": watched_minutes,
            "remainingMinutes": max(total_minutes - watched_minutes, 0),
            "categories": categories,
            "technologies": technologies,
        },
        "courses": [asdict(c) for c in courses],
    }


def write_outputs(out_dir: Path, courses: list[Course], curriculum: dict[str, list[Section]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    dataset = build_dataset(courses)
    (out_dir / "courses.json").write_text(
        json.dumps(dataset, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    curriculum_payload = {
        course_id: [asdict(section) for section in sections]
        for course_id, sections in curriculum.items()
    }
    (out_dir / "curriculum.json").write_text(
        json.dumps(curriculum_payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def run(excel_path: Path, out_dir: Path) -> dict[str, Any]:
    sheets = _read_sheets(excel_path)
    courses, curriculum = build_courses(sheets)
    write_outputs(out_dir, courses, curriculum)
    return build_dataset(courses)["stats"]


def main(argv: list[str] | None = None) -> int:
    root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="ETL del export de Udemy a JSON limpio")
    parser.add_argument("--excel", type=Path, default=root / "data" / "udemy_biblioteca_completa.xlsx")
    parser.add_argument("--out", type=Path, default=root / "frontend" / "public" / "data")
    args = parser.parse_args(argv)

    stats = run(args.excel, args.out)
    print(f"courses.json escrito en {args.out}")
    for key in ("totalCourses", "activeCourses", "completedCourses", "totalMinutes"):
        print(f"  {key}: {stats[key]}")
    return 0
