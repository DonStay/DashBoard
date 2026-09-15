import pytest

from udemy_etl.cleaning import (
    categorize,
    normalize_status,
    parse_duration_minutes,
    parse_duration_seconds,
    parse_progress,
    parse_questions,
    parse_students,
    split_instructors,
    split_technologies,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("4h 56m", 296),
        ("163h 17m", 9797),
        ("1h 0m", 60),
        ("19min", 19),
        ("45m", 45),
        ("2h", 120),
        ("1:02:03", 62),
        ("4:46", 5),
        (None, None),
        (float("nan"), None),
        ("300 questions", None),
        ("", None),
    ],
)
def test_parse_duration_minutes(raw, expected):
    assert parse_duration_minutes(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [("4:46", 286), ("1:02:03", 3723), ("7min", 420), (None, None)],
)
def test_parse_duration_seconds(raw, expected):
    assert parse_duration_seconds(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (
            "Go (programming language) | Programming Languages | Development",
            ["Go (programming language)", "Programming Languages", "Development"],
        ),
        ("  Python  |  python | ", ["Python"]),
        ("Node.Js|Typescript", ["Node.Js", "Typescript"]),
        (None, []),
        (float("nan"), []),
        ("", []),
    ],
)
def test_split_technologies(raw, expected):
    assert split_technologies(raw) == expected


def test_split_technologies_keeps_commas_inside_parentheses():
    assert split_technologies("Artificial Intelligence (AI, ML) | Data Science") == [
        "Artificial Intelligence (AI, ML)",
        "Data Science",
    ]


def test_split_instructors():
    raw = "Alvaro Chirou | Ciberseguridad Hacking Seguridad Informática"
    assert split_instructors(raw) == [
        "Alvaro Chirou",
        "Ciberseguridad Hacking Seguridad Informática",
    ]


@pytest.mark.parametrize(
    ("raw", "expected"), [("25,307", 25307), ("366", 366), (1319, 1319), (None, None)]
)
def test_parse_students(raw, expected):
    assert parse_students(raw) == expected


@pytest.mark.parametrize(("raw", "expected"), [("300 questions", 300), ("75 questions", 75), (None, None)])
def test_parse_questions(raw, expected):
    assert parse_questions(raw) == expected


@pytest.mark.parametrize(("raw", "expected"), [(-5, 0), (150, 100), (19, 19), (None, 0)])
def test_parse_progress(raw, expected):
    assert parse_progress(raw) == expected


def test_normalize_status():
    assert normalize_status("Activo") == "active"
    assert normalize_status("No disponible (curso eliminado o en borrador)") == "unavailable"
    assert normalize_status("Examen de práctica (sin video, solo preguntas)") == "practice_exam"
    assert normalize_status(None) == "active"


@pytest.mark.parametrize(
    ("technologies", "expected"),
    [
        (["React JS", "Web Development"], "Desarrollo web"),
        (["Ethical Hacking", "IT & Software"], "Ciberseguridad"),
        (["Generative AI (GenAI)"], "Datos & IA"),
        (["MySQL"], "Bases de datos"),
        ([], "Otros"),
    ],
)
def test_categorize(technologies, expected):
    assert categorize(technologies) == expected


def test_categorize_falls_back_to_title():
    assert categorize([], "Curso completo de Flutter y Dart") == "Mobile"
