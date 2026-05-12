# Migration Notes: Current `data/` Shape -> Source Schema v1

These notes describe how the existing runtime-oriented content model maps into canonical source schema v1.

This is documentation only. It does not implement migration or compilation.

## Top-level documents

Current runtime files:

- `data/qidan.json`
- `data/serate-qidase.json`
- `data/anaphoras/*.json`
- `data/seasonals.json`

Planned source equivalents:

- `content/source/documents/service.qidan.json`
- `content/source/documents/service.serate-qidase.json`
- `content/source/documents/anaphora.<slug>.json`
- `content/source/seasonals/seasonal.serate-qidase.json`

## Title fields

Current:

```json
{
  "title": {
    "english": "Qidan",
    "geez": "ጸሎተ ኪዳን",
    "amharic": "ጸሎተ ኪዳን"
  }
}
```

Source v1:

```json
{
  "titles": {
    "en": "Qidan",
    "gez": "ጸሎተ ኪዳን",
    "am": "ጸሎተ ኪዳን"
  }
}
```

Mapping:

- `english` -> `en`
- `geez` -> `gez`
- `amharic` -> `am`
- `transliteration` -> `gez-Latn`

If a value is missing, omit the key instead of storing `""`.

## Sections

Current:

- `sections[].title`
- `sections[].blocks`

Source v1:

- `sections[].titles`
- `sections[].nodes`

## Text blocks

Current runtime prayer/response blocks:

```json
{
  "id": "ap-op-2",
  "type": "prayer",
  "speaker": "priest",
  "geez": "እግዚአብሔር ምስለ ኵልክሙ።",
  "amharic": "እግዚአብሔር ከሁላችሁ ጋር ይሁን።",
  "english": "The Lord be with you all.",
  "transliteration": "Igzee'abihér misle kwulikimu."
}
```

Source v1 text node:

```json
{
  "id": "ap-op-2",
  "kind": "text",
  "role": "prayer",
  "speaker": "priest",
  "content": {
    "gez": "እግዚአብሔር ምስለ ኵልክሙ።",
    "am": "እግዚአብሔር ከሁላችሁ ጋር ይሁን።",
    "en": "The Lord be with you all.",
    "gez-Latn": "Igzee'abihér misle kwulikimu."
  }
}
```

## Heading and rubric blocks

Current `type: "heading"` becomes `kind: "heading"`.

Current `type: "rubric"` becomes `kind: "rubric"`.

Both use locale maps under `content`.

## Speaker normalization

Current runtime values map as follows:

- `priest` -> `priest`
- `deacon` -> `deacon`
- `asst. priest` -> `assistant-priest`
- `asst. deacon` -> `assistant-deacon`
- `congregation` -> `assembly`
- `all` -> `all`

## Seasonal placeholders

Current runtime placeholder blocks:

```json
{
  "type": "placeholder",
  "overrideId": "intro-day-of-week-overrides",
  "optional": true
}
```

Source v1 seasonal reference:

```json
{
  "kind": "seasonal-ref",
  "slot": "intro-day-of-week",
  "optional": true
}
```

Important change:

- current runtime `overrideId` values are implementation-oriented
- source v1 slot IDs should be renamed to semantic, stable names where possible

## Seasonal alternatives

Current `data/seasonals.json` uses ordinary blocks with inline `conditions`.

Source v1 moves these into a dedicated seasonal document:

```json
{
  "kind": "seasonal",
  "slots": [
    {
      "id": "intro-day-of-week",
      "rules": [
        {
          "id": "sunday",
          "when": {
            "daysOfWeek": ["sunday"]
          },
          "nodes": []
        }
      ]
    }
  ]
}
```

Condition key mapping:

- `dayOfWeek` -> `daysOfWeek`
- `season` -> `seasons`
- `feast` -> `feastIds`
- `dateRange` -> `dateRanges`

## Reading placeholders

Current runtime reading markers overload multiple fields:

- `type: "reading"`
- `dynamic`
- `readingSlot`

Source v1 removes `dynamic` and uses explicit node kinds.

Current runtime idea:

```json
{
  "id": "serate-readings-1",
  "type": "reading",
  "readingSlot": "gospel",
  "english": "Holy Gospel"
}
```

Source v1:

```json
{
  "id": "gospel-label",
  "kind": "reading-ref",
  "slot": "gospel",
  "style": "heading",
  "labels": {
    "en": "Holy Gospel"
  }
}
```

And the separate body position becomes:

```json
{
  "id": "gospel-body",
  "kind": "reading-body",
  "slot": "gospel"
}
```

For dynamic Psalm/Gospel labels that remain standalone in the current reader:

- heading-style markers become `reading-ref` with `style: "heading"`
- rubric-style markers become `reading-ref` with `style: "rubric"`

## Repeated copied text

Current repeated copied blocks should eventually move to `fragment` documents plus `include` nodes.

Example target pattern:

```json
{
  "id": "common-amen",
  "kind": "include",
  "ref": "fragment.common-amen#amen"
}
```

This is part of the source schema contract now even if fragment extraction happens later.
