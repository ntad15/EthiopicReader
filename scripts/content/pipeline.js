#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const CONTENT_ROOT = path.join(ROOT, 'content');
const SOURCE_ROOT = path.join(CONTENT_ROOT, 'source');
const DOCUMENTS_DIR = path.join(SOURCE_ROOT, 'documents');
const FRAGMENTS_DIR = path.join(SOURCE_ROOT, 'fragments');
const SEASONALS_DIR = path.join(SOURCE_ROOT, 'seasonals');
const DATA_DIR = path.join(ROOT, 'data');
const GENERATED_RUNTIME_INDEX = 'runtimeIndex.ts';
const RUNTIME_BLOCK_HARD_LIMIT = 400;

const SOURCE_LOCALES = ['gez', 'am', 'en', 'gez-Latn'];
const SOURCE_KINDS = ['service', 'anaphora', 'fragment', 'seasonal'];
const SPEAKER_TO_SOURCE = {
  'priest': 'priest',
  'deacon': 'deacon',
  'asst. priest': 'assistant-priest',
  'asst. deacon': 'assistant-deacon',
  'congregation': 'assembly',
  'all': 'all',
};
const SPEAKER_TO_RUNTIME = {
  'priest': 'priest',
  'deacon': 'deacon',
  'assistant-priest': 'asst. priest',
  'assistant-deacon': 'asst. deacon',
  'assembly': 'congregation',
  'all': 'all',
};
const READING_SLOTS = new Set(['pauline', 'catholic', 'acts', 'psalm', 'gospel']);
const SOURCE_NODE_KINDS = new Set([
  'text',
  'heading',
  'rubric',
  'reading-ref',
  'reading-body',
  'include',
  'seasonal-ref',
]);
const SOURCE_TEXT_ROLES = new Set(['prayer', 'response']);
const SOURCE_SPEAKERS = new Set([
  'priest',
  'deacon',
  'assistant-priest',
  'assistant-deacon',
  'assembly',
  'all',
]);
const DAY_OF_WEEK = new Set([
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);
const LITURGICAL_SEASONS = new Set([
  'ordinary',
  'advent',
  'christmas',
  'lent',
  'easter',
  'pentecost',
]);
const MANAGED_ANAPHORA_ORDER = [
  'saint-john-chrysostom',
  'saint-mary',
  'apostles',
  'saint-basil',
  'saint-gregory',
  'saint-epiphanius',
  'saint-cyril',
  'saint-james-sarugh',
  'saint-james-nisibis',
  'saint-dioscorus',
  'our-lord',
  'saint-john-thunder',
  'three-hundred-eighteen',
  'saint-athanasius',
];
const MANAGED_SERVICE_SLUGS = ['qidan', 'serate-qidase'];
// Keep the managed runtime list explicit so step 1 only owns the files we can
// round-trip cleanly between canonical source and committed runtime output.
const RUNTIME_TO_SOURCE_CONFIG = [
  {
    runtimePath: path.join(DATA_DIR, 'qidan.json'),
    sourcePath: path.join(DOCUMENTS_DIR, 'service.qidan.json'),
    kind: 'service',
    slug: 'qidan',
  },
  {
    runtimePath: path.join(DATA_DIR, 'serate-qidase.json'),
    sourcePath: path.join(DOCUMENTS_DIR, 'service.serate-qidase.json'),
    kind: 'service',
    slug: 'serate-qidase',
  },
  {
    runtimePath: path.join(DATA_DIR, 'seasonals.json'),
    sourcePath: path.join(SEASONALS_DIR, 'seasonal.serate-qidase.json'),
    kind: 'seasonal',
    slug: 'serate-qidase',
  },
  ...MANAGED_ANAPHORA_ORDER.map((slug) => ({
    runtimePath: path.join(DATA_DIR, 'anaphoras', `${slug}.json`),
    sourcePath: path.join(DOCUMENTS_DIR, `anaphora.${slug}.json`),
    kind: 'anaphora',
    slug,
  })),
];

function structuredCloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, 'utf8');
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => path.join(dirPath, entry))
    .sort();
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function slugify(text) {
  const trimmed = String(text || '').trim().toLowerCase();
  if (!trimmed) return '';
  const ascii = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return ascii;
}

