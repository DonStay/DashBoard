"""Funciones puras de limpieza para el export de Udemy.

Cada función acepta los valores tal como vienen del Excel (que trae nulos,
texto libre y formatos inconsistentes) y devuelve un valor normalizado.
"""

from __future__ import annotations

import math
import re
import unicodedata

DURATION_RE = re.compile(
    r"(?:(?P<hours>\d+)\s*h)?\s*(?:(?P<minutes>\d+)\s*m(?:in)?)?", re.IGNORECASE
)
QUESTIONS_RE = re.compile(r"(\d[\d.,]*)\s*questions?", re.IGNORECASE)
CLOCK_RE = re.compile(r"^(?:(\d+):)?(\d+):(\d+)$")

STATUS_BY_LABEL = {
    "activo": "active",
    "no disponible (curso eliminado o en borrador)": "unavailable",
    "examen de práctica (sin video, solo preguntas)": "practice_exam",
}

# Se evalúan en orden: la primera categoría con un match gana.
CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    (
        "Ciberseguridad",
        (
            "cybersecurity",
            "ethical hacking",
            "network & security",
            "penetration testing",
            "hacking",
            "osint",
            "malware",
            "kali",
            "burp",
            "nmap",
        ),
    ),
    (
        "Datos & IA",
        (
            "artificial intelligence",
            "generative ai",
            "machine learning",
            "deep learning",
            "data science",
            "data analysis",
            "chatgpt",
            "llm",
            "power bi",
            "tableau",
            "pandas",
            "numpy",
            "business analytics",
        ),
    ),
    (
        "Cloud & DevOps",
        (
            "aws",
            "amazon web services",
            "azure",
            "google cloud",
            "docker",
            "kubernetes",
            "devops",
            "terraform",
            "jenkins",
            "operating systems & servers",
            "linux",
        ),
    ),
    (
        "Mobile",
        ("mobile development", "android", "ios", "flutter", "react native", "kotlin", "swift"),
    ),
    (
        "Bases de datos",
        ("mysql", "sql", "postgresql", "mongodb", "database", "oracle", "firebase"),
    ),
    (
        "Desarrollo web",
        (
            "web development",
            "javascript",
            "typescript",
            "react",
            "angular",
            "vue",
            "node",
            "php",
            "laravel",
            "django",
            "wordpress",
            "css",
            "html",
            "bootstrap",
            "tailwind",
            "next.js",
        ),
    ),
    (
        "Lenguajes de programación",
        (
            "programming languages",
            "python",
            "java",
            "c# (programming language)",
            "c++",
            "c (programming language)",
            "go (programming language)",
            "rust",
            "software engineering",
            "software testing",
        ),
    ),
    (
        "Negocios & productividad",
        (
            "business",
            "marketing",
            "office productivity",
            "microsoft excel",
            "finance",
            "design",
            "teaching & academics",
            "personal development",
        ),
    ),
]


def _is_missing(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and value.strip().lower() in {"", "nan", "none", "-", "n/a"}:
        return True
    return False


def parse_duration_minutes(raw: object) -> int | None:
    """Convierte duraciones tipo ``"4h 56m"``, ``"19min"`` o ``"1:02:03"`` a minutos.

    Devuelve ``None`` cuando el valor falta o no contiene una duración
    (por ejemplo ``"300 questions"`` en los exámenes de práctica).
    """
    if _is_missing(raw):
        return None
    if isinstance(raw, (int, float)):
        return max(int(round(float(raw))), 0)

    text = str(raw).strip().lower().replace("hr", "h").replace("hrs", "h")

    clock = CLOCK_RE.match(text)
    if clock:
        hours, minutes, seconds = clock.groups()
        total = int(minutes) * 60 + int(seconds) + (int(hours) * 3600 if hours else 0)
        return int(round(total / 60))

    match = DURATION_RE.search(text)
    if not match or not any(match.groupdict().values()):
        return None
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes") or 0)
    return hours * 60 + minutes


def parse_duration_seconds(raw: object) -> int | None:
    """Convierte duraciones de lección (``"4:46"``, ``"1:02:03"``, ``"7min"``) a segundos."""
    if _is_missing(raw):
        return None
    text = str(raw).strip()
    clock = CLOCK_RE.match(text)
    if clock:
        hours, minutes, seconds = clock.groups()
        return int(minutes) * 60 + int(seconds) + (int(hours) * 3600 if hours else 0)
    minutes = parse_duration_minutes(text)
    return minutes * 60 if minutes is not None else None


def split_technologies(raw: object) -> list[str]:
    """Separa el texto libre ``"Go | Programming Languages | Development"`` en una lista.

    Normaliza espacios, elimina duplicados (sin distinguir mayúsculas) y
    conserva el orden original.
    """
    if _is_missing(raw):
        return []
    parts = re.split(r"[|;/]|,(?![^(]*\))", str(raw))
    seen: dict[str, str] = {}
    for part in parts:
        cleaned = re.sub(r"\s+", " ", part).strip(" .-")
        if not cleaned:
            continue
        seen.setdefault(cleaned.casefold(), cleaned)
    return list(seen.values())


def split_instructors(raw: object) -> list[str]:
    if _is_missing(raw):
        return []
    parts = [re.sub(r"\s+", " ", p).strip() for p in str(raw).split("|")]
    return [p for p in parts if p]


def parse_students(raw: object) -> int | None:
    """``"25,307"`` -> ``25307``. Devuelve ``None`` si no hay número."""
    if _is_missing(raw):
        return None
    if isinstance(raw, (int, float)):
        return int(raw)
    digits = re.sub(r"[^\d]", "", str(raw))
    return int(digits) if digits else None


def parse_questions(raw: object) -> int | None:
    """``"300 questions"`` -> ``300``."""
    if _is_missing(raw):
        return None
    if isinstance(raw, (int, float)):
        return int(raw)
    match = QUESTIONS_RE.search(str(raw))
    if match:
        return int(re.sub(r"[^\d]", "", match.group(1)))
    digits = re.sub(r"[^\d]", "", str(raw))
    return int(digits) if digits else None


def parse_int(raw: object) -> int | None:
    if _is_missing(raw):
        return None
    try:
        return int(round(float(raw)))
    except (TypeError, ValueError):
        digits = re.sub(r"[^\d]", "", str(raw))
        return int(digits) if digits else None


def parse_progress(raw: object) -> int:
    value = parse_int(raw) or 0
    return min(max(value, 0), 100)


def parse_bool(raw: object) -> bool:
    if _is_missing(raw):
        return False
    return str(raw).strip().casefold() in {"sí", "si", "yes", "true", "1", "x"}


def clean_text(raw: object) -> str | None:
    if _is_missing(raw):
        return None
    return re.sub(r"\s+", " ", str(raw)).strip()


def normalize_status(raw: object) -> str:
    text = (clean_text(raw) or "").casefold()
    return STATUS_BY_LABEL.get(text, "active")


def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def categorize(technologies: list[str], title: str = "") -> str:
    """Asigna una categoría única a partir de las tecnologías (y el título como fallback)."""
    haystack = _strip_accents(" | ".join(technologies + [title]).casefold())
    for category, keywords in CATEGORY_RULES:
        if any(_strip_accents(keyword) in haystack for keyword in keywords):
            return category
    return "Otros"
