/* ==========================================================================
   ZothPen — views: practice (labs, drills, forge, progress)
   Loaded after app.js, before start.js.
   ========================================================================== */
(function () {
'use strict';
const { esc, md, inline, codeBlock, note, chip, bar, meter,
        crumbs, rule, empty, diffTag, kindTag, kv } = ZO;
const ZM = ZO.ZM, ZT = ZO.ZT, ZL = ZO.ZL, ZD = ZO.ZD, ZF = ZO.ZF, ZX = ZO.ZX;
const M = ZO.M, T = ZO.T, L = ZO.L, D = ZO.D, R = ZO.R;

/* local, view-owned checkbox state (does not touch the XP state file) */
const CK = 'zothpen.checks.v1';
let checks = {};
try { checks = JSON.parse(localStorage.getItem(CK) || '{}') || {}; } catch (e) { checks = {}; }
function saveChecks() { try { localStorage.setItem(CK, JSON.stringify(checks)); } catch (e) {} }
ZO.toggleCheck = function (id) {
  if (!id) return;
  checks[id] = checks[id] ? 0 : 1; saveChecks();
  const b = document.querySelector('[data-act="check"][data-id="' + id.replace(/"/g, '') + '"]');
  if (b) { b.classList.toggle('on', !!checks[id]); b.setAttribute('aria-checked', checks[id] ? 'true' : 'false'); }
  const host = document.getElementById('labcheck');
  if (host) {
    const n = host.querySelectorAll('[data-act="check"].on').length;
    const t = document.getElementById('labcheckn'); if (t) t.textContent = n + '/' + host.querySelectorAll('[data-act="check"]').length + ' verified';
  }
};
const isDone = (id) => !!checks[id];

/* ---------------------------------------------------------------- *
 * LABS — list
 * ---------------------------------------------------------------- */
ZO.views.labs = function (r) {
  const st = ZO.stats();
  const labsHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('labs-holo', 'tesseract', 'ISOLATED VIRTUAL ENCLAVE') : '';
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'labs' }]);
  h += '<h1 class="h1">hands-on labs</h1>';
  h += '<p class="sub">' + ZL.length + ' build-it-yourself labs. A manual that only tells you what a tool does is a brochure; ' +
       'these are the jobs that make the tool yours. Every lab runs against <b>your own</b> hardware — your VM, your range, ' +
       'your deliberately broken machine. ' + st.labsDone + ' of ' + ZL.length + ' done.</p>';

  h += labsHolo;

  h += note('danger', 'Everything in this section is for targets <b>you own</b> or have <b>written permission</b> to test: your own VM range, ' +
    'a vulnerable machine you built, or a lab platform. Never a system you do not own and are not authorised to touch.', 'SCOPE');

  const diffs = ['easy', 'med', 'hard'].filter(d => ZL.some(l => l.diff === d));
  h += '<div class="filterbar"><span class="muted small">difficulty</span>' +
    diffs.map(d => chip(d + ' (' + ZL.filter(l => l.diff === d).length + ')', 'labsdiff', d)).join(' ') +
    '<button class="btn" data-act="labsdiff" data-id="">all</button>' +
    '<span class="sp"></span><span class="muted small">' + ZL.filter(l => l.os && l.os !== 'any').length + ' OS-specific</span></div>';

  h += '<div class="grid g2" id="labgrid">' + ZL.map((l, idx) => ZO.labCard(l, idx)).join('') + '</div>';

  h += '<div class="panel"><h4 class="h4">the working order</h4><ol class="tight">' +
    ['Build the range first — two VMs, host-only network, snapshots before every attack.',
     'Work a lab end to end before reading the next module: labs teach the reflexes, modules teach the reasons.',
     'Type every command by hand for the first three labs. Copy-paste is for the tenth repetition.',
     'Break something on purpose, then restore the snapshot and break it a different way.',
     'Keep a log file per lab. Your log is the raw material of every future report and the only proof you did it.']
      .map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div>';

  return { html: h, after: () => {
    if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('labs-holo', 'tesseract', 48, 16);
    ZO.labsDiff = (d) => {
      document.querySelectorAll('#labgrid .card').forEach(c => { c.hidden = d ? c.getAttribute('data-diff') !== d : false; });
      document.querySelectorAll('#view .chip[data-act="labsdiff"]').forEach(b => b.classList.toggle('on', (b.dataset.id || '') === (d || '')));
    };
  } };
};

