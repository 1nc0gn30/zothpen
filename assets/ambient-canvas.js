/* ==========================================================================
   ZothPen — Ambient 3D Matrix Canvas: Pixel Wizards, Arcane Portals & Parallax
   Inspired by @teknium's Uncommon Web (webdev.teknium.io) & Hermetic Cybernetics
   Zero external dependencies. Pure 2D Canvas with 3D Depth & Gravitational Trails.
   ========================================================================== */
(function () {
'use strict';

let canvas = document.getElementById('bg-canvas');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
}

let ctx = null;
let width = 0, height = 0, dpr = 1;
let animId = null;
let active = true;

// 3D Parallax Camera & Warp State
const camera = {
  x: 0,
  y: 0,
  z: 0,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  warp: 0,           // Impulse speed on question answer / scroll
  scrollOffset: 0,
  targetScroll: 0
};

// Shockwave rings emitted on question complete / warp
const shockwaves = [];

// Pointer physics with smooth inertia
const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.35,
  targetX: window.innerWidth * 0.5,
  targetY: window.innerHeight * 0.35,
  active: false,
  vx: 0,
  vy: 0
};

// 4x4 Bayer Dither Matrix
const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16]
];

// Single-character Matrix & Sacred Math Glyphs
const MATRIX_GLYPHS = [
  'ｦ', 'ｱ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', 'ﾀ', 'ﾂ', 'ﾃ', 'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾊ', 'ﾋ', 'ﾎ', 'ﾏ', 'ﾐ', 'ﾑ', 'ﾒ', 'ﾓ', 'ﾔ', 'ﾕ', 'ﾗ', 'ﾘ', 'ﾜ',
  'Δ', 'Σ', 'Ω', 'Ψ', 'λ', 'π', 'θ', 'φ', 'ξ', 'ζ', '☿', '⬡', '⬢', '◈', '▚', '※', '§', '★',
  '🜍', '🜔', '☉', '☽', '🜂', '🜄', '🜁', '🜃',
  '0', '1', '7', '9', 'X', 'Z', 'K', 'V', 'R', 'F', '*', '+', '<', '>', '#', '%', '&', '='
];

const HERMETIC_SYMBOLS = ['☿', '🜍', '🜔', '☉', '☽', '🜂', '🜄', '◈', '⬡', '★', '⬢', 'Ψ', 'Σ', 'Ω'];

// Matrix Rain Columns
let matrixStreams = [];
const MATRIX_FONT_SIZE = 13;
const STREAM_SPACING = 24;

function initMatrixStreams() {
  const colCount = Math.floor(width / STREAM_SPACING);
  matrixStreams = [];
  for (let c = 0; c < colCount; c++) {
    const len = Math.floor(Math.random() * 16) + 10;
    const chars = [];
    for (let k = 0; k < len; k++) {
      chars.push(MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)]);
    }
    matrixStreams.push({
      baseX: c * STREAM_SPACING + (Math.random() * 8 - 4),
      y: Math.random() * -height * 1.5,
      speed: Math.random() * 1.8 + 1.2,
      len: len,
      chars: chars,
      mutateTimer: 0
    });
  }
}

// 3D Mana Sparks & Orbiting Trail Particles
let manaParticles = [];

function initManaParticles() {
  manaParticles = [];
  const count = 55;
  for (let i = 0; i < count; i++) {
    manaParticles.push({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 400,
      z: Math.random() * 800 + 100,
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 140 + 20,
      speed: (Math.random() * 0.03 + 0.015) * (Math.random() < 0.5 ? 1 : -1),
      char: MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)],
      alpha: Math.random() * 0.6 + 0.3,
      size: Math.random() * 3 + 2
    });
  }
}

// Floating ambient occult runes
let particles = [];
function initParticles() {
  particles = [];
  const count = Math.min(45, Math.floor((width * height) / 24000));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      glyph: HERMETIC_SYMBOLS[Math.floor(Math.random() * HERMETIC_SYMBOLS.length)],
      alpha: Math.random() * 0.2 + 0.08,
      size: Math.floor(Math.random() * 5) + 12
    });
  }
}

/* ---------------- Contextual Scene Routing ---------------- */
function getSceneType() {
  const hash = (location.hash || '#/home').toLowerCase();
  if (hash.startsWith('#/mod')) return 'mod';
  if (hash.startsWith('#/tool')) return 'tools';
  if (hash.startsWith('#/lab')) return 'labs';
  if (hash.startsWith('#/drill')) return 'drills';
  if (hash.startsWith('#/forge')) return 'forge';
  if (hash.startsWith('#/progress')) return 'progress';
  if (hash.startsWith('#/console')) return 'console';
  if (hash.startsWith('#/map')) return 'map';
  return 'home';
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  if (ctx) ctx.scale(dpr, dpr);
  initMatrixStreams();
  initManaParticles();
  initParticles();
}

