/* ==========================================================================
   ZothPen — 3D ASCII & Hermetic Pixel-Art Hologram Engine
   Inspired by @teknium's Uncommon Web (webdev.teknium.io) & Hermetic Cybernetics
   Zero external dependencies. Pure 3D Vector Math, Sub-Pixel Braille, & Bayer Dither.
   ========================================================================== */
(function (global) {
  'use strict';

  // 4x4 Bayer Dither Matrix for retro digital thresholding
  const BAYER_4X4 = [
    [0 / 16, 8 / 16, 2 / 16, 10 / 16],
    [12 / 16, 4 / 16, 14 / 16, 6 / 16],
    [3 / 16, 11 / 16, 1 / 16, 9 / 16],
    [15 / 16, 7 / 16, 13 / 16, 5 / 16]
  ];

  // Luminance ramps from dense to sparse
  const ASCII_RAMP = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';

  /**
   * Pack a 2x4 pixel block into a Unicode Braille character (U+2800..U+28FF)
   * Sub-pixel resolution boost: 2 columns by 4 rows per character cell!
   */
  function packBraille(b00, b01, b02, b03, b10, b11, b12, b13) {
    let code = 0;
    if (b00) code |= 0x01;
    if (b01) code |= 0x02;
    if (b02) code |= 0x04;
    if (b10) code |= 0x08;
    if (b11) code |= 0x10;
    if (b12) code |= 0x20;
    if (b03) code |= 0x40;
    if (b13) code |= 0x80;
    return String.fromCharCode(0x2800 + code);
  }

  /* ---------------- Geometry Generators ---------------- */

  // 1. 4D Hypercube / Tesseract (16 vertices, 32 edges)
  function createTesseract() {
    const verts4D = [];
    for (let i = 0; i < 16; i++) {
      verts4D.push([
        (i & 1 ? 1 : -1) * 1.05,
        (i & 2 ? 1 : -1) * 1.05,
        (i & 4 ? 1 : -1) * 1.05,
        (i & 8 ? 1 : -1) * 1.05
      ]);
    }
    const edges = [];
    for (let i = 0; i < 16; i++) {
      for (let bit = 1; bit <= 8; bit <<= 1) {
        if ((i & bit) === 0) {
          edges.push([i, i | bit]);
        }
      }
    }
    return { type: '4d', verts4D, edges, label: '4D TESSERACT HYPERCUBE' };
  }

  // 2. Mystical Torus Knot (Trefoil / Arcane Loop)
  function createTorusKnot(p = 2, q = 3, segments = 84) {
    const verts = [];
    const edges = [];
    const r1 = 1.35, r2 = 0.55;
    for (let i = 0; i < segments; i++) {
      const phi = (i / segments) * Math.PI * 2;
      const r = r1 + r2 * Math.cos(q * phi);
      const x = r * Math.cos(p * phi);
      const y = r * Math.sin(p * phi);
      const z = -r2 * Math.sin(q * phi) * 1.4;
      verts.push([x, y, z]);
      edges.push([i, (i + 1) % segments]);
    }
    for (let i = 0; i < segments; i += 7) {
      edges.push([i, (i + Math.floor(segments / 3)) % segments]);
    }
    return { type: '3d', verts, edges, label: 'ARCANE TORUS KNOT' };
  }

  // 3. Cybernetic Occult Skull / Scanner Matrix (True Anatomical 3D Mesh)
  function createCyberSkull() {
    const rawVerts = [];
    const edges = [];

    function addV(x, y, z) {
      const idx = rawVerts.length;
      rawVerts.push([x * 0.72, y * 0.72, z * 0.72]);
      return idx;
    }
    function addE(i, j) { edges.push([i, j]); }

    // 1. Cranium Vault (forehead, parietal vault, occipital dome)
    const cRings = 5, cSegs = 14;
    const craniumGrid = [];
    for (let r = 0; r <= cRings; r++) {
      const phi = (r / cRings) * (Math.PI * 0.48);
      const y = 1.35 - Math.sin(phi) * 0.85;
      const rad = Math.cos(phi) * 0.95;
      const row = [];
      for (let s = 0; s < cSegs; s++) {
        const theta = (s / cSegs) * Math.PI * 2;
        const x = Math.sin(theta) * rad * 0.92;
        const z = Math.cos(theta) * rad * 1.05 - 0.10;
        row.push(addV(x, y, z));
      }
      craniumGrid.push(row);
    }
    for (let r = 0; r < cRings; r++) {
      for (let s = 0; s < cSegs; s++) {
        const nextS = (s + 1) % cSegs;
        addE(craniumGrid[r][s], craniumGrid[r][nextS]);
        addE(craniumGrid[r][s], craniumGrid[r + 1][s]);
      }
    }
    for (let s = 0; s < cSegs; s++) {
      addE(craniumGrid[cRings][s], craniumGrid[cRings][(s + 1) % cSegs]);
    }

    // 2. Supraorbital Brow Ridge (heavy frontal bone protrusion)
    const browLeft = [
      addV(-0.75, 0.42, 0.55),
      addV(-0.55, 0.45, 0.72),
      addV(-0.35, 0.45, 0.76),
      addV(-0.15, 0.40, 0.74),
      addV(0.00, 0.38, 0.72)
    ];
    for (let i = 0; i < browLeft.length - 1; i++) addE(browLeft[i], browLeft[i + 1]);

    const browRight = [
      browLeft[4],
      addV(0.15, 0.40, 0.74),
      addV(0.35, 0.45, 0.76),
      addV(0.55, 0.45, 0.72),
      addV(0.75, 0.42, 0.55)
    ];
    for (let i = 0; i < browRight.length - 1; i++) addE(browRight[i], browRight[i + 1]);

    addE(browLeft[0], craniumGrid[cRings][cSegs - 2]);
    addE(browRight[4], craniumGrid[cRings][2]);

    // 3. Eye Sockets (Orbits) - Rim & Recessed Cavities
    const orbitSegs = 8;
    const leftOrbitOuter = [], leftOrbitInner = [];
    const rightOrbitOuter = [], rightOrbitInner = [];
    const lcx = -0.38, rcx = 0.38, ocy = 0.16, orx = 0.22, ory = 0.20;

    for (let i = 0; i < orbitSegs; i++) {
      const ang = (i / orbitSegs) * Math.PI * 2;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      const lx = lcx + cosA * orx, ly = ocy + sinA * ory, lz = 0.68 - Math.abs(cosA) * 0.08;
      leftOrbitOuter.push(addV(lx, ly, lz));
      leftOrbitInner.push(addV(lcx + cosA * (orx * 0.45), ocy + sinA * (ory * 0.45), 0.15));

      const rx = rcx + cosA * orx, ry = ocy + sinA * ory, rz = 0.68 - Math.abs(cosA) * 0.08;
      rightOrbitOuter.push(addV(rx, ry, rz));
      rightOrbitInner.push(addV(rcx + cosA * (orx * 0.45), ocy + sinA * (ory * 0.45), 0.15));
    }

    for (let i = 0; i < orbitSegs; i++) {
      const nextI = (i + 1) % orbitSegs;
      addE(leftOrbitOuter[i], leftOrbitOuter[nextI]);
      addE(rightOrbitOuter[i], rightOrbitOuter[nextI]);
      addE(leftOrbitInner[i], leftOrbitInner[nextI]);
      addE(rightOrbitInner[i], rightOrbitInner[nextI]);
      addE(leftOrbitOuter[i], leftOrbitInner[i]);
      addE(rightOrbitOuter[i], rightOrbitInner[i]);
    }
    addE(browLeft[2], leftOrbitOuter[2]);
    addE(browRight[2], rightOrbitOuter[2]);

    // 4. Nasal Cavity (Piriform Aperture)
    const nTop = addV(0, 0.08, 0.68);
    const nBottomL = addV(-0.14, -0.22, 0.62);
    const nBottomR = addV(0.14, -0.22, 0.62);
    const nSpine = addV(0, -0.20, 0.64);
    const nCavity = addV(0, -0.08, 0.22);
    addE(nTop, nBottomL); addE(nTop, nBottomR);
    addE(nBottomL, nSpine); addE(nBottomR, nSpine);
    addE(nTop, nCavity); addE(nSpine, nCavity);
    addE(nTop, leftOrbitOuter[0]); addE(nTop, rightOrbitOuter[4]);

    // 5. Zygomatic Arches (Cheekbones)
    const lCheek = addV(-0.82, -0.05, 0.52);
    const rCheek = addV(0.82, -0.05, 0.52);
    const lArchMid = addV(-0.88, 0.02, 0.15);
    const rArchMid = addV(0.88, 0.02, 0.15);
    addE(leftOrbitOuter[4], lCheek); addE(rightOrbitOuter[0], rCheek);
    addE(lCheek, lArchMid); addE(rCheek, rArchMid);
    addE(lArchMid, craniumGrid[cRings][cSegs - 3]);
    addE(rArchMid, craniumGrid[cRings][3]);

    // 6. Maxilla & Upper Teeth Row
    const maxillaL = addV(-0.50, -0.32, 0.58);
    const maxillaR = addV(0.50, -0.32, 0.58);
    addE(lCheek, maxillaL); addE(rCheek, maxillaR);
    addE(nBottomL, maxillaL); addE(nBottomR, maxillaR);

    const upperTeeth = [];
    const teethCount = 7;
    for (let t = 0; t <= teethCount; t++) {
      const u = t / teethCount;
      const x = -0.38 + u * 0.76;
      const z = 0.68 - Math.pow(x * 1.2, 2) * 0.18;
      const vt = addV(x, -0.35, z);
      const vb = addV(x, -0.48, z);
      addE(vt, vb);
      upperTeeth.push({ vt, vb });
      if (t > 0) {
        addE(upperTeeth[t - 1].vt, vt);
        addE(upperTeeth[t - 1].vb, vb);
      }
    }

    // 7. Mandible & Lower Teeth Row
    const lowerTeeth = [];
    for (let t = 0; t <= teethCount; t++) {
      const u = t / teethCount;
      const x = -0.36 + u * 0.72;
      const z = 0.66 - Math.pow(x * 1.2, 2) * 0.18;
      const vt = addV(x, -0.52, z);
      const vb = addV(x, -0.65, z);
      addE(vt, vb);
      lowerTeeth.push({ vt, vb });
      if (t > 0) {
        addE(lowerTeeth[t - 1].vt, vt);
        addE(lowerTeeth[t - 1].vb, vb);
      }
    }

    // Chin & Jawline
    const chinCenter = addV(0, -1.02, 0.60);
    const chinL = addV(-0.25, -0.98, 0.55);
    const chinR = addV(0.25, -0.98, 0.55);
    addE(chinL, chinCenter); addE(chinCenter, chinR);
    addE(lowerTeeth[0].vb, chinL);
    addE(lowerTeeth[Math.floor(teethCount / 2)].vb, chinCenter);
    addE(lowerTeeth[teethCount].vb, chinR);

    const jawAngleL = addV(-0.68, -0.68, 0.18);
    const jawAngleR = addV(0.68, -0.68, 0.18);
    addE(chinL, jawAngleL); addE(chinR, jawAngleR);
    addE(jawAngleL, lArchMid); addE(jawAngleR, rArchMid);

    return { type: '3d', verts: rawVerts, edges, label: 'CYBER-OCCULT SKULL' };
  }

  // 4. Dithered 3D Globe with Orbital Ring
  function createDitherGlobe() {
    const verts = [];
    const edges = [];
    const rings = 7;
    const segments = 16;
    let idx = 0;
    for (let r = 0; r < rings; r++) {
      const theta = ((r + 1) / (rings + 1)) * Math.PI - Math.PI / 2;
      const y = Math.sin(theta) * 1.35;
      const rad = Math.cos(theta) * 1.35;
      const start = idx;
      for (let s = 0; s < segments; s++) {
        const phi = (s / segments) * Math.PI * 2;
        const x = Math.cos(phi) * rad;
        const z = Math.sin(phi) * rad;
        verts.push([x, y, z]);
        edges.push([idx, s === segments - 1 ? start : idx + 1]);
        idx++;
      }
    }
    for (let s = 0; s < segments; s += 2) {
      for (let r = 0; r < rings - 1; r++) {
        edges.push([r * segments + s, (r + 1) * segments + s]);
      }
    }
    const orbStart = idx;
    const orbSegments = 24;
    for (let i = 0; i < orbSegments; i++) {
      const phi = (i / orbSegments) * Math.PI * 2;
      const x = Math.cos(phi) * 1.85;
      const y = Math.sin(phi) * 0.95;
      const z = Math.sin(phi) * 1.6;
      verts.push([x, y, z]);
      edges.push([idx, i === orbSegments - 1 ? orbStart : idx + 1]);
      idx++;
    }
    return { type: '3d', verts, edges, label: 'DITHER COBE GLOBE' };
  }

  // 5. Sacred Merkaba (Interlocking Dual Tetrahedra)
  function createMerkaba() {
    const s = 1.35;
    const t1 = [
      [0, s, 0],
      [s * 0.94, -s * 0.47, 0],
      [-s * 0.47, -s * 0.47, s * 0.81],
      [-s * 0.47, -s * 0.47, -s * 0.81]
    ];
    const t2 = [
      [0, -s, 0],
      [-s * 0.94, s * 0.47, 0],
      [s * 0.47, s * 0.47, -s * 0.81],
      [s * 0.47, s * 0.47, s * 0.81]
    ];
    const verts = [...t1, ...t2];
    const edges = [
      [0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1],
      [4, 5], [4, 6], [4, 7], [5, 6], [6, 7], [7, 5],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    return { type: '3d', verts, edges, label: 'SACRED MERKABA STAR' };
  }

  // 6. HERMETIC: Ouroboros (Cosmic Serpent Eating Tail in Infinity Winding)
  function createOuroboros() {
    const verts = [];
    const edges = [];
    const steps = 60;
    const tubeRadius = 0.32;
    const majorRadius = 1.3;

    // Generate circular spine with scale ribs
    for (let i = 0; i < steps; i++) {
      const u = (i / steps) * Math.PI * 2;
      // Slight figure-8 twist
      const cx = Math.sin(u) * majorRadius;
      const cy = Math.sin(u * 2) * 0.4;
      const cz = Math.cos(u) * majorRadius;

      // Cross-sectional rib (4 points per rib)
      const r = tubeRadius * (0.6 + 0.4 * Math.sin(u * 0.5)); // Tapers toward tail
      const ribStart = verts.length;
      verts.push([cx, cy + r, cz]);
      verts.push([cx + r * Math.cos(u), cy, cz - r * Math.sin(u)]);
      verts.push([cx, cy - r, cz]);
      verts.push([cx - r * Math.cos(u), cy, cz + r * Math.sin(u)]);

      // Edges around the rib ring
      edges.push([ribStart, ribStart + 1]);
      edges.push([ribStart + 1, ribStart + 2]);
      edges.push([ribStart + 2, ribStart + 3]);
      edges.push([ribStart + 3, ribStart]);

      // Connect to previous rib
      if (i > 0) {
        const prevStart = ribStart - 4;
        edges.push([prevStart, ribStart]);
        edges.push([prevStart + 1, ribStart + 1]);
        edges.push([prevStart + 2, ribStart + 2]);
        edges.push([prevStart + 3, ribStart + 3]);
      }
    }
    // Connect last rib to head (serpent clasp)
    const lastStart = verts.length - 4;
    edges.push([lastStart, 0]);
    edges.push([lastStart + 1, 1]);
    edges.push([lastStart + 2, 2]);
    edges.push([lastStart + 3, 3]);

    // Head Crown & Ocular Node
    const headIdx = verts.length;
    verts.push([0, 0.7, majorRadius + 0.35]); // Crown
    verts.push([-0.25, 0.4, majorRadius + 0.25]); // Left eye
    verts.push([0.25, 0.4, majorRadius + 0.25]); // Right eye
    edges.push([0, headIdx], [0, headIdx + 1], [0, headIdx + 2], [headIdx + 1, headIdx + 2]);

    return { type: '3d', verts, edges, label: 'HERMETIC OUROBOROS' };
  }

  // 7. HERMETIC: Tree of Life (10 Sephiroth & 22 Sacred Pathways)
  function createTreeOfLife() {
    const rawNodes = [
      [0, 1.7, 0],         // 0: Keter (Crown)
      [1.0, 1.25, 0.25],   // 1: Chokhmah (Wisdom)
      [-1.0, 1.25, -0.25], // 2: Binah (Understanding)
      [1.1, 0.45, 0.25],   // 3: Chesed (Mercy)
      [-1.1, 0.45, -0.25], // 4: Gevurah (Strength)
      [0, 0.15, 0],        // 5: Tiferet (Beauty)
      [1.0, -0.65, 0.25],  // 6: Netzach (Victory)
      [-1.0, -0.65, -0.25],// 7: Hod (Glory)
      [0, -0.95, 0],       // 8: Yesod (Foundation)
      [0, -1.75, 0]        // 9: Malkuth (Kingdom)
    ];

    // 22 Traditional Sacred Pathways
    const paths = [
      [0, 1], [0, 2], [1, 2], [0, 5], [1, 5], [2, 5], [1, 3], [2, 4],
      [3, 4], [3, 5], [4, 5], [3, 6], [4, 7], [5, 6], [5, 7], [5, 8],
      [6, 7], [6, 8], [7, 8], [6, 9], [7, 9], [8, 9]
    ];

    const verts = [...rawNodes];
    const edges = [...paths];

    // Add spherical micro-rings around each Sephira
    rawNodes.forEach((node, ni) => {
      const ringStart = verts.length;
      const r = 0.16;
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        verts.push([node[0] + Math.cos(ang) * r, node[1] + Math.sin(ang) * r, node[2]]);
        edges.push([ringStart + k, ringStart + ((k + 1) % 6)]);
        edges.push([ni, ringStart + k]);
      }
    });

    return { type: '3d', verts, edges, label: 'KABBALISTIC TREE OF LIFE' };
  }

  // 8. HERMETIC: The Great Alchemical Seal (Hermes Trismegistus)
  function createHermeticSeal() {
    const verts = [];
    const edges = [];
    let idx = 0;

    // 1. Concentric Planetary Rings (Outer Octagram)
    const outerSegs = 24;
    const outerRadius = 1.55;
    const outerStart = idx;
    for (let i = 0; i < outerSegs; i++) {
      const ang = (i / outerSegs) * Math.PI * 2;
      verts.push([Math.cos(ang) * outerRadius, Math.sin(ang) * outerRadius, 0]);
      edges.push([idx, i === outerSegs - 1 ? outerStart : idx + 1]);
      idx++;
    }

    // 2. Middle Ring (Tilted 3D Orbit)
    const midSegs = 18;
    const midRadius = 1.15;
    const midStart = idx;
    for (let i = 0; i < midSegs; i++) {
      const ang = (i / midSegs) * Math.PI * 2;
      verts.push([Math.cos(ang) * midRadius, Math.sin(ang) * midRadius * 0.8, Math.sin(ang) * 0.6]);
      edges.push([idx, i === midSegs - 1 ? midStart : idx + 1]);
      idx++;
    }

    // 3. Central Sacred Triad (Fire Triangle & Water Triangle)
    const s = 1.0;
    const triadStart = idx;
    // Upright Triangle (Fire 🜂)
    verts.push([0, s, 0.2]);
    verts.push([s * 0.866, -s * 0.5, 0.2]);
    verts.push([-s * 0.866, -s * 0.5, 0.2]);
    edges.push([triadStart, triadStart + 1], [triadStart + 1, triadStart + 2], [triadStart + 2, triadStart]);

    // Inverted Triangle (Water 🜄)
    verts.push([0, -s, -0.2]);
    verts.push([s * 0.866, s * 0.5, -0.2]);
    verts.push([-s * 0.866, s * 0.5, -0.2]);
    edges.push([triadStart + 3, triadStart + 4], [triadStart + 4, triadStart + 5], [triadStart + 5, triadStart + 3]);

    // Connect vertices between triangles to create 3D alchemical volume
    edges.push([triadStart, triadStart + 3]);
    edges.push([triadStart + 1, triadStart + 4]);
    edges.push([triadStart + 2, triadStart + 5]);

    // Center Mercury node ☿
    const centerIdx = verts.length;
    verts.push([0, 0, 0]);
    edges.push([triadStart, centerIdx]);
    edges.push([triadStart + 3, centerIdx]);

    return { type: '3d', verts, edges, label: 'SEAL OF HERMES TRISMEGISTUS' };
  }

  // 9. AZOTH — The Universal Solvent & Hermetic Caduceus of Hermes
  function createAzoth() {
    const verts = [];
    const edges = [];
    let idx = 0;

    // 1. Central Caduceus Spine (Y from -1.4 to 1.3)
    const spineSegs = 9;
    const spineStart = idx;
    for (let i = 0; i <= spineSegs; i++) {
      const y = -1.4 + (i / spineSegs) * 2.7;
      verts.push([0, y, 0]);
      if (i > 0) edges.push([idx - 1, idx]);
      idx++;
    }

    // 2. Twin Intertwined Kundalini Serpents (Dual 3D Helices)
    const helixSegs = 18;
    for (let i = 0; i <= helixSegs; i++) {
      const t = (i / helixSegs);
      const y = -1.1 + t * 1.9;
      const ang = t * Math.PI * 4;
      const r = 0.45 * Math.sin(t * Math.PI) + 0.15;
      verts.push([Math.cos(ang) * r, y, Math.sin(ang) * r]);
      if (i > 0) edges.push([idx - 1, idx]);
      idx++;
    }

    for (let i = 0; i <= helixSegs; i++) {
      const t = (i / helixSegs);
      const y = -1.1 + t * 1.9;
      const ang = t * Math.PI * 4 + Math.PI; // 180 deg phase
      const r = 0.45 * Math.sin(t * Math.PI) + 0.15;
      verts.push([Math.cos(ang) * r, y, Math.sin(ang) * r]);
      if (i > 0) edges.push([idx - 1, idx]);
      idx++;
    }

    // 3. Alchemical Wings of the Ascended Mind
    const lWing = [
      [-0.4, 0.9, 0.1], [-0.85, 1.25, 0.2], [-1.35, 1.45, 0.0], [-0.95, 0.8, -0.15], [-0.5, 0.65, -0.05]
    ];
    const lwStart = idx;
    lWing.forEach(p => { verts.push(p); idx++; });
    edges.push([spineStart + spineSegs - 1, lwStart]);
    for (let i = 0; i < lWing.length - 1; i++) edges.push([lwStart + i, lwStart + i + 1]);
    edges.push([lwStart + lWing.length - 1, spineStart + spineSegs - 3]);

    // Right Wing (Symmetric)
    const rwStart = idx;
    lWing.forEach(p => { verts.push([-p[0], p[1], p[2]]); idx++; });
    edges.push([spineStart + spineSegs - 1, rwStart]);
    for (let i = 0; i < lWing.length - 1; i++) edges.push([rwStart + i, rwStart + i + 1]);
    edges.push([rwStart + lWing.length - 1, spineStart + spineSegs - 3]);

    // 4. Solar Alchemical Crown Disc & 7-Pointed Star at Summit
    const crownCenter = idx;
    verts.push([0, 1.4, 0]);
    idx++;

    const starPoints = 7;
    const starStart = idx;
    for (let i = 0; i < starPoints; i++) {
      const ang = (i / starPoints) * Math.PI * 2 - Math.PI / 2;
      const r = 0.32;
      verts.push([Math.cos(ang) * r, 1.4 + Math.sin(ang) * r, Math.sin(ang * 2) * 0.12]);
      edges.push([crownCenter, idx]);
      edges.push([idx, i === starPoints - 1 ? starStart : idx + 1]);
      idx++;
    }

    // 5. Lunar Alchemical Crescent at Base
    const crescentStart = idx;
    const crescSegs = 7;
    for (let i = 0; i <= crescSegs; i++) {
      const ang = Math.PI + (i / crescSegs) * Math.PI;
      const r = 0.38;
      verts.push([Math.cos(ang) * r, -1.45 + Math.sin(ang) * (r * 0.45), Math.cos(ang * 2) * 0.1]);
      if (i > 0) edges.push([idx - 1, idx]);
      idx++;
    }
    edges.push([spineStart, crescentStart + Math.floor(crescSegs / 2)]);

    return { type: '3d', verts, edges, label: 'AZOTH // SUPREME CADUCEUS' };
  }

  /**
   * 10. GhostByte: Parametric 3D Hologram Ghost from nullai.tech
   * Dome head + 5 scalloped ripples + glowing cyber eyes
   */
  function createGhostByte() {
    const verts = [];
    const edges = [];
    const rings = 16;
    const segs = 18;
    const grid = [];

    // Parametric Ghost equation from nullai.tech
    for (let s = 0; s <= rings; s++) {
      const c = s / rings;
      const ring = [];
      for (let f = 0; f < segs; f++) {
        const p = (f / segs) * Math.PI * 2;
        let m = 0, g = 0;
        if (c < 0.45) {
          // Dome head
          const z = (c / 0.45) * (Math.PI * 0.5);
          m = Math.sin(z) * 0.95;
          g = -Math.cos(z) * 1.05 - 0.2;
        } else {
          // Flowing ghostly ripples with 5 scalloped folds
          const z = (c - 0.45) / 0.55;
          m = 0.95 * (1 + z * 0.22 * Math.sin(p * 5));
          const wave = Math.cos(p * 5) * 0.25;
          g = -0.2 + (0.85 + wave) * z * 1.35;
        }
        const vx = Math.sin(p) * m * 1.05;
        const vy = -g * 0.95; // Invert Y so dome is upright
        const vz = Math.cos(p) * m * 0.9;

        const vIdx = verts.length;
        verts.push([vx, vy, vz]);
        ring.push(vIdx);
      }
      grid.push(ring);
    }

    // Connect rings & segments into wireframe mesh
    for (let s = 0; s <= rings; s++) {
      for (let f = 0; f < segs; f++) {
        edges.push([grid[s][f], grid[s][(f + 1) % segs]]);
        if (s < rings) {
          edges.push([grid[s][f], grid[s + 1][f]]);
        }
      }
    }

    // Floating Cyber Eyes
    const eyeY = 0.35;
    const eyeZ = 0.95;
    const eyeL = verts.length;
    verts.push([-0.32, eyeY, eyeZ]);
    verts.push([-0.24, eyeY + 0.08, eyeZ]);
    verts.push([-0.24, eyeY - 0.08, eyeZ]);
    verts.push([-0.40, eyeY, eyeZ]);
    edges.push([eyeL, eyeL + 1], [eyeL + 1, eyeL + 3], [eyeL + 3, eyeL + 2], [eyeL + 2, eyeL]);

    const eyeR = verts.length;
    verts.push([0.32, eyeY, eyeZ]);
    verts.push([0.40, eyeY, eyeZ]);
    verts.push([0.24, eyeY + 0.08, eyeZ]);
    verts.push([0.24, eyeY - 0.08, eyeZ]);
    edges.push([eyeR, eyeR + 1], [eyeR + 1, eyeR + 2], [eyeR + 2, eyeR + 3], [eyeR + 3, eyeR]);

    return { type: '3d', verts, edges, label: 'GHOSTBYTE // NULLAI SOVEREIGN SENTINEL' };
  }

  /* ---------------- 3D Engine Class ---------------- */

  class AsciiEngine {
    constructor(preElement, options = {}) {
      this.el = preElement;
      this.width = options.width || 52;
      this.height = options.height || 24;
      this.geomType = options.geom || 'tesseract';
      this.renderMode = options.mode || 'braille'; // 'braille', 'ascii', 'dither'

      this.rotX = options.rotX !== undefined ? options.rotX : 0.2;
      this.rotY = options.rotY !== undefined ? options.rotY : 0.4;
      this.rotZ = options.rotZ !== undefined ? options.rotZ : 0.1;
      this.rotW = 0.0; // 4D rotation

      this.velX = options.velX !== undefined ? options.velX : 0.007;
      this.velY = options.velY !== undefined ? options.velY : 0.013;
      this.velZ = options.velZ !== undefined ? options.velZ : 0.005;

      this.pointer = { isDown: false, lastX: 0, lastY: 0 };
      this.running = false;
      this.animId = null;

      this.geometries = {
        tesseract: createTesseract(),
        torus: createTorusKnot(),
        skull: createCyberSkull(),
        globe: createDitherGlobe(),
        merkaba: createMerkaba(),
        ouroboros: createOuroboros(),
        tree_of_life: createTreeOfLife(),
        hermetic_seal: createHermeticSeal(),
        azoth: createAzoth(),
        ghostbyte: createGhostByte()
      };

      this.currentGeom = this.geometries[this.geomType] || this.geometries.tesseract;

      this._bindEvents();
    }

    _bindEvents() {
      if (!this.el) return;
      this.el.addEventListener('mousedown', (e) => {
        this.pointer.isDown = true;
        this.pointer.lastX = e.clientX;
        this.pointer.lastY = e.clientY;
      });
      window.addEventListener('mousemove', (e) => {
        if (!this.pointer.isDown) {
          const rect = this.el.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
              e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;
            this.rotY += relX * 0.02;
            this.rotX += relY * 0.02;
          }
          return;
        }
        const dx = e.clientX - this.pointer.lastX;
        const dy = e.clientY - this.pointer.lastY;
        this.rotY += dx * 0.015;
        this.rotX += dy * 0.015;
        this.pointer.lastX = e.clientX;
        this.pointer.lastY = e.clientY;
      });
      window.addEventListener('mouseup', () => {
        this.pointer.isDown = false;
      });

      this.el.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.pointer.isDown = true;
          this.pointer.lastX = e.touches[0].clientX;
          this.pointer.lastY = e.touches[0].clientY;
        }
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (!this.pointer.isDown || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - this.pointer.lastX;
        const dy = e.touches[0].clientY - this.pointer.lastY;
        this.rotY += dx * 0.02;
        this.rotX += dy * 0.02;
        this.pointer.lastX = e.touches[0].clientX;
        this.pointer.lastY = e.touches[0].clientY;
      }, { passive: true });
      window.addEventListener('touchend', () => {
        this.pointer.isDown = false;
      });
    }

    setGeom(type) {
      if (this.geometries[type]) {
        this.geomType = type;
        this.currentGeom = this.geometries[type];
        this.render();
      }
    }

    setMode(mode) {
      if (['braille', 'ascii', 'dither', 'holo'].includes(mode)) {
        this.renderMode = mode;
        if (this.el) {
          this.el.classList.toggle('holo-active', mode === 'holo');
        }
        this.render();
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.render();
      let last3DFrame = 0;
      const loop = (time) => {
        if (!this.running) return;

        // Thermal Optimization: Skip when tab is hidden
        if (document.hidden) {
          this.animId = requestAnimationFrame(loop);
          return;
        }

        // Throttle to 24 FPS (authentic CRT terminal speed, saving 70% CPU)
        if (time - last3DFrame < 41) {
          this.animId = requestAnimationFrame(loop);
          return;
        }
        last3DFrame = time;

        // Viewport culling: do not calculate or render if scrolled out of view
        if (this.el) {
          const rect = this.el.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight || 800;
          if (rect.height > 0 && (rect.bottom < -100 || rect.top > vh + 100)) {
            this.animId = requestAnimationFrame(loop);
            return;
          }
        }

        this.update();
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
    }

    update() {
      if (!this.pointer.isDown) {
        this.rotX += this.velX;
        this.rotY += this.velY;
        this.rotZ += this.velZ;
        this.rotW += 0.012; // 4D rotation angle
      }
    }

    project4Dto3D(v4) {
      const cosW = Math.cos(this.rotW);
      const sinW = Math.sin(this.rotW);
      let x = v4[0] * cosW - v4[3] * sinW;
      let y = v4[1];
      let z = v4[2] * cosW + v4[3] * sinW;
      let w = v4[0] * sinW + v4[3] * cosW;

      const dist = 2.4;
      const scale = 1 / (dist - w * 0.45);
      return [x * scale * 1.5, y * scale * 1.5, z * scale * 1.5];
    }

    project3Dto2D(v, cx, cy, scaleX, scaleY) {
      const cx_ = Math.cos(this.rotX), sx_ = Math.sin(this.rotX);
      const cy_ = Math.cos(this.rotY), sy_ = Math.sin(this.rotY);
      const cz_ = Math.cos(this.rotZ), sz_ = Math.sin(this.rotZ);

      let x1 = v[0] * cy_ + v[2] * sy_;
      let y1 = v[1];
      let z1 = -v[0] * sy_ + v[2] * cy_;

      let x2 = x1;
      let y2 = y1 * cx_ - z1 * sx_;
      let z2 = y1 * sx_ + z1 * cx_;

      let x3 = x2 * cz_ - y2 * sz_;
      let y3 = x2 * sz_ + y2 * cz_;
      let z3 = z2;

      const cameraDist = 3.6;
      const ooz = 1 / (cameraDist - z3);
      const screenX = cx + x3 * ooz * scaleX;
      const screenY = cy - y3 * ooz * scaleY;

      return { x: screenX, y: screenY, z: z3, ooz };
    }

    render() {
      if (!this.el) return;

      const geom = this.currentGeom;
      if (this.geomType === 'skull' || this.geomType === 'ghostbyte') {
        this.renderVolumetricSdf(this.geomType);
        return;
      }

      let projected3DVerts = [];
      if (geom.type === '4d') {
        projected3DVerts = geom.verts4D.map(v => this.project4Dto3D(v));
      } else {
        projected3DVerts = geom.verts;
      }

      if (this.renderMode === 'braille') {
        this.renderBraille(projected3DVerts, geom.edges);
      } else if (this.renderMode === 'dither') {
        this.renderDither(projected3DVerts, geom.edges);
      } else if (this.renderMode === 'holo') {
        this.renderHolo(projected3DVerts, geom.edges);
      } else {
        this.renderAscii(projected3DVerts, geom.edges);
      }
    }

    // -------------------------------------------------------------------------
    // Uncommon Web (webdev.teknium.io) 3D Volumetric SDF + Bayer + Sobel Engine
    // -------------------------------------------------------------------------
    _sdfSmoothMin(a, b, k) {
      const h = Math.max(k - Math.abs(a - b), 0.0) / k;
      return Math.min(a, b) - h * h * k * 0.25;
    }

    _sdfSmoothMax(a, b, k) {
      return -this._sdfSmoothMin(-a, -b, k);
    }

    _evalSdfSkull(x, y, z) {
      const ax = Math.abs(x);
      // 1. Cranium vault (rounded neurocranium dome)
      const cranium = (Math.hypot(x / 0.64, (y - 0.20) / 0.56, (z + 0.04) / 0.68) - 1.0) * 0.58;
      // 2. Supraorbital brow ridge
      const browY = 0.13 - 0.04 * Math.cos(Math.min(ax * 5.0, 3.14));
      const brow = (Math.hypot(x / 0.50, (y - browY) / 0.13, (z - 0.44) / 0.24) - 1.0) * 0.18;
      // 3. Zygomatic cheekbones
      const cheek = (Math.hypot((ax - 0.36) / 0.19, (y + 0.08) / 0.15, (z - 0.34) / 0.26) - 1.0) * 0.16;
      // 4. Maxilla & Mandible (jaw tapering to chin)
      const jawT = Math.max(0, Math.min(1, (-y - 0.05) / 0.62));
      const jawW = 0.38 * (1.0 - 0.38 * jawT);
      const jawZ = 0.34 - 0.06 * jawT;
      const jaw = (Math.hypot(x / jawW, (y + 0.34) / 0.34, (z - jawZ) / 0.28) - 1.0) * 0.24;

      let d = this._sdfSmoothMin(cranium, brow, 0.12);
      d = this._sdfSmoothMin(d, cheek, 0.10);
      d = this._sdfSmoothMin(d, jaw, 0.12);

      // 5. Subtract deep orbital eye sockets
      const eyeSocket = (Math.hypot((ax - 0.23) / 0.185, (y - 0.01) / 0.165, (z - 0.50) / 0.24) - 1.0) * 0.17;
      // 6. Subtract piriform nasal cavity
      const ny = y + 0.16;
      const nw = Math.max(0.02, 0.11 - (ny + 0.06) * 0.45);
      const noseSocket = (Math.hypot(x / nw, ny / 0.13, (z - 0.55) / 0.22) - 1.0) * 0.11;
      // 7. Sub-zygomatic hollow
      const hollow = (Math.hypot((ax - 0.34) / 0.16, (y + 0.32) / 0.18, (z - 0.26) / 0.20) - 1.0) * 0.15;

      d = this._sdfSmoothMax(d, -eyeSocket, 0.04);
      d = this._sdfSmoothMax(d, -noseSocket, 0.025);
      d = this._sdfSmoothMax(d, -hollow, 0.06);
      return d;
    }

    _evalSdfGhostByte(x, y, z, time) {
      const angle = Math.atan2(x, z);
      const skirtFactor = Math.max(0, Math.min(1, (-y + 0.08) / 0.68));
      const wave = Math.sin(angle * 5.0 + time * 2.4) * 0.085 * skirtFactor;
      const radius = 0.48 + skirtFactor * 0.11 + wave;
      const bottomCut = -0.58 + Math.cos(angle * 5.0 + time * 2.4) * 0.095;
      if (y < bottomCut - 0.12) return 0.45;

      let d;
      if (y > 0.12) {
        d = (Math.hypot(x / 0.48, (y - 0.12) / 0.48, z / 0.48) - 1.0) * 0.46;
      } else {
        const rDist = Math.hypot(x, z) - radius;
        const bDist = bottomCut - y;
        d = Math.max(rDist, bDist);
      }
      return d;
    }

    _sampleVolumetricAt(kind, sx, sy, time) {
      if (sx * sx + sy * sy > 0.90) return 0;
      const rx = Math.max(-0.55, Math.min(0.55, this.rotX * 0.35));
      const ry = Math.sin(this.rotY) * 0.52;
      const cx = Math.cos(rx), sx_ = Math.sin(rx);
      const cy = Math.cos(ry), sy_ = Math.sin(ry);

      const toLocal = (vx, vy, vz) => {
        const y1 = vy * cx + vz * sx_;
        const z1 = -vy * sx_ + vz * cx;
        const x2 = vx * cy - z1 * sy_;
        const z2 = vx * sy_ + z1 * cy;
        return [x2, y1, z2];
      };

      const evalFn = kind === 'skull'
        ? (x, y, z) => this._evalSdfSkull(x, y, z)
        : (x, y, z) => this._evalSdfGhostByte(x, y, z, time);

      let t = 0.0, hit = false;
      const roZ = 1.5;
      let lx = 0, ly = 0, lz = 0;
      for (let i = 0; i < 20; i++) {
        const vz = roZ - t;
        const p = toLocal(sx, sy, vz);
        lx = p[0]; ly = p[1]; lz = p[2];
        const d = evalFn(lx, ly, lz);
        if (d < 0.01) { hit = true; break; }
        t += Math.max(0.022, d * 0.85);
        if (t > 2.3) break;
      }
      if (!hit) return 0;

      const ax = Math.abs(lx);
      if (kind === 'skull') {
        // Deep orbital eye cavities & piriform nasal aperture -> dark void
        const inEye = Math.hypot((ax - 0.23) / 0.18, (ly - 0.01) / 0.16) < 0.96 && lz > 0.20 && lz < 0.49;
        const ny = ly + 0.16;
        const nw = Math.max(0.02, 0.11 - (ny + 0.06) * 0.45);
        const inNose = Math.hypot(lx / nw, ny / 0.125) < 0.95 && ny < 0.10 && ny > -0.12 && lz > 0.24 && lz < 0.52;
        if (inEye || inNose) return 0.0;

        // Articulated dental arch (teeth & occlusal groove)
        if (ly < -0.27 && ly > -0.47 && ax < 0.23 && lz > 0.32) {
          if (Math.abs(ly + 0.37) < 0.028 || Math.sin(ax * 42) > 0.55) return 0.04;
          return 0.94;
        }
      } else {
        // GhostByte dark cyber eyes with glowing pupils
        const eyeDist = Math.hypot((ax - 0.17) / 0.095, (ly - 0.14) / 0.125);
        if (eyeDist < 1.0 && lz > 0.25) {
          return eyeDist < 0.38 ? 1.0 : 0.0;
        }
      }

      const eps = 0.016;
      const nx = evalFn(lx + eps, ly, lz) - evalFn(lx - eps, ly, lz);
      const ny_ = evalFn(lx, ly + eps, lz) - evalFn(lx, ly - eps, lz);
      const nz = evalFn(lx, ly, lz + eps) - evalFn(lx, ly, lz - eps);
      const len = Math.hypot(nx, ny_, nz) || 1;

      const lxDir = 0.32 + Math.sin(time * 1.4) * 0.18;
      const lyDir = 0.42 + Math.cos(time * 1.1) * 0.12;
      const lzDir = 0.84;
      const ndotl = (nx * lxDir + ny_ * lyDir + nz * lzDir) / len;
      const rim = Math.pow(1.0 - Math.max(0, nz / len), 2.2) * 0.45;
      return Math.max(0.12, Math.min(1.0, ndotl * 0.85 + rim + 0.10));
    }

    renderVolumetricSdf(kind) {
      const time = performance.now() * 0.001;
      const charCols = this.width;
      const charRows = this.height;

      if (this.renderMode === 'braille') {
        const pw = charCols * 2;
        const ph = charRows * 4;
        const buf = new Uint8Array(pw * ph);
        for (let y = 0; y < ph; y++) {
          const sy = (0.5 - y / (ph - 1)) * 1.62;
          const by = y % 4;
          for (let x = 0; x < pw; x++) {
            const sx = (x / (pw - 1) - 0.5) * 1.82;
            const lum = this._sampleVolumetricAt(kind, sx, sy, time);
            const thr = BAYER_4X4[by][x % 4] * 0.75 + 0.12;
            buf[y * pw + x] = lum > thr ? 1 : 0;
          }
        }
        let out = '';
        for (let cr = 0; cr < charRows; cr++) {
          let row = '';
          const y0 = cr * 4;
          for (let cc = 0; cc < charCols; cc++) {
            const x0 = cc * 2;
            row += packBraille(
              buf[(y0 + 0) * pw + x0], buf[(y0 + 1) * pw + x0], buf[(y0 + 2) * pw + x0], buf[(y0 + 3) * pw + x0],
              buf[(y0 + 0) * pw + x0 + 1], buf[(y0 + 1) * pw + x0 + 1], buf[(y0 + 2) * pw + x0 + 1], buf[(y0 + 3) * pw + x0 + 1]
            );
          }
          out += row + (cr < charRows - 1 ? '\n' : '');
        }
        this.el.textContent = out;
        return;
      }

      // Sample 2D grid for Dither, Sobel ASCII, and Holo modes
      const lumGrid = Array.from({ length: charRows }, (_, r) => {
        const sy = (0.5 - r / (charRows - 1)) * 1.62;
        return Array.from({ length: charCols }, (_, c) => {
          const sx = (c / (charCols - 1) - 0.5) * 1.82;
          return this._sampleVolumetricAt(kind, sx, sy, time);
        });
      });

      if (this.renderMode === 'dither') {
        let out = '';
        for (let r = 0; r < charRows; r++) {
          let row = '';
          for (let c = 0; c < charCols; c++) {
            const lum = lumGrid[r][c];
            const thr = BAYER_4X4[r % 4][c % 4] * 0.35;
            if (lum <= 0.06) row += ' ';
            else if (lum + thr > 0.88) row += '█';
            else if (lum + thr > 0.62) row += '▓';
            else if (lum + thr > 0.36) row += '▒';
            else row += '░';
          }
          out += row + (r < charRows - 1 ? '\n' : '');
        }
        this.el.textContent = out;
        return;
      }

      if (this.renderMode === 'holo') {
        const scanRow = Math.floor((performance.now() * 0.015) % charRows);
        let out = '';
        for (let r = 0; r < charRows; r++) {
          let row = '';
          const isScan = r === scanRow;
          for (let c = 0; c < charCols; c++) {
            const lum = lumGrid[r][c];
            if (lum <= 0.06) { row += ' '; continue; }
            if (isScan) { row += lum > 0.55 ? '■' : '◈'; continue; }
            if (lum > 0.82) row += (r % 2 === 0) ? '═' : '━';
            else if (lum > 0.52) row += '─';
            else if (lum > 0.28) row += '·';
            else row += '⋅';
          }
          out += row + (r < charRows - 1 ? '\n' : '');
        }
        this.el.textContent = out;
        return;
      }

      // Sobel Directional Contours + Density Ramp ASCII Mode
      const ramp = ' .:-=+*#%@';
      let out = '';
      for (let r = 0; r < charRows; r++) {
        let row = '';
        for (let c = 0; c < charCols; c++) {
          const lum = lumGrid[r][c];
          if (lum <= 0.05) { row += ' '; continue; }
          if (r > 0 && r < charRows - 1 && c > 0 && c < charCols - 1) {
            const gx = -lumGrid[r - 1][c - 1] + lumGrid[r - 1][c + 1] - 2 * lumGrid[r][c - 1] + 2 * lumGrid[r][c + 1] - lumGrid[r + 1][c - 1] + lumGrid[r + 1][c + 1];
            const gy = -lumGrid[r - 1][c - 1] - 2 * lumGrid[r - 1][c] - lumGrid[r - 1][c + 1] + lumGrid[r + 1][c - 1] + 2 * lumGrid[r + 1][c] + lumGrid[r + 1][c + 1];
            const mag = Math.hypot(gx, gy);
            if (mag > 0.75 && lum < 0.78) {
              const ang = (Math.atan2(gy, gx) * 180 / Math.PI + 180) % 180;
              if (ang >= 22.5 && ang < 67.5) { row += '/'; continue; }
              if (ang >= 67.5 && ang < 112.5) { row += '-'; continue; }
              if (ang >= 112.5 && ang < 157.5) { row += '\\'; continue; }
              row += '|'; continue;
            }
          }
          row += ramp[Math.floor(lum * (ramp.length - 1))];
        }
        out += row + (r < charRows - 1 ? '\n' : '');
      }
      this.el.textContent = out;
    }

    // High-Resolution Sub-Pixel Braille Mode (2x4 dot packing with Anti-Aliased Dithering)
    renderBraille(verts, edges) {
      const charCols = this.width;
      const charRows = this.height;
      const pixelWidth = charCols * 2;
      const pixelHeight = charRows * 4;

      const lumBuf = new Float32Array(pixelWidth * pixelHeight);
      const buf = new Uint8Array(pixelWidth * pixelHeight);

      const cx = pixelWidth * 0.5;
      const cy = pixelHeight * 0.5;
      const scaleX = pixelWidth * 0.72;
      const scaleY = pixelHeight * 0.72;

      const pts2D = verts.map(v => this.project3Dto2D(v, cx, cy, scaleX, scaleY));

      // 1. Draw Anti-Aliased Vector Wireframe Lines
      edges.forEach(([i, j]) => {
        const p1 = pts2D[i];
        const p2 = pts2D[j];
        if (!p1 || !p2) return;
        this._drawLineBrailleAA(lumBuf, pixelWidth, pixelHeight, p1, p2);
      });

      // 2. Illuminate Vertex Nodes with Sub-Pixel Hermetic Star Glow
      pts2D.forEach(p => {
        const vx = Math.round(p.x);
        const vy = Math.round(p.y);
        if (vx >= 0 && vx < pixelWidth && vy >= 0 && vy < pixelHeight) {
          const idx = vy * pixelWidth + vx;
          lumBuf[idx] = Math.min(2.0, lumBuf[idx] + 1.2);
          // 4-connected sub-pixel star points
          if (vx > 0) lumBuf[idx - 1] = Math.min(1.5, lumBuf[idx - 1] + 0.4);
          if (vx < pixelWidth - 1) lumBuf[idx + 1] = Math.min(1.5, lumBuf[idx + 1] + 0.4);
          if (vy > 0) lumBuf[idx - pixelWidth] = Math.min(1.5, lumBuf[idx - pixelWidth] + 0.4);
          if (vy < pixelHeight - 1) lumBuf[idx + pixelWidth] = Math.min(1.5, lumBuf[idx + pixelWidth] + 0.4);
        }
      });

      // 3. 4x4 Bayer Dither Thresholding into Sub-Pixel Braille Bits
      for (let y = 0; y < pixelHeight; y++) {
        const by = y % 4;
        for (let x = 0; x < pixelWidth; x++) {
          const bx = x % 4;
          const lum = lumBuf[y * pixelWidth + x];
          const threshold = BAYER_4X4[by][bx] * 0.35 + 0.35;
          buf[y * pixelWidth + x] = lum > threshold ? 1 : 0;
        }
      }

      // 4. Pack 2x4 Sub-pixel Blocks into Unicode Braille Glyphs (keep U+2800 blank for exact column alignment)
      let out = '';
      for (let cr = 0; cr < charRows; cr++) {
        let row = '';
        const y0 = cr * 4;
        for (let cc = 0; cc < charCols; cc++) {
          const x0 = cc * 2;
          const b00 = buf[(y0 + 0) * pixelWidth + (x0 + 0)];
          const b01 = buf[(y0 + 1) * pixelWidth + (x0 + 0)];
          const b02 = buf[(y0 + 2) * pixelWidth + (x0 + 0)];
          const b03 = buf[(y0 + 3) * pixelWidth + (x0 + 0)];
          const b10 = buf[(y0 + 0) * pixelWidth + (x0 + 1)];
          const b11 = buf[(y0 + 1) * pixelWidth + (x0 + 1)];
          const b12 = buf[(y0 + 2) * pixelWidth + (x0 + 1)];
          const b13 = buf[(y0 + 3) * pixelWidth + (x0 + 1)];

          row += packBraille(b00, b01, b02, b03, b10, b11, b12, b13);
        }
        out += row + (cr < charRows - 1 ? '\n' : '');
      }

      this.el.textContent = out;
    }

    _drawLineBrailleAA(lumBuf, pw, ph, p1, p2) {
      let x0 = Math.floor(p1.x), y0 = Math.floor(p1.y);
      const x1 = Math.floor(p2.x), y1 = Math.floor(p2.y);
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;

      const dist = Math.hypot(x1 - x0, y1 - y0) || 1;
      let step = 0;

      while (true) {
        if (x0 >= 0 && x0 < pw && y0 >= 0 && y0 < ph) {
          const t = step / dist;
          const zDepth = p1.z * (1 - t) + p2.z * t;
          const depthBoost = Math.max(0.6, Math.min(1.4, 1.0 + zDepth * 0.25));

          const idx = y0 * pw + x0;
          lumBuf[idx] = Math.min(2.0, lumBuf[idx] + 0.9 * depthBoost);

          // Sub-pixel anti-aliasing to adjacent cross neighbors
          if (x0 > 0) lumBuf[idx - 1] = Math.min(1.0, lumBuf[idx - 1] + 0.2 * depthBoost);
          if (x0 < pw - 1) lumBuf[idx + 1] = Math.min(1.0, lumBuf[idx + 1] + 0.2 * depthBoost);
          if (y0 > 0) lumBuf[idx - pw] = Math.min(1.0, lumBuf[idx - pw] + 0.2 * depthBoost);
          if (y0 < ph - 1) lumBuf[idx + pw] = Math.min(1.0, lumBuf[idx + pw] + 0.2 * depthBoost);
        }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
        step++;
      }
    }

    // Shaded ASCII Mode with Depth & Directional Luminance
    renderAscii(verts, edges) {
      const cols = this.width;
      const rows = this.height;
      const charBuf = new Array(cols * rows).fill(' ');
      const zBuf = new Float32Array(cols * rows).fill(-9999);

      const cx = cols * 0.5;
      const cy = rows * 0.5;
      const scaleX = cols * 0.72;
      const scaleY = rows * 0.72;

      const pts2D = verts.map(v => this.project3Dto2D(v, cx, cy, scaleX, scaleY));

      edges.forEach(([i, j]) => {
        const p1 = pts2D[i];
        const p2 = pts2D[j];
        if (!p1 || !p2) return;
        this._drawLineAscii(charBuf, zBuf, cols, rows, p1, p2);
      });

      pts2D.forEach(p => {
        const x = Math.floor(p.x), y = Math.floor(p.y);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          const idx = y * cols + x;
          if (p.z > zBuf[idx]) {
            zBuf[idx] = p.z;
            charBuf[idx] = '◈';
          }
        }
      });

      let out = '';
      for (let r = 0; r < rows; r++) {
        let row = '';
        for (let c = 0; c < cols; c++) {
          row += charBuf[r * cols + c];
        }
        out += row + (r < rows - 1 ? '\n' : '');
      }

      this.el.textContent = out;
    }

    _drawLineAscii(charBuf, zBuf, cols, rows, p1, p2) {
      let x0 = Math.floor(p1.x), y0 = Math.floor(p1.y);
      const x1 = Math.floor(p2.x), y1 = Math.floor(p2.y);
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;

      const dist = Math.hypot(x1 - x0, y1 - y0) || 1;
      let step = 0;

      let lineGlyph = '*';
      if (dx > dy * 2) lineGlyph = '─';
      else if (-dy > dx * 2) lineGlyph = '│';
      else if ((sx > 0 && sy > 0) || (sx < 0 && sy < 0)) lineGlyph = '╲';
      else lineGlyph = '╱';

      while (true) {
        if (x0 >= 0 && x0 < cols && y0 >= 0 && y0 < rows) {
          const t = step / dist;
          const z = p1.z * (1 - t) + p2.z * t;
          const idx = y0 * cols + x0;
          if (z > zBuf[idx]) {
            zBuf[idx] = z;
            charBuf[idx] = lineGlyph;
          }
        }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
        step++;
      }
    }

    // Ordered Bayer Dither Matrix Mode
    renderDither(verts, edges) {
      const cols = this.width;
      const rows = this.height;
      const charBuf = new Array(cols * rows).fill(' ');
      const lumBuf = new Float32Array(cols * rows).fill(0);

      const cx = cols * 0.5;
      const cy = rows * 0.5;
      const scaleX = cols * 0.72;
      const scaleY = rows * 0.72;

      const pts2D = verts.map(v => this.project3Dto2D(v, cx, cy, scaleX, scaleY));

      edges.forEach(([i, j]) => {
        const p1 = pts2D[i];
        const p2 = pts2D[j];
        if (!p1 || !p2) return;

        let x0 = Math.floor(p1.x), y0 = Math.floor(p1.y);
        const x1 = Math.floor(p2.x), y1 = Math.floor(p2.y);
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;

        while (true) {
          if (x0 >= 0 && x0 < cols && y0 >= 0 && y0 < rows) {
            lumBuf[y0 * cols + x0] = Math.min(1.0, lumBuf[y0 * cols + x0] + 0.6);
            for (let ox = -1; ox <= 1; ox++) {
              for (let oy = -1; oy <= 1; oy++) {
                const nx = x0 + ox, ny = y0 + oy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                  lumBuf[ny * cols + nx] = Math.min(1.0, lumBuf[ny * cols + nx] + 0.12);
                }
              }
            }
          }
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 >= dy) { err += dy; x0 += sx; }
          if (e2 <= dx) { err += dx; y0 += sy; }
        }
      });

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const lum = lumBuf[y * cols + x];
          const threshold = BAYER_4X4[y % 4][x % 4];
          if (lum > threshold) {
            if (lum > 0.75) charBuf[y * cols + x] = '█';
            else if (lum > 0.45) charBuf[y * cols + x] = '▓';
            else charBuf[y * cols + x] = '▒';
          }
        }
      }

      let out = '';
      for (let r = 0; r < rows; r++) {
        let row = '';
        for (let c = 0; c < cols; c++) {
          row += charBuf[r * cols + c];
        }
        out += row + (r < rows - 1 ? '\n' : '');
      }

      this.el.textContent = out;
    }

    // Avant-Garde Holographic Interlaced Scanline Mode
    renderHolo(verts, edges) {
      const cols = this.width;
      const rows = this.height;
      const charBuf = new Array(cols * rows).fill(' ');
      const zBuf = new Float32Array(cols * rows).fill(-9999);

      const cx = cols * 0.5;
      const cy = rows * 0.5;
      const scaleX = cols * 0.72;
      const scaleY = rows * 0.72;

      const pts2D = verts.map(v => this.project3Dto2D(v, cx, cy, scaleX, scaleY));

      // Scanline sweep that traverses vertically over time
      const scanRow = Math.floor((performance.now() * 0.015) % rows);

      edges.forEach(([i, j]) => {
        const p1 = pts2D[i];
        const p2 = pts2D[j];
        if (!p1 || !p2) return;

        let x0 = Math.floor(p1.x), y0 = Math.floor(p1.y);
        const x1 = Math.floor(p2.x), y1 = Math.floor(p2.y);
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;

        const dist = Math.hypot(x1 - x0, y1 - y0) || 1;
        let step = 0;

        while (true) {
          if (x0 >= 0 && x0 < cols && y0 >= 0 && y0 < rows) {
            const t = step / dist;
            const z = p1.z * (1 - t) + p2.z * t;
            const idx = y0 * cols + x0;
            if (z > zBuf[idx]) {
              zBuf[idx] = z;
              let glyph = '─';
              if (dx > dy * 2) glyph = (y0 % 2 === 0) ? '═' : '─';
              else if (-dy > dx * 2) glyph = (y0 % 2 === 0) ? '║' : '│';
              else if ((sx > 0 && sy > 0) || (sx < 0 && sy < 0)) glyph = '╲';
              else glyph = '╱';

              // Laser beam scanline boost
              if (Math.abs(y0 - scanRow) <= 1) {
                glyph = (z > 0) ? '■' : '◈';
              }
              charBuf[idx] = glyph;
            }
          }
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 >= dy) { err += dy; x0 += sx; }
          if (e2 <= dx) { err += dx; y0 += sy; }
          step++;
        }
      });

      // Vertices rendered as radiant holographic nodes
      pts2D.forEach(p => {
        const x = Math.floor(p.x), y = Math.floor(p.y);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          const idx = y * cols + x;
          if (p.z >= zBuf[idx] - 0.2) {
            zBuf[idx] = p.z;
            if (Math.abs(y - scanRow) <= 1) {
              charBuf[idx] = '⬡';
            } else {
              charBuf[idx] = (p.z > 0) ? '◈' : '◇';
            }
          }
        }
      });

      let out = '';
      for (let r = 0; r < rows; r++) {
        let row = '';
        const isScanLine = (r === scanRow);
        for (let c = 0; c < cols; c++) {
          row += charBuf[r * cols + c];
        }
        out += (isScanLine ? '▶ ' : '  ') + row + (isScanLine ? ' ◀' : '  ') + (r < rows - 1 ? '\n' : '');
      }

      this.el.textContent = out;
    }

    exportSvg() {
      const text = this.el.textContent || '';
      const lines = text.split('\n');
      const charW = 7.5;
      const lineH = 14;
      const width = (lines[0]?.length || 40) * charW + 20;
      const height = lines.length * lineH + 20;

      let textNodes = '';
      lines.forEach((ln, idx) => {
        const y = 16 + idx * lineH;
        textNodes += `<text x="10" y="${y}" fill="#10b981" font-family="monospace" font-size="11px" xml:space="preserve">${this._escapeXml(ln)}</text>\n`;
      });

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#07080b"/>
  <style>text { font-variant-ligatures: none; text-shadow: 0 0 4px #10b981; }</style>
  ${textNodes}
</svg>`;
    }

    _escapeXml(str) {
      return str.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    }
  }

  // Global factory / registry
  const instances = new Map();

  global.ZOAscii3D = {
    create(elementOrId, options) {
      const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (!el) return null;
      if (instances.has(el)) {
        instances.get(el).stop();
      }
      const inst = new AsciiEngine(el, options);
      instances.set(el, inst);
      return inst;
    },
    get(el) {
      return instances.get(el);
    },
    /**
     * Embed a self-contained 3D Holographic Viewport with controls
     */
    embedHtml(id, defaultGeom = 'tesseract', title = 'TACTICAL HOLOGRAPH') {
      return `
<div class="holo-viewport-card holo-projector" id="${id}-container">
  <div class="holo-projector-beam" aria-hidden="true"></div>
  <div class="hero-hologram-header">
    <span><span class="holo-emitter-dot"></span>◈ ${title} · <span id="${id}-label">${defaultGeom.toUpperCase()}</span></span>
    <span class="telemetry holo-telemetry">432.8 THz · INTERLACED</span>
  </div>
  <pre id="${id}-canvas" class="ascii-3d-canvas" style="height: 180px;" title="Drag to rotate 3D mesh"></pre>
  <div class="hologram-btn-row" style="margin-top: 6px;">
    <button class="btn-holo active" data-holo-target="${id}" data-holo-geom="${defaultGeom}">${defaultGeom}</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-geom="ouroboros">ouroboros</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-geom="tree_of_life">tree of life</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-geom="hermetic_seal">hermetic seal</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-geom="azoth">azoth</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-geom="skull">skull</button>
    <span class="sp"></span>
    <button class="btn-holo" data-holo-target="${id}" data-holo-mode="braille">braille</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-mode="dither">dither</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-mode="holo">holo</button>
    <button class="btn-holo" data-holo-target="${id}" data-holo-mode="ascii">ascii</button>
  </div>
</div>
`;
    },
    wireEmbedded(id, defaultGeom = 'tesseract', width = 44, height = 18) {
      const canvas = document.getElementById(`${id}-canvas`);
      if (!canvas) return null;
      const engine = this.create(canvas, { geom: defaultGeom, mode: 'braille', width, height });
      if (engine) engine.start();

      const label = document.getElementById(`${id}-label`);
      const btns = document.querySelectorAll(`[data-holo-target="${id}"][data-holo-geom]`);
      btns.forEach(b => {
        b.onclick = () => {
          btns.forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          const g = b.getAttribute('data-holo-geom');
          if (engine) engine.setGeom(g);
          if (label) label.textContent = g.toUpperCase().replace(/_/g, ' ');
          if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
        };
      });
      const modeBtns = document.querySelectorAll(`[data-holo-target="${id}"][data-holo-mode]`);
      modeBtns.forEach(m => {
        m.onclick = () => {
          modeBtns.forEach(x => x.classList.remove('active'));
          m.classList.add('active');
          const md = m.getAttribute('data-holo-mode');
          if (engine) engine.setMode(md);
          if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
        };
      });
      return engine;
    }
  };

})(window);
