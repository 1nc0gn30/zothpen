/* ==========================================================================
   ZothPen — Sovereign Cockpit & Floating Draggable Console Window [tty2]
   Inspired by @teknium's Uncommon Web & Retro UNIX System V Cockpits
   Features multi-tabbed interface (Shell, 3D Azoth Stream, 21 Agents Matrix),
   pointer dragging & corner resizing, procedural tool simulation,
   interactive 3D Braille stream, and 432 Hz Hermetic tactile audio.
   ========================================================================== */
(function () {
'use strict';

const STORAGE_POS_KEY = 'zothpen.floatconsole.pos';
const STORAGE_SIZE_KEY = 'zothpen.floatconsole.size';
const STORAGE_HIST_KEY = 'zothpen.floatconsole.history';

let el = null;
let header = null;
let body = null;
let outputEl = null;
let inputEl = null;
let resizerEl = null;
let isOpen = false;
let isMaximized = false;
let isMinimized = false;
let currentTab = 'shell';

// Drag state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;

// Resize state
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let initialWidth = 0;
let initialHeight = 0;

// Embedded 3D Engine for tty2
let azothEngine = null;

// Command history
let history = [];
let histIdx = -1;

try {
  const savedHist = localStorage.getItem(STORAGE_HIST_KEY);
  if (savedHist) history = JSON.parse(savedHist);
} catch (e) {}

function saveHistory(cmd) {
  if (!cmd || history[history.length - 1] === cmd) return;
  history.push(cmd);
  if (history.length > 50) history.shift();
  try { localStorage.setItem(STORAGE_HIST_KEY, JSON.stringify(history)); } catch (e) {}
}

/* ------------------------------------------------------------------ *
 * UI Initialization
 * ------------------------------------------------------------------ */
function init() {
  if (document.getElementById('floatConsole')) return;

  el = document.createElement('div');
  el.id = 'floatConsole';
  el.className = 'float-console';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'ZothPen Floating Sovereign Cockpit');
  el.hidden = true;
  el.style.display = 'none';

  el.innerHTML = `
    <div id="floatConsoleHeader" class="float-console-header">
      <div class="fc-title-group">
        <span class="fc-status-dot"></span>
        <span class="fc-title">▚ ZOTH_OS // SOVEREIGN COCKPIT</span>
        <div class="fc-tabs">
          <button class="fc-tab active" data-fc-tab="shell">tty1 · shell</button>
          <button class="fc-tab" data-fc-tab="azoth">tty2 · azoth 3d</button>
          <button class="fc-tab" data-fc-tab="agents">tty3 · pantheon</button>
        </div>
      </div>
      <div class="fc-controls">
        <button class="fc-btn" id="fcBtnClear" title="Clear console buffer (Ctrl+L)">⎚</button>
        <button class="fc-btn" id="fcBtnMin" title="Minimize / Restore">_</button>
        <button class="fc-btn" id="fcBtnMax" title="Maximize / Restore">□</button>
        <button class="fc-btn fc-close" id="fcBtnClose" title="Close console (Esc or c)">✕</button>
      </div>
    </div>
    <div id="floatConsoleBody" class="float-console-body">
      <!-- Tab 1: Interactive Execution Shell -->
      <div id="fcPaneShell" class="fc-pane active">
        <div id="floatConsoleOutput" class="float-console-output"></div>
        <div class="float-console-in">
          <span class="fc-ps1">zoth@zothpen:~$</span>
          <input id="floatConsoleInput" class="fc-input" type="text" autocomplete="off" spellcheck="false"
                 placeholder="help · nmap · scan 10.10.10.1 · azoth · ghostbyte · agents · tools">
        </div>
      </div>

      <!-- Tab 2: Live 3D Azoth Hermetic Stream -->
      <div id="fcPaneAzoth" class="fc-pane">
        <div class="fc-azoth-hud">
          <div class="fc-azoth-header">
            <span>◈ 3D SWARM & ALCHEMY // <b id="fcStreamLabel">GHOSTBYTE 3D</b></span>
            <div class="fc-azoth-controls">
              <button class="btn-holo" id="fcGeomAzoth">azoth</button>
              <button class="btn-holo" id="fcGeomSkull">cyber skull</button>
              <button class="btn-holo btn-holo-special" id="fcGeomGhost">ghostbyte 3d</button>
              <button class="btn-holo btn-holo-special" id="fcGeomHermes">hermes 3d</button>
              <button class="btn-holo btn-holo-special" id="fcGeomAthena">athena 3d</button>
              <button class="btn-holo btn-holo-special" id="fcGeomDraco">draco 3d</button>
              <button class="btn-holo btn-holo-special" id="fcGeomKitsune">kitsune 3d</button>
              <button class="btn-holo" id="fcModeBraille">braille</button>
              <button class="btn-holo" id="fcModeDither">dither</button>
            </div>
          </div>
          <pre id="fcAzothCanvas" class="ascii-3d-canvas fc-canvas-stream" style="display:none;" title="Drag to rotate 3D Mesh in real-time"></pre>
          <canvas id="fcGhostCanvas" class="ghostbyte-3d-canvas fc-canvas-stream" style="display:block; width: 100%; height: 210px;" title="Interactive 3D Swarm Character Model — Drag to Rotate"></canvas>
          <div class="fc-azoth-footer">
            <span>Formula: <b>V.I.T.R.I.O.L.U.M.</b> · 432 Hz Pythagorean Resonance</span>
            <span class="telemetry">SUB-PIXEL BRAILLE ACTIVE</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: The 21 Sovereign Agents Pantheon Matrix -->
      <div id="fcPaneAgents" class="fc-pane">
        <div class="fc-agents-matrix">
          <div class="fc-agents-head">
            <span>◈ 21 SOVEREIGN AGENTS // REAL-TIME CITADEL MATRIX</span>
            <span class="telemetry">ALL AGENTS SANDBOXED ON LOCAL DISK</span>
          </div>
          <div class="fc-agents-grid" id="fcAgentsGrid"></div>
        </div>
      </div>

      <!-- Bottom-Right Resize Handle -->
      <div id="fcResizer" class="fc-resizer" title="Drag to resize console">⇲</div>
    </div>
  `;

  document.body.appendChild(el);

  header = document.getElementById('floatConsoleHeader');
  body = document.getElementById('floatConsoleBody');
  outputEl = document.getElementById('floatConsoleOutput');
  inputEl = document.getElementById('floatConsoleInput');
  resizerEl = document.getElementById('fcResizer');

  // Bind dragging via Pointer Events
  bindDragging();

  // Bind resizing via Pointer Events
  bindResizing();

  // Bind tabs
  bindTabs();

  // Bind controls
  document.getElementById('fcBtnClose').onclick = (e) => { e.stopPropagation(); close(); };
  document.getElementById('fcBtnClear').onclick = (e) => { e.stopPropagation(); clear(); };
  document.getElementById('fcBtnMin').onclick = (e) => { e.stopPropagation(); toggleMinimize(); };
  document.getElementById('fcBtnMax').onclick = (e) => { e.stopPropagation(); toggleMaximize(); };

  // Double click header to maximize
  header.ondblclick = () => toggleMaximize();

  // Input handling with Hermetic tactile keystrokes
  inputEl.addEventListener('keydown', onInputKeydown);

  // Restore position & dimensions
  restorePositionAndSize();

  // Print welcome banner
  printBanner();

  // Populate Agents in tty3
  populateAgentsTab();

  // Bind global shortcuts
  bindShortcuts();
}

/* ------------------------------------------------------------------ *
 * Tab Navigation in Cockpit
 * ------------------------------------------------------------------ */
function bindTabs() {
  const tabs = el.querySelectorAll('[data-fc-tab]');
  tabs.forEach(tab => {
    tab.onclick = (e) => {
      e.stopPropagation();
      const target = tab.getAttribute('data-fc-tab');
      switchTab(target);
    };
  });

  // Azoth & GhostByte 3D Mesh controls
  let fcGhostViewer = null;

  const showFcAzoth = (g, m) => {
    const azothCanvas = document.getElementById('fcAzothCanvas');
    const ghostCanvas = document.getElementById('fcGhostCanvas');
    const label = document.getElementById('fcStreamLabel');
    if (ghostCanvas) ghostCanvas.style.display = 'none';
    if (azothCanvas) azothCanvas.style.display = 'flex';
    if (fcGhostViewer) fcGhostViewer.stop();
    if (azothEngine) {
      if (g) azothEngine.setGeom(g);
      if (m) azothEngine.setMode(m);
      azothEngine.start();
    }
    if (label && g) label.textContent = g.toUpperCase().replace(/_/g, ' ');
    if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
  };

  const showFcSwarm = (charId = 'ghostbyte') => {
    const azothCanvas = document.getElementById('fcAzothCanvas');
    const ghostCanvas = document.getElementById('fcGhostCanvas');
    const label = document.getElementById('fcStreamLabel');
    if (azothCanvas) azothCanvas.style.display = 'none';
    if (ghostCanvas) ghostCanvas.style.display = 'block';
    if (azothEngine) azothEngine.stop();

    if (!fcGhostViewer && window.ZOGhostByte3D && ghostCanvas) {
      fcGhostViewer = window.ZOGhostByte3D.create(ghostCanvas, {
        character: charId,
        mode: 'hologram',
        autoSpin: true,
        fpsCap: 30
      });
    } else if (fcGhostViewer) {
      fcGhostViewer.setCharacter(charId);
    }
    if (fcGhostViewer) fcGhostViewer.start();
    if (label) label.textContent = `${charId.toUpperCase()} 3D (SWARM)`;
    if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
  };

  const bAzoth = document.getElementById('fcGeomAzoth');
  if (bAzoth) bAzoth.onclick = () => showFcAzoth('azoth');
  const bSkull = document.getElementById('fcGeomSkull');
  if (bSkull) bSkull.onclick = () => showFcAzoth('skull');
  const bGhost = document.getElementById('fcGeomGhost');
  if (bGhost) bGhost.onclick = () => showFcSwarm('ghostbyte');
  const bHermes = document.getElementById('fcGeomHermes');
  if (bHermes) bHermes.onclick = () => showFcSwarm('hermes');
  const bAthena = document.getElementById('fcGeomAthena');
  if (bAthena) bAthena.onclick = () => showFcSwarm('athena');
  const bDraco = document.getElementById('fcGeomDraco');
  if (bDraco) bDraco.onclick = () => showFcSwarm('draco');
  const bKitsune = document.getElementById('fcGeomKitsune');
  if (bKitsune) bKitsune.onclick = () => showFcSwarm('kitsune');
  const bBraille = document.getElementById('fcModeBraille');
  if (bBraille) bBraille.onclick = () => showFcAzoth(null, 'braille');
  const bDither = document.getElementById('fcModeDither');
  if (bDither) bDither.onclick = () => showFcAzoth(null, 'dither');
}

function stop3DStreams() {
  if (azothEngine) azothEngine.stop();
  const gc = document.getElementById('fcGhostCanvas');
  if (gc && window.ZOGhostByte3D) {
    const v = window.ZOGhostByte3D.get(gc);
    if (v) v.stop();
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  el.querySelectorAll('.fc-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-fc-tab') === tabId);
  });

  const paneShell = document.getElementById('fcPaneShell');
  const paneAzoth = document.getElementById('fcPaneAzoth');
  const paneAgents = document.getElementById('fcPaneAgents');

  if (paneShell) paneShell.classList.toggle('active', tabId === 'shell');
  if (paneAzoth) paneAzoth.classList.toggle('active', tabId === 'azoth');
  if (paneAgents) paneAgents.classList.toggle('active', tabId === 'agents');

  if (tabId === 'shell' && inputEl) {
    stop3DStreams();
    inputEl.focus();
  } else if (tabId === 'azoth') {
    initAzothStream();
    if (azothEngine) azothEngine.start();
  } else {
    stop3DStreams();
  }

  if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
}

