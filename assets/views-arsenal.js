/* ==========================================================================
   ZothPen — views: arsenal (tool dossiers + the console)
   Loaded after app.js, before start.js.
   ========================================================================== */
(function () {
'use strict';
const { esc, md, inline, codeBlock, note, chip, bar, meter,
        crumbs, rule, empty, diffTag, kindTag, kv } = ZO;
const ZT = ZO.ZT, ZX = ZO.ZX, ZM = ZO.ZM, ZF = ZO.ZF, T = ZO.T;

/* ---------------------------------------------------------------- *
 * TOOL DOSSIERS — list
 * ---------------------------------------------------------------- */
const KIND_HINT = {
  tool: 'single-purpose binary — learn it properly',
  suite: 'suite of related binaries — learn the shape once',
  reference: 'concept, not a binary — read it like a page'
};

ZO.views.tools = function () {
  const kinds = [...new Set(ZT.map(t => t.kind))];
  const holoHtml = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('tools-holo', 'hermetic_seal', 'HERMETIC ARSENAL SCANNER') : '';
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'arsenal' }]);
  h += '<h1 class="h1">tool dossiers</h1>';
  h += '<p class="sub">' + ZT.length + ' entries — what the tool is for, the syntax that matters, the flags people actually get wrong, ' +
       'the operational-security cost of running it, and where to read the real manual. Nothing here is a substitute for ' +
       '<span class="mono">man</span>; it is the map that tells you which page to read.</p>';
  h += holoHtml;
  h += '<div class="filterbar">' +
    '<input id="tfilter" class="inp" placeholder="filter: name, package, phase, or what it does…" autocomplete="off">' +
    '<span class="muted small" id="tcount">' + ZT.length + ' dossiers</span>' +
    '<span class="sp"></span>' +
    kinds.map(k => chip(k + ' (' + ZT.filter(t => t.kind === k).length + ')', 'tkind', k)).join(' ') +
    '<button class="btn" data-act="tkind" data-id="">all</button>' +
    '</div>';

  kinds.forEach((k) => {
    const tools = ZT.filter(t => t.kind === k);
    h += '<div class="phaseblock" data-kind="' + esc(k) + '"><div class="phasehead">' + rule(k + ' — ' + (KIND_HINT[k] || 'dossiers')) + '</div>';
    h += '<div class="grid g3">' + tools.map((t, idx) =>
      '<button class="card" data-act="go" data-hash="#/tool/' + t.id + '" data-search="' +
        esc(((t.name || '') + ' ' + (t.pkg || '') + ' ' + (t.kind || '') + ' ' + (t.tagline || '') + ' ' + (t.what || '') + ' ' +
            (t.phases || []).join(' ')).toLowerCase()) + '">' +
      (window.ZOPixelArt ? window.ZOPixelArt.getSceneFor(t.name || t.kind, idx) : '') +
      '<span class="cardtop">' + kindTag(t.kind) + '<span class="sp"></span><span class="mono muted small">' + esc(t.pkg) + '</span></span>' +
      '<span class="t"><b>' + esc(t.name) + '</b></span>' +
      '<span class="d">' + esc(t.tagline) + '</span>' +
      '<span class="d muted small">' + (t.phases || []).join(' · ') + '</span>' +
      '</button>').join('') + '</div></div>';
  });

  // phase index
  const phases = [...new Set(ZT.flatMap(t => t.phases || []))];
  h += '<div class="panel"><h4 class="h4">by phase of the engagement</h4><div class="grid g2">' +
    phases.map(p => '<div><b class="mono">' + esc(p) + '</b><div class="chips small" style="margin-top:6px">' +
      ZT.filter(t => (t.phases || []).includes(p)).map(t => chip(t.name, 'go', '#/tool/' + t.id)).join(' ') +
    '</div></div>').join('') + '</div></div>';

  return { html: h, after: () => {
    const inp = document.getElementById('tfilter');
    const cnt = document.getElementById('tcount');
    const paint = () => {
      const q = (inp.value || '').trim().toLowerCase();
      let n = 0;
      document.querySelectorAll('#view .card[data-search]').forEach(c => {
        const ok = !q || c.getAttribute('data-search').indexOf(q) > -1;
        c.hidden = !ok; if (ok) n++;
      });
      document.querySelectorAll('#view .grid').forEach(g => {
        const vis = Array.from(g.querySelectorAll('.card[data-search]')).some(c => !c.hidden);
        const blk = g.closest('.phaseblock'); if (blk) blk.hidden = g.querySelector('.card[data-search]') ? !vis : false;
      });
      if (cnt) cnt.textContent = n + ' of ' + ZT.length + ' dossiers';
    };
    if (inp) { inp.oninput = paint; inp.focus(); paint(); }
    ZO.filterKind = (k) => {
      document.querySelectorAll('#view .card[data-search]').forEach(c => {
        const blk = c.closest('.phaseblock');
        c.hidden = k ? blk.getAttribute('data-kind') !== k : false;
      });
      document.querySelectorAll('#view .phaseblock').forEach(b => { b.hidden = k ? b.getAttribute('data-kind') !== k : false; });
      if (cnt) cnt.textContent = (k ? ZT.filter(t => t.kind === k).length : ZT.length) + ' of ' + ZT.length + ' dossiers';
    };
    if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('tools-holo', 'hermetic_seal', 52, 16);
  } };
};

