// Post-translation pass: pin every translated heading to its English slug.
// Matches headings positionally between docs/<rel>.md and the English source
// (.sync/en/docs/<rel>.md, or the .py jupytext original when that's what was
// converted). Inserts {#en-slug} when the Chinese auto-slug differs.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
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

// Extract heading lines with indices (fence-aware)
function headingLines(text) {
  const out = [];
  let inFence = false;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^#{1,6}\s+/.test(line)) out.push({ i, line });
  }
  return out;
}

// English headings: from md source, or from the jupytext .py originals
function enTextFor(rel) {
  const mdPath = path.join(EN, rel);
  if (existsSync(mdPath)) return { text: readFileSync(mdPath, 'utf8'), kind: 'md' };
  const pyRel = rel.replace(/\.md$/, '.py');
  const pyPath = path.join(EN, pyRel);
  if (existsSync(pyPath)) return { text: readFileSync(pyPath, 'utf8'), kind: 'py' };
  return null;
}

// English headings, extracting markdown-cell comment lines for py sources
function enHeadings(rel) {
  const src = enTextFor(rel);
  if (!src) return null;
  if (src.kind === 'md') return headingLines(src.text);
  // jupytext: markdown headings appear as "# ## Title" comment lines
  const out = [];
  let inFence = false;
  const lines = src.text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^# %%/.test(l)) continue;
    // convert md lines as our converter does: markdown cells = '# ' prefix
    // A heading in the md output corresponds to lines "# # Title" (md comment)
    // Our converter stripped the first '# ' — reconstruct the md heading lines.
    const m = /^# (#{1,6})\s+(.*)$/.exec(l);
    if (m) out.push({ i, line: `${m[1]} ${m[2]}` });
  }
  return out;
}

const modified = [];
const mismatches = [];
for (const rel of walk(DOCS)) {
  const zhAbs = path.join(DOCS, rel);
  const zhText = readFileSync(zhAbs, 'utf8');
  // skip English-only files (nothing to pin): crude check
  const zhHeads = headingLines(zhText);
  const enHeads = enHeadings(rel);
  if (!enHeads) { mismatches.push(`${rel}: no English source found`); continue; }
  if (zhHeads.length !== enHeads.length) {
    mismatches.push(`${rel}: heading count zh=${zhHeads.length} en=${enHeads.length}`);
    continue;
  }
  const lines = zhText.split(/\r?\n/);
  let touched = false;
  for (let k = 0; k < zhHeads.length; k++) {
    const zh = zhHeads[k].line;
    const en = enHeads[k].line;
    if (/\{#[^}]+\}\s*$/.test(zh)) continue; // already pinned (any-char anchor, incl. CJK)
    const enText = en.replace(/^#{1,6}\s+/, '');
    const zhText = zh.replace(/^#{1,6}\s+/, '');
    const enSlug = autoSlug(enText);
    const zhSlug = autoSlug(zhText);
    if (enSlug === zhSlug) continue; // auto slug already matches (e.g. untranslated or term-only headings)
    if (!enSlug) continue;
    lines[zhHeads[k].i] = `${zh} {#${enSlug}}`;
    touched = true;
  }
  if (touched) {
    writeFileSync(zhAbs, lines.join('\n'));
    modified.push(rel);
  }
}

console.log(`pinned slugs in ${modified.length} files`);
for (const m of modified) console.log('  ' + m);
if (mismatches.length) {
  console.log(`\nMISMATCHES (${mismatches.length}) — check manually:`);
  for (const m of mismatches) console.log('  ' + m);
}
