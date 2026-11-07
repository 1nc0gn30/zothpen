#!/usr/bin/env node
/* audit_sections.js - defect + coverage audit over every data section.
 *
 * Defect class the user flagged: "syntax is off ... extra lines when not
 * needed" -> non-runnable notation, alternatives crammed onto one line,
 * inline prose, angle-bracket placeholders, blank-line padding.
 *
 * Coverage class: a section that renders but has nothing to say (empty
 * tips/opsec/examples/verify) is an enhancement gap.
 *
 * Usage: node tools/audit_sections.js [--json]
 */
global.window = {};
['ZT', 'ZL', 'ZD', 'ZX', 'ZF', 'ZM'].forEach(k => { window[k] = []; });
const FILES = [
  'data-modules', 'data-tools', 'data-tools2', 'data-tools3', 'data-tools4',
  'data-labs', 'data-labs2', 'data-drills', 'data-drills2',
  'data-terminal', 'data-console-extra', 'data-forge'
];
FILES.forEach(f => require('../assets/' + f + '.js'));
const { ZT, ZL, ZD, ZX, ZF, ZM } = window;

const lines = s => String(s == null ? '' : s).split('\n');
const nonEmpty = a => (Array.isArray(a) ? a : a == null ? [] : [a]).filter(x => {
  if (x == null) return false;
  if (typeof x === 'string') return x.trim().length > 0;
  if (typeof x === 'object') return Object.keys(x).length > 0;   // {t,u} links, {f,d} flags
  return String(x).trim().length > 0;
});