/* ---------------------------------------------------------------- *
 * LAB — single
 * ---------------------------------------------------------------- */
ZO.views.lab = function (r) {
  const l = L[r.id];
  if (!l) return ZO.views.notfound(r);
  const idx = ZL.findIndex(x => x.id === l.id);
  const prev = ZL[idx - 1], next = ZL[idx + 1];
  const mod = M[l.mod];
  const done = ZO.state().labs[l.id];
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'labs', go: '/labs' }, { t: l.title }]);

  h += '<div class="panel hi"><div class="hero-top">' + diffTag(l.diff) +
    (l.os ? '<span class="badge mono">' + esc(l.os) + '</span>' : '') +
    (l.time ? '<span class="badge">' + esc(l.time) + '</span>' : '') +
    '<span class="badge">' + (l.xp || 60) + ' xp</span>' +
    (mod ? chip(mod.n + ' ' + mod.title, 'go', '#/mod/' + mod.id) : '') + '</div>' +
    '<h1 class="h1">' + esc(l.title) + '</h1>' +
    '<p class="sub">' + md(l.goal) + '</p>' +
    '<div class="hero-actions">' +
      '<button class="btn ' + (done ? '' : 'primary') + '" data-act="labdone" data-id="' + l.id + '">' +
        (done ? '✓ complete — unmark' : '✓ mark lab complete (+' + (l.xp || 60) + ' xp)') + '</button>' +
      '<span class="sp"></span>' +
      (prev ? '<button class="btn" data-act="go" data-hash="#/lab/' + prev.id + '">← ' + esc(prev.title.slice(0, 28)) + '</button>' : '') +
      (next ? '<button class="btn" data-act="go" data-hash="#/lab/' + next.id + '">' + esc(next.title.slice(0, 28)) + ' →</button>' : '') +
    '</div></div>';

  h += '<div class="cols"><div class="col-main">';

  if (l.scenario) h += '<div class="panel"><h2 class="h2">the situation</h2><p class="sub">' + md(l.scenario) + '</p></div>';

  if (l.steps && l.steps.length) {
    h += '<div class="panel"><h2 class="h2">do this, in this order</h2><div class="steps">';
    l.steps.forEach((s, i) => {
      h += '<div class="step"><div class="step-head"><span class="badge">' + (i + 1) + '</span><b>' + esc(s.t) + '</b></div>' +
        (s.why ? '<div class="step-why">' + md(s.why) + '</div>' : '') +
        (s.cmd ? codeBlock(s.cmd, 'bash', 'step ' + (i + 1)) : '') +
        (s.out ? '<div class="out"><span class="lab">you should see</span><pre>' + esc(s.out) + '</pre></div>' : '') +
        '</div>';
    });
    h += '</div></div>';
  }

  if (l.verify && l.verify.length) {
    h += '<div class="panel" id="labcheck"><h2 class="h2">how you know it worked <span class="muted small" id="labcheckn">' +
      l.verify.filter((v, i) => isDone(l.id + ':' + i)).length + '/' + l.verify.length + ' verified</span></h2>' +
      '<p class="muted small">Tick these honestly. A lab is not done because you ran the commands; it is done when the evidence exists.</p>' +
      l.verify.map((v, i) =>
        '<button class="check ' + (isDone(l.id + ':' + i) ? 'on' : '') + '" data-act="check" data-id="' + l.id + ':' + i + '" role="checkbox" aria-checked="' +
        (isDone(l.id + ':' + i) ? 'true' : 'false') + '"><span class="box"></span><span>' + md(v) + '</span></button>').join('') +
      '</div>';
  }

  if (l.hint) {
    h += '<div class="panel"><h2 class="h2">stuck?</h2><details class="det"><summary class="sum">open the hint — try for 20 minutes first, it is the whole point</summary>' +
      '<div class="sub">' + md(l.hint) + '</div></details></div>';
  }
  h += '</div><div class="col-side">';

  if (l.requires && l.requires.length) {
    h += '<div class="panel"><h4 class="h4">you need</h4><ul class="tight">' + l.requires.map(x => '<li>' + md(String(x)) + '</li>').join('') + '</ul></div>';
  }
  if (l.tools && l.tools.length) {
    h += '<div class="panel"><h4 class="h4">tools you will touch</h4><div class="chips small">' +
      l.tools.map(id => T[id] ? chip(T[id].name, 'go', '#/tool/' + id) : chip(String(id), 'noop')).join(' ') + '</div></div>';
  }
  if (l.pitfalls && l.pitfalls.length) {
    h += note('warn', '<b>Ways this bites people.</b><ul class="tight">' + l.pitfalls.map(p => '<li>' + md(p) + '</li>').join('') + '</ul>', 'PITFALLS');
  }
  if (l.drills !== false && l.mod) {
    h += '<div class="panel"><h4 class="h4">prove it</h4><div class="chips small">' +
      chip('drill ' + (mod ? mod.n : l.mod), 'go', '#/drills/' + l.mod) + ' ' +
      chip('open console', 'go', '#/console') + '</div></div>';
  }
  h += '</div></div>';
  return h;
};