/* ---------------------------------------------------------------- *
 * TOOL DOSSIER — single
 * ---------------------------------------------------------------- */
ZO.views.tool = function (r) {
  const t = T[r.id];
  if (!t) return ZO.views.notfound(r);
  const idx = ZT.findIndex(x => x.id === t.id);
  const prev = ZT[idx - 1], next = ZT[idx + 1];
  const mods = ZM.filter(m => (m.tools || []).includes(t.id));
  const recipes = ZF.filter(f => (f.title + ' ' + f.why + ' ' + f.code).toLowerCase().indexOf((t.name || '').toLowerCase().split(' ')[0]) > -1);

  let toolGeom = 'ouroboros';
  const nm = (t.name || '').toLowerCase();
  if (nm.includes('nmap') || nm.includes('masscan')) toolGeom = 'globe';
  else if (nm.includes('wireshark') || nm.includes('tcpdump')) toolGeom = 'torus';
  else if (nm.includes('metasploit') || nm.includes('sqlmap')) toolGeom = 'skull';
  else if (nm.includes('burp') || nm.includes('hashcat')) toolGeom = 'hermetic_seal';
  else if (nm.includes('hydra') || nm.includes('john')) toolGeom = 'ouroboros';
  else if (nm.includes('crypto') || nm.includes('cipher')) toolGeom = 'tree_of_life';
  else toolGeom = 'tesseract';

  const toolHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('tool-holo-' + t.id, toolGeom, 'PROTOCOL HOLOGRAPH') : '';

  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'arsenal', go: '/tools' }, { t: t.name }]);

  h += '<div class="panel hi"><div class="hero-top">' + kindTag(t.kind) +
    '<span class="mono badge">' + esc(t.pkg) + '</span>' +
    (t.phases || []).map(p => '<span class="badge">' + esc(p) + '</span>').join(' ') + '</div>' +
    '<h1 class="h1 mono">' + esc(t.name) + '</h1>' +
    '<p class="sub">' + esc(t.tagline) + '</p>' +
    '<div class="hero-actions">' +
      '<button class="btn" data-act="cxfill" data-id="' + esc(t.name.toLowerCase()) + '">→ open in console</button>' +
      (t.pkg && t.pkg !== '—' ? chip('install: ' + t.pkg, 'snippet', t.pkg) : '') +
      '<span class="sp"></span>' +
      (prev ? '<button class="btn" data-act="go" data-hash="#/tool/' + prev.id + '">← ' + esc(prev.name) + '</button>' : '') +
      (next ? '<button class="btn" data-act="go" data-hash="#/tool/' + next.id + '">' + esc(next.name) + ' →</button>' : '') +
    '</div></div>';

  if (t.what) h += '<div class="cols"><div class="col-main"><div class="panel"><h2 class="h2">what it is</h2><p class="sub">' + md(t.what) + '</p></div>';

  if (t.syntax) {
    h += '<div class="panel"><h2 class="h2">the syntax that matters</h2>' + codeBlock(t.syntax, 'bash', t.name + ' usage') +
      '<div class="muted small">Everything else is in <span class="mono">man ' + esc(t.name.split(' ')[0]) + '</span> — read it once, properly, on your own machine.</div></div>';
  }

  if (t.flags && t.flags.length) {
    h += '<div class="panel"><h2 class="h2">flags worth memorising</h2><table class="tbl"><tr><th>flag</th><th>what it does, and when it bites you</th></tr>' +
      t.flags.map(f => '<tr><td class="mono k">' + md(f.f) + '</td><td>' + md(f.d) + '</td></tr>').join('') + '</table></div>';
  }

  if (t.examples && t.examples.length) {
    h += '<div class="panel"><h2 class="h2">worked examples</h2>';
    t.examples.forEach((e, i) => {
      h += '<div class="ex"><div class="ex-head"><span class="badge">' + (i + 1) + '</span><b>' + esc(e.t || 'example') + '</b></div>' +
        codeBlock(e.cmd, (t.name.toLowerCase().indexOf('python') === 0 ? 'python' : 'bash'), 'shell') +
        (e.out ? '<div class="out"><span class="lab">out</span><pre>' + esc(e.out) + '</pre></div>' : '') +
        (e.note ? '<div class="sub">' + md(e.note) + '</div>' : '') + '</div>';
    });
    h += '</div>';
  }

  if (t.tips) h += '<div class="panel"><h2 class="h2">tips from the field</h2>' +
    (Array.isArray(t.tips) ? '<ul class="tight">' + t.tips.map(x => '<li>' + md(x) + '</li>').join('') + '</ul>' : '<p class="sub">' + md(t.tips) + '</p>') + '</div>';

  h += '</div><div class="col-side">' + toolHolo;

  if (t.opsec && t.opsec.length) {
    h += note('danger', '<b>Operational security — the cost of running this.</b><ul class="tight">' +
      t.opsec.map(o => '<li>' + md(o) + '</li>').join('') + '</ul>', 'OPSEC');
  }

  if (mods.length) {
    h += '<div class="panel"><h4 class="h4">taught in</h4>' +
      mods.map(m => '<div class="kv"><span class="mono">' + esc(m.n) + '</span><span><a href="#/mod/' + m.id + '">' + esc(m.title) + '</a></span></div>').join('') + '</div>';
  }
  if (recipes.length) {
    h += '<div class="panel"><h4 class="h4">forge it — rebuild this as your own script</h4>' +
      recipes.slice(0, 4).map(f => chip(f.title.slice(0, 34), 'go', '#/forge/' + f.id)).join(' ') +
      '<div class="muted small" style="margin-top:6px">Understanding the tool is half of it. Owning the wrapper around it is the job.</div></div>';
  }
  if (t.related && t.related.length) {
    h += '<div class="panel"><h4 class="h4">the usual neighbours</h4><div class="chips small">' +
      t.related.map(id => T[id] ? chip(T[id].name, 'go', '#/tool/' + id) : chip(id, 'noop')).join(' ') + '</div></div>';
  }
  if (t.links && t.links.length) {
    h += '<div class="panel"><h4 class="h4">read the real thing</h4>' +
      t.links.map(l => '<div class="kv"><span><a href="' + esc(l.u) + '" target="_blank" rel="noopener noreferrer">' + esc(l.t) + '</a></span></div>').join('') + '</div>';
  }
  h += '</div></div>';
  return {
    html: h,
    after: () => {
      if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('tool-holo-' + t.id, toolGeom, 36, 14);
    }
  };
};