function initAzothStream() {
  const canvas = document.getElementById('fcAzothCanvas');
  if (!canvas || !window.ZOAscii3D) return;

  if (!azothEngine) {
    azothEngine = window.ZOAscii3D.create(canvas, {
      geom: 'azoth',
      mode: 'braille',
      width: 44,
      height: 18
    });
    if (azothEngine) azothEngine.start();
  }
}

/* ------------------------------------------------------------------ *
 * Draggable Pointer Logic with Viewport Clamping
 * ------------------------------------------------------------------ */
function bindDragging() {
  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.fc-btn') || e.target.closest('.fc-tab')) return;
    if (isMaximized) return;

    isDragging = true;
    header.setPointerCapture(e.pointerId);
    header.classList.add('dragging');

    const rect = el.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;

    e.preventDefault();
  });

  header.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    newLeft = Math.max(10, Math.min(winW - elW - 10, newLeft));
    newTop = Math.max(10, Math.min(winH - elH - 10, newTop));

    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    header.classList.remove('dragging');
    try {
      if (header.hasPointerCapture(e.pointerId)) header.releasePointerCapture(e.pointerId);
    } catch (err) {}
    savePosition();
  };

  header.addEventListener('pointerup', stopDrag);
  header.addEventListener('pointercancel', stopDrag);
}