function humanizeSlug(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isOpaqueRuntimeSectionId(value) {
  return /^section-[a-z0-9]{8,}$/i.test(value || '') || /^seasonals-[a-z0-9]{8,}$/i.test(value || '');
}

function alphaSuffix(index) {
  if (index <= 0) return '';
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  if (index <= alphabet.length) return alphabet[index - 1];
  return `-${index + 1}`;
}

function dedupeLocalId(baseId, usedIds) {
  const safeBase = slugify(baseId) || 'item';
  let candidate = safeBase;
  let suffixIndex = 0;
  while (usedIds.has(candidate)) {
    suffixIndex += 1;
    candidate = `${safeBase}${alphaSuffix(suffixIndex)}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function localizeFromRuntimeFields(value) {
  const localized = {};
  if (value && typeof value === 'object') {
    if (isNonEmptyString(value.geez)) localized.gez = value.geez;
    if (isNonEmptyString(value.amharic)) localized.am = value.amharic;
    if (isNonEmptyString(value.english)) localized.en = value.english;
    if (isNonEmptyString(value.transliteration)) localized['gez-Latn'] = value.transliteration;
  }
  return localized;
}

function runtimeFieldsFromLocalized(localized) {
  const output = {};
  if (isNonEmptyString(localized.gez)) output.geez = localized.gez;
  if (isNonEmptyString(localized.am)) output.amharic = localized.am;
  if (isNonEmptyString(localized.en)) output.english = localized.en;
  if (isNonEmptyString(localized['gez-Latn'])) output.transliteration = localized['gez-Latn'];
  return output;
}

function findSplitPoint(text, hardLimit, preferredTarget) {
  const searchLimit = Math.min(hardLimit, text.length);
  const preferred = Math.min(preferredTarget || hardLimit, searchLimit);
  const punctuation = ['።', '.', '!', '?', '፤', ';', ':', '፣', ',', ' '];

  const tryFind = (start, end) => {
    for (let index = end; index >= start; index -= 1) {
      const char = text[index - 1];
      if (punctuation.includes(char)) {
        return index;
      }
    }
    return -1;
  };

  let point = tryFind(Math.max(1, Math.floor(preferred * 0.6)), preferred);
  if (point !== -1) return point;

  point = tryFind(Math.max(1, Math.floor(searchLimit * 0.6)), searchLimit);
  if (point !== -1) return point;

  return searchLimit;
}

function splitTextToHardLimit(text, hardLimit) {
  const normalized = String(text || '').trim();
  if (!normalized) return [];
  if (normalized.length <= hardLimit) return [normalized];

  const chunks = [];
  let remaining = normalized;
  while (remaining.length > hardLimit) {
    const splitPoint = findSplitPoint(remaining, hardLimit, Math.floor(hardLimit * 0.85));
    const chunk = remaining.slice(0, splitPoint).trim();
    chunks.push(chunk || remaining.slice(0, hardLimit).trim());
    remaining = remaining.slice(splitPoint).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function splitChunkNearMiddle(text) {
  if (text.length <= 1) return [text];
  const midpoint = Math.floor(text.length / 2);
  const splitPoint = findSplitPoint(text, text.length - 1, midpoint);
  const left = text.slice(0, splitPoint).trim();
  const right = text.slice(splitPoint).trim();
  if (!left || !right) {
    return [text.slice(0, midpoint).trim(), text.slice(midpoint).trim()].filter(Boolean);
  }
  return [left, right];
}

function expandChunksToCount(chunks, targetCount) {
  const expanded = chunks.slice();
  while (expanded.length < targetCount) {
    let longestIndex = -1;
    let longestLength = 0;
    for (let index = 0; index < expanded.length; index += 1) {
      const length = expanded[index].length;
      if (length > longestLength) {
        longestLength = length;
        longestIndex = index;
      }
    }
    if (longestIndex === -1 || longestLength <= 1) break;
    const [left, right] = splitChunkNearMiddle(expanded[longestIndex]);
    if (!left || !right) break;
    expanded.splice(longestIndex, 1, left, right);
  }
  while (expanded.length < targetCount) {
    expanded.push('');
  }
  return expanded;
}

function chunkRuntimeTextBlock(block) {
  const localeKeys = ['geez', 'amharic', 'english', 'transliteration'];
  const splitFields = {};
  let targetCount = 1;

  for (const key of localeKeys) {
    const text = block[key];
    if (!isNonEmptyString(text)) continue;
    const chunks = splitTextToHardLimit(text, RUNTIME_BLOCK_HARD_LIMIT);
    splitFields[key] = chunks;
    if (chunks.length > targetCount) {
      targetCount = chunks.length;
    }
  }

  if (targetCount === 1) {
    return [block];
  }

  // Each locale may split at different boundaries. Expand shorter locales so
  // every compiled block still lines up across languages by index.
  for (const key of Object.keys(splitFields)) {
    splitFields[key] = expandChunksToCount(splitFields[key], targetCount);
  }

  const blocks = [];
  for (let index = 0; index < targetCount; index += 1) {
    const chunked = {
      ...block,
      id: `${block.id}${alphaSuffix(index + 1)}`,
    };
    for (const key of localeKeys) {
      delete chunked[key];
      const value = splitFields[key]?.[index];
      if (isNonEmptyString(value)) {
        chunked[key] = value;
      }
    }
    blocks.push(chunked);
  }

  return blocks;
}

function titleFromRuntime(value, fallbackEnglish) {
  const localized = localizeFromRuntimeFields(value);
  if (!localized.en && isNonEmptyString(fallbackEnglish)) {
    localized.en = fallbackEnglish;
  }
  return localized;
}

function runtimeTitleFromLocalized(localized, fallbackEnglish) {
  const output = runtimeFieldsFromLocalized(localized || {});
  if (!output.english) {
    output.english = fallbackEnglish || localized?.am || localized?.gez || 'Untitled';
  }
  return output;
}

function mapSpeakerToSource(value) {
  return value ? SPEAKER_TO_SOURCE[value] || null : null;
}

function mapSpeakerToRuntime(value) {
  return value ? SPEAKER_TO_RUNTIME[value] || null : null;
}

function maybeAddArray(target, key, values) {
  if (Array.isArray(values) && values.length > 0) {
    target[key] = values;
  }
}

function createSourceMetadata(sourceRef, saint) {
  const metadata = {
    source: {
      type: 'imported',
      ref: sourceRef,
    },
  };
  if (isNonEmptyString(saint)) {
    metadata.saint = saint;
  }
  return metadata;
}

function pickLocalizedTitleText(localized, fallback) {
  return localized.en || localized.am || localized.gez || fallback;
}

function normalizeSectionId(section, usedIds, fallbackPrefix, index) {
  const title = titleFromRuntime(section.title || {}, '');
  const existingId = isNonEmptyString(section.id) ? slugify(section.id) : '';
  let candidate = '';

  if (existingId && !isOpaqueRuntimeSectionId(existingId)) {
    candidate = existingId;
  }
  if (!candidate) {
    candidate = slugify(title.en || '');
  }
  if (!candidate) {
    candidate = slugify(pickLocalizedTitleText(title, ''));
  }
  if (!candidate) {
    candidate = `${fallbackPrefix}-${index + 1}`;
  }

  return dedupeLocalId(candidate, usedIds);
}

function normalizeSeasonalSlotId(section, usedIds, index) {
  const existingId = isNonEmptyString(section.id) && !isOpaqueRuntimeSectionId(section.id)
    ? slugify(section.id)
    : '';
  const title = titleFromRuntime(section.title || {}, '');
  const titleSlug = slugify(title.en || '');
  const fallback = titleSlug || existingId || `seasonal-slot-${index + 1}`;
  const aliasMap = {
    'qidase-introduction': 'intro-day-of-week',
    'halleluia': 'halleluia-seasonal',
  };
  return dedupeLocalId(aliasMap[fallback] || fallback, usedIds);
}

function convertRuntimeBlockToSourceNodes(block, usedIds, options) {
  const sourceNodes = [];
  const speaker = mapSpeakerToSource(block.speaker);
  const content = localizeFromRuntimeFields(block);
  const blockId = slugify(block.id) || 'block';

  // The source schema keeps readings as two conceptual pieces:
  // 1. a labeled slot reference
  // 2. a placeholder where the chosen reading body is inserted later
  // This import step converts the legacy runtime representation back to that
  // smaller, more author-friendly source form.
  if ((block.type === 'heading' || block.type === 'rubric') && block.dynamic) {
    if (Object.keys(content).length === 0) {
      const fallbackLabels = {
        en: humanizeSlug(block.dynamic),
      };
      sourceNodes.push({
        id: dedupeLocalId(blockId, usedIds),
        kind: 'reading-ref',
        slot: block.dynamic,
        labels: fallbackLabels,
        style: block.type,
      });
      return sourceNodes;
    }
    sourceNodes.push({
      id: dedupeLocalId(blockId, usedIds),
      kind: 'reading-ref',
      slot: block.dynamic,
      labels: content,
      style: block.type,
    });
    return sourceNodes;
  }

  if (block.type === 'reading') {
    const labelId = dedupeLocalId(`${blockId}-label`, usedIds);
    sourceNodes.push({
      id: labelId,
      kind: 'reading-ref',
      slot: block.readingSlot,
      labels: content,
      style: 'heading',
    });
    sourceNodes.push({
      id: dedupeLocalId(blockId, usedIds),
      kind: 'reading-body',
      slot: block.readingSlot,
    });
    return sourceNodes;
  }

  if (block.type === 'placeholder') {
    sourceNodes.push({
      id: dedupeLocalId(blockId, usedIds),
      kind: 'seasonal-ref',
      slot: options.slotMap?.[block.overrideId] || slugify(block.overrideId) || block.overrideId,
      ...(block.optional ? { optional: true } : {}),
    });
    return sourceNodes;
  }

  if (block.type === 'heading') {
    if (Object.keys(content).length === 0) {
      return sourceNodes;
    }
    sourceNodes.push({
      id: dedupeLocalId(blockId, usedIds),
      kind: 'heading',
      content,
    });
    return sourceNodes;
  }

  if (block.type === 'rubric') {
    if (Object.keys(content).length === 0) {
      return sourceNodes;
    }
    sourceNodes.push({
      id: dedupeLocalId(blockId, usedIds),
      kind: 'rubric',
      content,
    });
    return sourceNodes;
  }

  if (block.type === 'prayer' || block.type === 'response') {
    if (Object.keys(content).length === 0) {
      return sourceNodes;
    }
    const node = {
      id: dedupeLocalId(blockId, usedIds),
      kind: 'text',
      role: block.type,
      content,
    };
    if (speaker) {
      node.speaker = speaker;
    }
    sourceNodes.push(node);
    return sourceNodes;
  }

  throw new Error(`Unsupported runtime block type: ${block.type}`);
}

function convertSeasonalConditions(conditions) {
  const result = {};
  if (!conditions || typeof conditions !== 'object') return result;
  maybeAddArray(result, 'daysOfWeek', conditions.dayOfWeek);
  maybeAddArray(result, 'seasons', conditions.season);
  maybeAddArray(result, 'feastIds', conditions.feast);
  if (Array.isArray(conditions.dateRange) && conditions.dateRange.length > 0) {
    result.dateRanges = conditions.dateRange.map((item) => ({
      start: item.start,
      end: item.end,
    }));
  }
  return result;
}

function describeRuleId(block, index) {
  const dayValues = block.conditions?.dayOfWeek || [];
  if (dayValues.length === 1) return dayValues[0];
  if (dayValues.length > 1) return `${dayValues[0]}-through-${dayValues[dayValues.length - 1]}`;
  const seasonValues = block.conditions?.season || [];
  if (seasonValues.length === 1) return seasonValues[0];
  return slugify(block.id) || `rule-${index + 1}`;
}

function importSeasonalRuntimeDoc(runtimeData, runtimePath) {
  const slotUsedIds = new Set();
  const slotMap = {};
  const slots = (runtimeData.sections || []).map((section, index) => {
    const slotId = normalizeSeasonalSlotId(section, slotUsedIds, index);
    slotMap[section.id] = slotId;
    const slotTitles = titleFromRuntime(section.title || {}, humanizeSlug(slotId));
    const ruleUsedIds = new Set();
    const rules = (section.blocks || []).map((block, blockIndex) => {
      const nodeUsedIds = new Set();
      const nodes = convertRuntimeBlockToSourceNodes(block, nodeUsedIds, { slotMap: {} });
      return {
        id: dedupeLocalId(describeRuleId(block, blockIndex), ruleUsedIds),
        when: convertSeasonalConditions(block.conditions || {}),
        nodes,
      };
    });
    return {
      id: slotId,
      titles: slotTitles,
      rules,
    };
  });

  const doc = {
    schemaVersion: 1,
    kind: 'seasonal',
    id: 'seasonal.serate-qidase',
    slug: 'serate-qidase',
    titles: titleFromRuntime(runtimeData.title || {}, 'Seasonal Variations'),
    slots,
    metadata: createSourceMetadata(path.relative(ROOT, runtimePath), undefined),
  };

  return { doc, slotMap };
}

function importStructuredRuntimeDoc(runtimeData, config, slotMap) {
  const sectionUsedIds = new Set();
  const sourceDoc = {
    schemaVersion: 1,
    kind: config.kind,
    id: `${config.kind}.${config.slug}`,
    slug: config.slug,
    titles: titleFromRuntime(runtimeData.name || runtimeData.title || {}, humanizeSlug(config.slug)),
    sections: [],
    metadata: createSourceMetadata(path.relative(ROOT, config.runtimePath), runtimeData.saint),
  };

  sourceDoc.sections = (runtimeData.sections || []).map((section, index) => {
    const localizedTitle = titleFromRuntime(section.title || {}, humanizeSlug(section.id || `section-${index + 1}`));
    const normalizedSectionId = normalizeSectionId(section, sectionUsedIds, 'section', index);
    const nodeUsedIds = new Set();
    const nodes = [];
    for (const block of section.blocks || []) {
      const converted = convertRuntimeBlockToSourceNodes(block, nodeUsedIds, { slotMap });
      nodes.push(...converted);
    }

    return {
      id: normalizedSectionId,
      titles: localizedTitle,
      nodes,
    };
  }).filter((section) => section.nodes.length > 0);

  return sourceDoc;
}

function importRuntimeToSource() {
  ensureDir(DOCUMENTS_DIR);
  ensureDir(SEASONALS_DIR);
  ensureDir(FRAGMENTS_DIR);

  const seasonalConfig = RUNTIME_TO_SOURCE_CONFIG.find((item) => item.kind === 'seasonal');
  const seasonalRuntime = readJson(seasonalConfig.runtimePath);
  const { doc: seasonalDoc, slotMap } = importSeasonalRuntimeDoc(seasonalRuntime, seasonalConfig.runtimePath);
  writeJson(seasonalConfig.sourcePath, seasonalDoc);

  const imported = [seasonalConfig.sourcePath];

  for (const config of RUNTIME_TO_SOURCE_CONFIG) {
    if (config.kind === 'seasonal') continue;
    const runtimeData = readJson(config.runtimePath);
    const sourceDoc = importStructuredRuntimeDoc(runtimeData, config, slotMap);
    writeJson(config.sourcePath, sourceDoc);
    imported.push(config.sourcePath);
  }

  return imported;
}

function loadSourceDocuments() {
  const documentFiles = listJsonFiles(DOCUMENTS_DIR);
  const fragmentFiles = listJsonFiles(FRAGMENTS_DIR);
  const seasonalFiles = listJsonFiles(SEASONALS_DIR);
  const docs = [];
  for (const filePath of [...documentFiles, ...fragmentFiles, ...seasonalFiles]) {
    const parsed = readJson(filePath);
    docs.push({ filePath, doc: parsed });
  }
  return docs;
}

function isCompiledRuntimeId(value) {
  return typeof value === 'string' && value.includes(':');
}

function validateLocalizedText(value, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    errors.push(`${label} must contain at least one locale`);
  }
  for (const key of keys) {
    if (!SOURCE_LOCALES.includes(key)) {
      errors.push(`${label} contains unsupported locale "${key}"`);
    } else if (!isNonEmptyString(value[key])) {
      errors.push(`${label}.${key} must be a non-empty string`);
    }
  }
}

function validateCondition(condition, label, errors) {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const keys = Object.keys(condition);
  if (keys.length === 0) {
    errors.push(`${label} must contain at least one selector`);
  }
  if (condition.daysOfWeek) {
    if (!Array.isArray(condition.daysOfWeek) || condition.daysOfWeek.length === 0) {
      errors.push(`${label}.daysOfWeek must be a non-empty array`);
    } else {
      for (const value of condition.daysOfWeek) {
        if (!DAY_OF_WEEK.has(value)) {
          errors.push(`${label}.daysOfWeek contains invalid value "${value}"`);
        }
      }
    }
  }
  if (condition.seasons) {
    if (!Array.isArray(condition.seasons) || condition.seasons.length === 0) {
      errors.push(`${label}.seasons must be a non-empty array`);
    } else {
      for (const value of condition.seasons) {
        if (!LITURGICAL_SEASONS.has(value)) {
          errors.push(`${label}.seasons contains invalid value "${value}"`);
        }
      }
    }
  }
  if (condition.feastIds) {
    if (!Array.isArray(condition.feastIds) || condition.feastIds.length === 0) {
      errors.push(`${label}.feastIds must be a non-empty array`);
    } else {
      for (const value of condition.feastIds) {
        if (!isNonEmptyString(value)) {
          errors.push(`${label}.feastIds must contain non-empty strings`);
        }
      }
    }
  }
  if (condition.dateRanges) {
    if (!Array.isArray(condition.dateRanges) || condition.dateRanges.length === 0) {
      errors.push(`${label}.dateRanges must be a non-empty array`);
    } else {
      for (const range of condition.dateRanges) {
        if (!range || !/^\d{4}-\d{2}-\d{2}$/.test(range.start) || !/^\d{4}-\d{2}-\d{2}$/.test(range.end)) {
          errors.push(`${label}.dateRanges must contain YYYY-MM-DD start/end pairs`);
        }
      }
    }
  }
}

function validateNode(node, label, errors) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(node.id)) {
    errors.push(`${label}.id must be a non-empty string`);
  }
  if (isCompiledRuntimeId(node.id)) {
    errors.push(`${label}.id must not be a compiled runtime ID`);
  }
  if (!SOURCE_NODE_KINDS.has(node.kind)) {
    errors.push(`${label}.kind "${node.kind}" is unsupported`);
    return;
  }

  if (node.kind === 'text') {
    if (!SOURCE_TEXT_ROLES.has(node.role)) {
      errors.push(`${label}.role must be "prayer" or "response"`);
    }
    if (node.speaker && !SOURCE_SPEAKERS.has(node.speaker)) {
      errors.push(`${label}.speaker "${node.speaker}" is unsupported`);
    }
    validateLocalizedText(node.content, `${label}.content`, errors);
  } else if (node.kind === 'heading' || node.kind === 'rubric') {
    validateLocalizedText(node.content, `${label}.content`, errors);
  } else if (node.kind === 'reading-ref') {
    if (!READING_SLOTS.has(node.slot)) {
      errors.push(`${label}.slot "${node.slot}" is unsupported`);
    }
    if (node.style && !['heading', 'rubric'].includes(node.style)) {
      errors.push(`${label}.style must be "heading" or "rubric"`);
    }
    validateLocalizedText(node.labels, `${label}.labels`, errors);
  } else if (node.kind === 'reading-body') {
    if (!READING_SLOTS.has(node.slot)) {
      errors.push(`${label}.slot "${node.slot}" is unsupported`);
    }
  } else if (node.kind === 'include') {
    if (!isNonEmptyString(node.ref)) {
      errors.push(`${label}.ref must be a non-empty string`);
    }
  } else if (node.kind === 'seasonal-ref') {
    if (!isNonEmptyString(node.slot)) {
      errors.push(`${label}.slot must be a non-empty string`);
    }
  }
}

function validateSourceDocs() {
  const loaded = loadSourceDocuments();
  const errors = [];
  const warnings = [];
  const docsById = new Map();
  const seasonalSlotIds = new Set();
  const fragmentSections = new Set();

  // First pass validates local shape/uniqueness and collects cross-document
  // identifiers so the second pass can verify includes and seasonal refs.
  for (const { filePath, doc } of loaded) {
    const basename = path.basename(filePath, '.json');
    if (!SOURCE_KINDS.includes(doc.kind)) {
      errors.push(`${path.relative(ROOT, filePath)} has unsupported kind "${doc.kind}"`);
      continue;
    }
    if (doc.id !== basename) {
      errors.push(`${path.relative(ROOT, filePath)} id "${doc.id}" must match filename stem "${basename}"`);
    }
    if (docsById.has(doc.id)) {
      errors.push(`duplicate source document id "${doc.id}"`);
    } else {
      docsById.set(doc.id, { filePath, doc });
    }
    if (doc.schemaVersion !== 1) {
      errors.push(`${doc.id} must use schemaVersion 1`);
    }
    if (!isNonEmptyString(doc.slug)) {
      errors.push(`${doc.id} must define a non-empty slug`);
    }
    validateLocalizedText(doc.titles, `${doc.id}.titles`, errors);
    if (doc.kind === 'seasonal') {
      if (!Array.isArray(doc.slots) || doc.slots.length === 0) {
        errors.push(`${doc.id} must contain at least one slot`);
      } else {
        const slotIds = new Set();
        for (const slot of doc.slots) {
          if (!isNonEmptyString(slot.id)) {
            errors.push(`${doc.id} slot id must be a non-empty string`);
            continue;
          }
          if (slotIds.has(slot.id)) {
            errors.push(`${doc.id} has duplicate slot id "${slot.id}"`);
          } else {
            slotIds.add(slot.id);
            seasonalSlotIds.add(slot.id);
          }
          if (slot.titles) {
            validateLocalizedText(slot.titles, `${doc.id}.slots.${slot.id}.titles`, errors);
          }
          if (!Array.isArray(slot.rules) || slot.rules.length === 0) {
            errors.push(`${doc.id}.slots.${slot.id} must contain at least one rule`);
            continue;
          }
          const ruleIds = new Set();
          for (const rule of slot.rules) {
            if (!isNonEmptyString(rule.id)) {
              errors.push(`${doc.id}.slots.${slot.id} rule id must be a non-empty string`);
              continue;
            }
            if (ruleIds.has(rule.id)) {
              errors.push(`${doc.id}.slots.${slot.id} has duplicate rule id "${rule.id}"`);
            } else {
              ruleIds.add(rule.id);
            }
            validateCondition(rule.when, `${doc.id}.slots.${slot.id}.rules.${rule.id}.when`, errors);
            if (!Array.isArray(rule.nodes) || rule.nodes.length === 0) {
              errors.push(`${doc.id}.slots.${slot.id}.rules.${rule.id} must contain at least one node`);
              continue;
            }
            const nodeIds = new Set();
            for (const node of rule.nodes) {
              validateNode(node, `${doc.id}.slots.${slot.id}.rules.${rule.id}.nodes.${node.id || '<unknown>'}`, errors);
              if (node.id) {
                if (nodeIds.has(node.id)) {
                  errors.push(`${doc.id}.slots.${slot.id}.rules.${rule.id} has duplicate node id "${node.id}"`);
                } else {
                  nodeIds.add(node.id);
                }
              }
            }
          }
        }
      }
    } else {
      if (!Array.isArray(doc.sections) || doc.sections.length === 0) {
        errors.push(`${doc.id} must contain at least one section`);
      } else {
        const sectionIds = new Set();
        for (const section of doc.sections) {
          if (!isNonEmptyString(section.id)) {
            errors.push(`${doc.id} section id must be a non-empty string`);
            continue;
          }
          if (sectionIds.has(section.id)) {
            errors.push(`${doc.id} has duplicate section id "${section.id}"`);
          } else {
            sectionIds.add(section.id);
            if (doc.kind === 'fragment') {
              fragmentSections.add(`${doc.id}#${section.id}`);
            }
          }
          validateLocalizedText(section.titles, `${doc.id}.sections.${section.id}.titles`, errors);
          if (!Array.isArray(section.nodes) || section.nodes.length === 0) {
            errors.push(`${doc.id}.sections.${section.id} must contain at least one node`);
            continue;
          }
          const nodeIds = new Set();
          for (const node of section.nodes) {
            validateNode(node, `${doc.id}.sections.${section.id}.nodes.${node.id || '<unknown>'}`, errors);
            if (node.id) {
              if (nodeIds.has(node.id)) {
                errors.push(`${doc.id}.sections.${section.id} has duplicate node id "${node.id}"`);
              } else {
                nodeIds.add(node.id);
              }
            }
          }
        }
      }
    }
  }

  for (const { doc } of loaded) {
    if (doc.kind === 'seasonal') continue;
    for (const section of doc.sections || []) {
      for (const node of section.nodes || []) {
        if (node.kind === 'seasonal-ref' && !seasonalSlotIds.has(node.slot)) {
          errors.push(`${doc.id}.sections.${section.id}.nodes.${node.id} references missing seasonal slot "${node.slot}"`);
        }
        if (node.kind === 'include') {
          const [refId, sectionId] = String(node.ref).split('#');
          const target = docsById.get(refId);
          if (!target || target.doc.kind !== 'fragment') {
            errors.push(`${doc.id}.sections.${section.id}.nodes.${node.id} references missing fragment "${node.ref}"`);
          } else if (sectionId && !fragmentSections.has(node.ref)) {
            errors.push(`${doc.id}.sections.${section.id}.nodes.${node.id} references missing fragment section "${node.ref}"`);
          }
        }
      }
    }
  }

  return { errors, warnings, docsById, loaded };
}