function onPointerMove(e) {
  pointer.vx = e.clientX - pointer.targetX;
  pointer.vy = e.clientY - pointer.targetY;
  pointer.targetX = e.clientX;
  pointer.targetY = e.clientY;
  pointer.active = true;

  // Subtle parallax tilt
  camera.targetX = (e.clientX - width * 0.5) * 0.08;
  camera.targetY = (e.clientY - height * 0.5) * 0.08;
}

function onPointerLeave() {
  pointer.active = false;
  pointer.targetX = width * 0.5;
  pointer.targetY = height * 0.35;
  camera.targetX = 0;
  camera.targetY = 0;
}

// Global Warp Pulse Trigger
window.ZO_BG_WARP = function (intensity = 1.0) {
  camera.warp += intensity * 18;
  const scene = getSceneType();
  const portalPos = getPortalPosition(scene);
  shockwaves.push({
    x: portalPos.x,
    y: portalPos.y,
    radius: 10,
    maxRadius: Math.min(width, height) * 0.55,
    speed: 8 * intensity,
    alpha: 0.95
  });
};

// Wire scroll parallax on main content area
let lastScrollTop = 0;
function bindScrollParallax() {
  const main = document.getElementById('main') || window;
  const onScroll = () => {
    const st = (main === window ? window.scrollY : main.scrollTop) || 0;
    camera.targetScroll = st;
    const delta = Math.abs(st - lastScrollTop);
    if (delta > 3) {
      camera.warp += Math.min(2.5, delta * 0.04);
    }
    lastScrollTop = st;
  };
  main.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------- Scene Geometric Anchor Points ---------------- */
function getPortalPosition(scene) {
  const isMobile = width < 768;
  const baseW = isMobile ? width * 0.5 : width * 0.74;
  const baseH = isMobile ? height * 0.65 : height * 0.52;

  switch (scene) {
    case 'mod':
      return { x: isMobile ? width * 0.5 : width * 0.76, y: height * 0.48, scale: 1.1 };
    case 'tools':
      return { x: isMobile ? width * 0.5 : width * 0.72, y: height * 0.50, scale: 1.25 };
    case 'labs':
      return { x: isMobile ? width * 0.5 : width * 0.70, y: height * 0.54, scale: 1.0 };
    case 'drills':
      return { x: isMobile ? width * 0.5 : width * 0.68, y: height * 0.46, scale: 1.3 };
    case 'forge':
      return { x: isMobile ? width * 0.5 : width * 0.74, y: height * 0.56, scale: 1.15 };
    case 'progress':
      return { x: isMobile ? width * 0.5 : width * 0.70, y: height * 0.45, scale: 1.35 };
    case 'console':
    case 'map':
      return { x: isMobile ? width * 0.5 : width * 0.50, y: height * 0.50, scale: 1.4 };
    default: // home
      return { x: baseW, y: baseH, scale: 1.2 };
  }
}

function getWizardPosition(scene, portalPos) {
  switch (scene) {
    case 'mod':
      return { x: portalPos.x - 110, y: portalPos.y + 40, scale: 1.0 };
    case 'tools':
      return { x: portalPos.x - 130, y: portalPos.y + 50, scale: 1.05 };
    case 'drills':
      return { x: portalPos.x - 140, y: portalPos.y + 60, scale: 1.15 };
    case 'labs':
      return { x: portalPos.x - 120, y: portalPos.y + 35, scale: 0.95 };
    case 'forge':
      return { x: portalPos.x - 105, y: portalPos.y + 45, scale: 1.0 };
    case 'progress':
      return { x: portalPos.x, y: portalPos.y + 55, scale: 1.2 };
    case 'console':
    case 'map':
      return { x: portalPos.x - 150, y: portalPos.y + 70, scale: 0.9 };
    default: // home
      return { x: portalPos.x - 125, y: portalPos.y + 45, scale: 1.1 };
  }
}

/* ---------------- 3D Pixel Wizard Renderer ---------------- */
/**
 * Renders a crisp 16-bit cyber wizard directly on the 2D canvas
 * with integer pixel scaling and dynamic staff/eye lighting.
 */
function renderPixelWizard(x, y, scale, time, theme) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const px = Math.max(2, Math.round(2 * scale));
  const breathe = Math.sin(time * 0.003) * (px * 0.8);

  const colRobe = theme.dim;
  const colBright = theme.bright;
  const colCore = '#ffffff';

  // Helper to draw a pixel block [x, y, w, h] in grid units
  const drawPx = (gx, gy, gw, gh, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(gx * px, (gy * px) + breathe, gw * px, gh * px);
  };

  // 1. Wizard Robe & Body
  drawPx(0, 8, 7, 10, colRobe);
  drawPx(-1, 14, 9, 5, colRobe);
  drawPx(-2, 17, 11, 3, colRobe);
  drawPx(1, 10, 5, 8, colBright);

  // 2. Wizard Face & Beard
  drawPx(2, 4, 4, 3, '#ffffff');
  drawPx(2, 7, 3, 5, '#e2e8f0'); // Cascading beard

  // Glowing Eye
  const eyeBlink = Math.sin(time * 0.002) > 0.96 ? colRobe : colCore;
  drawPx(4, 4, 1, 1, eyeBlink);

  // 3. Pointed Wizard Hat
  drawPx(0, 3, 8, 1, colRobe);   // Brim
  drawPx(1, 1, 6, 2, colBright); // Hat crown
  drawPx(2, -1, 4, 2, colRobe);
  drawPx(3, -3, 2, 2, colBright);
  drawPx(4, -4, 1, 1, colCore);  // Tip

  // 4. Extended Casting Arm
  drawPx(5, 7, 5, 2, colRobe);

  // 5. Magic Staff
  drawPx(10, -2, 1, 22, colBright);
  // Crystal Orb Head (pulsing)
  const staffGlow = Math.sin(time * 0.006) * 0.3 + 0.7;
  drawPx(9, -5, 3, 3, colCore);
  drawPx(10, -4, 1, 1, eyeBlink);

  // Aura around staff head
  ctx.fillStyle = theme.glow;
  ctx.beginPath();
  ctx.arc((10.5 * px), (-3.5 * px) + breathe, 14 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Return staff tip world coordinate for beam targeting
  return {
    tipX: x + 10.5 * px,
    tipY: y + (-3.5 * px) + breathe
  };
}

/* ---------------- 3D Arcane Portal Renderer ---------------- */
/**
 * Renders a 3D stone portal archway with a swirling event horizon vortex.
 */
function renderArcanePortal(x, y, scale, time, theme, scene) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const pSize = Math.round(50 * scale);
  const vTime = time * 0.002;

  // 1. Stone Archway Pillars
  ctx.fillStyle = theme.stone;
  // Left Pillar
  ctx.fillRect(-pSize * 0.8, -pSize * 1.1, pSize * 0.22, pSize * 2.2);
  // Right Pillar
  ctx.fillRect(pSize * 0.58, -pSize * 1.1, pSize * 0.22, pSize * 2.2);
  // Top Arch Keystone
  ctx.fillRect(-pSize * 0.85, -pSize * 1.25, pSize * 1.7, pSize * 0.22);
  ctx.fillRect(-pSize * 0.45, -pSize * 1.4, pSize * 0.9, pSize * 0.18);

  // Glowing Carved Runes on Pillars
  const runePulse = Math.sin(time * 0.004) * 0.3 + 0.7;
  ctx.fillStyle = theme.bright;
  ctx.globalAlpha = runePulse;
  // Left pillar runes
  ctx.fillRect(-pSize * 0.73, -pSize * 0.6, pSize * 0.08, pSize * 0.15);
  ctx.fillRect(-pSize * 0.73, -pSize * 0.1, pSize * 0.08, pSize * 0.12);
  ctx.fillRect(-pSize * 0.73, pSize * 0.4, pSize * 0.08, pSize * 0.15);
  // Right pillar runes
  ctx.fillRect(pSize * 0.65, -pSize * 0.5, pSize * 0.08, pSize * 0.15);
  ctx.fillRect(pSize * 0.65, 0, pSize * 0.08, pSize * 0.12);
  ctx.fillRect(pSize * 0.65, pSize * 0.5, pSize * 0.08, pSize * 0.15);
  ctx.globalAlpha = 1.0;

  // 2. Swirling Event Horizon Vortex (3D Rotating Ellipses)
  const ellipseCount = 6;
  for (let i = 0; i < ellipseCount; i++) {
    const radX = (pSize * 0.68) * (1 - i * 0.14);
    const radY = (pSize * 1.0) * (1 - i * 0.12);
    const rot = vTime * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.2);

    ctx.save();
    ctx.rotate(rot);
    ctx.lineWidth = Math.max(1.5, 2.5 * scale - i * 0.3);
    ctx.strokeStyle = i === ellipseCount - 1 ? '#ffffff' : theme.dim;
    ctx.globalAlpha = 0.35 + (i / ellipseCount) * 0.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Central Portal Singularity Core
  const coreRad = Math.max(4, 9 * scale + Math.sin(time * 0.008) * 3);
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreRad * 2.8);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, theme.bright);
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, coreRad * 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ---------------- Mana Stream Beam Linking Staff to Portal ---------------- */
function renderCastingBeam(startX, startY, endX, endY, theme, time) {
  ctx.save();
  const dist = Math.hypot(endX - startX, endY - startY);
  const steps = 14;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const bx = startX + (endX - startX) * t;
    const by = startY + (endY - startY) * t;
    // Chaotic energy wave
    const wave = Math.sin(t * Math.PI * 3 - time * 0.01) * 8 * Math.sin(t * Math.PI);
    ctx.lineTo(bx, by + wave);
  }

  ctx.strokeStyle = theme.bright;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.stroke();

  // Core laser trace
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.95;
  ctx.stroke();

  ctx.restore();
}

