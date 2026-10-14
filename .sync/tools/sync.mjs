// Mirror upstream nautilus_trader docs (.sync/en/docs) into ./docs for Docusaurus.
// - converts jupytext percent-format .py docs into .md pages
// - copies tutorial PNG assets
// - rewrites upstream link styles to Docusaurus-compatible relative links
//   (extensionless -> .md, dir -> dir/index.md, ../../repo paths -> GitHub URLs,
//    nautilustrader.io/docs/{latest,nightly} -> local relative links)
// - converts fumadocs <Steps>/<Step> blocks to ordered lists
// - writes _category_.json sidebar metadata (Chinese labels, positions)
// - deletes docs not present upstream (stale content removal)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, '.sync', 'en', 'docs');
const DEST = path.join(ROOT, 'docs');
const GH = 'https://github.com/nautechsystems/nautilus_trader/blob/develop';
const GH_TREE = 'https://github.com/nautechsystems/nautilus_trader/tree/develop';

const warnings = [];
const info = [];

function walk(dir, rel = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), r));
    else out.push(r);
  }
  return out;
}

// ---------- jupytext percent format -> markdown ----------
function jupytextToMd(src) {
  const lines = src.split(/\r?\n/);
  const cells = [];
  let cur = null;
  for (const line of lines) {
    const m = /^# %%\s*(.*)$/.exec(line);
    if (m) {
      if (cur) cells.push(cur);
      cur = { md: m[1].trim() === '[markdown]', body: [] };
    } else if (cur) {
      cur.body.push(line);
    } else {
      // content before the first cell marker: treat as markdown comment lines
      cur = { md: true, body: [] };
      cur.body.push(line);
    }
  }
  if (cur) cells.push(cur);

  const parts = [];
  for (const c of cells) {
    if (c.md) {
      const body = c.body.map((l) => {
        if (l === '#') return '';
        if (l.startsWith('# ')) return l.slice(2);
        if (l === '') return '';
        return l.replace(/^#/, '');
      });
      parts.push(body.join('\n').trim());
    } else {
      const code = c.body.join('\n').trim();
      if (code) parts.push('```python\n' + code + '\n```');
    }
  }
  return parts.join('\n\n') + '\n';
}

// ---------- Steps/Step conversion ----------
function convertSteps(text) {
  return text.replace(
    /<Steps>\s*([\s\S]*?)\s*<\/Steps>/g,
    (_full, inner) => {
      const steps = [...inner.matchAll(/<Step>\s*([\s\S]*?)\s*<\/Step>/g)].map((m) =>
        m[1].replace(/\s*\n\s*/g, '\n').trim(),
      );
      return steps.map((s, i) => `${i + 1}. ${s.split('\n').join('\n   ')}`).join('\n\n');
    },
  );
}

// ---------- link rewriting ----------
// filesPresent: Set of synced output-relative paths (like concepts/data/bar.md, tutorials/assets/x/y.png)
function rewriteLinks(text, relFrom, filesPresent) {
  const dirOf = path.posix.dirname(relFrom);
  const resolveRel = (target) => {
    const clean = target.replace(/^\.\//, '');
    const joined = path.posix.normalize(path.posix.join(dirOf, clean)).replace(/\/+$/, '') || '.';
    if (joined.startsWith('..')) return null; // outside docs root
    return joined;
  };

  const report = (msg) => warnings.push(`${relFrom}: ${msg}`);

  // 1. nautilustrader.io versioned docs links -> local relative links when mappable
  text = text.replace(
    /https:\/\/nautilustrader\.io\/docs\/(?:latest|nightly)\/([^\s)'"]*)([)'"])/g,
    (full, p1, tail) => {
      const clean = p1.replace(/\/?$/, '').split('#')[0];
      const cand1 = clean ? `${clean}.md` : 'index.md';
      const cand2 = clean ? `${clean}/index.md` : null;
      let hit = null;
      if (filesPresent.has(cand1)) hit = cand1;
      else if (cand2 && filesPresent.has(cand2)) hit = cand2;
      if (!hit) return full;
      const frag = p1.includes('#') ? '#' + p1.split('#')[1] : '';
      const rel = path.posix.relative(dirOf, hit) || 'index.md';
      info.push(`${relFrom}: nautilustrader.io link -> ${rel}${frag}`);
      return (rel.startsWith('.') ? rel : './' + rel) + frag + tail;
    },
  );

  // 1b. root-relative /docs/python-api-* links -> official Sphinx site
  text = text.replace(
    /\]\(\/docs\/(python-api-[^\s)]+)\)/g,
    (full, p) => {
      info.push(`${relFrom}: sphinx api link -> https://nautilustrader.io/docs/${p}`);
      return `](https://nautilustrader.io/docs/${p})`;
    },
  );

  // 2. markdown links/images with relative targets
  const linkRe = /(!?\[[^\]]*\]\()([^)\s]+)(\))/g;
  text = text.replace(linkRe, (full, head, url, tail) => {
    if (/^(https?:|mailto:|#)/.test(url)) return full;
    const [targetRaw, frag] = url.split('#');
    const hash = frag ? `#${frag}` : '';
    if (!targetRaw) return full;

    // links escaping the docs tree -> GitHub
    const resolved = resolveRel(targetRaw);
    if (resolved === null) {
      const repoPath = path.posix.normalize(path.posix.join('docs', dirOf, targetRaw.replace(/^\.\//, '')));
      const ghBase = repoPath.endsWith('/') ? GH_TREE : GH;
      const url2 = ghBase + '/' + repoPath.replace(/^\.\.\//g, '').replace(/\/$/, '');
      info.push(`${relFrom}: repo link -> ${url2}`);
      return head + url2 + hash + tail;
    }

    // dev_templates (not mirrored) -> GitHub
    if (resolved === 'dev_templates' || resolved.startsWith('dev_templates/')) {
      const url2 = GH + '/' + resolved;
      info.push(`${relFrom}: dev_templates -> ${url2}`);
      return head + url2 + hash + tail;
    }

    // already-existing file
    const relOut = (target) => './' + (path.posix.relative(dirOf, target) || 'index.md');
    if (filesPresent.has(resolved)) return head + relOut(resolved) + hash + tail;

    // extensionless doc link
    if (!path.posix.extname(resolved)) {
      if (filesPresent.has(resolved + '.md')) return head + relOut(resolved + '.md') + hash + tail;
      if (filesPresent.has(resolved + '/index.md'))
        return head + relOut(resolved + '/index.md') + hash + tail;
    }
    // directory link x/ handled by resolveRel normalization losing slash: try index
    if (targetRaw.endsWith('/') && filesPresent.has(resolved + '/index.md'))
      return head + relOut(resolved + '/index.md') + hash + tail;

    // upstream .py doc sources referenced by URL-style path (e.g. docs/how_to/x.py in GitHub URLs already handled)
    if (resolved.endsWith('.py') && filesPresent.has(resolved.replace(/\.py$/, '.md')))
      return head + relOut(resolved.replace(/\.py$/, '.md')) + hash + tail;

    report(`unresolved link target: ${url}`);
    return full;
  });

  // 3. definition-style links to upstream .py docs -> local pages
  text = text.replace(
    /^\[([^\]]+)\]: https:\/\/github\.com\/nautechsystems\/nautilus_trader\/(?:blob|tree)\/develop\/docs\/((?:how_to|tutorials|getting_started)\/[^\s]+)\.py\s*$/gm,
    (full, label, target) => {
      if (!filesPresent.has(target + '.md')) return full;
      const rel = path.posix.relative(dirOf, target + '.md') || 'index.md';
      info.push(`${relFrom}: definition link [${label}] -> ${rel}`);
      return `[${label}]: ${(rel.startsWith('.') ? rel : './' + rel)}`;
    },
  );

  // 3b. definition-style links escaping the docs tree -> GitHub
  text = text.replace(
    /^\[([^\]]+)\]: ((?:\.\.\/)+[^\s]+)\s*$/gm,
    (full, label, target) => {
      const joined = path.posix.normalize(path.posix.join('docs', dirOf, target)).replace(/^(\.\.\/)+/, '');
      const url2 = GH + '/' + joined;
      info.push(`${relFrom}: definition repo link [${label}] -> ${url2}`);
      return `[${label}]: ${url2}`;
    },
  );

  return text;
}

// ---------- frontmatter/sync pipeline ----------
const skipDirs = new Set(['dev_templates', '_static']);
const skipFiles = new Set(['api_reference/conf.py']);

const srcFiles = walk(SRC).filter((f) => {
  const top = f.split('/');
  if (top.some((seg) => skipDirs.has(seg))) return false;
  if (skipFiles.has(f)) return false;
  return true;
});

// Map of planned outputs
const outputs = new Map(); // outRel -> {srcRel, kind}
for (const f of srcFiles) {
  if (f.endsWith('.md')) outputs.set(f, { src: f, kind: 'md' });
  else if (f.endsWith('.py') && !f.includes('assets/')) outputs.set(f.replace(/\.py$/, '.md'), { src: f, kind: 'jupytext' });
  else if (/\.(png|jpg|jpeg|gif|svg|json)$/i.test(f)) outputs.set(f, { src: f, kind: 'asset' });
  else outputs.set(f, { src: f, kind: 'copy' }); // css etc kept as-is
}

const filesPresent = new Set(outputs.keys());

// clean destination (stale files removed by full rebuild)
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

for (const [outRel, meta] of [...outputs.entries()].sort()) {
  const abs = path.join(DEST, outRel);
  mkdirSync(path.dirname(abs), { recursive: true });
  const srcAbs = path.join(SRC, meta.src);
  if (meta.kind === 'asset' || meta.kind === 'copy') {
    copyFileSync(srcAbs, abs);
    continue;
  }
  let text = readFileSync(srcAbs, 'utf8');
  if (meta.kind === 'jupytext') text = jupytextToMd(text);
  if (meta.kind === 'md') text = convertSteps(text);
  // api_reference eval-rst automodule stubs -> readable member lists + links to the official Sphinx build
  if (outRel.startsWith('api_reference/') && meta.kind === 'md') {
    const sphinxUrl = 'https://nautilustrader.io/docs/python-api-latest/' + outRel.replace(/^api_reference\//, '').replace(/\.md$/, '.html');
    text = text.replace(/```{eval-rst}\n([\s\S]*?)```\n?/g, (_full, block) => {
      const mod = /automodule::\s*([\w.]+)/.exec(block);
      const members = /:members:[ \t]*([^\n]*)/.exec(block);
      const modName = mod ? mod[1] : null;
      if (!modName) return `See the [Python API reference](${sphinxUrl}).\n\n`;
      const modLink = `[\`${modName}\`](https://nautilustrader.io/docs/python-api-latest/#module-${modName})`;
      const memberList = members && members[1] && !members[1].trim().startsWith(':') ? members[1].trim() : '';
      if (memberList) {
        const list = memberList.split(',').map((m) => m.trim()).filter(Boolean).map((name) => `\`${name}\``).join('、');
        return `Auto-generated from the latest source. The official documentation renders ${modLink} with the following members: ${list}.\n\n`;
      }
      return `Auto-generated from the latest source. See ${modLink} in the official documentation.\n\n`;
    });
  }
  text = rewriteLinks(text, outRel, filesPresent);
  writeFileSync(abs, text);
}

// ---------- sidebar category metadata ----------
const categories = {
  '': null,
  'getting_started': { label: '快速开始', position: 1 },
  'concepts': { label: '核心概念', position: 2 },
  'concepts/instruments': { label: '金融工具', position: 1 },
  'concepts/orders': { label: '订单', position: 2 },
  'concepts/data': { label: '数据', position: 3 },
  'concepts/backtesting': { label: '回测', position: 4 },
  'concepts/events': { label: '事件', position: 5 },
  'concepts/execution': { label: '执行', position: 6 },
  'integrations': { label: '交易所与集成', position: 3 },
  'how_to': { label: '操作指南', position: 4 },
  'tutorials': { label: '教程', position: 5 },
  'developer_guide': { label: '开发者指南', position: 6 },
  'api_reference': { label: 'API 参考', position: 7 },
  'api_reference/model': { label: '模型', position: 1 },
  'api_reference/adapters': { label: '适配器', position: 2 },
};
for (const [dir, cfg] of Object.entries(categories)) {
  if (!cfg) continue;
  const dirAbs = path.join(DEST, dir);
  if (!existsSync(dirAbs) || !statSync(dirAbs).isDirectory()) continue;
  writeFileSync(
    path.join(dirAbs, '_category_.json'),
    JSON.stringify({ label: cfg.label, position: cfg.position, collapsible: true }, null, 2) + '\n',
  );
}

// ---------- report ----------
console.log(`synced ${outputs.size} files -> docs/`);
if (info.length) {
  console.log(`\nrewrites: ${info.length}`);
}
if (warnings.length) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log('  ' + w);
}
