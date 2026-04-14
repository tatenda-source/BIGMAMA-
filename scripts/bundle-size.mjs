#!/usr/bin/env node
/**
 * Enforce the gzip bundle budget defined in .claude/agents/perf-guardian.md.
 * Walks dist/ and fails with non-zero exit if total gzip size exceeds the
 * budget. Meant to run in CI after `npm run build`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist';
const BUDGET_BYTES = 300 * 1024;
const TRACKED_EXT = new Set(['.js', '.css', '.html', '.svg', '.json', '.webmanifest']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function dot(p) {
  const i = p.lastIndexOf('.');
  return i === -1 ? '' : p.slice(i).toLowerCase();
}

try {
  statSync(DIST);
} catch {
  console.error(`bundle:size — ${DIST}/ does not exist. Run \`npm run build\` first.`);
  process.exit(1);
}

let total = 0;
const rows = [];
for (const file of walk(DIST)) {
  if (!TRACKED_EXT.has(dot(file))) continue;
  const gz = gzipSync(readFileSync(file)).length;
  total += gz;
  rows.push({ file, gz });
}

rows.sort((a, b) => b.gz - a.gz);
for (const r of rows.slice(0, 10)) {
  console.log(`${(r.gz / 1024).toFixed(1).padStart(7)} KB  ${r.file}`);
}

const totalKb = (total / 1024).toFixed(1);
const budgetKb = (BUDGET_BYTES / 1024).toFixed(0);
console.log(`\nTotal (gzip): ${totalKb} KB  /  budget: ${budgetKb} KB`);

if (total > BUDGET_BYTES) {
  console.error(`\nbundle:size — OVER BUDGET by ${((total - BUDGET_BYTES) / 1024).toFixed(1)} KB`);
  process.exit(1);
}
console.log('bundle:size — within budget');