/* ---------------------------------------------------------------- *
 * DRILLS — a session
 * ---------------------------------------------------------------- */
const DS = { scope: '', pool: [], i: 0, pick: -1, right: 0, wrong: 0, shown: 0, order: [] };
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function dsStart(scope) {
  DS.scope = scope || '';
  DS.pool = shuffle(DS.scope ? ZD.filter(d => d.mod === DS.scope) : ZD);
  DS.i = 0; DS.pick = -1; DS.right = 0; DS.wrong = 0; DS.shown = 0;
}
function drillCard() {
  if (!DS.pool.length) return '<div class="panel">' + empty('no drills in this scope yet.') + '</div>';
  if (DS.i >= DS.pool.length) {
    const pct = DS.shown ? Math.round(100 * DS.right / DS.shown) : 0;
    return '<div class="panel hi"><div class="hero-top"><span class="badge">session over</span><span class="badge mono">' + DS.right + '/' + DS.shown + '</span>' +
      '<span class="badge mono">' + pct + '%</span></div>' +
      '<h2 class="h2">' + (pct >= 85 ? 'that is exam-ready.' : pct >= 65 ? 'solid, with specific holes.' : 'read the why on each one, then run it again — that is the whole method.') + '</h2>' +
      '<p class="sub">Wrong answers are the useful ones: every one of them is a mistake people actually make in the field. ' +
      'Re-run the set until the misses are gone, then move scope.</p>' +
      '<div class="hero-actions"><button class="btn primary" data-a="restart">↻ run this scope again</button>' +
      '<button class="btn" data-a="all">all ' + ZD.length + ' drills</button>' +
      '<button class="btn" data-act="go" data-hash="#/progress">see progress</button></div></div>';
  }
  const d = DS.pool[DS.i];
  const mod = M[d.mod];
  let h = '<div class="panel"><div class="hero-top">' + diffTag(d.diff) + '<span class="badge mono">' + DS.i + '/' + DS.pool.length + '</span>' +
    (mod ? '<span class="badge">' + esc(mod.n + ' ' + mod.title) + '</span>' : '') +
    (d.tags || []).slice(0, 3).map(t => '<span class="badge">' + esc(t) + '</span>').join('') +
    '<span class="sp"></span><span class="mono small">' + DS.right + ' right · ' + DS.wrong + ' wrong</span></div>';
  h += '<h2 class="h2">' + md(d.q) + '</h2><div class="opts">';
  d.a.forEach((opt, i) => {
    let cls = 'opt';
    if (DS.pick > -1) {
      if (i === d.k) cls += ' right';
      else if (i === DS.pick) cls += ' wrong';
      else cls += ' dim';
    }
    h += '<button class="' + cls + '" data-o="' + i + '"' + (DS.pick > -1 ? ' disabled' : '') + '>' +
      '<span class="key">' + 'ABCD'[i] + '</span><span>' + md(opt) + '</span></button>';
  });
  h += '</div>';
  if (DS.pick > -1) {
    const ok = DS.pick === d.k;
    h += note(ok ? 'ok' : 'danger', '<b>' + (ok ? 'right — ' : 'not quite. the answer is ' + 'ABCD'[d.k] + ' — ') + '</b>' + md(d.why), ok ? 'WHY' : 'WHY IT MATTERS');
    h += '<div class="hero-actions"><button class="btn primary" data-a="next">next →</button>' +
      '<button class="btn" data-a="stop">end session</button></div>';
  } else {
    h += '<div class="muted small">pick one. the explanation is the lesson, so it only appears after you commit.</div>';
  }
  h += '</div>';
  return h;
}
function drillPaint() {
  const host = document.getElementById('drillwrap');
  if (!host) return;
  host.innerHTML = drillCard();
  host.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    if (DS.pick > -1) return;
    DS.pick = +b.getAttribute('data-o'); DS.shown++;
    const d = DS.pool[DS.i]; const ok = DS.pick === d.k;
    if (ok) DS.right++; else DS.wrong++;
    ZO.recordDrill(d.id, ok);
    if (window.ZO_BG_WARP) window.ZO_BG_WARP(ok ? 2.5 : 1.2);
    drillPaint();
    const n = host.querySelector('.note'); if (n) n.scrollIntoView({ block: 'nearest' });
  });
  host.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.getAttribute('data-a');
    if (a === 'next') {
      DS.i++; DS.pick = -1;
      if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.8);
    }
    else if (a === 'restart') { dsStart(DS.scope); if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.5); }
    else if (a === 'all') { dsStart(''); if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.5); }
    else if (a === 'stop') { DS.i = DS.pool.length; }
    drillPaint();
  });
  const c = document.getElementById('dscore'); if (c) c.textContent = DS.right + '/' + DS.shown;
}
ZO.views.drills = function (r) {
  const scope = r.id || '';
  if (DS.scope !== scope || !DS.pool.length) dsStart(scope);
  const mod = scope ? M[scope] : null;
  const drillHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('drill-holo', 'ouroboros', 'CIPHER TARGET // MERKABA WHEEL') : '';
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'drills', go: '/drills' }, { t: mod ? mod.n + ' ' + mod.title : 'all scopes' }]);
  h += '<h1 class="h1">drills</h1>';
  h += '<p class="sub">' + ZD.length + ' scenario questions. These are not trivia — every wrong option is a mistake that has cost ' +
       'somebody a client, an engagement, or a criminal charge. Answer before you scroll; the explanation is the real material.</p>';
  h += drillHolo;
  h += '<div class="filterbar"><span class="muted small">scope</span>' +
    chip('all ' + ZD.length, 'go', '#/drills') +
    ZM.filter(m => ZD.some(d => d.mod === m.id)).map(m =>
      chip(m.n + ' (' + ZD.filter(d => d.mod === m.id).length + ')', 'go', '#/drills/' + m.id)).join(' ') +
    '<span class="sp"></span><span class="muted small">this session <b class="mono" id="dscore">' + DS.right + '/' + DS.shown + '</b></span></div>';
  h += '<div id="drillwrap">' + drillCard() + '</div>';
  h += '<div class="panel"><h4 class="h4">how to use these without wasting them</h4><ol class="tight">' +
    ['Answer out loud, in full sentences. If you cannot explain the choice, you guessed.',
     'Read the explanation for the options you rejected too — that is where the operational detail lives.',
     'Come back to a scope after the matching lab. Understanding changes the answer.',
     'Anything you get wrong twice belongs in your own notes, in your own words.',
     'Target score is not 100% on the first run; it is 100% on the run before you touch a client network.']
      .map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div>';
  return { html: h, after: () => {
    if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('drill-holo', 'ouroboros', 48, 16);
    drillPaint();
  } };
};

