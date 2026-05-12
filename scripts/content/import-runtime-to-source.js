#!/usr/bin/env node
'use strict';

const { importRuntimeToSource } = require('./pipeline');

// One-time/bootstrap command for lifting legacy runtime JSON into the canonical
// source schema. After the migration, normal edits should happen in content/source.
const files = importRuntimeToSource();
console.log(`Imported ${files.length} source documents.`);
for (const file of files) {
  console.log(`- ${file}`);
}