function assertValidationPassed(result) {
  if (result.errors.length === 0) return;
  const message = `Source validation failed:\n${result.errors.map((item) => `- ${item}`).join('\n')}`;
  const error = new Error(message);
  error.validationErrors = result.errors;
  throw error;
}

function expandIncludeNodes(nodes, docsById, includeStack) {
  const expanded = [];
  for (const node of nodes) {
    if (node.kind !== 'include') {
      expanded.push(node);
      continue;
    }
    // Fragments are a source-authoring convenience only; compiled runtime is
    // always flattened so the Expo app can keep consuming plain sections/blocks.
    const [refId, sectionId] = String(node.ref).split('#');
    const key = sectionId ? `${refId}#${sectionId}` : refId;
    if (includeStack.includes(key)) {
      throw new Error(`Include cycle detected: ${includeStack.concat(key).join(' -> ')}`);
    }
    const target = docsById.get(refId);
    if (!target || target.doc.kind !== 'fragment') {
      throw new Error(`Missing fragment include target "${node.ref}"`);
    }
    const sections = sectionId
      ? target.doc.sections.filter((section) => section.id === sectionId)
      : target.doc.sections;
    for (const section of sections) {
      expanded.push(...expandIncludeNodes(section.nodes || [], docsById, includeStack.concat(key)));
    }
  }
  return expanded;
}