/* ------------------------------------------------------------------ *
 * Resizing Pointer Logic
 * ------------------------------------------------------------------ */
function bindResizing() {
  if (!resizerEl) return;

  resizerEl.addEventListener('pointerdown', (e) => {
    if (isMaximized) return;

    isResizing = true;
    resizerEl.setPointerCapture(e.pointerId);
    resizerEl.classList.add('resizing');

    const rect = el.getBoundingClientRect();
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    initialWidth = rect.width;
    initialHeight = rect.height;

    e.preventDefault();
    e.stopPropagation();
  });

  resizerEl.addEventListener('pointermove', (e) => {
    if (!isResizing) return;

    const dw = e.clientX - resizeStartX;
    const dh = e.clientY - resizeStartY;

    const minW = 420;
    const minH = 260;
    const maxW = window.innerWidth - 30;
    const maxH = window.innerHeight - 30;

    const newW = Math.max(minW, Math.min(maxW, initialWidth + dw));
    const newH = Math.max(minH, Math.min(maxH, initialHeight + dh));

    el.style.width = newW + 'px';
    el.style.height = newH + 'px';
  });

  const stopResize = (e) => {
    if (!isResizing) return;
    isResizing = false;
    resizerEl.classList.remove('resizing');
    try {
      if (resizerEl.hasPointerCapture(e.pointerId)) resizerEl.releasePointerCapture(e.pointerId);
    } catch (err) {}
    saveSize();
  };

  resizerEl.addEventListener('pointerup', stopResize);
  resizerEl.addEventListener('pointercancel', stopResize);
}

function savePosition() {
  if (isMaximized) return;
  const rect = el.getBoundingClientRect();
  try {
    sessionStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
  } catch (e) {}
}

function saveSize() {
  if (isMaximized) return;
  const rect = el.getBoundingClientRect();
  try {
    sessionStorage.setItem(STORAGE_SIZE_KEY, JSON.stringify({ width: rect.width, height: rect.height }));
  } catch (e) {}
}

function restorePositionAndSize() {
  try {
    const rawPos = sessionStorage.getItem(STORAGE_POS_KEY);
    if (rawPos) {
      const pos = JSON.parse(rawPos);
      const left = Math.max(10, Math.min(window.innerWidth - 440, pos.left));
      const top = Math.max(10, Math.min(window.innerHeight - 300, pos.top));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    } else {
      const defaultLeft = Math.max(20, window.innerWidth - 620);
      const defaultTop = Math.max(70, window.innerHeight * 0.16);
      el.style.left = defaultLeft + 'px';
      el.style.top = defaultTop + 'px';
    }

    const rawSize = sessionStorage.getItem(STORAGE_SIZE_KEY);
    if (rawSize) {
      const size = JSON.parse(rawSize);
      el.style.width = Math.min(window.innerWidth - 30, Math.max(420, size.width)) + 'px';
      el.style.height = Math.min(window.innerHeight - 30, Math.max(280, size.height)) + 'px';
    }
  } catch (e) {}
}

/* ------------------------------------------------------------------ *
 * Window State Toggles
 * ------------------------------------------------------------------ */
function open() {
  init();
  el.hidden = false;
  el.style.display = 'flex';
  isOpen = true;
  el.classList.add('active');
  if (currentTab === 'shell') inputEl.focus();
  if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
  updateTopBtn(true);
}

function close() {
  if (!el) return;
  el.hidden = true;
  el.style.display = 'none';
  isOpen = false;
  el.classList.remove('active');
  stop3DStreams();
  if (window.ZOSynth && window.ZOSynth.playBlip) window.ZOSynth.playBlip();
  updateTopBtn(false);
}

function toggle() {
  if (isOpen && !el.hidden) close();
  else open();
}

function toggleMinimize() {
  isMinimized = !isMinimized;
  el.classList.toggle('minimized', isMinimized);
  document.getElementById('fcBtnMin').textContent = isMinimized ? '▲' : '_';
  if (!isMinimized && currentTab === 'shell') inputEl.focus();
  if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
}

function toggleMaximize() {
  isMaximized = !isMaximized;
  el.classList.toggle('maximized', isMaximized);
  document.getElementById('fcBtnMax').textContent = isMaximized ? '❐' : '□';
  if (!isMaximized) restorePositionAndSize();
  if (currentTab === 'shell') inputEl.focus();
  if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
}

function clear() {
  if (outputEl) outputEl.innerHTML = '';
  if (window.ZOSynth && window.ZOSynth.playBlip) window.ZOSynth.playBlip();
}

function updateTopBtn(active) {
  const btn = document.getElementById('floatingConsoleBtn');
  if (btn) btn.classList.toggle('active', active);
}

/* ------------------------------------------------------------------ *
 * Print Helpers
 * ------------------------------------------------------------------ */
