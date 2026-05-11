# Content Workspace

This directory is the new home for canonical liturgical content and its schema contract.

## Step-1 boundary

This directory currently defines structure only.

- `content/source/` is for human-edited canonical source
- `content/schema/` is the source schema contract
- runtime JSON in `data/` stays unchanged for now

No compiler, validator CLI, compiled output, or CI flow is implemented here yet.

## Layout

```text
content/
  schema/
    v1/
      README.md
      migration-notes.md
      types.ts
      source-document.schema.json
  source/
    documents/
    fragments/
    seasonals/
    examples/
```

## Source conventions

- Use locale maps, not fixed `geez` / `amharic` / `english` fields.
- Omit missing translations instead of storing empty strings.
- Keep source IDs stable once published.
- Do not store compiled runtime IDs in source content.
- Keep seasonal rules in `seasonal` documents, not inline on generic text nodes.

## Current source schema

The step-1 schema contract lives in:

- `content/schema/v1/README.md`
- `content/schema/v1/migration-notes.md`
- `content/schema/v1/types.ts`
- `content/schema/v1/source-document.schema.json`

The step-1 implementation plan lives in:

- `docs/content-schema-implementation-plan.md`

## Content pipeline commands

The repo now includes a local source-to-runtime pipeline:

- `npm run content:import`
  One-time migration helper that imports the current runtime corpus into `content/source/`.
- `npm run content:validate`
  Validates canonical source documents and references.
- `npm run content:build`
  Compiles source documents back into committed runtime artifacts under `data/`.
- `npm run content:verify`
  Rebuilds into a temp directory and fails if checked-in runtime artifacts are stale.
