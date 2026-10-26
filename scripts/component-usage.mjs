// Builds src/styleguide/usage.json: for every component imported from
// src/components, the files that use it. The style guide shows this as
// "Used in" under each component. Run with `npm run styleguide:usage`.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');
const out = join(src, 'styleguide', 'usage.json');

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'styleguide' ? [] : files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const importRe = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'@\/components\/([A-Za-z]+)'/g;
const usage = {};

for (const file of files(src)) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(importRe)) {
    const module = match[2];
    for (const raw of match[1].split(',')) {
      const name = raw.replace(/\btype\b/, '').trim();
      if (!name) continue;
      const key = `${module}.${name}`;
      (usage[key] ??= []).push(relative(src, file));
    }
  }
}

const sorted = Object.fromEntries(
  Object.keys(usage)
    .sort()
    .map((key) => [key, [...new Set(usage[key])].sort()]),
);
writeFileSync(out, JSON.stringify(sorted, null, 2) + '\n');
console.log(`Wrote ${relative(root, out)} (${Object.keys(sorted).length} components)`);