function printLine(text, cls = '') {
  if (!outputEl) return;
  const div = document.createElement('div');
  div.className = 'fc-line ' + cls;
  div.innerHTML = text;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function printBanner() {
  printLine('<span class="fc-cyan">▚ ZOTH_OS // SOVEREIGN COCKPIT [tty1-3]</span>', 'head');
  printLine('<span class="fc-dim">Zero telemetry · 100% offline field manual & offensive security suite</span>');
  printLine('<span class="fc-dim">Tabs: <b>tty1 · shell</b> | <b>tty2 · azoth 3d</b> | <b>tty3 · pantheon</b></span>');
  printLine('<span class="fc-ok">Type <b class="fc-cyan">help</b>, <b class="fc-cyan">scan 10.10.10.1</b>, <b class="fc-cyan">azoth</b>, <b class="fc-cyan">ghostbyte</b>, or <b class="fc-cyan">tools</b>.</span>');
  printLine('');
}

/* ------------------------------------------------------------------ *
 * Command Execution Engine & Tactile Keystrokes
 * ------------------------------------------------------------------ */
function onInputKeydown(e) {
  // Tactile Mechanical Terminal Click for every keystroke
  if (window.ZOSynth && window.ZOSynth.playKeystroke && e.key.length === 1) {
    window.ZOSynth.playKeystroke();
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const val = inputEl.value.trim();
    if (val) {
      saveHistory(val);
      histIdx = history.length;
      execute(val);
      inputEl.value = '';
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length > 0) {
      if (histIdx > 0) histIdx--;
      else histIdx = 0;
      inputEl.value = history[histIdx] || '';
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (history.length > 0) {
      if (histIdx < history.length - 1) {
        histIdx++;
        inputEl.value = history[histIdx] || '';
      } else {
        histIdx = history.length;
        inputEl.value = '';
      }
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    close();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    autocomplete(inputEl.value.trim());
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    clear();
  }
}

function autocomplete(prefix) {
  if (!prefix) return;
  const p = prefix.toLowerCase();
  const builtins = ['help', 'scan', 'recon', 'dossier', 'hash', 'clear', 'close', 'tools', 'tool', 'search', 'azoth', 'ghostbyte', 'agents', 'bridge', 'signal', 'simplex', 'matrix', 'comic', 'bored', 'downtime', 'drill', 'labs', 'forge', 'theme', 'font', 'warp', 'top'];
  let matches = builtins.filter(b => b.startsWith(p));
  if (matches.length === 0 && window.ZO && window.ZO.ZX) {
    const cmds = window.ZO.ZX.map(x => x.c.split(' ')[0]).filter(Boolean);
    matches = [...new Set(cmds.filter(c => c.toLowerCase().startsWith(p)))];
  }
  if (matches.length === 1) {
    inputEl.value = matches[0] + ' ';
  } else if (matches.length > 1) {
    printLine('<span class="fc-ps1">suggestions:</span> ' + matches.slice(0, 10).join('  '), 'fc-dim');
  }
}

function execute(raw) {
  printLine('<span class="fc-ps1">zoth@zothpen:~$</span> ' + escapeHtml(raw), 'fc-cmd');

  const parts = raw.trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const arg = parts.slice(1).join(' ');

  if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();

  switch (cmd) {
    case 'help':
      printHelp();
      break;

    case 'scan':
    case 'portscan':
      simulatePortScan(arg || '10.10.14.7');
      break;

    case 'recon':
      simulateRecon(arg || 'target.local');
      break;

    case 'dossier':
      lookupTool(arg);
      break;

    case 'hash':
      simulateHash(arg || 'vitriolum');
      break;

    case 'clear':
    case 'cls':
      clear();
      break;

    case 'close':
    case 'exit':
    case 'quit':
      close();
      break;

    case 'top':
      scrollToTop();
      printLine('<span class="fc-ok">✓ Viewport scrolled to absolute top.</span>');
      break;

    case 'azoth':
      printAzoth();
      switchTab('azoth');
      break;

    case 'ghostbyte':
    case 'nullbyte':
      printGhostByte();
      break;

    case 'summon':
    case 'agent':
    case 'char':
      summonAgentInConsole(arg);
      break;

    case 'skull':
      switchTab('azoth');
      const bSk = document.getElementById('fcGeomSkull');
      if (bSk) bSk.click();
      printLine('<span class="fc-cyan">◈ Cyber-Occult 3D Skull loaded into stream.</span>');
      break;

    case 'hermes':
      summonAgentInConsole('hermes');
      break;

    case 'athena':
      summonAgentInConsole('athena');
      break;

    case 'draco':
      summonAgentInConsole('draco');
      break;

    case 'kitsune':
      summonAgentInConsole('kitsune');
      break;

    case 'agents':
    case 'pantheon':
      printAgents();
      switchTab('agents');
      break;

    case 'comic':
    case 'bored':
    case 'downtime':
      printComic(arg);
      break;

    case 'warp': {
      const intensity = parseFloat(arg) || 1.6;
      if (window.ZO_BG_WARP) window.ZO_BG_WARP(intensity);
      if (window.ZOSynth && window.ZOSynth.playWarp) window.ZOSynth.playWarp();
      printLine(`<span class="fc-cyan">◈ Gravitational warp impulse emitted: ${intensity}x (432 Hz resonance)</span>`);
      break;
    }

    case 'tools':
      printTools(arg);
      break;

    case 'tool':
      lookupTool(arg);
      break;

    case 'search':
    case 'find':
      searchManual(arg);
      break;

    case 'theme':
      setTheme(arg);
      break;

    case 'font':
      setFont(arg);
      break;

    case 'drill':
      location.hash = '#/drills';
      printLine('<span class="fc-ok">→ Navigating to interactive drill range...</span>');
      break;

    case 'labs':
      location.hash = '#/labs';
      printLine('<span class="fc-ok">→ Navigating to hands-on labs...</span>');
      break;

    case 'forge':
      location.hash = '#/forge';
      printLine('<span class="fc-ok">→ Navigating to forge script recipes...</span>');
      break;

    case 'bridge':
    case 'bridges':
      checkBridgeStatus();
      break;

    case 'signal':
      sendBridgeMessage('signal', arg);
      break;

    case 'simplex':
      sendBridgeMessage('simplex', arg);
      break;

    case 'matrix':
      sendBridgeMessage('matrix', arg);
      break;

    default:
      if (!lookupTool(raw)) {
        printLine(`<span class="fc-warn">command not found: "${escapeHtml(raw)}"</span>`);
        printLine('<span class="fc-dim">Type <b class="fc-cyan">help</b>, <b class="fc-cyan">scan 10.10.10.1</b>, or <b class="fc-cyan">search ${escapeHtml(raw)}</b>.</span>');
      }
      break;
  }
}

function simulatePortScan(target) {
  printLine(`<span class="fc-cyan">Starting Nmap 7.94 (https://nmap.org) at local time</span>`);
  printLine(`<span class="fc-dim">Initiating SYN Stealth Scan against ${escapeHtml(target)} (1000 ports)</span>`);

  let progress = 0;
  const line = document.createElement('div');
  line.className = 'fc-line fc-dim';
  outputEl.appendChild(line);

  const iv = setInterval(() => {
    progress += 25;
    line.innerHTML = `<span class="fc-gold">[${'='.repeat(progress / 5)}${' '.repeat(20 - progress / 5)}] ${progress}% complete</span>`;
    if (window.ZOSynth && window.ZOSynth.playKeystroke) window.ZOSynth.playKeystroke();

    if (progress >= 100) {
      clearInterval(iv);
      line.remove();
      printLine(`<span class="fc-ok">Nmap scan report for ${escapeHtml(target)}</span>`);
      printLine(`<span class="fc-dim">Host is up (0.0014s latency).</span>`);
      printLine(`<pre class="fc-ascii">PORT     STATE SERVICE     VERSION
22/tcp   open  ssh         OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http        Apache httpd 2.4.52 ((Ubuntu))
445/tcp  open  netbios-ssn Samba smbd 4.6.2
3306/tcp open  mysql       MySQL 8.0.35-0ubuntu0.22.04.1
8080/tcp open  http-proxy  Werkzeug/3.0.1 Python/3.10.12</pre>`);
      printLine(`<span class="fc-ok">✓ 5 open ports discovered. Type <b class="fc-cyan">dossier nmap</b> for syntax.</span>`);
      if (window.ZOSynth && window.ZOSynth.playBell) window.ZOSynth.playBell();
    }
  }, 100);
}

function simulateRecon(domain) {
  printLine(`<span class="fc-cyan">◈ Local Recon Pivot: ${escapeHtml(domain)}</span>`);
  printLine(`  <span class="fc-gold">DNS A:</span>      10.10.14.7`);
  printLine(`  <span class="fc-gold">DNS MX:</span>     mail.${escapeHtml(domain)} (priority 10)`);
  printLine(`  <span class="fc-gold">Subdomains:</span> api, vpn, auth, staging, git`);
  printLine(`  <span class="fc-gold">Scope Check:</span> IN-SCOPE (Local lab environment authorized)`);
  if (window.ZOSynth && window.ZOSynth.playChime) window.ZOSynth.playChime();
}

function simulateHash(str) {
  printLine(`<span class="fc-cyan">◈ Alchemical Cryptographic Hashes for: "${escapeHtml(str)}"</span>`);
  printLine(`  <b class="fc-gold">MD5:</b>    ${simpleHash(str, 16)}`);
  printLine(`  <b class="fc-gold">SHA-256:</b> ${simpleHash(str, 32)}${simpleHash(str + 'salt', 32)}`);
  if (window.ZOSynth && window.ZOSynth.playBell) window.ZOSynth.playBell();
}

function simpleHash(s, len) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let hex = (h >>> 0).toString(16).padStart(8, '0');
  while (hex.length < len) hex += hex;
  return hex.slice(0, len);
}

function scrollToTop() {
  const main = document.getElementById('main');
  const view = document.getElementById('view');
  if (main) main.scrollTop = 0;
  if (view) view.scrollTop = 0;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function printHelp() {
  printLine('<span class="fc-cyan">ZothPen Sovereign Cockpit Commands:</span>');
  printLine('  <b class="fc-gold">scan [host]</b>       Simulate SYN port scan (nmap simulation)');
  printLine('  <b class="fc-gold">recon [domain]</b>    Run local reconnaissance pivot');
  printLine('  <b class="fc-gold">hash &lt;text&gt;</b>      Generate offline alchemical cryptographic hashes');
  printLine('  <b class="fc-gold">tools [cat]</b>      List security tools by category');
  printLine('  <b class="fc-gold">dossier &lt;name&gt;</b>   Inspect cheatsheet & syntax for any tool');
  printLine('  <b class="fc-gold">azoth</b>            Switch to tty2 3D Braille Mesh stream');
  printLine('  <b class="fc-gold">agents</b>           Switch to tty3 21 Sovereign Agents matrix');
  printLine('  <b class="fc-gold">bridge</b>           Live Signal, SimpleX &amp; Matrix Bridge telemetry');
  printLine('  <b class="fc-gold">signal &lt;msg&gt;</b>     Send E2EE message to phone via Signal Bridge');
  printLine('  <b class="fc-gold">simplex &lt;msg&gt;</b>    Send metadata-free msg via SimpleX Bridge');
  printLine('  <b class="fc-gold">matrix &lt;msg&gt;</b>     Route message via SimpleX-Matrix Sovereign Relay');
  printLine('  <b class="fc-gold">ghostbyte</b>        NullAI Sovereign Mascot telemetry &amp; voice');
  printLine('  <b class="fc-gold">warp [val]</b>       Trigger 3D matrix background shockwave');
  printLine('  <b class="fc-gold">theme &lt;name&gt;</b>    green | amber | ice | magenta');
  printLine('  <b class="fc-gold">font &lt;name&gt;</b>     pixel | vt220 | terminus | jetbrains');
  printLine('  <b class="fc-gold">clear</b>            Clear buffer (Ctrl+L)');
  printLine('  <b class="fc-gold">close</b>            Dismiss console (Esc or c)');
}

function checkBridgeStatus() {
  printLine('<span class="fc-cyan">◈ Querying Sovereign Agent Bridge (:8102), Signal (:8768) &amp; SimpleX (:8767)...</span>');
  fetch('http://127.0.0.1:8102/api/channels')
    .then(r => r.json())
    .then(data => {
      const chs = data.channels || [];
      printLine(`<span class="fc-ok">✓ Sovereign Agent Bridge ONLINE (${data.healthy_count || chs.length}/${data.total_channels || chs.length} channels healthy)</span>`);
      chs.forEach(c => {
        if (['signal', 'simplex', 'matrix'].includes(c.id)) {
          const badge = c.status === 'HEALTHY' || c.status === 'ONLINE' ? '<span class="fc-ok">● ONLINE</span>' : '<span class="fc-warn">● DEGRADED</span>';
          let extra = '';
          if (c.account) extra = ` · ${escapeHtml(c.account)}`;
          if (c.contacts && c.contacts.length) extra += ` · @${escapeHtml(c.contacts.join(', @'))}`;
          if (c.relay_target) extra += ` · Relay ➔ ${escapeHtml(c.relay_target)}`;
          printLine(`  ${badge} <b class="fc-gold">${escapeHtml(c.name)}</b> <span class="fc-dim">[${escapeHtml(c.encryption)}${extra}]</span>`);
          if (c.invite_url) {
            printLine(`    <span class="fc-dim">↳ Pairing Link:</span> <code class="fc-code">${escapeHtml(c.invite_url)}</code>`);
          }
        }
      });
    })
    .catch(() => {
      printLine('<span class="fc-warn">⚠ Local bridge daemon (:8102) unreachable from browser context.</span>');
    });
}

function sendBridgeMessage(channel, text) {
  if (!text || !text.trim()) {
    checkBridgeStatus();
    printLine(`<span class="fc-dim">Usage: <b class="fc-gold">${escapeHtml(channel)} &lt;message&gt;</b> — dispatches live message to your phone via ${escapeHtml(channel.toUpperCase())} bridge.</span>`);
    return;
  }
  printLine(`<span class="fc-cyan">⚡ Dispatching via ${escapeHtml(channel.toUpperCase())} bridge...</span>`);
  fetch('http://127.0.0.1:8102/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: channel, message: text.trim(), agent_id: 'zothpen-cockpit' })
  })
    .then(r => r.json())
    .then(res => {
      printLine(`<span class="fc-ok">✓ [${escapeHtml(res.status || 'DELIVERED')}] Routed to ${escapeHtml(res.recipient || channel)} (${res.delivery_latency_ms || 12}ms)</span>`);
    })
    .catch(err => {
      printLine(`<span class="fc-warn">⚠ Bridge dispatch error: ${escapeHtml(String(err))}</span>`);
    });
}

function printAzoth() {
  if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.8);
  if (window.ZOSynth && window.ZOSynth.playFanfare) window.ZOSynth.playFanfare();

  const glyph = `
<pre class="fc-ascii">
        ⢀⣴⡿⠋⠁       ★ 7-POINTED STAR ★        ⠈⠙⢿⣦⡀
      ⣠⣾⠟⠁          ☿ AZOTH OF HERMES ☿           ⠈⠻⣷⣄
     ⣴⡿⠁       ╭────────────┴────────────╮       ⠈⢿⣦
    ⣾⡟          │ V.I.T.R.I.O.L.U.M.      │          ⢻⣷
   ⣸⡿    ⢀⣀⡀    │ Visita Interiora Terrae │    ⢀⣀⡀    ⢿⣇
   ⣿⡇   ⣰⡿⠻⣷   │ Rectificando Invenies   │   ⣾⠟⢿⣆   ⢸⣿
   ⢻⣧   ⢿⣇⣠⡿   │ Occultum Lapidem        │   ⢿⣄⣸⡿   ⣼⡟
    ⠻⣷⣄ ⠈⠉⠁    ╰────────────┬────────────╯    ⠈⠉⠁ ⣠⣾⠟
      ⠉⠛⠿⣶⣤⣀       │ KUNDALINI HELIX │       ⣀⣤⣶⠿⠛⠉
             ⠉⠉⠛⠶⣶⣤⣄ ╪ ⣠⣤⣶⠶⠛⠉⠉
</pre>`;
  printLine(glyph);
  printLine('<span class="fc-gold">Azoth 3D stream active in tab <b>tty2</b>.</span>');
}

function summonAgentInConsole(rawName) {
  const name = (rawName || 'ghostbyte').toLowerCase().replace(/[^a-z]/g, '');
  const agents = {
    ghostbyte: { name: 'GhostByte', role: 'Cryptographic Scout', quote: 'Zero egress, Operator. Your reconnaissance is sovereign and silent on your local disk.' },
    azoth: { name: 'Azoth', role: 'Alchemical Core', quote: 'Visita Interiora Terrae Rectificando Invenies Occultum Lapidem. The quintessence is primed.' },
    hermes: { name: 'Hermes', role: 'Network Topology', quote: 'Packets move like thoughts through the ether. Scan the subnet, inspect the routes, leave no trace.' },
    athena: { name: 'Athena', role: 'Aegis Defense', quote: 'The supreme defense is proactive strategy. Armor your perimeter before launching the reconnaissance strike.' },
    draco: { name: 'Draco', role: 'Protocol Dragon', quote: 'From Layer 2 ARP to Layer 7 payloads, protocol dragons bend the packets to sovereign will.' },
    kitsune: { name: 'Kitsune', role: 'Nine-Tailed Illusionist', quote: 'The human element is polymorphic. Dissect social engineering vectors with mathematical detachment.' },
    kraken: { name: 'Kraken', role: 'Packet Sniffer', quote: 'Dragging raw promiscuous traffic into the light. The abyssal deep-packet sniffer watches every handshake.' },
    antigravity: { name: 'Antigravity', role: 'Master Weaver', quote: 'Cognitive multi-agent architectures running locally. Weave high-entropy defense lattices.' },
    lycan: { name: 'Lycan', role: 'Vuln Hunter', quote: 'Scenting vulnerabilities across CIDR ranges. Automate the hunt, lock the telemetry.' },
    pixelneko: { name: 'PixelNeko', role: 'Matrix Familiar', quote: 'Batting at falling matrix rain glyphs! Purring on an encrypted local filesystem, nya.' }
  };

  const a = agents[name] || agents.ghostbyte;
  const imgPath = a.name === 'GhostByte' ? 'assets/img/ghostbyte.png' : (a.name === 'PixelNeko' ? 'assets/img/agents/pixel-neko.png' : `assets/img/agents/${name}.png`);

  if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.4);
  if (window.ZOSynth && window.ZOSynth.playChirp) window.ZOSynth.playChirp();

  printLine(`<div class="fc-ghost-bubble">
    <img src="${imgPath}" class="fc-ghost-img" alt="${a.name}">
    <div><b class="fc-cyan">${a.name} // Swarm ${a.role}:</b><br>
    <span>"${a.quote}"</span><br>
    <span class="fc-dim" style="font-size: 10px;">[ 3D holographic specimen synchronized into stream ]</span></div>
  </div>`);

  switchTab('azoth');
  const btn = document.getElementById(`fcGeom${a.name.charAt(0).toUpperCase() + a.name.slice(1)}`);
  if (btn) btn.click();
  else {
    const bGhost = document.getElementById('fcGeomGhost');
    if (bGhost) bGhost.click();
  }
}