/* ---------------------------------------------------------------- *
 * CONSOLE
 * ---------------------------------------------------------------- */
const CX = { lines: [], hist: [], hi: -1, cat: '' };
function cxPaint() {
  const b = document.getElementById('cx-body');
  if (!b) return;
  b.innerHTML = CX.lines.map(l => '<div class="ln ' + esc(l.cls || '') + '">' + esc(l.text) + '</div>').join('');
  b.scrollTop = b.scrollHeight;
}
function cxRun(raw) {
  const line = String(raw || '');
  if (!line.trim()) return;
  if (window.ZO_SOUND) ZO_SOUND.cmd();
  CX.lines.push({ cls: 'ps1', text: 'zoth@zothpen:~$ ' + line });
  if (CX.hist[CX.hist.length - 1] !== line) CX.hist.push(line);
  CX.hi = CX.hist.length;
  ZO.runCommand(line, '').forEach(o => {
    if (o.text === '__CLEAR__') CX.lines.length = 0;
    else CX.lines.push(o);
  });
  if (CX.lines.length > 400) CX.lines = CX.lines.slice(-320);
  cxPaint();
}
ZO.cxRun = cxRun;
ZO.cxClear = function () { CX.lines = []; ZO.cxBanner(); cxPaint(); const i = document.getElementById('cx-in'); if (i) i.focus(); };
ZO.cxSetCat = function (c) {
  CX.cat = c || '';
  document.querySelectorAll('#view .chip[data-act="cxcat"]').forEach(b => b.classList.toggle('on', (b.dataset.id || '') === CX.cat));
  if (ZO.cxPaintList) ZO.cxPaintList();
};
ZO.cxBanner = function () {
  CX.lines = [
    { cls: 'o-info', text: 'ZothPen console — ' + ZX.length + ' indexed commands, offline.' },
    { cls: 'o-dim',  text: 'this is not a shell and it never pretends to be one: it is the index behind the manual.' },
    { cls: 'o-dim',  text: 'type a tool name (nmap), a query (index smb), or help.' },
    { cls: 'o-ok',   text: 'when you want the real thing, copy the line into the terminal on your own box.' },
    { cls: '',       text: '' }
  ];
};

