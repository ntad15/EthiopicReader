#!/usr/bin/env node
'use strict';

const { validateSourceDocs, assertValidationPassed } = require('./pipeline');

// Validation runs against canonical source content only; it intentionally does
// not read compiled runtime output except through the pipeline code itself.
const result = validateSourceDocs();
assertValidationPassed(result);

console.log('Source validation passed.');
if (result.warnings.length > 0) {
  console.log('Warnings:');
  for (const warning of result.warnings) {
    console.log(`- ${warning}`);
  }
}
