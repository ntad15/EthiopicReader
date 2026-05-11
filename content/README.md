# Content Workspace

This directory is the new home for canonical liturgical content and its schema contract.

## Current state

- `content/source/**` is the human-edited canonical source of truth
- `content/schema/**` defines the source schema contract
- `data/**` is compiled runtime output generated locally and committed to the repo
- `data/runtimeIndex.ts` is generated and serves as the Expo app's runtime import surface
- CI only verifies that committed runtime output is current with `npm run content:verify`
- local `pre-commit` can enforce the non-mutating content checks before commit

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

The current schema contract lives in:

- `content/schema/v1/README.md`
- `content/schema/v1/migration-notes.md`
- `content/schema/v1/types.ts`
- `content/schema/v1/source-document.schema.json`

## Normal editing workflow

1. Edit canonical source documents in `content/source/**`.
2. Run `npm run content:sync`.
3. Run `npm run content:check`.
4. Commit both the source edits and regenerated runtime files under `data/**`.

Avoid editing `data/**` directly for routine content work. Those files are build output and can drift from or be overwritten by the canonical source pipeline.

If you install `pre-commit`, commits that touch canonical content or generated runtime files will automatically run `npm run content:check`.

For a fresh maintainer machine, the easiest bootstrap path is `npm run setup:dev`.

## Content pipeline commands

The repo now includes a local source-to-runtime pipeline:

- `npm run content:import`
  One-time/bootstrap helper that imports the current runtime corpus into `content/source/`.
- `npm run content:sync`
  Validates canonical source documents and regenerates the committed runtime files under `data/`.
- `npm run content:check`
  Verifies compiled runtime freshness and runs the block-length lint.
- `npm run content:validate`
  Validates canonical source documents and references.
- `npm run content:build`
  Compiles source documents back into committed runtime artifacts under `data/`.
- `npm run content:verify`
  Rebuilds into a temp directory and fails if checked-in runtime artifacts are stale.