ZO.views.console = function (r) {
  const q0 = r.id || '';
  const cats = [...new Set(ZX.map(x => x.cat))].sort();
  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'console' }]);
  h += '<h1 class="h1">console</h1>';
  h += '<p class="sub">A lookup shell over the ' + ZX.length + '-command index. Type a tool name, a category ' +
       '(<span class="mono">index smb</span>), or <span class="mono">help</span>. Every answer is local, because ' +
       'the point of a field manual is that it still works when the network does not.</p>';
  h += '<div class="cols cxcols"><div class="col-main"><div class="term big">' +
    '<div class="term-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span>' +
    '<span>zoth@zothpen — index shell</span><span class="sp"></span>' +
    '<button class="copy" data-act="cxclear">clear</button></div>' +
    '<div class="term-body" id="cx-body"></div>' +
    '<div class="term-in"><span class="ps1">zoth@zothpen:~$</span>' +
    '<input id="cx-in" class="cx-inp" autocomplete="off" spellcheck="false" placeholder="nmap · index smb · run f-alias · help"></div>' +
    '</div>' +
    note('info', 'This console looks things up; it does not touch the network. Run the real command on your own machine, ' +
      'against a target you are authorised to test — the index gives you the line, your scope gives you the permission.', 'HONEST') +
    '</div>';

  const cxHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('cx-holo', 'tree_of_life', 'HERMETIC TOPOLOGY HUD') : '';
  h += '<div class="col-side">' + cxHolo + '<div class="panel"><h4 class="h4">command index</h4>' +
    '<div class="filterbar"><input id="cx-filter" class="inp" placeholder="filter the index…" autocomplete="off"></div>' +
    '<div class="chips small" style="margin:6px 0 10px">' + cats.map(c => chip(c, 'cxcat', c)).join(' ') + '</div>' +
    '<div id="cx-list" class="cxlist"></div></div>' +
    '<div class="panel"><h4 class="h4">shell commands</h4>' +
    [['help', 'everything this shell answers to'], ['index <query>', 'search all ' + ZX.length + ' entries'],
     ['tool <name>', 'what it is + how to install it'], ['detect <name>', 'does it exist on your box'],
     ['run <recipe>', 'print a forge recipe'], ['ls', 'list the modules'], ['progress', 'your numbers'],
     ['ascii <geom>', 'switch 3d ascii topology HUD'], ['hermetic', 'the seven emerald axioms'],
     ['export / import', 'move progress between machines'], ['wipe', 'clean slate']]
      .map(([c, d]) => '<div class="kv"><span class="mono">' + esc(c) + '</span><span class="muted small">' + esc(d) + '</span></div>').join('') +
    '</div></div></div>';

  return { html: h, after: () => {
    if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('cx-holo', 'tree_of_life', 38, 14);
    if (!CX.lines.length) ZO.cxBanner();
    cxPaint();
    const inp = document.getElementById('cx-in');
    const list = document.getElementById('cx-list');
    const filter = document.getElementById('cx-filter');
    const paintList = () => {
      const q = (filter.value || '').trim().toLowerCase();
      const hits = ZX.filter(x => (!CX.cat || x.cat === CX.cat) &&
        (!q || (x.c + ' ' + (x.al || []).join(' ') + ' ' + x.cat + ' ' + x.what).toLowerCase().indexOf(q) > -1));
      list.innerHTML = hits.length ? hits.map(x =>
        '<button class="cxrow" data-act="cxcmd" data-id="' + esc(x.c) + '" title="' + esc(x.what) + '">' +
        '<span class="mono">' + esc(x.c) + '</span><span class="muted small">' + esc(x.what.slice(0, 54)) + '</span></button>').join('')
        : '<div class="muted small" style="padding:8px">nothing matched. try another word.</div>';
    };
    ZO.cxPaintList = paintList;
    paintList();
    if (filter) filter.oninput = paintList;
    if (inp) {
      if (q0) {
        const c = decodeURIComponent(q0);
        inp.value = c;
        cxRun(c);
      }
      inp.focus();
      inp.onkeydown = (e) => {
        if (window.ZOSynth && window.ZOSynth.playKeystroke && e.key.length === 1) window.ZOSynth.playKeystroke();
        if (e.key === 'Enter') {
          e.preventDefault();
          if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
          cxRun(inp.value);
          inp.value = '';
        }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (CX.hi > 0) { CX.hi--; inp.value = CX.hist[CX.hi] || ''; } }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (CX.hi < CX.hist.length - 1) { CX.hi++; inp.value = CX.hist[CX.hi] || ''; } else { CX.hi = CX.hist.length; inp.value = ''; } }
        else if (e.key === 'Escape') { inp.value = ''; }
      };
    }
    document.getElementById('cx-body').onclick = () => { if (inp) inp.focus(); };
  } };
};

ZO.views.notfound = function (r) {
  return '<div class="panel"><span class="badge">404</span><h1 class="h1">nothing here: ' + esc(r.name) + (r.id ? '/' + esc(r.id) : '') + '</h1>' +
    '<p class="sub">That route does not exist in this manual. It may have been an old link, or a typo in the hash.</p>' +
    '<div class="hero-actions"><button class="btn primary" data-act="go" data-hash="#/home">→ overview</button>' +
    '<button class="btn" data-act="go" data-hash="#/map">roadmap</button>' +
    '<button class="btn" data-act="go" data-hash="#/console">console</button>' +
    '<button class="btn" data-act="openpal">search everything (⌘K)</button></div></div>';
};

})();
