#!/usr/bin/env python3
"""Convert Qidase Reader liturgical JSON files to/from CSV.

Supports the LiturgicalText shape used by data/qidan.json and
data/serate-qidase.json (and structurally compatible Anaphora files).

Usage:
    python scripts/json_csv.py --to-csv  data/qidan.json          out.csv
    python scripts/json_csv.py --to-json out.csv                  data/qidan.json

CSV layout: one row per record with a `kind` discriminator
(`doc` | `section` | `block`). Row order encodes structural order; a
`section` row opens a new section and subsequent `block` rows belong to it
until the next `section` (or end of file).

Empty-cell convention: an empty CSV cell means an empty string in JSON
(`"key": ""`). The literal sentinel `\\N` means the key is absent from the
JSON object entirely. This distinction matters because qidan.json omits
unused text fields while serate-qidase.json sets them to "".
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any

ABSENT = "\\N"  # sentinel meaning "key not present in JSON object"

TITLE_LANGS = ("english", "geez", "amharic", "transliteration")
BLOCK_TEXT_FIELDS = ("geez", "amharic", "english", "transliteration")
BLOCK_OPTIONAL_FIELDS = ("speaker", "dynamic", "overrideId")

FIELDS = [
    "kind",
    "doc_id",
    "doc_saint",
    *(f"doc_title_{lang}" for lang in TITLE_LANGS),
    "section_id",
    *(f"section_title_{lang}" for lang in TITLE_LANGS),
    "block_id",
    "block_type",
    "speaker",
    "geez",
    "amharic",
    "english",
    "transliteration",
    "dynamic",
    "overrideId",
    "optional",
]


def _cell(obj: dict[str, Any], key: str) -> str:
    """Render a possibly-absent string field. Absent keys become ABSENT."""
    if key not in obj:
        return ABSENT
    value = obj[key]
    return "" if value == "" else str(value)


def _read_optional(row: dict[str, str], key: str) -> tuple[bool, str]:
    """Return (present, value). Present=False means the JSON key should be omitted."""
    raw = row.get(key)
    if raw is None or raw == ABSENT:
        return False, ""
    return True, raw


def _title_dict(row: dict[str, str], prefix: str) -> dict[str, str]:
    title: dict[str, str] = {}
    for lang in TITLE_LANGS:
        present, value = _read_optional(row, f"{prefix}_{lang}")
        if present:
            title[lang] = value
    return title


def json_to_csv(json_path: Path, csv_path: Path) -> None:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    rows: list[dict[str, str]] = []

    # LiturgicalText uses `title`; Anaphora uses `name`. Track which.
    if "name" in data:
        doc_kind = "anaphora"
        doc_title = data["name"]
    else:
        doc_kind = "doc"
        doc_title = data.get("title", {})
    doc_row: dict[str, str] = {
        "kind": doc_kind,
        "doc_id": data.get("id", ""),
        "doc_saint": _cell(data, "saint"),
    }
    for lang in TITLE_LANGS:
        doc_row[f"doc_title_{lang}"] = _cell(doc_title, lang)
    rows.append(doc_row)

    for section in data.get("sections", []):
        s_title = section.get("title", {})
        section_row: dict[str, str] = {
            "kind": "section",
            "section_id": section.get("id", ""),
        }
        for lang in TITLE_LANGS:
            section_row[f"section_title_{lang}"] = _cell(s_title, lang)
        rows.append(section_row)

        for block in section.get("blocks", []):
            row: dict[str, str] = {
                "kind": "block",
                "block_id": block.get("id", ""),
                "block_type": block.get("type", ""),
            }
            for field in BLOCK_OPTIONAL_FIELDS + BLOCK_TEXT_FIELDS:
                row[field] = _cell(block, field)
            row["optional"] = (
                ABSENT if "optional" not in block
                else ("true" if block["optional"] else "false")
            )
            rows.append(row)

    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in FIELDS})

    print(f"wrote {len(rows)} rows to {csv_path}")


def csv_to_json(csv_path: Path, json_path: Path) -> None:
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    doc: dict[str, Any] = {}
    sections: list[dict[str, Any]] = []
    current_section: dict[str, Any] | None = None

    for i, row in enumerate(rows, start=2):  # start=2 for 1-based + header
        kind = (row.get("kind") or "").strip()
        if kind in ("doc", "anaphora"):
            root_key = "name" if kind == "anaphora" else "title"
            doc = {
                "id": row["doc_id"],
                root_key: _title_dict(row, "doc_title"),
            }
            saint_present, saint_value = _read_optional(row, "doc_saint")
            if saint_present:
                doc["saint"] = saint_value
            doc["sections"] = sections
        elif kind == "section":
            current_section = {
                "id": row["section_id"],
                "title": _title_dict(row, "section_title"),
                "blocks": [],
            }
            sections.append(current_section)
        elif kind == "block":
            if current_section is None:
                raise ValueError(f"row {i}: block before any section")
            block: dict[str, Any] = {
                "id": row["block_id"],
                "type": row["block_type"],
            }
            for field in BLOCK_OPTIONAL_FIELDS + BLOCK_TEXT_FIELDS:
                present, value = _read_optional(row, field)
                if present:
                    block[field] = value
            opt_present, opt_value = _read_optional(row, "optional")
            if opt_present:
                normalized = opt_value.strip().lower()
                if normalized in ("true", "1", "yes"):
                    block["optional"] = True
                elif normalized in ("false", "0", "no"):
                    block["optional"] = False
                else:
                    raise ValueError(f"row {i}: bad optional value {opt_value!r}")
            current_section["blocks"].append(block)
        elif kind == "":
            continue
        else:
            raise ValueError(f"row {i}: unknown kind {kind!r}")

    if not doc:
        raise ValueError("no `doc` row found in CSV")

    json_path.write_text(
        json.dumps(doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(sections)} sections to {json_path}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    direction = parser.add_mutually_exclusive_group(required=True)
    direction.add_argument("--to-csv", action="store_true", help="JSON -> CSV")
    direction.add_argument("--to-json", action="store_true", help="CSV -> JSON")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args(argv)

    if args.to_csv:
        json_to_csv(args.input, args.output)
    else:
        csv_to_json(args.input, args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