/* a command string that is really an instruction, not a command */
const NOTATION = [
  [/<[a-z][^>\s]*>/, 'angle-bracket placeholder'],
  [/\S\s{2,}\|\s{2,}\S/, 'alternates on one line'],
  [/\[opts?\]|\[options?\]|\[args?\]|\[scan type\]|\[BPF|\[rules\]|\[\.\.\.\]/, 'prose bracket'],
  [/\bX\s*\|\s*Y\b|\bA\s*\|\s*B\b/, 'X|Y skeleton'],
  [/\bor\b\s+\w+\s+for\b/, 'inline "or ... for" prose'],
  [/^\s*#?\s*(e\.g\.|example:|usage:)/i, 'labelled example prose'],
  [/\S\s+then\s+(sudo|ip|nmap|run)\b/, 'then-chained prose'],
  [/\bCtrl-[a-z]\b.*\bdetach\b/, 'keyboard prose'],
  [/^\s*\n|\n\s*\n/, 'blank line inside block'],
  [/[ \t]+$/m, 'trailing whitespace']
];

const findings = [];
function scan(section, id, field, value) {
  const s = typeof value === 'string' ? value : (value && value.cmd) || '';
  if (!s) return;
  NOTATION.forEach(([re, label]) => {
    if (re.test(s)) findings.push({ section, id, field, label, sample: s.split('\n')[0].slice(0, 90) });
  });
  const l = lines(s);
  if (l.length > 6) findings.push({ section, id, field, label: 'block > 6 lines', sample: s.split('\n')[0].slice(0, 90) });
  if (l.some(x => x.trim().length === 0) && l.length > 1)
    findings.push({ section, id, field, label: 'blank line inside block', sample: s.split('\n')[0].slice(0, 90) });
}

ZT.forEach(e => { scan('tools', e.id, 'syntax', e.syntax); (e.examples || []).forEach((x, i) => scan('tools', e.id, 'examples[' + i + ']', x)); });
ZX.forEach(e => { scan('console', e.c, 'syn', e.syn); (e.ex || []).forEach((x, i) => scan('console', e.c, 'ex[' + i + ']', x)); });
ZL.forEach(e => (e.steps || []).forEach((s, i) => scan('labs', e.id, 'steps[' + i + ']', s)));
ZF.forEach(e => scan('forge', e.id, 'code', e.code));
ZM.forEach(e => { const m = String(e.body || '').match(/```[a-z]*\n([\s\S]*?)```/g) || []; m.forEach((b, i) => scan('learn', e.id, 'fence[' + i + ']', b.replace(/```[a-z]*\n?/g, ''))); });

/* coverage ------------------------------------------------------------- */
const cov = [];
function covRow(section, id, field, have) {
  if (!have) cov.push({ section, id, field });
}
ZT.forEach(e => {
  covRow('tools', e.id, 'tagline', !!e.tagline);
  covRow('tools', e.id, 'what', !!e.what);
  covRow('tools', e.id, 'flags', nonEmpty(e.flags).length >= 3);
  covRow('tools', e.id, 'examples>=2', nonEmpty(e.examples).length >= 2);
  covRow('tools', e.id, 'tips', nonEmpty(e.tips).length > 0);
  covRow('tools', e.id, 'opsec', nonEmpty(e.opsec).length > 0);
  covRow('tools', e.id, 'links', nonEmpty(e.links).length > 0);
  covRow('tools', e.id, 'related', nonEmpty(e.related).length > 0);
});
ZX.forEach(e => {
  covRow('console', e.c, 'syn', !!e.syn);
  covRow('console', e.c, 'ex>=2', nonEmpty(e.ex).length >= 2);
  covRow('console', e.c, 'tips', nonEmpty(e.tips).length > 0);
  covRow('console', e.c, 'warn', nonEmpty(e.warn).length > 0);
});
ZL.forEach(e => {
  covRow('labs', e.id, 'scenario', !!e.scenario);
  covRow('labs', e.id, 'steps', nonEmpty(e.steps).length > 0);
  covRow('labs', e.id, 'pitfalls', nonEmpty(e.pitfalls).length > 0);
  covRow('labs', e.id, 'verify', nonEmpty(e.verify).length > 0);
  covRow('labs', e.id, 'hint', !!e.hint);
});
ZD.forEach(e => { covRow('drills', e.id || e.q, 'why', !!e.why); covRow('drills', e.id || e.q, 'tags', nonEmpty(e.tags).length > 0); });
ZF.forEach(e => {
  covRow('forge', e.id, 'why', !!e.why);
  covRow('forge', e.id, 'when', !!e.when);
  covRow('forge', e.id, 'parts', nonEmpty(e.parts).length > 0);
  covRow('forge', e.id, 'harden', nonEmpty(e.harden).length > 0);
  covRow('forge', e.id, 'next', nonEmpty(e.next).length > 0);
});
ZM.forEach(e => {
  covRow('learn', e.id, 'why', !!e.why);
  covRow('learn', e.id, 'keyIdeas', nonEmpty(e.keyIdeas).length > 0);
  covRow('learn', e.id, 'lessons', nonEmpty(e.lessons).length > 0);
  covRow('learn', e.id, 'tools', nonEmpty(e.tools).length > 0);
  covRow('learn', e.id, 'labs', nonEmpty(e.labs).length > 0);
});

const count = (a, k) => a.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {});
const summary = {
  sizes: { modules: ZM.length, dossiers: ZT.length, console: ZX.length, labs: ZL.length, drills: ZD.length, forge: ZF.length },
  defects: findings.length,
  defectsByLabel: count(findings, 'label'),
  defectsBySection: count(findings, 'section'),
  gaps: cov.length,
  gapsBySection: count(cov, 'section'),
  gapsByField: count(cov, 'field')
};
console.log(JSON.stringify(summary, null, 2));
if (findings.length) {
  console.log('\n--- DEFECTS ---');
  findings.slice(0, 60).forEach(f => console.log([f.section, f.id, f.field, f.label, JSON.stringify(f.sample)].join('\t')));
}
if (cov.length) {
  console.log('\n--- COVERAGE GAPS ---');
  cov.slice(0, 60).forEach(g => console.log([g.section, g.id, g.field].join('\t')));
  const byField = {};
  cov.forEach(g => (byField[g.field] = byField[g.field] || []).push(g.id));
  console.log('\n--- GAP FIELD -> IDS ---');
  Object.keys(byField).forEach(k => console.log(k + '\t' + byField[k].join(',')));
}