function printGhostByte() {
  if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.2);
  if (window.ZOSynth && window.ZOSynth.playChirp) window.ZOSynth.playChirp();

  const quotes = [
    "\"Zero egress, Operator. Your reconnaissance is sovereign and silent.\"",
    "\"The terminal is not a barrier; it is the loom upon which you weave reality.\"",
    "\"21 Agents guard this citadel. No telemetry leaves this local disk.\"",
    "\"Rules of Engagement are not handcuffs; they are the chalice of legitimacy.\""
  ];
  const q = quotes[Math.floor(Math.random() * quotes.length)];

  printLine('<div class="fc-ghost-bubble">' +
    '<img src="assets/img/ghostbyte.png" class="fc-ghost-img" alt="GhostByte Mascot">' +
    '<div><b class="fc-cyan">GhostByte v2.1 // NullAI Sovereign Core:</b><br>' +
    '<span>' + q + '</span></div></div>');
}

function populateAgentsTab() {
  const container = document.getElementById('fcAgentsGrid');
  if (!container) return;

  const agents = [
    { name: 'Azoth', role: 'Alchemical Core', status: 'SYNCHRONIZED', col: '#f59e0b' },
    { name: 'GhostByte', role: 'Cryptographic Scout', status: 'OBSIDIAN_VAULT', col: '#06b6d4' },
    { name: 'Antigravity', role: 'Master Weaver', status: 'COGNITIVE_ACTIVE', col: '#10b981' },
    { name: 'Hermes', role: 'Network Topology', status: 'VELOCITY_PATROL', col: '#fbbf24' },
    { name: 'Athena', role: 'Aegis Defense', status: 'SHIELD_RESONANT', col: '#94a3b8' },
    { name: 'Grok', role: 'Pattern Breaker', status: 'TELEMETRY_SCAN', col: '#ec4899' },
    { name: 'Kai', role: 'Exploit Infiltrator', status: 'SHADOW_READY', col: '#38bdf8' },
    { name: 'Chronos', role: 'Temporal Ledger', status: 'LOGS_PARSED', col: '#6366f1' },
    { name: 'Draco', role: 'Protocol Dragon', status: 'CIRCUIT_COILED', col: '#ef4444' },
    { name: 'Ignis', role: 'Buffer Forge', status: 'FLAME_PRIMED', col: '#ea580c' },
    { name: 'Kitsune', role: 'Social Forge', status: 'ILLUSION_ARMED', col: '#f97316' },
    { name: 'Kraken', role: 'Packet Sniffer', status: 'ABYSS_LISTENING', col: '#0284c7' },
    { name: 'Leviathan', role: 'Hash Ledger', status: 'ENTROPY_LOCKED', col: '#3b82f6' },
    { name: 'Lycan', role: 'Vuln Hunter', status: 'PACK_PROWLING', col: '#10b981' },
    { name: 'Onyx', role: 'Sandboxed Bastion', status: 'ISOLATION_TOTAL', col: '#64748b' },
    { name: 'Aquila', role: 'RF / Wi-Fi Recon', status: 'SPECTRUM_WATCH', col: '#eab308' },
    { name: 'Aether', role: 'Cloud Pen', status: 'FABRIC_DECOUPLED', col: '#06b6d4' },
    { name: 'Scorpius', role: 'SQL Payload Sting', status: 'INJECTION_CALM', col: '#a855f7' },
    { name: 'PixelNeko', role: 'Matrix Familiar', status: 'PAWS_READY', col: '#c084fc' },
    { name: 'PixelShiba', role: 'Disk Watchdog', status: 'SOVEREIGN_GUARD', col: '#f59e0b' },
    { name: 'Solon', role: 'RoE Lawgiver', status: 'SCOPE_RATIFIED', col: '#10b981' }
  ];

  let html = '';
  agents.forEach(a => {
    html += `
      <div class="fc-agent-row">
        <div class="fc-agent-info">
          <span class="fc-agent-dot" style="background:${a.col};box-shadow:0 0 6px ${a.col}"></span>
          <b class="fc-agent-name">${a.name}</b>
          <span class="fc-agent-role">${a.role}</span>
        </div>
        <span class="fc-agent-status">${a.status}</span>
      </div>
    `;
  });
  container.innerHTML = html;
}

