/* Dump every command-ish string from the ZothPen data layer as JSON, tagging each
   with the language it is written in, so the auditor can pick the right parser.
   usage: node tools/dump_cmds.js <out.json>                                    */
const fs = require('fs'), vm = require('vm'), path = require('path');
global.window = global;
const dir = path.join(__dirname, '..', 'assets');
const files = ['data-modules.js','data-tools.js','data-tools2.js','data-tools3.js','data-tools4.js',
  'data-labs.js','data-labs2.js','data-drills.js','data-drills2.js','data-terminal.js','data-forge.js'];
for (const f of files) {
  try { vm.runInThisContext(fs.readFileSync(path.join(dir, f), 'utf8'), { filename: f }); }
  catch (e) { console.error('LOAD FAIL ' + f + ': ' + e.message); process.exit(1); }
}
const KEYS = new Set(['cmd', 'syn', 'syntax', 'code', 'usage', 'run', 'script', 'c']);
const SRC = { ZM: 'data-modules.js', ZT: 'data-tools', ZL: 'data-labs', ZD: 'data-drills', ZX: 'data-terminal', ZF: 'data-forge' };
const LANG = { ZM: 'bash', ZT: 'bash', ZL: 'bash', ZD: 'text', ZX: 'bash', ZF: null };
const out = [];
function walk(v, key, rec, meta) {
  if (v == null) return;
  if (typeof v === 'string') {
    if (KEYS.has(key) && key !== 'c') out.push(Object.assign({ where: key, s: v }, meta));
    return;
  }
  if (Array.isArray(v)) { for (const x of v) walk(x, key, rec, meta); return; }
  if (typeof v === 'object') { for (const k of Object.keys(v)) walk(v[k], k, rec, meta); }
}
for (const n of ['ZM', 'ZT', 'ZL', 'ZD', 'ZX', 'ZF']) {
  const arr = window[n] || [];
  arr.forEach((o, i) => {
    const id = (o && (o.id || o.c || o.title || o.name)) || (n + '[' + i + ']');
    walk(o, '(root)', o, { file: SRC[n], id: id, lang: (o && o.lang) || LANG[n] || 'bash', kind: (o && o.kind) || '' });
  });
}
fs.writeFileSync(process.argv[2] || '/dev/stdout', JSON.stringify(out));
console.error('dumped ' + out.length + ' strings');
