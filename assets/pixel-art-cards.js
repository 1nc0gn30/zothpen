/* ==========================================================================
   ZothPen — High-Quality 16-Bit / 32-Bit Hermetic Pixel-Art Engine
   Inspired by @teknium's Uncommon Web & Classic 16-Bit Occult Masterpieces
   Features multi-tone shading, 4x4 Bayer dither transitions, animated runes,
   and authentic Hermetic alchemical pixel scenes.
   ========================================================================== */
(function (global) {
  'use strict';

  const ZOPixelArt = {
    /**
     * Scene 1: High-Definition Hermetic Cyber-Wizard & Event Horizon Portal
     * 64x36 Pixel Grid with multi-tier shading, Bayer dither, and mana beam
     */
    wizardPortal() {
      return `
<div class="card-pixel-art" aria-hidden="true">
<svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Ground Cyber Grid Horizon with Dither Shading -->
  <rect x="0" y="34" width="64" height="2" fill="currentColor" opacity="0.45" />
  <rect x="0" y="35" width="64" height="1" fill="currentColor" opacity="0.7" />
  <!-- Dither grid lines -->
  <rect x="2" y="33" width="4" height="1" fill="currentColor" opacity="0.25" />
  <rect x="14" y="33" width="6" height="1" fill="currentColor" opacity="0.25" />
  <rect x="28" y="33" width="8" height="1" fill="currentColor" opacity="0.25" />
  <rect x="44" y="33" width="6" height="1" fill="currentColor" opacity="0.25" />
  <rect x="56" y="33" width="5" height="1" fill="currentColor" opacity="0.25" />

  <!-- === ARCANE STONE PORTAL (Multi-tier Shaded) === -->
  <!-- Base Plinth -->
  <rect x="36" y="32" width="26" height="2" fill="currentColor" opacity="0.75" />
  <rect x="38" y="30" width="22" height="2" fill="currentColor" opacity="0.85" />
  <rect x="40" y="29" width="18" height="1" fill="#ffffff" opacity="0.3" />

  <!-- Left Pillar (Shadow + Midtone + Highlight Edge) -->
  <rect x="39" y="10" width="4" height="19" fill="currentColor" opacity="0.8" />
  <rect x="39" y="10" width="1" height="19" fill="#000000" opacity="0.45" /> <!-- Shadow edge -->
  <rect x="42" y="10" width="1" height="19" fill="#ffffff" opacity="0.4" /> <!-- Inner glow -->
  <!-- Left Pillar Runes (Animated Pulse) -->
  <rect x="40" y="13" width="2" height="2" fill="#fff" class="px-rune-pulse" />
  <rect x="41" y="18" width="1" height="2" fill="#fff" opacity="0.9" />
  <rect x="40" y="23" width="2" height="2" fill="#fff" class="px-rune-pulse" />

  <!-- Right Pillar -->
  <rect x="53" y="10" width="4" height="19" fill="currentColor" opacity="0.8" />
  <rect x="53" y="10" width="1" height="19" fill="#ffffff" opacity="0.4" /> <!-- Inner glow -->
  <rect x="56" y="10" width="1" height="19" fill="#000000" opacity="0.45" /> <!-- Shadow edge -->
  <!-- Right Pillar Runes -->
  <rect x="54" y="14" width="2" height="2" fill="#fff" class="px-rune-pulse" />
  <rect x="54" y="19" width="1" height="2" fill="#fff" opacity="0.9" />
  <rect x="54" y="24" width="2" height="2" fill="#fff" class="px-rune-pulse" />

  <!-- Keystone Archway -->
  <rect x="41" y="7" width="14" height="4" fill="currentColor" opacity="0.85" />
  <rect x="44" y="5" width="8" height="3" fill="currentColor" opacity="0.95" />
  <rect x="46" y="4" width="4" height="2" fill="#ffffff" opacity="0.85" /> <!-- Crown keystone -->

  <!-- Portal Event Horizon Vortex (Deep Multi-layered Singularity) -->
  <g class="px-portal-vortex">
    <rect x="43" y="11" width="10" height="18" fill="currentColor" opacity="0.25" />
    <rect x="44" y="12" width="8" height="16" fill="currentColor" opacity="0.45" />
    <rect x="45" y="14" width="6" height="12" fill="currentColor" opacity="0.75" />
    <rect x="46" y="16" width="4" height="8" fill="#ffffff" opacity="0.9" />
    <rect x="47" y="19" width="2" height="3" fill="#ffffff" /> <!-- Singularity -->
  </g>

  <!-- === THE CYBER WIZARD (16-Bit Shaded Sprite) === -->
  <!-- Robe Skirt & Shadow -->
  <rect x="8" y="32" width="12" height="2" fill="currentColor" opacity="0.95" />
  <rect x="9" y="24" width="10" height="8" fill="currentColor" opacity="0.9" />
  <rect x="10" y="18" width="8" height="6" fill="currentColor" opacity="0.85" />
  <!-- Robe Shading Highlights & Folds -->
  <rect x="9" y="26" width="2" height="6" fill="#000000" opacity="0.3" /> <!-- Dark fold -->
  <rect x="13" y="22" width="2" height="10" fill="#ffffff" opacity="0.25" /> <!-- Midtone highlight -->

  <!-- Wizard Face, Visor & Cascading Beard -->
  <rect x="12" y="15" width="5" height="4" fill="#ffffff" opacity="0.95" /> <!-- Beard -->
  <rect x="13" y="19" width="3" height="3" fill="#e2e8f0" />
  <!-- Glowing Eye / Cyber Visor -->
  <rect x="15" y="14" width="2" height="1" fill="#fff" class="px-eye-glow" />

  <!-- Pointed Wizard Hat with Multi-Tier Slope -->
  <rect x="9" y="13" width="10" height="2" fill="currentColor" opacity="0.95" /> <!-- Brim -->
  <rect x="11" y="11" width="6" height="2" fill="currentColor" opacity="0.9" />
  <rect x="12" y="9" width="4" height="2" fill="currentColor" opacity="0.85" />
  <rect x="13" y="7" width="3" height="2" fill="currentColor" opacity="0.85" />
  <rect x="14" y="5" width="2" height="2" fill="currentColor" opacity="0.9" />
  <rect x="15" y="4" width="1" height="1" fill="#ffffff" /> <!-- Hat Tip Star -->

  <!-- Extended Casting Arm & Crystalline Staff -->
  <rect x="16" y="20" width="6" height="2" fill="currentColor" opacity="0.9" />
  <!-- Staff Pole -->
  <rect x="22" y="8" width="1" height="26" fill="currentColor" opacity="0.95" />
  <rect x="23" y="9" width="1" height="24" fill="#000000" opacity="0.2" /> <!-- Staff shadow -->
  <!-- Staff Crystal Head (Pulsing 432 Hz Core) -->
  <rect x="20" y="5" width="5" height="4" fill="currentColor" opacity="0.5" />
  <rect x="21" y="4" width="3" height="4" fill="#ffffff" class="px-staff-glow" />
  <rect x="22" y="5" width="1" height="2" fill="#38bdf8" />

  <!-- High-Energy Casting Mana Beam Linking Staff to Portal -->
  <rect x="25" y="8" width="4" height="1" fill="#fff" opacity="0.9" class="px-spark-1" />
  <rect x="30" y="11" width="5" height="1" fill="currentColor" opacity="0.85" class="px-spark-2" />
  <rect x="36" y="15" width="5" height="1" fill="#fff" opacity="0.9" class="px-spark-1" />
  <rect x="41" y="18" width="3" height="1" fill="currentColor" opacity="0.9" class="px-spark-3" />

  <!-- Starry Sky Pixels & Alchemical Constellations -->
  <rect x="4" y="5" width="1" height="1" fill="#fff" opacity="0.7" />
  <rect x="10" y="3" width="1" height="1" fill="currentColor" opacity="0.5" />
  <rect x="28" y="4" width="1" height="1" fill="#fff" opacity="0.8" />
  <rect x="33" y="2" width="1" height="1" fill="currentColor" opacity="0.6" />
  <rect x="60" y="6" width="1" height="1" fill="#fff" opacity="0.7" />
</svg>
</div>`;
    },

    /**
     * Scene 2: The Sacred Azoth Caduceus Altar & Sphinx Gate
     */
    azothAltar() {
      return `
<div class="card-pixel-art" aria-hidden="true">
<svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Ground Horizon -->
  <rect x="0" y="34" width="64" height="2" fill="currentColor" opacity="0.45" />

  <!-- Altar Pedestal with Alchemical Steps -->
  <rect x="20" y="32" width="24" height="2" fill="currentColor" opacity="0.8" />
  <rect x="23" y="30" width="18" height="2" fill="currentColor" opacity="0.9" />
  <rect x="26" y="28" width="12" height="2" fill="#ffffff" opacity="0.3" />

  <!-- Central Caduceus Spine of Hermes -->
  <rect x="31" y="8" width="2" height="20" fill="#ffffff" opacity="0.95" />
  <rect x="30" y="6" width="4" height="3" fill="#f59e0b" class="px-staff-glow" />

  <!-- Spreading Alchemical Wings -->
  <rect x="20" y="10" width="11" height="2" fill="#f59e0b" opacity="0.85" />
  <rect x="16" y="12" width="8" height="2" fill="#f59e0b" opacity="0.75" />
  <rect x="12" y="14" width="6" height="1" fill="#f59e0b" opacity="0.65" />

  <rect x="33" y="10" width="11" height="2" fill="#f59e0b" opacity="0.85" />
  <rect x="40" y="12" width="8" height="2" fill="#f59e0b" opacity="0.75" />
  <rect x="46" y="14" width="6" height="1" fill="#f59e0b" opacity="0.65" />

  <!-- 7-Pointed Crown Star of Azoth -->
  <rect x="31" y="2" width="2" height="3" fill="#ffffff" class="px-eye-glow" />
  <rect x="28" y="4" width="2" height="2" fill="#f59e0b" />
  <rect x="34" y="4" width="2" height="2" fill="#f59e0b" />

  <!-- Twin Intertwined Kundalini Serpents (Gold & Cyan) -->
  <rect x="29" y="15" width="2" height="2" fill="#06b6d4" />
  <rect x="33" y="15" width="2" height="2" fill="#f59e0b" />
  <rect x="29" y="21" width="2" height="2" fill="#f59e0b" />
  <rect x="33" y="21" width="2" height="2" fill="#06b6d4" />

  <!-- Flanking Sphinx Monoliths -->
  <rect x="6" y="22" width="8" height="12" fill="currentColor" opacity="0.75" />
  <rect x="7" y="18" width="6" height="5" fill="currentColor" opacity="0.85" />
  <rect x="9" y="19" width="1" height="1" fill="#fff" class="px-eye-glow" />

  <rect x="50" y="22" width="8" height="12" fill="currentColor" opacity="0.75" />
  <rect x="51" y="18" width="6" height="5" fill="currentColor" opacity="0.85" />
  <rect x="52" y="19" width="1" height="1" fill="#fff" class="px-eye-glow" />
</svg>
</div>`;
    },

    /**
     * Scene 3: GhostByte & NullAI Sovereign Cyber-Keep
     */
    ghostbyteKeep() {
      return `
<div class="card-pixel-art" aria-hidden="true">
<svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Ground Horizon -->
  <rect x="0" y="34" width="64" height="2" fill="currentColor" opacity="0.45" />

  <!-- Cyber Bastion Wall -->
  <rect x="18" y="26" width="36" height="8" fill="currentColor" opacity="0.75" />
  <rect x="22" y="20" width="28" height="6" fill="currentColor" opacity="0.85" />
  <rect x="26" y="16" width="20" height="4" fill="currentColor" opacity="0.9" />

  <!-- Holographic Terminal Console -->
  <rect x="32" y="18" width="8" height="6" fill="#06b6d4" opacity="0.3" class="px-portal-vortex" />
  <rect x="33" y="19" width="6" height="4" fill="#ffffff" opacity="0.8" />

  <!-- Floating GhostByte Mascot (Cyan Hood & Glowing Eyes) -->
  <g class="px-staff-glow">
    <rect x="33" y="7" width="8" height="7" fill="#06b6d4" />
    <rect x="32" y="9" width="10" height="5" fill="#38bdf8" />
    <!-- Floating Scalloped Skirt -->
    <rect x="32" y="14" width="2" height="2" fill="#06b6d4" />
    <rect x="36" y="14" width="2" height="2" fill="#06b6d4" />
    <rect x="40" y="14" width="2" height="2" fill="#06b6d4" />
    <!-- Large Pixel Eyes -->
    <rect x="34" y="9" width="2" height="2" fill="#ffffff" />
    <rect x="38" y="9" width="2" height="2" fill="#ffffff" />
  </g>

  <!-- Orbiting NullByte Satellite -->
  <rect x="46" y="8" width="2" height="2" fill="#ffffff" class="px-spark-1" />
  <rect x="47" y="9" width="1" height="1" fill="#06b6d4" />

  <!-- Sentinel Agent on Rampart (Hermes / Antigravity) -->
  <rect x="10" y="28" width="4" height="6" fill="#fbbf24" />
  <rect x="11" y="25" width="2" height="3" fill="#ffffff" />
  <!-- Winged Heel -->
  <rect x="8" y="32" width="2" height="1" fill="#38bdf8" />

  <!-- PixelNeko Familiar Playing on Left Bastion -->
  <rect x="56" y="30" width="5" height="4" fill="#c084fc" />
  <rect x="56" y="28" width="2" height="2" fill="#c084fc" />
  <rect x="59" y="28" width="2" height="2" fill="#c084fc" />
  <rect x="61" y="31" width="2" height="1" fill="#a855f7" /> <!-- Tail -->
</svg>
</div>`;
    },

    /**
     * Scene 4: Hermetic Tree of Life (10 Sephiroth Crystalline Nodes)
     */
    treeOfLife() {
      return `
<div class="card-pixel-art" aria-hidden="true">
<svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect x="0" y="34" width="64" height="2" fill="currentColor" opacity="0.45" />

  <!-- 22 Interconnecting Path Lines -->
  <!-- Central Middle Pillar -->
  <rect x="31" y="4" width="2" height="28" fill="currentColor" opacity="0.35" />
  <!-- Cross Paths -->
  <rect x="22" y="10" width="20" height="1" fill="currentColor" opacity="0.3" />
  <rect x="22" y="18" width="20" height="1" fill="currentColor" opacity="0.3" />
  <rect x="22" y="26" width="20" height="1" fill="currentColor" opacity="0.3" />

  <!-- 10 Sephiroth Glowing Crystalline Spheres -->
  <!-- 1. Kether (Crown) -->
  <rect x="30" y="2" width="4" height="4" fill="#ffffff" class="px-staff-glow" />
  <!-- 2. Chokmah & 3. Binah -->
  <rect x="41" y="8" width="4" height="4" fill="#38bdf8" />
  <rect x="19" y="8" width="4" height="4" fill="#f59e0b" />
  <!-- 4. Chesed & 5. Geburah -->
  <rect x="41" y="16" width="4" height="4" fill="#06b6d4" />
  <rect x="19" y="16" width="4" height="4" fill="#ef4444" />
  <!-- 6. Tiphereth (Heart of Sol) -->
  <rect x="30" y="16" width="4" height="4" fill="#ffffff" class="px-rune-pulse" />
  <!-- 7. Netzach & 8. Hod -->
  <rect x="41" y="24" width="4" height="4" fill="#10b981" />
  <rect x="19" y="24" width="4" height="4" fill="#ea580c" />
  <!-- 9. Yesod (Foundation) -->
  <rect x="30" y="24" width="4" height="4" fill="#a855f7" />
  <!-- 10. Malkuth (Kingdom / Earth) -->
  <rect x="30" y="30" width="4" height="4" fill="#f8fafc" />
</svg>
</div>`;
    },

    /**
     * Pick a scene based on card index, id, or phase
     */
    render(key = '') {
      if (typeof this[key] === 'function') return this[key]();
      return this.getSceneFor(key);
    },

    getSceneFor(idOrPhase = '', index = 0) {
      const s = String(idOrPhase).toLowerCase();
      if (s.includes('recon') || s.includes('scan') || s.includes('nmap')) return this.wizardPortal();
      if (s.includes('exploit') || s.includes('forge') || s.includes('script')) return this.azothAltar();
      if (s.includes('lab') || s.includes('drill') || s.includes('agent')) return this.ghostbyteKeep();
      if (s.includes('map') || s.includes('overview') || s.includes('roe')) return this.treeOfLife();

      const scenes = [this.wizardPortal, this.azothAltar, this.ghostbyteKeep, this.treeOfLife];
      return scenes[index % scenes.length].call(this);
    }
  };

  global.ZOPixelArt = ZOPixelArt;

})(window);