/* ---------------------------------------------------------------- *
 * FORGE — list
 * ---------------------------------------------------------------- */
const LANGNAME = { bash: 'bash', python: 'python', ruby: 'ruby', yaml: 'yaml', lua: 'lua', powershell: 'powershell', text: 'shell + notes' };
ZO.views.forge = function (r) {
  const st = ZO.stats();
  const forgeHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('forge-holo', 'torus', 'KINETIC SCRIPT FORGE ANVIL') : '';
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'forge' }]);
  h += '<h1 class="h1">the forge — make the tools yours</h1>';
  h += '<p class="sub">' + ZF.length + ' recipes for scripting your way out of repetition. Knowing what nmap does is table stakes; ' +
       'the thing that makes you fast is the alias, the wrapper, the report generator, the parser you wrote yourself. ' +
       'Each recipe gives you the code, what each part is doing, the hardening pass, and where to take it next.</p>';
  h += forgeHolo;
  h += note('info', 'Every recipe is meant to be <b>edited</b>, not copied. Change the names, break it, fix it. ' +
    'A script you did not understand is a liability the day it fails on a client network.', 'METHOD');

  const lvls = ['base', 'mid', 'deep'].filter(l => ZF.some(f => f.lvl === l));
  h += '<div class="filterbar"><span class="muted small">level</span>' + lvls.map(l =>
      chip(l + ' (' + ZF.filter(f => f.lvl === l).length + ')', 'forgelvl', l)).join(' ') +
    '<button class="btn" data-act="forgelvl" data-id="">all</button>' +
    '<span class="sp"></span>' + Object.keys(ZF.reduce((a, f) => (a[f.lang] = 1, a), {})).map(lg =>
      chip(lg, 'forgelang', lg)).join(' ') +
    '<span class="sp"></span><span class="muted small" id="forgeCount"></span>' +
    '</div>';

  h += '<div class="grid g2" id="forgegrid">' + ZF.map((f, idx) =>
    '<button class="card ' + (ZO.state().forge[f.id] ? 'carddone' : '') + '" data-act="go" data-hash="#/forge/' + f.id + '" data-lvl="' + f.lvl + '" data-lang="' + f.lang + '">' +
    (window.ZOPixelArt ? window.ZOPixelArt.getSceneFor(f.lvl || f.lang, idx) : '') +
    '<span class="cardtop">' + chip(LANGNAME[f.lang] || f.lang, 'noop') + '<span class="sp"></span><span class="badge mono">' + f.lvl + '</span>' +
    '<span class="badge mono">' + esc(f.time) + '</span></span>' +
    '<span class="t"><b>' + esc(f.title) + '</b></span>' +
    '<span class="d">' + esc(f.why.slice(0, 132)) + (f.why.length > 132 ? '…' : '') + '</span>' +
    '</button>').join('') + '</div>';

  h += '<div class="panel"><h4 class="h4">the habits that separate fast from slow</h4><div class="grid g2">' +
    [['Write the loop first', 'If you are about to type the same command into a third host by hand, stop and write the four-line loop.'],
     ['Fail loudly', 'set -euo pipefail, quote your variables, check the tool exists before calling it. Silent failure on a client network is expensive.'],
     ['Log as you go', 'tee every engagement command into a per-target log. The report writes itself from there.'],
     ['Keep the raw output', 'Parsers are built against real output, not the output you remember. Save it first.'],
     ['Version your scripts', 'A git repo of your own tooling is the single highest-leverage five minutes of an engagement week.'],
     ['Refuse to hand-roll crypto', 'Use the tool. Innovation belongs in the workflow, not in the primitive.']]
      .map(([t, d]) => '<div><b>' + esc(t) + '</b><div class="muted small">' + esc(d) + '</div></div>').join('') +
    '</div></div>';
  return { html: h, after: () => {
    if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('forge-holo', 'torus', 48, 16);
    const mark = () => {
      document.querySelectorAll('#view .chip[data-act="forgelvl"]').forEach(b =>
        b.classList.toggle('on', (b.dataset.id || '') === ZO.forgeFilter.lvl));
      document.querySelectorAll('#view .chip[data-act="forgelang"]').forEach(b =>
        b.classList.toggle('on', (b.dataset.id || '') === ZO.forgeFilter.lang));
      const c = document.querySelector('#forgeCount');
      if (c) {
        const shown = Array.prototype.filter.call(document.querySelectorAll('#forgegrid .card'), x => !x.hidden).length;
        c.textContent = shown === ZF.length ? ZF.length + ' recipes' : shown + ' of ' + ZF.length + ' recipes';
      }
    };
    const apply = (lvl, lang) => {
      document.querySelectorAll('#forgegrid .card').forEach(c => {
        c.hidden = (lvl && c.getAttribute('data-lvl') !== lvl) || (lang && c.getAttribute('data-lang') !== lang);
      });
      mark();
    };
    ZO.forgeFilter = { lvl: '', lang: '' };
    ZO.filterForgeLvl = (l) => { ZO.forgeFilter.lvl = l || ''; apply(ZO.forgeFilter.lvl, ZO.forgeFilter.lang); };
    ZO.filterForgeLang = (l) => { ZO.forgeFilter.lang = l || ''; apply(ZO.forgeFilter.lvl, ZO.forgeFilter.lang); };
    document.querySelectorAll('#view .chip[data-act="forgelvl"]').forEach(b => b.onclick = () => ZO.filterForgeLvl(b.dataset.id));
    document.querySelectorAll('#view .chip[data-act="forgelang"]').forEach(b => b.onclick = () => ZO.filterForgeLang(b.dataset.id));
    mark();
  } };
};