function compileTextNode(node, options) {
  const block = {
    id: node.id,
    type: node.role,
    ...runtimeFieldsFromLocalized(node.content),
  };
  const runtimeSpeaker = mapSpeakerToRuntime(node.speaker);
  if (runtimeSpeaker) {
    block.speaker = runtimeSpeaker;
  }
  if (options?.chunkText === false) {
    return [block];
  }
  return chunkRuntimeTextBlock(block);
}

function compileHeadingLikeNode(node, type) {
  return {
    id: node.id,
    type,
    ...runtimeFieldsFromLocalized(node.content),
  };
}

function compileStandaloneReadingRefNode(node) {
  return {
    id: node.id,
    type: node.style || 'heading',
    dynamic: node.slot,
    ...runtimeFieldsFromLocalized(node.labels),
  };
}

function compileReadingPairNodes(labelNode, bodyNode) {
  return {
    id: bodyNode.id,
    type: 'reading',
    readingSlot: bodyNode.slot,
    ...runtimeFieldsFromLocalized(labelNode.labels),
  };
}

function compileSeasonalRefNode(node) {
  const block = {
    id: node.id,
    type: 'placeholder',
    overrideId: node.slot,
  };
  if (node.optional) {
    block.optional = true;
  }
  return block;
}

function compileNodeSequence(nodes, options) {
  const blocks = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const nextNode = nodes[index + 1];

    // Adjacent reading label/body nodes become the single runtime "reading"
    // block shape that the existing app already understands.
    if (node.kind === 'reading-ref' && nextNode && nextNode.kind === 'reading-body' && node.slot === nextNode.slot) {
      blocks.push(compileReadingPairNodes(node, nextNode));
      index += 1;
      continue;
    }

    if (node.kind === 'text') {
      blocks.push(...compileTextNode(node, options));
    } else if (node.kind === 'heading') {
      blocks.push(compileHeadingLikeNode(node, 'heading'));
    } else if (node.kind === 'rubric') {
      blocks.push(compileHeadingLikeNode(node, 'rubric'));
    } else if (node.kind === 'reading-ref') {
      blocks.push(compileStandaloneReadingRefNode(node));
    } else if (node.kind === 'reading-body') {
      blocks.push({
        id: node.id,
        type: 'reading',
        readingSlot: node.slot,
      });
    } else if (node.kind === 'seasonal-ref') {
      blocks.push(compileSeasonalRefNode(node));
    } else {
      throw new Error(`Unexpected node kind during compile: ${node.kind}`);
    }
  }
  return blocks;
}

