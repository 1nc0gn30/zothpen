/* ==========================================================================
   ZothPen — start.js
   Last file in the load order: data-*.js -> app.js -> views-*.js -> start.js
   Nothing above this point touches the DOM; this is the ignition.
   ========================================================================== */
(function () {
'use strict';
if (window.__zothpen) return;
window.__zothpen = true;

function ignition() {
  if (!window.ZO || typeof ZO.start !== 'function') {
    document.body.innerHTML = '<pre style="padding:24px;font:13px ui-monospace,monospace;color:#c9d1d9;background:#0b0e14">' +
      'ZothPen failed to load: assets/app.js did not define ZO.start().\n' +
      'Check that the scripts in index.html are in the order:\n' +
      '  data-*.js -> app.js -> views-learn.js -> views-arsenal.js -> views-practice.js -> start.js</pre>';
    return;
  }

  const views = (window.ZO.views && Object.keys(ZO.views)) || [];
  const need = ['home', 'map', 'mod', 'tools', 'console', 'labs', 'lab', 'drills', 'forge', 'recipe', 'progress', 'story'];
  const missing = need.filter(k => !ZO.views[k]);
  if (missing.length) {
    // A missing view is a broken route, not a crash: say so plainly, then start anyway.
    try { console.warn('[ZothPen] views not registered: ' + missing.join(', ')); } catch (e) {}
  }

  try {
    ZO.start();
    try {
      console.log('%cZothPen', 'font:bold 12px ui-monospace;color:#7ee787',
        'field manual · ' + views.length + ' views · ' + (window.ZM || []).length + ' modules · ' +
        (window.ZT || []).length + ' dossiers · ' + (window.ZL || []).length + ' labs · ' +
        (window.ZF || []).length + ' recipes · offline');
    } catch (e) {}
  } catch (err) {
    console.error('[ZothPen] start failed', err);
    const b = document.getElementById('boot');
    if (b) b.hidden = false;
    const s = document.getElementById('bootmsg');
    if (s) s.textContent = 'startup error: ' + (err && err.message ? err.message : String(err));
    return;
  }

  // A local single-page manual has no server to complain to, so surface real
  // script errors in the console panel instead of letting them vanish.
  window.addEventListener('error', (e) => {
    try {
      if (ZO.say) ZO.say('script error: ' + (e.message || 'unknown'), 'bad');
      if (ZO.cxPush) ZO.cxPush({ cls: 'o-bad', text: 'script error: ' + (e.message || 'unknown') + ' @ ' + (e.filename || '?') + ':' + (e.lineno || 0) });
    } catch (x) {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try { if (ZO.say) ZO.say('unhandled promise rejection', 'bad'); } catch (x) {}
  });

  // Ctrl/Cmd+K anywhere opens the palette overlay.
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      const pal = document.getElementById('palette');
      if (pal && pal.hidden && ZO.openPalette) ZO.openPalette();
    }
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ignition);
else ignition();

})();
