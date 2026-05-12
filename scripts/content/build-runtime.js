#!/usr/bin/env node
'use strict';

const { buildRuntimeIntoRepo } = require('./pipeline');

// Local build command: validate canonical source, compile runtime artifacts,
// then copy the generated output back into committed data/.
const { buildResult } = buildRuntimeIntoRepo();
console.log(`Generated ${buildResult.generatedFiles.length} runtime artifacts.`);