/* ---------------------------------------------------------------- *
 * FORGE — single recipe
 * ---------------------------------------------------------------- */
ZO.views.recipe = function (r) {
  const f = R[r.id];
  if (!f) return ZO.views.notfound(r);
  const idx = ZF.findIndex(x => x.id === f.id);
  const prev = ZF[idx - 1], next = ZF[idx + 1];
  const done = ZO.state().forge[f.id];
  const related = ZF.filter(x => x.id !== f.id && x.lvl === f.lvl).slice(0, 3);

  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'forge', go: '/forge' }, { t: f.title }]);
  h += '<div class="panel hi"><div class="hero-top">' + chip(LANGNAME[f.lang] || f.lang, 'noop') +
    '<span class="badge mono">' + esc(f.lvl) + '</span><span class="badge mono">' + esc(f.time) + '</span>' +
    (f.when || []).slice(0, 2).map(w => '<span class="badge">' + esc(w) + '</span>').join('') + '</div>' +
    '<h1 class="h1">' + esc(f.title) + '</h1><p class="sub">' + md(f.why) + '</p>' +
    '<div class="hero-actions">' +
      '<button class="btn ' + (done ? '' : 'primary') + '" data-act="forgedone" data-id="' + f.id + '">' +
        (done ? '✓ built this — unmark' : '✓ i built and ran it (+25 xp)') + '</button>' +
      '<span class="sp"></span>' +
      (prev ? '<button class="btn" data-act="go" data-hash="#/forge/' + prev.id + '">← previous</button>' : '') +
      (next ? '<button class="btn" data-act="go" data-hash="#/forge/' + next.id + '">next →</button>' : '') +
    '</div></div>';

  h += '<div class="cols"><div class="col-main">' +
    '<div class="panel"><h2 class="h2">the script</h2>' + codeBlock(f.code, f.lang, ZO.slug(f.title) + (f.lang === 'bash' ? '.sh' : f.lang === 'python' ? '.py' : '.' + f.lang)) + '</div>' +
    (f.parts && f.parts.length ? '<div class="panel"><h2 class="h2">what each part is doing</h2><table class="tbl"><tr><th>part</th><th>why</th></tr>' +
      f.parts.map(p => '<tr><td class="mono k">' + esc(p.k) + '</td><td>' + md(p.v) + '</td></tr>').join('') + '</table></div>' : '') +
    '</div><div class="col-side">';

  if (f.when && f.when.length) h += '<div class="panel"><h4 class="h4">reach for it when</h4><ul class="tight">' + f.when.map(w => '<li>' + md(w) + '</li>').join('') + '</ul></div>';
  if (f.harden && f.harden.length) h += note('warn', '<b>Harden it before you trust it.</b><ul class="tight">' + f.harden.map(x => '<li>' + md(x) + '</li>').join('') + '</ul>', 'HARDEN');
  if (f.next && f.next.length) h += '<div class="panel"><h4 class="h4">where to take it next</h4><ul class="tight">' + f.next.map(x => '<li>' + md(x) + '</li>').join('') + '</ul></div>';
  if (related.length) h += '<div class="panel"><h4 class="h4">same level, other builds</h4><div class="chips small">' +
    related.map(x => chip(x.title.slice(0, 30), 'go', '#/forge/' + x.id)).join(' ') + '</div></div>';
  h += '</div></div>';
  return h;
};