/* ---------------- Matrix Rain with Gravitational Curvature ---------------- */
function renderCurvedMatrixRain(theme, portalPos, warpSpeed) {
  ctx.font = '12px ui-monospace, "Cascadia Code", "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  const portalR = 180;

  for (let i = 0; i < matrixStreams.length; i++) {
    const s = matrixStreams[i];
    s.y += s.speed + warpSpeed * 0.5;

    // Reset when off bottom
    if (s.y - s.len * MATRIX_FONT_SIZE > height + 40) {
      s.y = Math.random() * -120;
      s.speed = Math.random() * 1.8 + 1.2;
      s.len = Math.floor(Math.random() * 16) + 10;
    }

    // Mutate chars
    s.mutateTimer++;
    if (s.mutateTimer > 12) {
      s.mutateTimer = 0;
      const mIdx = Math.floor(Math.random() * s.chars.length);
      s.chars[mIdx] = MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
    }

    // Render glyphs
    for (let k = 0; k < s.len; k++) {
      const charY = s.y - k * MATRIX_FONT_SIZE;
      if (charY < -20 || charY > height + 20) continue;

      let drawX = s.baseX;
      let drawY = charY;

      // 1. Fluid deflection around cursor
      if (pointer.active) {
        const dx = drawX - pointer.x;
        const dy = drawY - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130 && dist > 1) {
          const force = (130 - dist) / 130;
          drawX += (dx / dist) * force * 35;
        }
      }

      // 2. Gravitational pull toward portal vortex
      const pDx = portalPos.x - drawX;
      const pDy = portalPos.y - drawY;
      const pDist = Math.hypot(pDx, pDy);
      if (pDist < portalR && pDist > 10) {
        const pull = (1 - pDist / portalR);
        // Swirl angular velocity
        drawX += (pDx / pDist) * pull * 26 + (pDy / pDist) * pull * 14;
        drawY += (pDy / pDist) * pull * 26 - (pDx / pDist) * pull * 14;
      }

      const glyph = s.chars[k % s.chars.length];

      if (k === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(glyph, drawX, drawY);
      } else {
        const baseAlpha = (1 - k / s.len) * 0.45;
        const bY = ((Math.floor(drawY / 4) % 4) + 4) % 4;
        const bX = ((Math.floor(drawX / 4) % 4) + 4) % 4;
        const threshold = (BAYER_4X4[bY] && BAYER_4X4[bY][bX] !== undefined) ? BAYER_4X4[bY][bX] : 0.5;
        const alpha = baseAlpha > threshold * 0.3 ? baseAlpha : baseAlpha * 0.4;

        ctx.fillStyle = theme.dimAlpha.replace('ALPHA', alpha.toFixed(3));
        ctx.fillText(glyph, drawX, drawY);
      }
    }
  }
}