function printAgents() {
  printLine('<span class="fc-cyan">Switching to tty3 (Pantheon Citadel Matrix)...</span>');
}

function printComic(arg) {
  printLine('<span class="fc-gold">◈ OPERATOR DOWNTIME // ZOTH STUDIO COMIC CHRONICLES:</span>');
  printLine('  <b class="fc-cyan">S01E01:</b> The Singularity Breach (Cover & Pages 1-6)');
  printLine('  <b class="fc-cyan">S01E02:</b> The Hermetic Ledger (Cover & Pages 1-6)');
  printLine('  <b class="fc-cyan">S01E03:</b> The 21 Keys of Azoth (Cover & Pages 1-6)');

  let target = '#/comic';
  if (arg) {
    const a = arg.toUpperCase().trim();
    if (a.includes('1') || a.includes('E01')) target = '#/comic/S01E01';
    else if (a.includes('2') || a.includes('E02')) target = '#/comic/S01E02';
    else if (a.includes('3') || a.includes('E03')) target = '#/comic/S01E03';
  }
  printLine(`<span class="fc-ok">→ Opening Operator Downtime Lounge (${target}). Relax your mind!</span>`);
  if (window.ZO && window.ZO.go) window.ZO.go(target);
}

function printTools(catFilter) {
  const ZT = window.ZO ? window.ZO.ZT : [];
  if (!ZT || !ZT.length) {
    printLine('<span class="fc-warn">Tool registry loading...</span>');
    return;
  }
  let list = ZT;
  if (catFilter) {
    const f = catFilter.toLowerCase();
    list = list.filter(t => (t.cat && t.cat.toLowerCase().includes(f)) || (t.phase && t.phase.toLowerCase().includes(f)));
  }

  printLine(`<span class="fc-cyan">Security Tools (${list.length} available):</span>`);
  const grouped = {};
  list.forEach(t => {
    const c = t.cat || 'other';
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(t.name);
  });

  for (const [cat, tools] of Object.entries(grouped)) {
    printLine(`  <b class="fc-gold">${cat}:</b> <span class="fc-dim">${tools.join(', ')}</span>`);
  }
}

