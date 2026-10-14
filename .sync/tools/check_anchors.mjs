// Verify every internal link anchor in docs/ still resolves.
// English sources (.sync/en/docs) define the required slug for each heading.
// A translated page satisfies a fragment if it:
//   a) declares an explicit {#slug} on some heading, or
//   b) has a heading whose auto-slug (GitHub algorithm) equals the fragment.
// Reports (file, fragment, expected source heading) for anything broken.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = path.join(ROOT, 'docs');
const EN = path.join(ROOT, '.sync', 'en', 'docs');

function walk(dir, rel = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), r));
    else if (e.name.endsWith('.md')) out.push(r);
  }
  return out;
}

// GitHub-style slug from heading text
function autoSlug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/ /g, '-')
    .replace(/-+/g, '-');
}

function headingsOf(mdPath) {
  const text = readFileSync(mdPath, 'utf8');
  const out = [];
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!m) continue;
    let rest = m[2];
    const explicit = /\{#([^}]+)\}\s*$/.exec(rest);
    if (explicit) {
      out.push({ explicit: explicit[1], auto: autoSlug(rest.replace(/\{#([^}]+)\}\s*$/, '')) });
    } else {
      out.push({ explicit: null, auto: autoSlug(rest) });
    }
  }
  return out;
}

// Map of anchor availability per docs file
const anchors = new Map(); // rel -> Set of slugs available
for (const rel of walk(DOCS)) {
  const abs = path.join(DOCS, rel);
  const set = new Set();
  for (const h of headingsOf(abs)) set.add(h.explicit ?? h.auto);
  anchors.set(rel, set);
}

// English source slugs (auto slug from original heading text)
const enSlugs = new Map(); // rel -> Map(slug -> heading text)
for (const rel of walk(EN)) {
  const abs = path.join(EN, rel);
  const m = new Map();
  for (const h of headingsOf(abs)) m.set(h.auto, h.auto);
  enSlugs.set(rel, m);
}

// Collect all internal fragments
const problems = [];
const linkRe = /\]\((?!https?:|mailto:)([^)\s#]+)#([^)\s]+)\)/g;
for (const rel of walk(DOCS)) {
  const abs = path.join(DOCS, rel);
  const text = readFileSync(abs, 'utf8');
  const dirOf = path.posix.dirname(rel);
  let m;
  while ((m = linkRe.exec(text))) {
    const targetRaw = m[1];
    const frag = m[2];
    let joined = path.posix.normalize(path.posix.join(dirOf, targetRaw));
    if (joined.startsWith('..')) continue; // external github url rewrite happened already
    // normalize to docs file
    let cand = joined;
    if (!cand.endsWith('.md')) {
      if (anchors.has(cand + '.md')) cand += '.md';
      else if (anchors.has(cand + '/index.md')) cand += '/index.md';
    }
    const set = anchors.get(cand);
    if (!set) { problems.push(`${rel} -> ${targetRaw}#${frag} : target file missing`); continue; }
    if (!set.has(frag)) {
      problems.push(`${rel} -> ${targetRaw}#${frag} : anchor missing in ${cand}`);
    }
  }
}

console.log(`checked ${anchors.size} files`);
if (problems.length) {
  console.log(`\nBROKEN ANCHORS (${problems.length}):`);
  for (const p of problems) console.log('  ' + p);
} else {
  console.log('all anchors OK');
}
