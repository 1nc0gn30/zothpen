/* ==========================================================================
   ZothPen — Hermetic Cyberpunk Pixel Cursor Engine
   Inspired by @teknium's Uncommon Web & Hermetic Alchemical HUD Interfaces
   Features sub-pixel Braille particle dust, animated pixel targeting reticle,
   lock-on hover brackets, and alchemical click shockwaves.
   100% offline, pure Canvas / Vanilla JS, zero performance overhead.
   ========================================================================== */
(function (global) {
'use strict';

let canvas = null;
let ctx = null;
let width = 0, height = 0;
let animId = null;
let active = true;

// Hermetic Trail Glyphs & Sub-Pixel Braille
const OCCULT_GLYPHS = ['☿', '◈', '⬡', '★', '⬢', '⢀', '⣴', '⠿', '⠂', '⠶'];

// Mouse state
const mouse = {
  x: -100,
  y: -100,
  targetX: -100,
  targetY: -100,
  down: false,
  hovering: false,
  speed: 0
};

// Trailing particles
const particles = [];
// Click shockwaves
const shockwaves = [];

function init() {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    // Touchscreen / mobile device - skip custom cursor
    return;
  }

  canvas = document.createElement('canvas');
  canvas.id = 'hermetic-cursor-canvas';
  canvas.className = 'hermetic-cursor-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  ctx = canvas.getContext('2d');
  resize();

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  document.addEventListener('mouseleave', () => { mouse.x = -100; mouse.y = -100; });

  document.addEventListener('visibilitychange', () => {
    active = !document.hidden;
    if (active && !animId) loop(performance.now());
  });

  loop(performance.now());
}

function resize() {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function onPointerMove(e) {
  const dx = e.clientX - mouse.targetX;
  const dy = e.clientY - mouse.targetY;
  mouse.speed = Math.hypot(dx, dy);

  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;

  // Detect hover on interactive targets
  const target = document.elementFromPoint(e.clientX, e.clientY);
  const isInteractive = target && (
    target.closest('button') ||
    target.closest('a') ||
    target.closest('[data-act]') ||
    target.closest('input') ||
    target.closest('select') ||
    target.closest('.agent-card') ||
    target.closest('.comic-card') ||
    target.closest('.float-console-header') ||
    target.closest('.rough-annotation-target')
  );
  mouse.hovering = !!isInteractive;

  // Spawn sub-pixel Braille particle dust if moving
  if (mouse.speed > 3 && particles.length < 35 && Math.random() < 0.6) {
    particles.push({
      x: e.clientX + (Math.random() * 8 - 4),
      y: e.clientY + (Math.random() * 8 - 4),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.4,
      glyph: OCCULT_GLYPHS[Math.floor(Math.random() * OCCULT_GLYPHS.length)],
      alpha: 0.85,
      size: Math.random() * 4 + 9,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

function onPointerDown(e) {
  mouse.down = true;
  shockwaves.push({
    x: e.clientX,
    y: e.clientY,
    radius: 4,
    maxRadius: 28,
    alpha: 0.95
  });
}

function onPointerUp() {
  mouse.down = false;
}

let lastCursorFrame = 0;
let cursorIdleFrames = 0;

function loop(time) {
  if (!active) return;

  // Thermal Protection: Pause when tab is not active
  if (document.hidden) {
    animId = requestAnimationFrame(loop);
    return;
  }

  // Throttle to max 35 FPS
  if (time - lastCursorFrame < 28) {
    animId = requestAnimationFrame(loop);
    return;
  }
  lastCursorFrame = time;

  // Check if idle
  const moved = Math.abs(mouse.targetX - mouse.x) > 0.3 || Math.abs(mouse.targetY - mouse.y) > 0.3;
  if (!moved && particles.length === 0 && shockwaves.length === 0) {
    cursorIdleFrames++;
    if (cursorIdleFrames > 5) {
      // Sleep animation loop when completely idle
      animId = requestAnimationFrame(loop);
      return;
    }
  } else {
    cursorIdleFrames = 0;
  }

  // Smooth lerp
  mouse.x += (mouse.targetX - mouse.x) * 0.45;
  mouse.y += (mouse.targetY - mouse.y) * 0.45;

  ctx.clearRect(0, 0, width, height);

  const mode = document.documentElement.dataset.phosphor || 'green';
  const themeCol = mode === 'amber' ? '#f59e0b' : (mode === 'ice' ? '#38bdf8' : (mode === 'magenta' ? '#ec4899' : '#10b981'));
  const px = 2;

  // 1. Render Floating Sub-Pixel Glyphs & Braille Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.font = `${Math.round(p.size)}px "DotGothic16", monospace`;
    ctx.fillStyle = themeCol;
    ctx.globalAlpha = p.alpha;
    ctx.fillText(p.glyph, p.x, p.y);
  }
  ctx.globalAlpha = 1.0;

  // 2. Render Click Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += 2.2;
    sw.alpha *= 0.88;

    if (sw.alpha < 0.05 || sw.radius >= sw.maxRadius) {
      shockwaves.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = sw.alpha;
    ctx.strokeRect(sw.x - sw.radius, sw.y - sw.radius, sw.radius * 2, sw.radius * 2);
    ctx.strokeStyle = themeCol;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(sw.x - sw.radius * 1.3, sw.y - sw.radius * 1.3, sw.radius * 2.6, sw.radius * 2.6);
    ctx.restore();
  }

  // 3. Render Pixel Reticle Cursor
  if (mouse.x > 0 && mouse.x < width && mouse.y > 0 && mouse.y < height) {
    const cx = Math.round(mouse.x);
    const cy = Math.round(mouse.y);
    const reticleSize = mouse.hovering ? 14 : 9;

    ctx.save();

    // Center Crosshair Dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);

    // Glowing Concentric Pixel Reticle Corners [ ┌ ┐ └ ┘ ]
    ctx.fillStyle = themeCol;
    // Top-Left
    ctx.fillRect(cx - reticleSize, cy - reticleSize, 4 * px, 1 * px);
    ctx.fillRect(cx - reticleSize, cy - reticleSize, 1 * px, 4 * px);
    // Top-Right
    ctx.fillRect(cx + reticleSize - 3 * px, cy - reticleSize, 4 * px, 1 * px);
    ctx.fillRect(cx + reticleSize, cy - reticleSize, 1 * px, 4 * px);
    // Bottom-Left
    ctx.fillRect(cx - reticleSize, cy + reticleSize, 4 * px, 1 * px);
    ctx.fillRect(cx - reticleSize, cy + reticleSize - 3 * px, 1 * px, 4 * px);
    // Bottom-Right
    ctx.fillRect(cx + reticleSize - 3 * px, cy + reticleSize, 4 * px, 1 * px);
    ctx.fillRect(cx + reticleSize, cy + reticleSize - 3 * px, 1 * px, 4 * px);

    // If Hovering, show lock-on cardinal ticks
    if (mouse.hovering) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy - reticleSize - 4, 1, 3);
      ctx.fillRect(cx, cy + reticleSize + 2, 1, 3);
      ctx.fillRect(cx - reticleSize - 4, cy, 3, 1);
      ctx.fillRect(cx + reticleSize + 2, cy, 3, 1);
    }

    ctx.restore();
  }

  animId = requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

global.ZOHermeticCursor = { init };

})(window);
