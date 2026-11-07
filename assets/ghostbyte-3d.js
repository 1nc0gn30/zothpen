/**
 * ZothPen Swarm Character 3D Interactive Specimen Engine
 * Authentic 3D Voxel / Hologram Models for the Sovereign Swarm:
 * GhostByte, Azoth, Hermes, Athena, Draco, Kitsune, Kraken, Antigravity, Lycan, PixelNeko.
 * Dynamic orbital rings, 4 shader modes (Hologram, Wireframe, Chrome, Quantum),
 * cursor-tracking pupils, scanline sweep, and thermal-safe 30 FPS cap.
 */
(function (global) {
  'use strict';

  const MODES = [
    { id: 'hologram', label: 'HOLOGRAM' },
    { id: 'wireframe', label: 'WIREFRAME' },
    { id: 'chrome', label: 'CHROME PHANTOM' },
    { id: 'quantum', label: 'QUANTUM PULSE' }
  ];

  const CHAR_PALETTES = {
    ghostbyte: { accent: '#00d5ff', secondary: '#5b3df5', name: 'GhostByte', title: 'Cryptographic Scout' },
    azoth: { accent: '#f59e0b', secondary: '#d97706', name: 'Azoth', title: 'Alchemical Core' },
    hermes: { accent: '#38bdf8', secondary: '#fbbf24', name: 'Hermes', title: 'Network Topology' },
    athena: { accent: '#94a3b8', secondary: '#38bdf8', name: 'Athena', title: 'Aegis Defense' },
    draco: { accent: '#ef4444', secondary: '#f97316', name: 'Draco', title: 'Protocol Dragon' },
    kitsune: { accent: '#f97316', secondary: '#ec4899', name: 'Kitsune', title: 'Nine-Tailed Illusionist' },
    kraken: { accent: '#0284c7', secondary: '#10b981', name: 'Kraken', title: 'Packet Sniffer' },
    antigravity: { accent: '#10b981', secondary: '#00d5ff', name: 'Antigravity', title: 'Master Weaver' },
    lycan: { accent: '#10b981', secondary: '#f59e0b', name: 'Lycan', title: 'Vuln Hunter' },
    pixelneko: { accent: '#c084fc', secondary: '#ec4899', name: 'PixelNeko', title: 'Matrix Familiar' }
  };

  function hexToRgba(hex, alpha) {
    if (alpha === undefined) alpha = 1;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  }

  /* ---------------- Parametric Mesh Generators ---------------- */

  // 1. GhostByte
  function createGhostByteMesh() {
    const vertices = [], ringGrid = [];
    const rings = 30, segs = 36;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let m = 0, g = 0;
        if (c < 0.42) {
          const z = (c / 0.42) * (Math.PI * 0.5);
          m = Math.sin(z) * 0.96;
          g = -Math.cos(z) * 1.02 - 0.24;
        } else {
          const z = (c - 0.42) / 0.58;
          m = 0.96 * (1 + z * 0.16 * Math.sin(p * 5 + 0.2));
          const j = Math.cos(p * 5);
          const L = Math.max(0, Math.cos(p)) * 0.34;
          g = -0.24 + (0.82 + 0.24 * j + L) * z * 1.32;
        }
        const v = Math.sin(p) * m;
        const b = Math.cos(p) * m * 0.88;
        let feature = null;
        if (b > 0.22) {
          const P = Math.hypot((v + 0.33) * 1.05 + (g + 0.42) * 0.22, (g + 0.42) * 0.88 - (v + 0.33) * 0.18);
          const _ = Math.hypot((v - 0.33) * 1.05 - (g + 0.42) * 0.22, (g + 0.42) * 0.88 + (v - 0.33) * 0.18);
          const F = Math.abs(v) < 0.26 && Math.abs(g - (-0.04 + Math.pow(v * 1.35, 2) * 0.42)) < 0.052;
          if (P < 0.18 || _ < 0.18) feature = 'eye';
          else if (F) feature = 'mouth';
        }
        const idx = vertices.length;
        vertices.push({ x: v, y: -g * 0.9, z: b, u: p, v: c, nx: Math.sin(p), ny: 0, nz: Math.cos(p), feature, seed: (s * 31 + f * 11) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 2. Azoth (Alchemical Core)
  function createAzothMesh() {
    const vertices = [], ringGrid = [];
    const rings = 24, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const phi = (s / rings) * Math.PI;
      const ring = [];
      const r = Math.sin(phi) * 0.85;
      const y = Math.cos(phi) * 0.85;
      for (let f = 0; f < segs; f++) {
        const theta = (f / segs) * Math.PI * 2;
        let x = Math.cos(theta) * r;
        let z = Math.sin(theta) * r;
        let feature = null;
        // Alchemical heptagram rays radiating from equator
        if (Math.abs(s - rings / 2) < 3) {
          const ray = Math.pow(Math.cos(theta * 3.5), 8) * 0.45;
          x += Math.cos(theta) * ray;
          z += Math.sin(theta) * ray;
          if (ray > 0.2) feature = 'core';
        }
        if (Math.abs(y) > 0.72) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: theta, v: s / rings, nx: x, ny: y, nz: z, feature, seed: (s * 37 + f * 17) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 3. Hermes (Winged Helm)
  function createHermesMesh() {
    const vertices = [], ringGrid = [];
    const rings = 26, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const phi = c * Math.PI;
      const rad = Math.sin(phi) * 0.85;
      const y = Math.cos(phi) * 0.95;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let x = Math.cos(p) * rad;
        let z = Math.sin(p) * rad * 1.1;
        let feature = null;
        // Aerodynamic wings on lateral sides
        if (c > 0.25 && c < 0.75 && Math.abs(Math.cos(p)) > 0.7) {
          const wingSpread = (1 - Math.abs(c - 0.5) * 3) * 0.55;
          x += Math.sign(x) * wingSpread;
          z -= wingSpread * 0.45;
          feature = 'wing';
        }
        if (z > 0.62 && Math.abs(y - 0.1) < 0.12 && Math.abs(x) < 0.45) {
          feature = 'eye';
        }
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 29 + f * 13) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 4. Athena (Aegis Crested Helm)
  function createAthenaMesh() {
    const vertices = [], ringGrid = [];
    const rings = 26, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const phi = c * Math.PI;
      const rad = Math.sin(phi) * 0.88;
      let y = Math.cos(phi) * 0.92;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let x = Math.cos(p) * rad;
        let z = Math.sin(p) * rad;
        let feature = null;
        // Crest fin along the top
        if (Math.abs(x) < 0.14 && y > 0.15) {
          y += 0.35 * Math.sin(c * Math.PI);
          feature = 'core';
        }
        // Aegis shield on the left side
        if (x < -0.7 && Math.abs(y) < 0.45 && z > -0.2) {
          x -= 0.24;
          feature = 'wing';
        }
        if (z > 0.65 && Math.abs(y - 0.05) < 0.08 && Math.abs(x) < 0.5) {
          feature = 'eye';
        }
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 33 + f * 19) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 5. Draco (Protocol Dragon)
  function createDracoMesh() {
    const vertices = [], ringGrid = [];
    const rings = 28, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const rad = Math.sin(c * Math.PI * 0.85) * (0.85 - c * 0.35);
      let y = 0.9 - c * 1.8;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let x = Math.cos(p) * rad;
        let z = Math.sin(p) * rad;
        let feature = null;
        if (c > 0.2 && c < 0.6 && z > 0) z *= 1.45; // snout
        if (c < 0.25 && Math.abs(x) > 0.25 && z < 0) { // horns
          y += 0.45 * (1 - c * 4);
          x += Math.sign(x) * 0.2;
          z -= 0.35 * (1 - c * 4);
          feature = 'core';
        }
        if (c > 0.25 && c < 0.42 && z > 0.45 && Math.abs(x) > 0.2) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 23 + f * 17) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 6. Kitsune (Nine-Tailed Illusionist)
  function createKitsuneMesh() {
    const vertices = [], ringGrid = [];
    const rings = 26, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const phi = c * Math.PI;
      const rad = Math.sin(phi) * 0.82;
      let y = Math.cos(phi) * 0.88;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let x = Math.cos(p) * rad;
        let z = Math.sin(p) * rad;
        let feature = null;
        if (c < 0.28 && Math.abs(x) > 0.22 && z < 0.1) { // Fox ears
          y += 0.42 * (1 - c * 3.5);
          x += Math.sign(x) * 0.15;
          feature = 'core';
        }
        if (c > 0.55 && z < -0.2) { // 9 tails
          const tailIdx = Math.floor(((p + Math.PI) / (Math.PI * 2)) * 9);
          const wave = Math.sin(tailIdx * 0.7) * 0.35;
          x += wave;
          z -= (c - 0.55) * 0.8;
          y -= (c - 0.55) * 0.4;
          feature = 'wing';
        }
        if (z > 0.55 && Math.abs(y - 0.08) < 0.1 && Math.abs(x) > 0.18 && Math.abs(x) < 0.42) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 31 + f * 19) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 7. Kraken (Abyssal Sniffer)
  function createKrakenMesh() {
    const vertices = [], ringGrid = [];
    const rings = 28, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let rad = 0, y = 0, x = 0, z = 0, feature = null;
        if (c < 0.45) {
          const phi = (c / 0.45) * (Math.PI * 0.5);
          rad = Math.sin(phi) * 0.92;
          y = 0.95 - (1 - Math.cos(phi)) * 0.95;
          x = Math.cos(p) * rad;
          z = Math.sin(p) * rad;
        } else {
          const tProgress = (c - 0.45) / 0.55;
          const tentacleNum = Math.floor((p / (Math.PI * 2)) * 8);
          const baseAng = (tentacleNum / 8) * Math.PI * 2;
          rad = 0.85 * (1 - tProgress * 0.6);
          y = 0.0 - tProgress * 1.1;
          x = Math.cos(baseAng) * rad;
          z = Math.sin(baseAng) * rad;
          feature = 'wing';
        }
        if (c > 0.35 && c < 0.50 && Math.abs(x) < 0.22 && z > 0.55) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 37 + f * 23) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 8. Antigravity (Tesseract Gimbal)
  function createAntigravityMesh() {
    const vertices = [], ringGrid = [];
    const rings = 24, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const phi = c * Math.PI;
      const rad = Math.sin(phi) * 0.85;
      const y = Math.cos(phi) * 0.85;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        const x = Math.cos(p) * rad;
        const z = Math.sin(p) * rad;
        let feature = null;
        if (Math.abs(y) < 0.06 || Math.abs(x) < 0.06 || Math.abs(z) < 0.06) feature = 'core';
        if (Math.abs(Math.abs(x) - 0.45) < 0.08 && Math.abs(Math.abs(y) - 0.45) < 0.08 && Math.abs(Math.abs(z) - 0.45) < 0.08) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 41 + f * 17) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 9. Lycan (Cyber-Wolf)
  function createLycanMesh() {
    const vertices = [], ringGrid = [];
    const rings = 26, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const phi = c * Math.PI;
      const rad = Math.sin(phi) * 0.85;
      let y = Math.cos(phi) * 0.88;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let x = Math.cos(p) * rad;
        let z = Math.sin(p) * rad;
        let feature = null;
        if (c < 0.3 && Math.abs(x) > 0.28 && z < 0.1) { // lupine ears
          y += 0.48 * (1 - c * 3.3);
          x += Math.sign(x) * 0.18;
          feature = 'core';
        }
        if (c > 0.35 && c < 0.75 && z > 0.2) z += 0.38 * Math.sin((c - 0.35) * 7.8); // muzzle
        if (z > 0.55 && Math.abs(y - 0.12) < 0.1 && Math.abs(x) > 0.22 && Math.abs(x) < 0.45) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 31 + f * 13) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  // 10. PixelNeko (Chibi Matrix Cat)
  function createPixelNekoMesh() {
    const vertices = [], ringGrid = [];
    const rings = 26, segs = 32;
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      const phi = c * Math.PI;
      const rad = Math.sin(phi) * 0.86;
      let y = Math.cos(phi) * 0.82;
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let x = Math.cos(p) * rad;
        let z = Math.sin(p) * rad;
        let feature = null;
        if (c < 0.3 && Math.abs(x) > 0.25 && z < 0.2) { // cat ears
          y += 0.38 * (1 - c * 3.3);
          x += Math.sign(x) * 0.12;
          feature = 'core';
        }
        if (c > 0.75 && x > 0.2 && z < -0.3) { // tail
          x += 0.35 * Math.sin(c * 10);
          y += 0.45 * (c - 0.75) * 4;
          feature = 'wing';
        }
        if (z > 0.58 && Math.abs(y - 0.05) < 0.12 && Math.abs(x) > 0.2 && Math.abs(x) < 0.44) feature = 'eye';
        const idx = vertices.length;
        vertices.push({ x, y, z, u: p, v: c, nx: x, ny: y, nz: z, feature, seed: (s * 37 + f * 11) % 100 });
        ring.push(idx);
      }
      ringGrid.push(ring);
    }
    return { vertices, ringGrid, rings, segs };
  }

  const GENERATORS = {
    ghostbyte: createGhostByteMesh,
    azoth: createAzothMesh,
    hermes: createHermesMesh,
    athena: createAthenaMesh,
    draco: createDracoMesh,
    kitsune: createKitsuneMesh,
    kraken: createKrakenMesh,
    antigravity: createAntigravityMesh,
    lycan: createLycanMesh,
    pixelneko: createPixelNekoMesh
  };

  class Swarm3DViewer {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        character: 'ghostbyte',
        mode: 'hologram',
        autoSpin: true,
        fpsCap: 30
      }, options);

      this.character = this.opts.character;
      this.mode = this.opts.mode;
      this.autoSpin = this.opts.autoSpin;
      this.mesh = (GENERATORS[this.character] || GENERATORS.ghostbyte)();

      this.running = false;
      this.animId = null;
      this.lastFrameTime = 0;
      this.frameInterval = 1000 / this.opts.fpsCap;

      this.startTime = performance.now();
      this.drag = {
        dragging: false,
        lastX: 0,
        lastY: 0,
        yaw: 0.32,
        pitch: -0.08,
        targetYaw: 0.32,
        targetPitch: -0.08,
        cursorX: 0,
        cursorY: 0
      };

      this._bindEvents();
    }

    _bindEvents() {
      const c = this.canvas;

      c.addEventListener('pointerdown', (e) => {
        this.drag.dragging = true;
        this.drag.lastX = e.clientX;
        this.drag.lastY = e.clientY;
        if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
      });

      window.addEventListener('pointermove', (e) => {
        const rect = c.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          this.drag.cursorX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
          this.drag.cursorY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
        }
        if (this.drag.dragging) {
          const dx = e.clientX - this.drag.lastX;
          const dy = e.clientY - this.drag.lastY;
          this.drag.targetYaw += dx * 0.01;
          this.drag.targetPitch = Math.max(-1.15, Math.min(1.15, this.drag.targetPitch - dy * 0.01));
          this.drag.lastX = e.clientX;
          this.drag.lastY = e.clientY;
        }
      });

      const endDrag = (e) => {
        if (this.drag.dragging) {
          this.drag.dragging = false;
          if (c.releasePointerCapture && e.pointerId) {
            try { c.releasePointerCapture(e.pointerId); } catch (_) {}
          }
        }
      };

      c.addEventListener('pointerup', endDrag);
      c.addEventListener('pointercancel', endDrag);
      c.addEventListener('pointerleave', () => {
        if (!this.drag.dragging) {
          this.drag.cursorX = 0;
          this.drag.cursorY = 0;
        }
      });
    }

    setCharacter(charId) {
      const id = (charId || '').toLowerCase().replace(/[^a-z]/g, '');
      if (GENERATORS[id]) {
        this.character = id;
        this.mesh = GENERATORS[id]();
      }
    }

    setMode(modeId) {
      if (MODES.some(m => m.id === modeId)) {
        this.mode = modeId;
      }
    }

    resetView() {
      this.drag.targetYaw = 0.32;
      this.drag.targetPitch = -0.08;
      this.drag.cursorX = 0;
      this.drag.cursorY = 0;
    }

    toggleAutoSpin() {
      this.autoSpin = !this.autoSpin;
      return this.autoSpin;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastFrameTime = performance.now();
      const loop = (t) => {
        if (!this.running) return;
        this.animId = requestAnimationFrame(loop);

        if (document.hidden) return;
        const elapsed = t - this.lastFrameTime;
        if (elapsed < this.frameInterval) return;
        this.lastFrameTime = t - (elapsed % this.frameInterval);

        this.render(t);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    render(timestamp) {
      const c = this.canvas;
      const ctx = this.ctx;
      if (!c || !ctx) return;

      const rect = c.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.bottom < -100 || rect.top > (window.innerHeight || 800) + 100) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(260, Math.floor(rect.width));
      const H = Math.max(260, Math.floor(rect.height));

      if (c.width !== W * dpr || c.height !== H * dpr) {
        c.width = W * dpr;
        c.height = H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background Fill
      ctx.fillStyle = '#04070e';
      ctx.fillRect(0, 0, W, H);

      const pal = CHAR_PALETTES[this.character] || CHAR_PALETTES.ghostbyte;
      const U = (timestamp - this.startTime) * 0.001;

      // Radial Core Glow
      const glow = ctx.createRadialGradient(W * 0.5, H * 0.46, 12, W * 0.5, H * 0.5, W * 0.62);
      glow.addColorStop(0, hexToRgba(pal.accent, 0.22));
      glow.addColorStop(0.45, hexToRgba(pal.secondary, 0.10));
      glow.addColorStop(1, 'rgba(4, 7, 14, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Auto-Orbit Drift
      if (this.autoSpin && !this.drag.dragging) {
        this.drag.targetYaw = Math.sin(U * 0.95) * 0.52 + Math.cos(U * 0.4) * 0.15;
        this.drag.targetPitch = Math.sin(U * 1.2) * 0.1;
      }
      this.drag.yaw += (this.drag.targetYaw - this.drag.yaw) * 0.12;
      this.drag.pitch += (this.drag.targetPitch - this.drag.pitch) * 0.12;

      const N = Math.cos(this.drag.yaw);
      const H_sin = Math.sin(this.drag.yaw);
      const at = Math.cos(this.drag.pitch);
      const st = Math.sin(this.drag.pitch);
      const ft = Math.sin(U * 2.3) * 0.065;
      const k = 3.15;
      const Y = Math.min(W, H) * 0.88;

      // 1. Concentric / Gimbal Orbital Rings
      const ringCount = this.character === 'antigravity' ? 3 : 2;
      for (let wt = 0; wt < ringCount; wt++) {
        const dt = wt === 0 ? 1.15 : (wt === 1 ? 1.48 : 1.75);
        const spinSpeed = wt === 0 ? 1.1 : (wt === 1 ? -0.8 : 0.6);
        ctx.beginPath();
        for (let Et = 0; Et <= Math.PI * 2 + 0.08; Et += 0.12) {
          let jt = Math.cos(Et + U * spinSpeed) * dt;
          let xt = Math.sin(Et + U * spinSpeed) * dt;
          let It = 1.22 + Math.sin(Et * 3 + U * 2) * 0.03;
          if (wt === 2) { // 3rd orthogonal ring for Antigravity
            const tmp = jt; jt = It; It = tmp;
          }
          const Bt = It * at - xt * st;
          const Wt = It * st + xt * at + k;
          const Xt = W * 0.5 + (jt / Wt) * Y;
          const Ce = H * 0.48 + (Bt / Wt) * Y;
          if (Et === 0) ctx.moveTo(Xt, Ce);
          else ctx.lineTo(Xt, Ce);
        }
        ctx.strokeStyle = hexToRgba(wt === 0 ? pal.accent : pal.secondary, 0.35);
        ctx.lineWidth = wt === 0 ? 1.5 : 1;
        ctx.stroke();
      }

      // 2. Vertex Projection & Dynamic Wave Motion
      const { vertices: lt, ringGrid: ct, rings: pt, segs: ut } = this.mesh;
      const gt = new Array(lt.length);

      for (let wt = 0; wt < lt.length; wt++) {
        const dt = lt[wt];
        // Dynamic wave motion depending on character anatomy
        let waveX = 0, waveY = 0;
        if (this.character === 'kraken' && dt.feature === 'wing') {
          // Tentacle wave
          waveX = Math.sin(U * 3 + dt.v * 6) * 0.12;
          waveY = Math.cos(U * 2.5 + dt.u * 3) * 0.08;
        } else if (this.character === 'kitsune' && dt.feature === 'wing') {
          // Tail ribbon wave
          waveX = Math.sin(U * 2.2 + dt.u * 4) * 0.14;
        } else if (this.character === 'ghostbyte') {
          const Et = dt.v > 0.38 ? (dt.v - 0.38) / 0.62 : 0;
          waveX = Et * Math.cos(U * 2.6 + dt.v * 3) * 0.04;
          waveY = Et * Math.cos(dt.u * 3 - U * 3.4) * 0.04;
        }

        const It = this.mode === 'quantum' ? 1 + Math.sin(U * 3 + dt.seed * 0.2) * 0.08 : 1;
        let Bt = (dt.x + waveX) * It;
        let Gt = (dt.y + ft + waveY) * It;
        let Wt = dt.z * It;
        const Xt = dt.feature;

        // Eye pupil tracking
        if (Xt === 'eye') {
          Bt += this.drag.cursorX * 0.04;
          Gt -= this.drag.cursorY * 0.04;
        }

        const Ce = Bt * N + Wt * H_sin;
        const vt = -Bt * H_sin + Wt * N;
        const fi = Gt * at - vt * st;
        const fe = Gt * st + vt * at;
        const di = dt.nx * N + dt.nz * H_sin;
        const Te = -dt.nx * H_sin + dt.nz * N;
        const Ft = dt.ny * st + Te * at;
        const de = fe + k;
        const Pe = W * 0.5 + (Ce / de) * Y;
        const _n = H * 0.48 - (fi / de) * Y;
        const Qe = Math.pow(1 - Math.min(1, Math.abs(Ft)), 1.65);
        const Ii = Math.pow(Math.max(0, di * 0.45 - dt.ny * 0.45 + Ft * 0.75), 10);

        gt[wt] = {
          sx: Pe,
          sy: _n,
          z: fe,
          fresnel: Qe,
          spec: Ii,
          feature: Xt,
          v: dt.v,
          seed: dt.seed
        };
      }

      // 3. Wireframe Topology (Hologram / Wireframe Modes)
      if (this.mode === 'wireframe' || this.mode === 'hologram') {
        ctx.lineWidth = this.mode === 'wireframe' ? 0.95 : 0.45;
        ctx.strokeStyle = hexToRgba(pal.accent, this.mode === 'wireframe' ? 0.42 : 0.14);

        for (let wt = 0; wt <= pt; wt += 2) {
          ctx.beginPath();
          for (let dt = 0; dt <= ut; dt += 2) {
            const Et = ct[wt][dt % ut];
            const jt = gt[Et];
            if (dt === 0) ctx.moveTo(jt.sx, jt.sy);
            else ctx.lineTo(jt.sx, jt.sy);
          }
          ctx.stroke();
        }

        for (let wt = 0; wt < ut; wt += 4) {
          ctx.beginPath();
          for (let dt = 0; dt <= pt; dt += 2) {
            const Et = ct[dt][wt];
            const jt = gt[Et];
            if (dt === 0) ctx.moveTo(jt.sx, jt.sy);
            else ctx.lineTo(jt.sx, jt.sy);
          }
          ctx.stroke();
        }
      }

      // 4. Sorted Voxels (Depth Sort / Painter's Algorithm)
      const Lt = gt.slice().sort((a, b) => a.z - b.z);
      for (let wt = 0; wt < Lt.length; wt++) {
        const dt = Lt[wt];
        if (dt.feature === 'eye' || dt.feature === 'mouth') {
          ctx.fillStyle = '#050b1c';
          ctx.beginPath();
          ctx.arc(dt.sx, dt.sy, 3.6, 0, Math.PI * 2);
          ctx.fill();
          if (dt.feature === 'eye' && dt.seed % 11 === 0) {
            ctx.fillStyle = pal.accent;
            ctx.beginPath();
            ctx.arc(dt.sx + this.drag.cursorX * 2, dt.sy + this.drag.cursorY * 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          continue;
        }

        const Et = dt.fresnel;
        const jt = this.mode === 'wireframe' ? 1.3 + Et * 1.4 : 1.85 + Et * 2.1;

        if (this.mode === 'chrome') {
          const xt = Math.min(255, Math.round(32 + Et * 180 + dt.spec * 220));
          ctx.fillStyle = 'rgba(' + xt + ', ' + Math.min(255, xt + 18) + ', 255, ' + (0.42 + Et * 0.52) + ')';
        } else if (this.mode === 'quantum') {
          ctx.fillStyle = Et > 0.52 ? pal.accent : pal.secondary;
          ctx.globalAlpha = 0.35 + Et * 0.6;
        } else {
          // Signature Character Palette Tints
          if (dt.feature === 'core' || dt.feature === 'wing') {
            ctx.fillStyle = pal.accent;
            ctx.globalAlpha = 0.55 + Et * 0.45;
          } else {
            const col1 = parseInt(pal.accent.slice(1, 3), 16) || 0;
            const col2 = parseInt(pal.accent.slice(3, 5), 16) || 213;
            const col3 = parseInt(pal.accent.slice(5, 7), 16) || 255;
            const xt = Math.round(col1 * (0.2 + Et * 0.8));
            const It = Math.round(col2 * (0.2 + Et * 0.8));
            const Bt = Math.round(col3 * (0.2 + Et * 0.8));
            ctx.fillStyle = 'rgba(' + xt + ', ' + It + ', ' + Bt + ', ' + (0.38 + Et * 0.58) + ')';
          }
        }

        ctx.beginPath();
        ctx.arc(dt.sx, dt.sy, jt, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 5. Scanline Sweep Beam
      const kt = (U * 95) % H;
      const ze = ctx.createLinearGradient(0, kt - 18, 0, kt + 18);
      ze.addColorStop(0, 'rgba(0, 213, 255, 0)');
      ze.addColorStop(0.5, hexToRgba(pal.accent, 0.12));
      ze.addColorStop(1, 'rgba(0, 213, 255, 0)');
      ctx.fillStyle = ze;
      ctx.fillRect(0, kt - 18, W, 36);

      ctx.restore();
    }
  }

  // Global registry
  const instances = new Map();

  global.ZOGhostByte3D = {
    MODES: MODES,
    CHAR_PALETTES: CHAR_PALETTES,
    CHARACTERS: Object.keys(GENERATORS),
    create(canvasOrId, options) {
      const c = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
      if (!c) return null;
      if (instances.has(c)) {
        instances.get(c).stop();
      }
      const viewer = new Swarm3DViewer(c, options);
      instances.set(c, viewer);
      return viewer;
    },
    get(c) {
      return instances.get(c);
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