/* ---------------------------------------------------------------- *
 * PROGRESS
 * ---------------------------------------------------------------- */
ZO.views.progress = function () {
  const st = ZO.stats();
  const S = ZO.state();
  const seen = Object.keys(S.seen || {}).length;
  const progHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('prog-holo', 'hermetic_seal', 'HERMETIC OPERATOR CREST') : '';
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'dossier' }]);
  h += '<h1 class="h1">your dossier</h1>';
  h += '<p class="sub">Everything you have opened, answered, built, and left half-done — stored in this browser only. ' +
       'Nothing leaves the machine, and there is no account, because there does not need to be one.</p>';
  h += progHolo;

  h += '<div class="panel hi"><div class="hero-top"><span class="badge mono">level ' + st.lv.n + '</span>' +
    '<span class="badge mono">' + st.xp + ' xp</span><span class="badge mono">' + st.streak + 'd streak</span></div>' +
    '<h2 class="h2">' + esc(st.lv.name) + '</h2>' + bar(st.lv.pct || 0, 28) +
    '<div class="muted small">' + (st.lv.need ? st.lv.into + ' / ' + st.lv.need + ' xp to the next level · ' + (st.lv.need - st.lv.into) + ' to go' : 'maxed — now teach somebody else') + '</div></div>';

  const storyDone = Object.keys(S.story || {}).filter(k => S.story[k]).length;
  const cells = [
    ['campaign operations', storyDone + ' / 8', Math.round(100 * storyDone / 8)],
    ['modules finished', st.modsDone + ' / ' + ZM.length, ZM.length ? Math.round(100 * st.modsDone / ZM.length) : 0],
    ['lessons ticked', st.lessonsDone + ' / ' + ZM.reduce((a, m) => a + (m.lessons || []).length, 0), 0],
    ['drills answered', st.answered + ' / ' + ZD.length + ' · ' + st.acc + '% right', st.answered ? st.acc : 0],
    ['labs completed', st.labsDone + ' / ' + ZL.length, ZL.length ? Math.round(100 * st.labsDone / ZL.length) : 0],
    ['recipes built', st.forgeDone + ' / ' + ZF.length, ZF.length ? Math.round(100 * st.forgeDone / ZF.length) : 0]
  ];
  h += '<div class="grid g3">' + cells.map(([t, v, p]) =>
    '<div class="panel stat"><div class="muted small">' + esc(t) + '</div><div class="big mono">' + esc(v) + '</div>' +
    (p ? meter(p, 100) : '') + '</div>').join('') + '</div>';

  // Alchemical Seals Panel
  const seals = [
    { sigil: '🜔', name: 'Nigredo', desc: 'The Black Work · Perimeter Breach', done: (S.story && S.story.m1 && S.story.m2) },
    { sigil: '🜛', name: 'Albedo', desc: 'The White Work · Foothold & Hashes', done: (S.story && S.story.m3 && S.story.m4) },
    { sigil: '🜚', name: 'Citrinitas', desc: 'The Yellow Work · PrivEsc & Domain', done: (S.story && S.story.m5 && S.story.m6) },
    { sigil: '☉', name: 'Rubedo', desc: 'The Red Work · Azoth Transmutation', done: (S.story && S.story.m7 && S.story.m8) }
  ];
  h += '<div class="panel"><div class="hero-top"><span class="badge on">ALCHEMICAL CITADEL SEALS</span><span class="telemetry">SOVEREIGN PROTOCOL</span></div>' +
    '<h2 class="h2">The Four Stages of the Great Work</h2>' +
    '<div class="grid g4" style="margin-top:14px;">' + seals.map(s =>
      '<div class="panel ' + (s.done ? 'hi' : '') + '" style="text-align:center;padding:14px 10px;">' +
      '<div style="font-size:32px;line-height:1;margin-bottom:6px;color:' + (s.done ? 'var(--phos)' : 'var(--text-faint)') + '">' + s.sigil + '</div>' +
      '<div style="font-weight:700;font-size:0.95em;color:var(--text-main);">' + esc(s.name) + '</div>' +
      '<div class="muted small" style="font-size:0.75em;margin:4px 0 8px;">' + esc(s.desc) + '</div>' +
      '<span class="badge ' + (s.done ? 'on' : '') + '">' + (s.done ? '✓ TRANSMUTED' : 'UNSEALED') + '</span>' +
      '</div>').join('') +
    '</div>' +
    '<div style="margin-top:12px;"><button class="btn primary" data-act="go" data-hash="#/story">→ open sovereign campaign map</button></div></div>';

  h += '<div class="panel"><h2 class="h2">module by module</h2><table class="tbl"><tr><th>#</th><th>module</th><th>lessons</th><th>drills</th><th>labs</th><th></th></tr>' +
    ZM.map(m => {
      const ls = (m.lessons || []).length;
      const ld = (S.lessons[m.id] || []).filter(Boolean).length;
      const dd = ZD.filter(d => d.mod === m.id);
      const da = dd.filter(d => S.drills[d.id] != null).length;
      const dl = (m.labs || []).filter(id => S.labs[id]).length;
      const bar1 = ls ? '<span style="margin-left:8px">' + bar(100 * ld / ls, 10) + '</span>' : '';
      return '<tr><td class="mono">' + esc(m.n) + '</td>' +
        '<td><a href="#/mod/' + m.id + '">' + esc(m.title) + '</a><div class="muted small">' + esc(m.sum || '') + '</div></td>' +
        '<td class="mono">' + ld + '/' + ls + bar1 + '</td>' +
        '<td class="mono">' + da + '/' + dd.length + '</td>' +
        '<td class="mono">' + dl + '/' + (m.labs || []).length + '</td>' +
        '<td>' + (ld === ls && ls ? '<span class="badge ok">done</span>' : (ld ? '<span class="badge">in progress</span>' : '<span class="badge dim">untouched</span>')) + '</td></tr>';
    }).join('') + '</table></div>';

  h += '<div class="panel"><h2 class="h2">carry it between machines</h2><p class="sub">Export writes a JSON file with your levels, ' +
    'checks and answers. Import reads one back. It contains no personal data — just your position in the manual.</p>' +
    '<div class="hero-actions"><button class="btn" data-act="export">↓ export progress</button>' +
    '<button class="btn" data-act="import">↑ import progress</button>' +
    '<button class="btn" data-act="openpal">search everything (⌘K)</button>' +
    '<button class="btn" data-act="keys">keyboard shortcuts</button></div></div>';
  return {
    html: h,
    after: () => {
      if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('prog-holo', 'hermetic_seal', 48, 16);
    }
  };
};

})();