function compileStructuredRuntimeDoc(doc, docsById) {
  const runtimeRoot = {
    id: doc.slug,
    sections: [],
  };

  if (doc.kind === 'anaphora') {
    runtimeRoot.name = runtimeTitleFromLocalized(doc.titles, humanizeSlug(doc.slug));
    if (isNonEmptyString(doc.metadata?.saint)) {
      runtimeRoot.saint = doc.metadata.saint;
    }
  } else {
    runtimeRoot.title = runtimeTitleFromLocalized(doc.titles, humanizeSlug(doc.slug));
  }

  runtimeRoot.sections = doc.sections.map((section) => {
    const expandedNodes = expandIncludeNodes(section.nodes || [], docsById, [`${doc.id}#${section.id}`]);
    return {
      id: section.id,
      title: runtimeTitleFromLocalized(section.titles, humanizeSlug(section.id)),
      // Normal services/anaphoras can be chunked during compile so long prayers
      // still respect the reader's presentation-mode hard block limit.
      blocks: compileNodeSequence(expandedNodes, { chunkText: true }),
    };
  });

  return runtimeRoot;
}

function compileSeasonalsRuntimeDoc(seasonalDocs, docsById) {
  const sections = [];
  for (const doc of seasonalDocs) {
    for (const slot of doc.slots || []) {
      const blocks = [];
      for (const rule of slot.rules || []) {
        const expandedNodes = expandIncludeNodes(rule.nodes || [], docsById, [`${doc.id}#${slot.id}#${rule.id}`]);
        // The current seasonal resolver swaps in one runtime block per rule.
        // We preserve that contract in step 1, so seasonal content does not
        // use runtime chunking even when regular sections do.
        const compiledBlocks = compileNodeSequence(expandedNodes, { chunkText: false });
        if (compiledBlocks.length !== 1) {
          throw new Error(`Seasonal slot ${doc.id}.${slot.id}.${rule.id} must compile to exactly one runtime block`);
        }
        const block = compiledBlocks[0];
        block.conditions = {};
        if (rule.when.daysOfWeek) block.conditions.dayOfWeek = structuredCloneJson(rule.when.daysOfWeek);
        if (rule.when.seasons) block.conditions.season = structuredCloneJson(rule.when.seasons);
        if (rule.when.feastIds) block.conditions.feast = structuredCloneJson(rule.when.feastIds);
        if (rule.when.dateRanges) {
          block.conditions.dateRange = rule.when.dateRanges.map((range) => ({
            start: range.start,
            end: range.end,
          }));
        }
        blocks.push(block);
      }
      sections.push({
        id: slot.id,
        title: runtimeTitleFromLocalized(slot.titles || { en: humanizeSlug(slot.id) }, humanizeSlug(slot.id)),
        blocks,
      });
    }
  }

  return {
    id: 'seasonals',
    title: {
      english: 'Seasonal Variations',
      geez: 'ወቅታዊ ልዩነቶች',
      amharic: 'ወቅታዊ ልዩነቶች',
    },
    sections,
  };
}