function lookupTool(name) {
  const q = (name || '').toLowerCase().trim();
  const ZT = window.ZO ? window.ZO.ZT : [];
  const ZX = window.ZO ? window.ZO.ZX : [];

  const tool = ZT.find(t => t.id === q || t.name.toLowerCase() === q);
  const cmds = ZX.filter(x => x.c.toLowerCase().startsWith(q) || (x.al && x.al.some(a => a.toLowerCase() === q)));

  if (!tool && (!cmds || cmds.length === 0)) return false;

  if (tool) {
    printLine(`<span class="fc-cyan">◈ TOOL DOSSIER: ${escapeHtml(tool.name)}</span> <span class="fc-badge">${escapeHtml(tool.cat || '')}</span>`);
    printLine(`  <span class="fc-dim">${escapeHtml(tool.tagline || '')}</span>`);
    if (tool.syntax) printLine(`  <span class="fc-ps1">syntax:</span> <code class="fc-code">${escapeHtml(tool.syntax)}</code>`);
    if (tool.pkg) printLine(`  <span class="fc-dim">package:</span> ${escapeHtml(tool.pkg)}`);
    printLine(`  <a href="#/tool/${tool.id}" class="fc-link">→ open full interactive dossier in reader</a>`);
  }

  if (cmds && cmds.length > 0) {
    printLine(`<span class="fc-gold">Indexed commands (${cmds.length}):</span>`);
    cmds.slice(0, 5).forEach(c => {
      printLine(`  <code class="fc-code">$ ${escapeHtml(c.c)}</code>`);
      printLine(`  <span class="fc-dim">  ↳ ${escapeHtml(c.what)}</span>`);
    });
  }

  return true;
}