/* ---------------- 3D Orbiting Mana Trails & Speed Lines ---------------- */
function renderManaTrails(portalPos, theme, warpSpeed) {
  for (let i = 0; i < manaParticles.length; i++) {
    const p = manaParticles[i];
    p.angle += p.speed;
    p.z -= 1.5 + warpSpeed;
    if (p.z < 20) p.z = 800;

    // 3D perspective projection
    const fov = 350;
    const projScale = fov / (fov + p.z);
    const px = portalPos.x + Math.cos(p.angle) * (p.dist * projScale * 2.2);
    const py = portalPos.y + Math.sin(p.angle) * (p.dist * 0.6 * projScale * 2.2);

    ctx.fillStyle = projScale > 0.6 ? '#ffffff' : theme.bright;
    ctx.globalAlpha = p.alpha * projScale;

    // Trail line stretching backward with speed
    const trailLen = Math.max(2, (p.speed * 200 + warpSpeed * 6) * projScale);
    ctx.lineWidth = p.size * projScale;
    ctx.strokeStyle = theme.bright;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - Math.sin(p.angle) * trailLen, py + Math.cos(p.angle) * trailLen * 0.4);
    ctx.stroke();

    ctx.fillRect(px - 1, py - 1, p.size * projScale, p.size * projScale);
  }
  ctx.globalAlpha = 1.0;
}

