#!/usr/bin/env node
'use strict';

const { verifyRuntimeIsCurrent } = require('./pipeline');

// CI uses this to ensure committed runtime still matches what the local
// compiler would generate from the checked-in canonical source content.
const result = verifyRuntimeIsCurrent();
if (result.mismatches.length > 0) {
  console.error('Compiled runtime artifacts are out of date:');
  for (const file of result.mismatches) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('Compiled runtime artifacts are current.');