function searchManual(query) {
  if (!query) {
    printLine('<span class="fc-warn">Usage: search &lt;keyword&gt;</span>');
    return;
  }
  const q = query.toLowerCase();
  const ZT = window.ZO ? window.ZO.ZT : [];
  const ZM = window.ZO ? window.ZO.ZM : [];
  const ZF = window.ZO ? window.ZO.ZF : [];

  const foundTools = ZT.filter(t => t.name.toLowerCase().includes(q) || (t.tagline && t.tagline.toLowerCase().includes(q)));
  const foundMods = ZM.filter(m => m.title.toLowerCase().includes(q) || (m.body && m.body.toLowerCase().includes(q)));
  const foundForge = ZF.filter(f => f.title.toLowerCase().includes(q));

  printLine(`<span class="fc-cyan">Search results for "${escapeHtml(query)}":</span>`);
  if (foundTools.length) {
    printLine(`  <b class="fc-gold">Tools:</b> ` + foundTools.slice(0, 6).map(t => `<a href="#/tool/${t.id}" class="fc-link">${escapeHtml(t.name)}</a>`).join(', '));
  }
  if (foundMods.length) {
    printLine(`  <b class="fc-gold">Modules:</b> ` + foundMods.slice(0, 4).map(m => `<a href="#/mod/${m.id}" class="fc-link">${escapeHtml(m.n)} ${escapeHtml(m.title)}</a>`).join(', '));
  }
  if (foundForge.length) {
    printLine(`  <b class="fc-gold">Forge:</b> ` + foundForge.slice(0, 4).map(f => `<a href="#/forge/${f.id}" class="fc-link">${escapeHtml(f.title)}</a>`).join(', '));
  }
  if (!foundTools.length && !foundMods.length && !foundForge.length) {
    printLine('  <span class="fc-dim">No matching entries found.</span>');
  }
}

function setTheme(theme) {
  const allowed = ['green', 'amber', 'ice', 'magenta'];
  if (!allowed.includes(theme)) {
    printLine(`<span class="fc-warn">Unknown theme. Choices: ${allowed.join(', ')}</span>`);
    return;
  }
  document.documentElement.dataset.phosphor = theme;
  try { localStorage.setItem('zothpen.phosphor', theme); } catch (e) {}
  printLine(`<span class="fc-ok">✓ Phosphor theme set to ${theme}</span>`);
}

function setFont(font) {
  const allowed = ['pixel', 'vt220', 'terminus', 'jetbrains'];
  if (!allowed.includes(font)) {
    printLine(`<span class="fc-warn">Unknown font reality. Choices: ${allowed.join(', ')}</span>`);
    return;
  }
  document.documentElement.dataset.font = font;
  try { localStorage.setItem('zothpen.font', font); } catch (e) {}
  printLine(`<span class="fc-ok">✓ Font reality set to ${font} (100% matrix mystical)</span>`);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ------------------------------------------------------------------ *
 * Global Keybindings & Button Hooks
 * ------------------------------------------------------------------ */
function bindShortcuts() {
  window.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable);

    if (e.key === 'c' && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggle();
      return;
    }

    if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggle();
      return;
    }
  });

  const topBtn = document.getElementById('floatingConsoleBtn');
  if (topBtn) {
    topBtn.onclick = (e) => {
      e.preventDefault();
      toggle();
    };
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act="open-float-console"]');
    if (btn) {
      e.preventDefault();
      open();
      const fill = btn.getAttribute('data-fill');
      if (fill && inputEl) {
        inputEl.value = fill;
        inputEl.focus();
      }
    }
  });
}

window.ZOFloatConsole = {
  init,
  open,
  close,
  toggle,
  execute,
  clear,
  switchTab
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
