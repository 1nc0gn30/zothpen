/* ==========================================================================
   ZothPen — SVGator-Style High-Quality Animated Vector Sigils
   Inspired by @teknium's Uncommon Web (webdev.teknium.io) & SVGator Motion
   Zero external dependencies. Pure scalable SVG with CSS keyframe choreography.
   ========================================================================== */
(function (global) {
  'use strict';

  const ZOSigils = {};

  // Unique ID generator for SVG clip-paths and filters
  let uid = 0;
  const nextId = (p = 'sig') => p + '_' + (++uid);

  /**
   * Master Hero Arcane Techno-Sigil (SVGator style)
   * Multi-ring counter-rotating sacred cybernetics with laser crosshairs and pulsing runic glyphs.
   */
  ZOSigils.heroAltar = function (size = 300) {
    const id = nextId('altar');
    return `
<svg class="svgator-sigil hero-altar-sigil" width="${size}" height="${size}" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arcane Cybernetic Sigil">
  <defs>
    <filter id="${id}-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="${id}-coregrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--accent, #10b981)" stop-opacity="0.75" />
      <stop offset="55%" stop-color="var(--accent, #10b981)" stop-opacity="0.18" />
      <stop offset="100%" stop-color="transparent" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background Ambient Glow Aura -->
  <circle cx="200" cy="200" r="160" fill="url(#${id}-coregrad)" />

  <!-- Layer 1: Outermost Cardinal Tick Ring (Counter-Clockwise) -->
  <g class="svg-spin-slow-ccw" style="transform-origin: 200px 200px;">
    <circle cx="200" cy="200" r="185" stroke="var(--accent, #10b981)" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="3 7 12 7" />
    <circle cx="200" cy="200" r="176" stroke="var(--accent, #10b981)" stroke-opacity="0.2" stroke-width="1" />
    <!-- Outer Coordinates & Runic Markers -->
    <text x="200" y="24" text-anchor="middle" fill="var(--accent, #10b981)" font-family="monospace" font-size="9" opacity="0.8" letter-spacing="2">0x00·SEC_ROOT</text>
    <text x="376" y="204" text-anchor="middle" fill="var(--accent, #10b981)" font-family="monospace" font-size="9" opacity="0.8">0x3F·RECON</text>
    <text x="200" y="385" text-anchor="middle" fill="var(--accent, #10b981)" font-family="monospace" font-size="9" opacity="0.8" letter-spacing="2">0x7F·EXPLOIT</text>
    <text x="24" y="204" text-anchor="middle" fill="var(--accent, #10b981)" font-family="monospace" font-size="9" opacity="0.8">0xBF·FORGE</text>
  </g>

  <!-- Layer 2: Segmented Arcane Gear Track (Clockwise) -->
  <g class="svg-spin-cw" style="transform-origin: 200px 200px;">
    <circle cx="200" cy="200" r="152" stroke="var(--accent, #10b981)" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="40 18 10 18" filter="url(#${id}-glow)" />
    <circle cx="200" cy="200" r="142" stroke="var(--accent, #10b981)" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="4 4" />
    <!-- Arcane Orbital Satellites -->
    <circle cx="200" cy="48" r="3.5" fill="var(--accent, #10b981)" />
    <circle cx="352" cy="200" r="3.5" fill="var(--accent, #10b981)" />
    <circle cx="200" cy="352" r="3.5" fill="var(--accent, #10b981)" />
    <circle cx="48" cy="200" r="3.5" fill="var(--accent, #10b981)" />
  </g>

  <!-- Layer 3: Concentric Hexagonal Sacred Geometry (Counter-Clockwise) -->
  <g class="svg-spin-mid-ccw" style="transform-origin: 200px 200px;">
    <!-- Outer Hexagon -->
    <polygon points="200,85 299,142 299,257 200,314 101,257 101,142" stroke="var(--accent, #10b981)" stroke-opacity="0.45" stroke-width="1.5" fill="none" />
    <!-- Inverted Hexagon (Hexagram / Merkaba) -->
    <polygon points="200,314 101,257 101,142 200,85 299,142 299,257" stroke="var(--accent, #10b981)" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="6 6" fill="none" />
    <!-- Node circles on vertices -->
    <circle cx="200" cy="85" r="2.5" fill="var(--accent, #10b981)" />
    <circle cx="299" cy="142" r="2.5" fill="var(--accent, #10b981)" />
    <circle cx="299" cy="257" r="2.5" fill="var(--accent, #10b981)" />
    <circle cx="200" cy="314" r="2.5" fill="var(--accent, #10b981)" />
    <circle cx="101" cy="257" r="2.5" fill="var(--accent, #10b981)" />
    <circle cx="101" cy="142" r="2.5" fill="var(--accent, #10b981)" />
  </g>

  <!-- Layer 4: Tactical Crosshair & Laser Reticles -->
  <g class="svg-pulse-laser" stroke="var(--accent, #10b981)" stroke-opacity="0.4" stroke-width="1">
    <line x1="200" y1="40" x2="200" y2="120" />
    <line x1="200" y1="280" x2="200" y2="360" />
    <line x1="40" y1="200" x2="120" y2="200" />
    <line x1="280" y1="200" x2="360" y2="200" />
    <!-- Diagonal tick marks -->
    <line x1="88" y1="88" x2="116" y2="116" stroke-dasharray="2 3" />
    <line x1="312" y1="88" x2="284" y2="116" stroke-dasharray="2 3" />
    <line x1="88" y1="312" x2="116" y2="284" stroke-dasharray="2 3" />
    <line x1="312" y1="312" x2="284" y2="284" stroke-dasharray="2 3" />
  </g>

  <!-- Layer 5: Inner Spinning Dial & Dashed Core Orbit -->
  <g class="svg-spin-fast-cw" style="transform-origin: 200px 200px;">
    <circle cx="200" cy="200" r="74" stroke="var(--accent, #10b981)" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="16 12 32 12" />
    <circle cx="200" cy="200" r="58" stroke="var(--accent, #10b981)" stroke-opacity="0.3" stroke-width="1.2" stroke-dasharray="5 5" />
    <polygon points="200,132 212,148 188,148" fill="var(--accent, #10b981)" />
    <polygon points="200,268 212,252 188,252" fill="var(--accent, #10b981)" />
  </g>

  <!-- Layer 6: Center Cybernetic Nexus / Glowing Core -->
  <g class="svg-core-breathe" style="transform-origin: 200px 200px;">
    <circle cx="200" cy="200" r="38" fill="rgba(6, 12, 9, 0.85)" stroke="var(--accent, #10b981)" stroke-width="2.5" filter="url(#${id}-glow)" />
    <polygon points="200,172 224,196 200,220 176,196" stroke="var(--accent, #10b981)" stroke-width="1.8" fill="rgba(16, 185, 129, 0.15)" />
    <circle cx="200" cy="200" r="8" fill="var(--accent, #10b981)" filter="url(#${id}-glow)" />
    <circle cx="200" cy="200" r="3" fill="#ffffff" />
  </g>
</svg>
`;
  };

  /**
   * Animated Brand Micro-Sigil (Replaces static ▚ in Topbar)
   * Rotating high-precision micro-dial with glowing center core
   */
  ZOSigils.brandMicro = function (size = 28) {
    const id = nextId('brm');
    return `
<svg class="svgator-sigil brand-micro-sigil" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ZothPen Brand Sigil">
  <defs>
    <filter id="${id}-brm-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Outer rotating ticks -->
  <g class="svg-spin-cw" style="transform-origin: 16px 16px;">
    <circle cx="16" cy="16" r="14" stroke="var(--accent, #10b981)" stroke-width="1.4" stroke-dasharray="14 6 4 6" opacity="0.8" />
  </g>
  <!-- Inner counter-spin diamond -->
  <g class="svg-spin-fast-ccw" style="transform-origin: 16px 16px;">
    <polygon points="16,5 24,16 16,27 8,16" stroke="var(--accent, #10b981)" stroke-width="1.2" fill="none" opacity="0.6" />
  </g>
  <!-- Center pulsing emerald node -->
  <circle cx="16" cy="16" r="3.5" fill="var(--accent, #10b981)" filter="url(#${id}-brm-glow)" />
  <circle cx="16" cy="16" r="1.5" fill="#ffffff" />
</svg>
`;
  };

  /**
   * Phase Emblems (SVGator Style) for Module Readers and Cards
   */
  ZOSigils.phaseSigil = function (phaseName = 'Recon', size = 48) {
    const id = nextId('phase');
    const p = (phaseName || '').toLowerCase();

    // 1. Orientation / ROE — Lawful Arcane Balance & Seal
    if (p.includes('orient') || p.includes('roe')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" stroke="var(--accent, #10b981)" stroke-width="1.5" stroke-dasharray="8 4 2 4" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <circle cx="32" cy="32" r="21" stroke="var(--accent, #10b981)" stroke-width="1" opacity="0.4" />
  <!-- Legal scales / Scope lock -->
  <path d="M32 14 V48 M20 22 H44 M20 22 L15 34 H25 Z M44 22 L39 34 H49 Z" stroke="var(--accent, #10b981)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="32" cy="32" r="3" fill="var(--accent, #10b981)" />
</svg>`;
    }

    // 2. Foundations / Lab — Hypervisor Grid & Circuit Traces
    if (p.includes('found') || p.includes('lab')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="48" height="48" rx="6" stroke="var(--accent, #10b981)" stroke-width="1.5" stroke-dasharray="12 4 4 4" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <rect x="18" y="18" width="28" height="28" rx="3" stroke="var(--accent, #10b981)" stroke-width="1.2" opacity="0.5" />
  <path d="M12 32 H22 M42 32 H52 M32 12 V22 M32 42 V52" stroke="var(--accent, #10b981)" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="32" cy="32" r="4" fill="var(--accent, #10b981)" class="svg-core-breathe" style="transform-origin: 32px 32px;" />
</svg>`;
    }

    // 3. Recon — Sonar Radar Sweep with Ping Blips
    if (p.includes('recon')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" stroke="var(--accent, #10b981)" stroke-width="1.5" opacity="0.35" />
  <circle cx="32" cy="32" r="18" stroke="var(--accent, #10b981)" stroke-width="1" opacity="0.5" />
  <circle cx="32" cy="32" r="8" stroke="var(--accent, #10b981)" stroke-width="1" opacity="0.7" />
  <!-- Sweep needle -->
  <line x1="32" y1="32" x2="56" y2="16" stroke="var(--accent, #10b981)" stroke-width="2" stroke-linecap="round" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <circle cx="44" cy="24" r="2.5" fill="var(--accent, #10b981)" class="svg-pulse-laser" />
  <circle cx="22" cy="40" r="2" fill="var(--accent, #10b981)" opacity="0.8" />
  <circle cx="32" cy="32" r="3.5" fill="var(--accent, #10b981)" />
</svg>`;
    }

    // 4. Enumerate — Port Discovery Hexagon Mesh
    if (p.includes('enum')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="32,6 54,19 54,45 32,58 10,45 10,19" stroke="var(--accent, #10b981)" stroke-width="1.5" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <polygon points="32,16 46,24 46,40 32,48 18,40 18,24" stroke="var(--accent, #10b981)" stroke-width="1.2" stroke-dasharray="4 3" class="svg-spin-ccw" style="transform-origin: 32px 32px;" />
  <!-- Port dots -->
  <circle cx="32" cy="6" r="2.5" fill="var(--accent, #10b981)" />
  <circle cx="54" cy="19" r="2.5" fill="var(--accent, #10b981)" />
  <circle cx="54" cy="45" r="2.5" fill="var(--accent, #10b981)" />
  <circle cx="32" cy="58" r="2.5" fill="var(--accent, #10b981)" />
  <circle cx="10" cy="45" r="2.5" fill="var(--accent, #10b981)" />
  <circle cx="10" cy="19" r="2.5" fill="var(--accent, #10b981)" />
  <circle cx="32" cy="32" r="4.5" fill="var(--accent, #10b981)" />
</svg>`;
    }

    // 5. Exploit — Fractured Cipher / Penetration Lance
    if (p.includes('exploit')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" stroke="var(--accent, #10b981)" stroke-width="1.5" stroke-dasharray="14 6" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <!-- Diamond lance piercing barrier -->
  <polygon points="32,8 44,32 32,56 20,32" stroke="var(--accent, #10b981)" stroke-width="1.8" fill="rgba(16, 185, 129, 0.12)" class="svg-core-breathe" style="transform-origin: 32px 32px;" />
  <line x1="8" y1="32" x2="56" y2="32" stroke="var(--accent, #10b981)" stroke-width="1.5" stroke-dasharray="3 3" />
  <circle cx="32" cy="32" r="5" fill="var(--accent, #10b981)" />
  <circle cx="32" cy="32" r="2" fill="#fff" />
</svg>`;
    }

    // 6. Post / Privilege Escalation — Ascending Arcane Crest
    if (p.includes('post') || p.includes('priv')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" stroke="var(--accent, #10b981)" stroke-width="1.5" stroke-dasharray="6 3 18 3" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <!-- Ascending Chevron Triad -->
  <path d="M20 44 L32 32 L44 44" stroke="var(--accent, #10b981)" stroke-width="2" stroke-linecap="round" opacity="0.4" />
  <path d="M20 34 L32 22 L44 34" stroke="var(--accent, #10b981)" stroke-width="2.2" stroke-linecap="round" opacity="0.7" />
  <path d="M20 24 L32 12 L44 24" stroke="var(--accent, #10b981)" stroke-width="2.5" stroke-linecap="round" />
  <circle cx="32" cy="12" r="3.5" fill="var(--accent, #10b981)" class="svg-pulse-laser" />
</svg>`;
    }

    // 7. Report / Proof — Cryptographic Seal of Scope
    if (p.includes('report')) {
      return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="32,6 50,14 58,32 50,50 32,58 14,50 6,32 14,14" stroke="var(--accent, #10b981)" stroke-width="1.5" class="svg-spin-slow-ccw" style="transform-origin: 32px 32px;" />
  <circle cx="32" cy="32" r="18" stroke="var(--accent, #10b981)" stroke-width="1.2" stroke-dasharray="4 4" />
  <!-- Wax seal / Keyhole -->
  <circle cx="32" cy="27" r="5" stroke="var(--accent, #10b981)" stroke-width="2" fill="none" />
  <path d="M30 32 L27 42 H37 L34 32 Z" fill="var(--accent, #10b981)" />
</svg>`;
    }

    // 8. Forge / Script Automation — Cyber Anvil & Kinetic Gears
    return `
<svg class="svgator-sigil phase-sigil" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" stroke="var(--accent, #10b981)" stroke-width="1.5" stroke-dasharray="10 5" class="svg-spin-cw" style="transform-origin: 32px 32px;" />
  <!-- Cyber Anvil / Terminal Brackets -->
  <path d="M16 20 L24 32 L16 44 M48 20 L40 32 L48 44" stroke="var(--accent, #10b981)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="28" y1="32" x2="36" y2="32" stroke="var(--accent, #10b981)" stroke-width="2.5" stroke-linecap="round" class="svg-pulse-laser" />
  <circle cx="32" cy="18" r="2" fill="var(--accent, #10b981)" />
  <circle cx="32" cy="46" r="2" fill="var(--accent, #10b981)" />
</svg>`;
  };

  global.ZOSigils = ZOSigils;
})(window);