function sortAnaphoraDocs(anaphoraDocs) {
  const indexMap = new Map(MANAGED_ANAPHORA_ORDER.map((slug, index) => [slug, index]));
  return anaphoraDocs.slice().sort((left, right) => {
    const leftIndex = indexMap.has(left.slug) ? indexMap.get(left.slug) : Number.MAX_SAFE_INTEGER;
    const rightIndex = indexMap.has(right.slug) ? indexMap.get(right.slug) : Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.slug.localeCompare(right.slug);
  });
}

function buildRuntimeIndexSource(serviceDocs, anaphoraDocs) {
  const lines = [];
  lines.push('// This file is generated by scripts/content/build-runtime.js.');
  lines.push('// It gives the Expo app one stable import surface for committed runtime content.');
  lines.push("import type { Anaphora, AnaphoraMetadata, LiturgicalText } from '@/data/types';");
  lines.push('');
  for (const doc of serviceDocs) {
    lines.push(`const service_${doc.slug.replace(/-/g, '_')}: LiturgicalText = require('@/data/${doc.slug}.json');`);
  }
  lines.push("const seasonalsData: LiturgicalText = require('@/data/seasonals.json');");
  lines.push("const anaphoraMetadata: AnaphoraMetadata[] = require('@/data/anaphoras/anaphoras.json');");
  for (const doc of anaphoraDocs) {
    lines.push(`const anaphora_${doc.slug.replace(/-/g, '_')}: Anaphora = require('@/data/anaphoras/${doc.slug}.json');`);
  }
  lines.push('');
  lines.push('// These maps are generated from canonical source docs during the local build step.');
  lines.push('export const SERVICE_RUNTIME_MAP: Record<string, LiturgicalText> = {');
  for (const doc of serviceDocs) {
    lines.push(`  '${doc.slug}': service_${doc.slug.replace(/-/g, '_')},`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const ANAPHORA_RUNTIME_MAP: Record<string, Anaphora> = {');
  for (const doc of anaphoraDocs) {
    lines.push(`  '${doc.slug}': anaphora_${doc.slug.replace(/-/g, '_')},`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const SEASONALS_DATA = seasonalsData;');
  lines.push('export const ANAPHORA_METADATA = anaphoraMetadata;');
  lines.push('');
  lines.push('// Route screens use these helpers so they never import individual JSON files directly.');
  lines.push('export function loadServiceRuntime(id: string): LiturgicalText | null {');
  lines.push('  return SERVICE_RUNTIME_MAP[id] ?? null;');
  lines.push('}');
  lines.push('');
  lines.push('export function loadAnaphoraRuntime(id: string): Anaphora | null {');
  lines.push('  return ANAPHORA_RUNTIME_MAP[id] ?? null;');
  lines.push('}');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildRuntime(outputRoot) {
  const validation = validateSourceDocs();
  assertValidationPassed(validation);

  const docs = validation.loaded.map((entry) => entry.doc);
  const docsById = new Map(validation.loaded.map((entry) => [entry.doc.id, entry.doc]));
  const serviceDocs = docs.filter((doc) => doc.kind === 'service');
  const anaphoraDocs = sortAnaphoraDocs(docs.filter((doc) => doc.kind === 'anaphora'));
  const seasonalDocs = docs.filter((doc) => doc.kind === 'seasonal');

  const generatedFiles = [];

  for (const doc of serviceDocs) {
    const runtime = compileStructuredRuntimeDoc(doc, docsById);
    const outputPath = path.join(outputRoot, 'data', `${doc.slug}.json`);
    writeJson(outputPath, runtime);
    generatedFiles.push(outputPath);
  }

  for (const doc of anaphoraDocs) {
    const runtime = compileStructuredRuntimeDoc(doc, docsById);
    const outputPath = path.join(outputRoot, 'data', 'anaphoras', `${doc.slug}.json`);
    writeJson(outputPath, runtime);
    generatedFiles.push(outputPath);
  }

  const anaphoraMetadata = anaphoraDocs.map((doc) => {
    const item = {
      id: doc.slug,
      name: runtimeTitleFromLocalized(doc.titles, humanizeSlug(doc.slug)),
    };
    if (isNonEmptyString(doc.metadata?.saint)) {
      item.saint = doc.metadata.saint;
    }
    return item;
  });
  const metadataPath = path.join(outputRoot, 'data', 'anaphoras', 'anaphoras.json');
  writeJson(metadataPath, anaphoraMetadata);
  generatedFiles.push(metadataPath);

  const seasonalsRuntime = compileSeasonalsRuntimeDoc(seasonalDocs, docsById);
  const seasonalsPath = path.join(outputRoot, 'data', 'seasonals.json');
  writeJson(seasonalsPath, seasonalsRuntime);
  generatedFiles.push(seasonalsPath);

  const runtimeIndexSource = buildRuntimeIndexSource(serviceDocs, anaphoraDocs);
  const runtimeIndexPath = path.join(outputRoot, 'data', GENERATED_RUNTIME_INDEX);
  writeText(runtimeIndexPath, runtimeIndexSource);
  generatedFiles.push(runtimeIndexPath);

  return {
    generatedFiles,
    validation,
  };
}

function relativeToRoot(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function copyBuiltRuntimeIntoRepo(buildResult) {
  for (const outputPath of buildResult.generatedFiles) {
    const relative = path.relative(path.join(ROOT, 'data'), outputPath.replace(/\/data\//, '/data/'));
    void relative;
  }
}

function buildRuntimeIntoRepo() {
  // Build into a temp directory first so validation/generation can fail without
  // leaving partially updated committed runtime files in the repo.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ethiopic-reader-build-'));
  try {
    const buildResult = buildRuntime(tempDir);
    for (const outputPath of buildResult.generatedFiles) {
      const relative = path.relative(path.join(tempDir), outputPath);
      const destination = path.join(ROOT, relative);
      ensureDir(path.dirname(destination));
      fs.copyFileSync(outputPath, destination);
    }
    return {
      tempDir,
      buildResult,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function verifyRuntimeIsCurrent() {
  // Verification re-runs the compiler into a temp directory and compares bytes
  // so CI only needs to answer "would committed runtime change right now?".
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ethiopic-reader-verify-'));
  try {
    const buildResult = buildRuntime(tempDir);
    const mismatches = [];
    for (const outputPath of buildResult.generatedFiles) {
      const relative = path.relative(tempDir, outputPath);
      const repoPath = path.join(ROOT, relative);
      const generatedText = fs.readFileSync(outputPath, 'utf8');
      const repoText = fs.existsSync(repoPath) ? fs.readFileSync(repoPath, 'utf8') : null;
      if (repoText !== generatedText) {
        mismatches.push(relativeToRoot(repoPath));
      }
    }
    return {
      mismatches,
      validation: buildResult.validation,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

module.exports = {
  ROOT,
  importRuntimeToSource,
  validateSourceDocs,
  assertValidationPassed,
  buildRuntimeIntoRepo,
  verifyRuntimeIsCurrent,
};
