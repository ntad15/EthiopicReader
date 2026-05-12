# Source Schema v1

This directory defines the first canonical source-content schema for Ethiopic Reader.

## Scope

Schema v1 is intentionally narrow.

It defines:

- canonical source document shapes
- locale-map conventions
- source ID and filename conventions
- normalized speaker roles
- explicit seasonal and reading placeholders

It does not define:

- compiled runtime output
- compiler behavior
- validator CLI wiring
- CI enforcement
- editor/admin workflows

## Design rules

### Canonical source is not runtime JSON

Source files in `content/source/` are edited for meaning and structure.

Runtime JSON in `data/` remains the app-facing format until a later step migrates the reader.

### Locale maps are required

Use locale maps instead of fixed per-language properties:

```json
{
  "content": {
    "gez": "ቅዱስ።",
    "am": "ቅዱስ።",
    "en": "Holy.",
    "gez-Latn": "Qidus."
  }
}
```

Rules:

- omit missing locales
- never store empty strings
- only use `gez`, `am`, `en`, and `gez-Latn` in v1

### Seasonal logic stays out of generic text nodes

Do not put `conditions` on ordinary text nodes in base service or anaphora documents.

Instead:

- store conditional alternatives in `kind: "seasonal"` documents
- refer to them from base documents using `seasonal-ref`

### Reading markers are explicit node kinds

Do not carry over the current overloaded `dynamic` field into canonical source.

Use:

- `reading-ref` for the label or heading
- `reading-body` for the rendered reading slot

When a `reading-ref` is rendered without an adjacent `reading-body`, it may carry
`style: "heading"` or `style: "rubric"` so the compiler can preserve the current
runtime presentation.

## File naming

Use these filename prefixes:

- `service.<slug>.json`
- `anaphora.<slug>.json`
- `fragment.<slug>.json`
- `seasonal.<slug>.json`

Examples:

- `service.qidan.json`
- `service.serate-qidase.json`
- `anaphora.apostles.json`
- `fragment.common-amen.json`
- `seasonal.serate-qidase.json`

## Document IDs

Document IDs should match the filename stem.

Examples:

- filename `service.qidan.json` -> id `service.qidan`
- filename `anaphora.apostles.json` -> id `anaphora.apostles`
- filename `seasonal.serate-qidase.json` -> id `seasonal.serate-qidase`

Rules:

- IDs are lowercase
- IDs use `.` between namespace and slug
- IDs are stable once published
- IDs are never reused for different content

## Slugs

Slugs are kebab-case and human-readable.

Examples:

- `qidan`
- `serate-qidase`
- `saint-john-chrysostom`
- `common-amen`

## Section IDs

Section IDs are local to a document and should be semantic, not generated.

Good examples:

- `opening`
- `lords-prayer`
- `preface`
- `communion-prayer`

Avoid opaque generated IDs like:

- `section-mlyzjz9w58u`
- `section-mokp9yvc9w2`

## Node IDs

Node IDs are local to a section and should remain stable when text is edited.

Good examples:

- `priest-1`
- `response-1`
- `gospel-label`
- `gospel-body`
- `intercession-3a`
- `intercession-3b`

Rules:

- prefer semantic names over generated identifiers
- if a long unit must be split, suffix it with `a`, `b`, `c`
- do not reuse an existing node ID for unrelated text later

## Reference format

`include.ref` points to a fragment document or a specific section inside a fragment document.

Supported shapes:

- `fragment.common-amen`
- `fragment.common-amen#amen`

`seasonal-ref.slot` points to a seasonal slot ID such as:

- `intro-day-of-week`
- `halleluia-seasonal`

## Speaker normalization

Canonical source uses normalized values:

- `priest`
- `deacon`
- `assistant-priest`
- `assistant-deacon`
- `assembly`
- `all`

This lets later tooling map old runtime labels without preserving inconsistent source spelling like `asst. priest`.

## Relationship to current block-length rules

Current runtime `data/` content still follows the repo's block-length lint rules.

Schema v1 does not bake presentation-size limits into canonical source structure. Those limits stay a runtime concern until later migration work switches the app to compiled content.
