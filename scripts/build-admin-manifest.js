#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const COMMON_BLOCKS_PATH = path.join(DATA_DIR, 'common-blocks.json');

const COMMON_BLOCK_THRESHOLD = 3;
const SIGNATURE_KEYS = ['type', 'speaker', 'geez', 'amharic', 'english', 'transliteration'];

function walkJsonFiles(dir, base) {
  base = base || '';
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === 'data_csv' || entry.name === 'scripts') continue;
      out.push(...walkJsonFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.json')) {
      if (entry.name === 'manifest.json' || entry.name === 'common-blocks.json') continue;
      out.push(rel);
    }
  }
  return out;
}

function signatureFor(block) {
  const parts = SIGNATURE_KEYS.map(k => (block[k] == null ? '' : String(block[k])));
  return parts.join('␟');
}

function cleanBlock(block) {
  const out = {};
  for (const k of SIGNATURE_KEYS) {
    if (block[k] != null && block[k] !== '') out[k] = block[k];
  }
  if (!out.type) out.type = 'prayer';
  return out;
}

function collectBlocks(data, sink) {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data)) return;
  if (!Array.isArray(data.sections)) return;
  for (const section of data.sections) {
    for (const block of (section.blocks || [])) {
      if (!block || typeof block !== 'object') continue;
      const sig = signatureFor(block);
      const hasContent = SIGNATURE_KEYS.some(k => k !== 'type' && k !== 'speaker' && block[k]);
      if (!hasContent) continue;
      let entry = sink.get(sig);
      if (!entry) {
        entry = { count: 0, block: cleanBlock(block) };
        sink.set(sig, entry);
      }
      entry.count += 1;
    }
  }
}

function main() {
  const files = walkJsonFiles(DATA_DIR).sort();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(files, null, 2) + '\n', 'utf8');

  const sink = new Map();
  for (const rel of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), 'utf8'));
    } catch (e) {
      console.warn('skip ' + rel + ': ' + e.message);
      continue;
    }
    collectBlocks(parsed, sink);
  }

  const common = [];
  for (const entry of sink.values()) {
    if (entry.count >= COMMON_BLOCK_THRESHOLD) common.push(entry);
  }
  common.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (a.block.english || '').localeCompare(b.block.english || '');
  });

  fs.writeFileSync(COMMON_BLOCKS_PATH, JSON.stringify(common, null, 2) + '\n', 'utf8');

  console.log('manifest.json:       ' + files.length + ' files');
  console.log('common-blocks.json:  ' + common.length + ' blocks (>=' + COMMON_BLOCK_THRESHOLD + ' occurrences)');
}

main();