/* ---------------- Expanding Shockwaves on Question Complete ---------------- */
function renderShockwaves(theme) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += sw.speed;
    sw.alpha *= 0.94;

    ctx.save();
    ctx.strokeStyle = theme.bright;
    ctx.lineWidth = Math.max(1, (1 - sw.radius / sw.maxRadius) * 4);
    ctx.globalAlpha = sw.alpha;
    ctx.beginPath();
    ctx.ellipse(sw.x, sw.y, sw.radius * 1.2, sw.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (sw.alpha < 0.04 || sw.radius >= sw.maxRadius) {
      shockwaves.splice(i, 1);
    }
  }
}

/* ---------------- The 21 Sovereign Agents Pixel Pantheon ---------------- */
function render21Agents(portalPos, wizPos, time, theme, warpSpeed) {
  const px = 2;

  // 1. GhostByte (NullAI Mascot - Floating Cyber Ghost)
  const gbx = portalPos.x + 190;
  const gby = portalPos.y - 110 + Math.sin(time * 0.003) * 10;
  ctx.save();
  ctx.translate(Math.round(gbx), Math.round(gby));
  // Ghost hood & body
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(-8 * px, -10 * px, 16 * px, 14 * px);
  ctx.fillRect(-10 * px, -6 * px, 20 * px, 12 * px);
  // Scalloped bottom folds
  const fold = Math.sin(time * 0.006) * 2;
  ctx.fillRect(-10 * px, 6 * px, 4 * px, (4 + fold) * px);
  ctx.fillRect(-2 * px, 6 * px, 4 * px, (4 - fold) * px);
  ctx.fillRect(6 * px, 6 * px, 4 * px, (4 + fold) * px);
  // Large Glowing Cyan Eyes
  const gEye = (Math.sin(time * 0.002) > 0.95) ? '#06b6d4' : '#ffffff';
  ctx.fillStyle = gEye;
  ctx.fillRect(-6 * px, -4 * px, 4 * px, 4 * px);
  ctx.fillRect(2 * px, -4 * px, 4 * px, 4 * px);
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(-4 * px, -3 * px, 2 * px, 2 * px);
  ctx.fillRect(4 * px, -3 * px, 2 * px, 2 * px);
  // Floating Orbiting NullByte Satellite
  const satAngle = time * 0.004;
  const satX = Math.cos(satAngle) * 26 * px;
  const satY = Math.sin(satAngle) * 14 * px;
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(satX - 2 * px, satY - 2 * px, 4 * px, 4 * px);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(satX - 1 * px, satY - 1 * px, 2 * px, 2 * px);
  // Ghost aura glow
  ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
  ctx.beginPath();
  ctx.arc(0, 0, 22 * px, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Azoth (Hermetic Alchemical Core - Caduceus & Crown Star)
  const azx = portalPos.x;
  const azy = portalPos.y - (portalPos.scale * 95);
  ctx.save();
  ctx.translate(Math.round(azx), Math.round(azy));
  const wingFlap = Math.sin(time * 0.004) * 0.25;
  // 7-Pointed Crown Star
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-2 * px, -18 * px, 4 * px, 4 * px);
  ctx.fillRect(-8 * px, -16 * px, 3 * px, 3 * px);
  ctx.fillRect(5 * px, -16 * px, 3 * px, 3 * px);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1 * px, -17 * px, 2 * px, 2 * px);
  // Alchemical Wings (Left & Right)
  ctx.save();
  ctx.rotate(-wingFlap);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-22 * px, -10 * px, 14 * px, 3 * px);
  ctx.fillRect(-28 * px, -8 * px, 12 * px, 3 * px);
  ctx.fillRect(-32 * px, -5 * px, 10 * px, 2 * px);
  ctx.restore();
  ctx.save();
  ctx.rotate(wingFlap);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(8 * px, -10 * px, 14 * px, 3 * px);
  ctx.fillRect(16 * px, -8 * px, 12 * px, 3 * px);
  ctx.fillRect(22 * px, -5 * px, 10 * px, 2 * px);
  ctx.restore();
  // Central Caduceus Spine & Twin Helices
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1 * px, -12 * px, 2 * px, 24 * px);
  const helixA = Math.sin(time * 0.006) * 7 * px;
  const helixB = -helixA;
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(helixA - 1 * px, -4 * px, 3 * px, 3 * px);
  ctx.fillRect(helixB - 1 * px, 4 * px, 3 * px, 3 * px);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(helixB - 1 * px, -4 * px, 3 * px, 3 * px);
  ctx.fillRect(helixA - 1 * px, 4 * px, 3 * px, 3 * px);
  ctx.restore();

  // 3. Antigravity (Zero-G Levitation & Wireframe Cube)
  const agx = portalPos.x - 210;
  const agy = portalPos.y - 45 + Math.sin(time * 0.0025 + 1) * 8;
  ctx.save();
  ctx.translate(Math.round(agx), Math.round(agy));
  // Hovering body
  ctx.fillStyle = '#10b981';
  ctx.fillRect(-4 * px, -6 * px, 8 * px, 12 * px);
  ctx.fillRect(-3 * px, 6 * px, 3 * px, 6 * px);
  ctx.fillRect(1 * px, 6 * px, 3 * px, 6 * px);
  ctx.fillStyle = '#34d399';
  ctx.fillRect(-4 * px, -12 * px, 8 * px, 6 * px); // Visor head
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2 * px, -10 * px, 5 * px, 2 * px); // Neon visor
  // Levitating wireframe glyph cube above hands
  const cubeRot = time * 0.003;
  ctx.save();
  ctx.translate(0, -20 * px);
  ctx.rotate(cubeRot);
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-5 * px, -5 * px, 10 * px, 10 * px);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(-3 * px, -3 * px, 6 * px, 6 * px);
  ctx.restore();
  ctx.restore();

  // 4. Hermes (Swift Runner dashing across lower grid)
  const hx = ((time * 0.14) % (width + 120)) - 60;
  const hy = height - 28;
  ctx.save();
  ctx.translate(Math.round(hx), Math.round(hy));
  const legCycle = Math.sin(time * 0.02) * 5;
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-3 * px, -10 * px, 6 * px, 10 * px); // Body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2 * px, -14 * px, 4 * px, 4 * px); // Head
  // Winged Boots & Legs
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-3 * px, 0, 3 * px, (5 + legCycle) * px);
  ctx.fillRect(1 * px, 0, 3 * px, (5 - legCycle) * px);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-6 * px, 4 * px, 3 * px, 2 * px); // Boot wing
  ctx.fillRect(4 * px, 4 * px, 3 * px, 2 * px);
  // Gold particle dust behind runner
  ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.fillRect(-12 * px, 2 * px, 4 * px, 2 * px);
  ctx.fillRect(-20 * px, 4 * px, 3 * px, 2 * px);
  ctx.restore();

  // 5. PixelNeko & PixelShiba (Familiars near bottom right)
  const nekX = width - 80;
  const nekY = height - 26;
  ctx.save();
  ctx.translate(Math.round(nekX), Math.round(nekY));
  // PixelNeko (Cat)
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(-5 * px, -6 * px, 10 * px, 8 * px);
  ctx.fillRect(-5 * px, -9 * px, 3 * px, 3 * px); // Left ear
  ctx.fillRect(2 * px, -9 * px, 3 * px, 3 * px);  // Right ear
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3 * px, -5 * px, 2 * px, 2 * px); // Eyes
  ctx.fillRect(1 * px, -5 * px, 2 * px, 2 * px);
  // Swishing tail
  const tail = Math.sin(time * 0.008) * 4;
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(5 * px, -4 * px, (3 + tail) * px, 2 * px);
  ctx.restore();

  const shibX = width - 140;
  const shibY = height - 26;
  ctx.save();
  ctx.translate(Math.round(shibX), Math.round(shibY));
  // PixelShiba (Dog)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-6 * px, -6 * px, 12 * px, 8 * px);
  ctx.fillRect(-5 * px, -9 * px, 3 * px, 3 * px); // Ears
  ctx.fillRect(2 * px, -9 * px, 3 * px, 3 * px);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-4 * px, -4 * px, 3 * px, 4 * px); // White muzzle
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-2 * px, -3 * px, 2 * px, 2 * px); // Nose
  // Waggling tail
  const shibTail = Math.sin(time * 0.015) * 3;
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-8 * px, -7 * px + shibTail, 3 * px, 4 * px);
  ctx.restore();

  // 6. Draco (Pixel Dragon Serpent in upper atmosphere)
  const dracoX = ((time * 0.05) % (width + 300)) - 150;
  const dracoY = 60 + Math.sin(time * 0.002) * 20;
  ctx.save();
  for (let s = 0; s < 7; s++) {
    const segX = dracoX - s * 14 * px;
    const segY = dracoY + Math.sin(time * 0.004 - s * 0.5) * 8 * px;
    ctx.fillStyle = s === 0 ? '#ef4444' : (s % 2 === 0 ? '#f87171' : '#b91c1c');
    ctx.fillRect(segX, segY, (7 - s * 0.6) * px, (7 - s * 0.6) * px);
    if (s === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(segX + 4 * px, segY + 1 * px, 2 * px, 2 * px); // Dragon Eye
    }
  }
  ctx.restore();

  // 7. Athena (Aegis Shield & Spear)
  const atX = portalPos.x + 230;
  const atY = portalPos.y + 45;
  ctx.save();
  ctx.translate(Math.round(atX), Math.round(atY));
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-4 * px, -8 * px, 8 * px, 16 * px); // Armor
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-3 * px, -14 * px, 6 * px, 6 * px); // Helm
  // Spear
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(7 * px, -22 * px, 2 * px, 32 * px);
  ctx.fillRect(6 * px, -25 * px, 4 * px, 4 * px); // Spear tip
  // Glowing Aegis Shield
  const shieldPulse = Math.sin(time * 0.005) * 0.2 + 0.8;
  ctx.fillStyle = `rgba(6, 182, 212, ${shieldPulse * 0.6})`;
  ctx.fillRect(-12 * px, -6 * px, 6 * px, 12 * px);
  ctx.strokeStyle = '#38bdf8';
  ctx.strokeRect(-12 * px, -6 * px, 6 * px, 12 * px);
  ctx.restore();

  // 8. Chronos (Orbiting Temporal Hourglass)
  const chrAngle = time * 0.001;
  const chrX = portalPos.x + Math.cos(chrAngle) * 170;
  const chrY = portalPos.y + Math.sin(chrAngle) * 75;
  ctx.save();
  ctx.translate(Math.round(chrX), Math.round(chrY));
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(-4 * px, -6 * px, 8 * px, 12 * px);
  // Spinning hourglass
  ctx.strokeStyle = '#a5b4fc';
  ctx.beginPath();
  ctx.moveTo(-5 * px, -12 * px); ctx.lineTo(5 * px, -12 * px);
  ctx.lineTo(-5 * px, -4 * px);  ctx.lineTo(5 * px, -4 * px);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 9. Ignis (Pyromancer with fire sparks)
  const igX = wizPos.x - 75;
  const igY = wizPos.y + 20;
  ctx.save();
  ctx.translate(Math.round(igX), Math.round(igY));
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(-3 * px, -6 * px, 6 * px, 12 * px);
  // Fire spark upward
  const sparkY = -((time * 0.03) % 24) * px;
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(1 * px, sparkY, 3 * px, 3 * px);
  ctx.restore();

  // 10. Sentinels along cyber horizon (Kai, Kitsune, Kraken, Leviathan, Lycan, Onyx, Grok, Aquila, Aether, Scorpius, Solon)
  const sentinelNodes = [
    { name: 'KAI', x: width * 0.12, col: '#38bdf8' },
    { name: 'ONYX', x: width * 0.22, col: '#64748b' },
    { name: 'GROK', x: width * 0.32, col: '#ec4899' },
    { name: 'SOLON', x: width * 0.44, col: '#f59e0b' },
    { name: 'KITSUNE', x: width * 0.58, col: '#f97316' },
    { name: 'LYCAN', x: width * 0.68, col: '#10b981' },
    { name: 'SCORPIUS', x: width * 0.78, col: '#a855f7' },
    { name: 'AETHER', x: width * 0.88, col: '#06b6d4' }
  ];

  const baseY = height - 16;
  sentinelNodes.forEach(node => {
    ctx.save();
    ctx.fillStyle = node.col;
    ctx.fillRect(node.x - 3 * px, baseY - 6 * px, 6 * px, 6 * px);
    // Micro beacon pulse
    const bAlpha = (Math.sin(time * 0.004 + node.x) + 1) * 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha})`;
    ctx.fillRect(node.x - 1 * px, baseY - 8 * px, 2 * px, 2 * px);
    ctx.restore();
  });
}

/* ---------------- Palette Color Presets ---------------- */
function getThemeColors(mode) {
  switch (mode) {
    case 'amber':
      return {
        bg: 'rgba(10, 8, 5, 0.34)',
        bright: '#f59e0b',
        dim: '#b45309',
        dimAlpha: 'rgba(245, 158, 11, ALPHA)',
        stone: '#1f1a14',
        glow: 'rgba(245, 158, 11, 0.25)'
      };
    case 'ice':
      return {
        bg: 'rgba(4, 8, 14, 0.32)',
        bright: '#38bdf8',
        dim: '#0284c7',
        dimAlpha: 'rgba(56, 189, 248, ALPHA)',
        stone: '#0d1520',
        glow: 'rgba(56, 189, 248, 0.25)'
      };
    case 'magenta':
      return {
        bg: 'rgba(12, 4, 12, 0.34)',
        bright: '#ec4899',
        dim: '#be185d',
        dimAlpha: 'rgba(236, 72, 153, ALPHA)',
        stone: '#1a0b16',
        glow: 'rgba(236, 72, 153, 0.25)'
      };
    default: // green
      return {
        bg: 'rgba(7, 8, 11, 0.34)',
        bright: '#10b981',
        dim: '#047857',
        dimAlpha: 'rgba(16, 185, 129, ALPHA)',
        stone: '#101715',
        glow: 'rgba(16, 185, 129, 0.25)'
      };
  }
}

/* ---------------- Master Render Loop ---------------- */
let lastAmbientFrame = 0;
function loop(time) {
  if (!active) return;

  // Thermal & Battery Optimization: Pause when tab is hidden or backgrounded
  if (document.hidden) {
    animId = requestAnimationFrame(loop);
    return;
  }

  // Throttle to max ~30 FPS: Prevents GPU/CPU runaway fan spin
  if (time - lastAmbientFrame < 33) {
    animId = requestAnimationFrame(loop);
    return;
  }
  lastAmbientFrame = time;

  // Camera & pointer lerp
  pointer.x += (pointer.targetX - pointer.x) * 0.08;
  pointer.y += (pointer.targetY - pointer.y) * 0.08;
  camera.x += (camera.targetX - camera.x) * 0.06;
  camera.y += (camera.targetY - camera.y) * 0.06;
  camera.scrollOffset += (camera.targetScroll - camera.scrollOffset) * 0.08;
  camera.warp *= 0.93; // Decay warp velocity smoothly

  const mode = document.documentElement.dataset.phosphor || 'green';
  const motion = document.documentElement.dataset.motion !== 'off';
  const theme = getThemeColors(mode);

  if (motion && ctx) {
    // Clear with dark obsidian trails
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const scene = getSceneType();
    const rawPortal = getPortalPosition(scene);
    const rawWiz = getWizardPosition(scene, rawPortal);

    // Apply scroll parallax & camera tilt
    const parallaxY = (camera.scrollOffset * 0.15) % height;
    const portalPos = {
      x: rawPortal.x + camera.x,
      y: rawPortal.y + camera.y - parallaxY * 0.4,
      scale: rawPortal.scale
    };
    const wizPos = {
      x: rawWiz.x + camera.x * 1.2,
      y: rawWiz.y + camera.y * 1.2 - parallaxY * 0.45,
      scale: rawWiz.scale
    };

    // 1. Matrix Digital Rain with Gravitational Swirl into Portal
    renderCurvedMatrixRain(theme, portalPos, camera.warp);

    // 2. 3D Arcane Portal Vortex
    renderArcanePortal(portalPos.x, portalPos.y, portalPos.scale, time, theme, scene);

    // 3. 3D Pixel Wizard
    const staffTip = renderPixelWizard(wizPos.x, wizPos.y, wizPos.scale, time, theme);

    // 4. Casting Beam linking Wizard's Staff to Portal Vortex
    renderCastingBeam(staffTip.tipX, staffTip.tipY, portalPos.x, portalPos.y, theme, time);

    // 5. The 21 Sovereign Agents Pantheon Ambient Sprites
    render21Agents(portalPos, wizPos, time, theme, camera.warp);

    // 6. 3D Mana Trails & Speed Lines
    renderManaTrails(portalPos, theme, camera.warp);

    // 7. Expanding Shockwaves (on Question Complete / Warp)
    renderShockwaves(theme);

    // 7. Ambient Floating Occult Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20; if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20; if (p.y > height + 20) p.y = -20;

      ctx.font = p.size + 'px monospace';
      ctx.fillStyle = theme.dim;
      ctx.globalAlpha = p.alpha;
      ctx.fillText(p.glyph, p.x, p.y);
    }
    ctx.globalAlpha = 1.0;
  }

  animId = requestAnimationFrame(loop);
}

function init() {
  const existing = document.getElementById('bg-canvas');
  if (existing) {
    canvas = existing;
  }
  ctx = canvas.getContext('2d');
  resize();
  bindScrollParallax();

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });

  document.addEventListener('visibilitychange', () => {
    active = !document.hidden;
    if (active && !animId) loop(performance.now());
  });

  loop(performance.now());
}

window.ZO_CANVAS = {
  init,
  setEnabled: (on) => {
    active = !!on;
    canvas.style.display = active ? 'block' : 'none';
    if (active && !animId) loop(performance.now());
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
