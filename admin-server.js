#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const UI_FILE = path.join(__dirname, 'admin-ui.html');

// Walk data dir and collect all .json file paths (relative to DATA_DIR)
// Excludes bible/ directory
function walkDir(dir, base) {
  base = base || '';
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }
  for (const entry of entries) {
    const rel = base ? base + '/' + entry.name : entry.name;
    
    // Skip bible directory
    if (entry.isDirectory() && entry.name === 'bible') {
      continue;
    }
    
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.json')) {
      results.push(rel);
    }
  }
  return results;
}

// Resolve a user-supplied path safely within DATA_DIR
function safeDataPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const abs = path.resolve(DATA_DIR, filePath);
  // Must stay inside DATA_DIR
  if (abs !== DATA_DIR && !abs.startsWith(DATA_DIR + path.sep)) return null;
  return abs;
}

// Collect request body and parse as JSON
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, contentType, body) {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}

function json(res, status, data) {
  send(res, status, 'application/json; charset=utf-8', JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  // Only allow requests from localhost
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + PORT);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/files — list all JSON files in /data
  if (pathname === '/api/files' && method === 'GET') {
    json(res, 200, walkDir(DATA_DIR));
    return;
  }

  // GET /api/lint — count blocks per file with any language field over HARD_LIMIT chars.
  // Mirrors data/scripts/lint_block_length.py.
  if (pathname === '/api/lint' && method === 'GET') {
    const HARD = 400;
    const LANGS = ['geez', 'amharic', 'english', 'transliteration'];
    const SKIP = new Set(['heading', 'rubric', 'placeholder']);
    const result = {};
    for (const rel of walkDir(DATA_DIR)) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), 'utf8'));
        if (!data || typeof data !== 'object' || !Array.isArray(data.sections)) continue;
        let errors = 0;
        for (const sec of data.sections) {
          for (const b of (sec.blocks || [])) {
            if (SKIP.has(b.type)) continue;
            for (const l of LANGS) {
              if ((b[l] || '').length > HARD) { errors++; break; }
            }
          }
        }
        if (errors > 0) result[rel] = errors;
      } catch (e) { /* skip unreadable / non-JSON files */ }
    }
    json(res, 200, result);
    return;
  }

  // GET /api/file?path=... — read a JSON file
  if (pathname === '/api/file' && method === 'GET') {
    const abs = safeDataPath(parsed.query.path);
    if (!abs) { json(res, 400, { error: 'Invalid path' }); return; }
    try {
      const content = fs.readFileSync(abs, 'utf8');
      send(res, 200, 'application/json; charset=utf-8', content);
    } catch (e) {
      json(res, 404, { error: 'File not found' });
    }
    return;
  }

  // PUT /api/file?path=... — write a JSON file
  if (pathname === '/api/file' && method === 'PUT') {
    const abs = safeDataPath(parsed.query.path);
    if (!abs) { json(res, 400, { error: 'Invalid path' }); return; }
    try {
      const data = await parseBody(req);
      fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n', 'utf8');
      json(res, 200, { ok: true });
    } catch (e) {
      json(res, 500, { error: e.message });
    }
    return;
  }

  // Serve the admin UI HTML for everything else
  if (method === 'GET') {
    try {
      const html = fs.readFileSync(UI_FILE, 'utf8');
      send(res, 200, 'text/html; charset=utf-8', html);
    } catch (e) {
      send(res, 500, 'text/plain', 'admin-ui.html not found: ' + e.message);
    }
    return;
  }

  json(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, '127.0.0.1', () => {
  const line = '─'.repeat(40);
  console.log('\n  ' + line);
  console.log('  ቅዳሴ  Qidase Admin Server');
  console.log('  ' + line);
  console.log('  URL:  http://localhost:' + PORT);
  console.log('  Data: ' + DATA_DIR);
  console.log('  ' + line);
  console.log('  Press Ctrl+C to stop\n');
});
