---
name: anaphora-parser
description: Parse an Ethiopian Orthodox anaphora from the englishethiopianliturgy.pdf source into structured JSON for the Qidase Reader app. Use this skill when the user asks to add or update an anaphora, parse anaphora text, or populate data/anaphoras/<name>.json from the PDF.
---

Parse an anaphora from the PDF source into a structured JSON file. Follow these steps in order.

> **Context tip:** Parsing a full anaphora is a long task. If the context window fills up mid-way, run `/compact` to summarize prior context and continue from where you left off without losing progress.

---

## Step 1 — Extract PDF text

Run `pdftotext` with the correct page range for the target anaphora. Output goes to `anaphora_pds/`, not `/tmp`.

```bash
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH" && \
pdftotext -f <start_page> -l <end_page> -layout \
  "/Users/nahom_work/Documents/projects/EthiopicReader/anaphora_pds/englishethiopianliturgy.pdf" \
  "/Users/nahom_work/Documents/projects/EthiopicReader/anaphora_pds/<name>_text.txt" && \
wc -l "/Users/nahom_work/Documents/projects/EthiopicReader/anaphora_pds/<name>_text.txt"
```

**Page ranges** (from the PDF table of contents):
| Anaphora | Pages |
|---|---|
| Apostles | 43–57 |
| Lord (Hwarya) | 58–81 |
| John Son of Thunder | 82–97 |
| Mary (Our Lady) | 98–117 |
| Athanasius | 118–130 |
| Basil | 131–148 |
| Gregory of Nyssa | 149–160 |
| Epiphanius | 161–173 |
| Cyril | (appendix) |
| John Chrysostom | (appendix) |

> If unsure of page range, ask the user or check the PDF table of contents (around page 5–7).

---

## Step 2 — Read and clean the extracted text

Read the full `anaphora_pds/<name>_text.txt` file. See `anaphora_pds/apostles_text.txt` as a completed reference example. Key things to know:

- **Two-column layout**: The PDF renders two columns. `pdftotext -layout` interleaves them — left column lines appear first on each page, then right column. Read carefully to reconstruct paragraph order.
- **Paragraph numbers**: Each prayer unit is numbered (1., 2., 3., ...). Use these as anchors.
- **Strip noise**: page numbers, `www.ethiopianorthodox.org` URLs, `\f` form-feed characters, footnote superscripts like `(1)`.
- **Rubrics**: Lines describing liturgical actions (e.g. "He shall then...", "At this time...", "The people shall repeat...") are rubrics — not spoken text.

---

## Step 3 — Map paragraphs to liturgical sections

Group numbered paragraphs into sections. Use `data/anaphoras/apostles.json` as the canonical reference model (170 paragraphs, 19 sections — parsed from `anaphora_pds/apostles_text.txt`).

**Standard section sequence** (most anaphoras follow this order):

| Section ID suffix | Description |
|---|---|
| `opening` | Opening blessing, dialogue (Give thanks / It is right) |
| `lords-prayer` | The Lord's Prayer |
| `hail-mary` | Hail Mary |
| `preface` | Preface prayer(s) |
| `intercessions` | Intercession prayers for church, saints, departed |
| `sanctus` | Holy holy holy (Sanctus) |
| `post-sanctus` | Post-sanctus prayer |
| `institution` | Words of institution (bread and cup) |
| `anamnesis` | Anamnesis / memorial hymns |
| `epiclesis` | Epiclesis (invocation of Holy Spirit) |
| `fraction` | Prayer of Fraction |
| `absolution` | Absolution / forgiveness prayers |
| `penitence` | Prayer of Penitence |
| `remembrances` | Remembrances of saints and departed |
| `pre-communion` | Pre-communion prayers and I believe confessions |
| `communion` | Distribution of Communion |
| `post-communion` | Post-communion thanksgiving |
| `thanksgiving` | Thanksgiving chants / My mouth shall speak |
| `post-consumption` | After consuming remaining Body and Blood |
| `dismissal` | Blessing, benediction, dismissal |

Not all anaphoras have every section — skip those that don't appear.

---

## Step 4 — Build PrayerBlock JSON

**Block ID format:** `<anaphora-abbrev>-<section-abbrev>-<n>`
Example: `ap-op-1` (Apostles, Opening, block 1), `lo-san-3` (Lord, Sanctus, block 3)

**Common anaphora abbreviations:**
- Apostles → `ap`
- Lord (Hwarya) → `lo`
- John Son of Thunder → `jo`
- Mary → `ma`
- Athanasius → `at`
- Basil → `ba`
- Gregory → `gr`
- Epiphanius → `ep`

**Block types:**

| `type` | When to use |
|---|---|
| `"prayer"` | Priest, deacon, or joint spoken prayer |
| `"response"` | Congregation response |
| `"rubric"` | Liturgical instruction (no speech) |
| `"heading"` | Section heading / title label |

**Speaker attribution** (only on `prayer` and `response` blocks, not rubric/heading):

| Text says | `speaker` value |
|---|---|
| Priest: | `"priest"` |
| People: | `"congregation"` |
| Deacon: / Asst. Deacon: | `"deacon"` |
| All together / joint | `"all"` |
| (no speaker — rubric) | omit `speaker` field |

**Language fields:** Always include all four — set to `""` if not available:
```json
{
  "geez": "",
  "amharic": "",
  "english": "...",
  "transliteration": ""
}
```

**Preserve existing content:** If the target JSON already has blocks with Ge'ez/Amharic/transliteration text, copy them over exactly — do not overwrite with empty strings.

**Section structure:**
```json
{
  "id": "apostles-opening",
  "title": "Opening",
  "blocks": [
    {
      "id": "ap-op-1",
      "type": "prayer",
      "speaker": "priest",
      "geez": "",
      "amharic": "",
      "english": "The Lord be with all of you.",
      "transliteration": ""
    }
  ]
}
```

---

## Step 5 — Write the JSON file

1. **Read the existing file first** (required — Write tool will fail otherwise):
   ```
   Read: data/anaphoras/<name>.json
   ```
2. **Write** the complete new JSON to `data/anaphoras/<name>.json`
3. **Check `data/anaphoras/metadata.json`** — if the anaphora is not listed, add an entry with `id`, `name`, and `shortName`.

---

## Verification

- Count total blocks written vs. total numbered paragraphs in the PDF — they should be close (rubrics add extra blocks beyond paragraph count)
- Run `npx expo start` and navigate to the anaphora in the app to verify it renders correctly
- Check that existing Ge'ez/Amharic content was not accidentally overwritten

---

## Commit

```bash
git add anaphora_pds/<name>_text.txt data/anaphoras/<name>.json && \
git commit -m "parse <Name> anaphora from PDF

- Add anaphora_pds/<name>_text.txt: extracted text from pages <start>-<end>
- Populate data/anaphoras/<name>.json: <N> paragraphs across <N> sections with English text"
```
