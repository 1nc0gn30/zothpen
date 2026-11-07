/* ==========================================================================
   ZothPen — Matrix-Hackerish RoughNotation Engine
   Cyberpunk digital annotations: targeting reticles, phosphor scan underlines,
   hacker corner-brackets, laser strike-throughs, and phosphor highlighters.
   Integrates with RoughNotation (Uncommon Web) and ZOSynth audio.
   100% offline, zero network dependencies.
   ========================================================================== */
(function (global) {
  'use strict';

  // Active annotations pool so we can clear on route change
  let activeAnnotations = [];

  const ZOMatrixNotation = {
    /**
     * Color presets that match the current phosphor reality
     */
    getThemeColor(variant = 'phos') {
      const rootStyle = getComputedStyle(document.documentElement);
      if (variant === 'amber') return rootStyle.getPropertyValue('--amber').trim() || '#f59e0b';
      if (variant === 'cyan') return rootStyle.getPropertyValue('--cyan').trim() || '#06b6d4';
      if (variant === 'red') return rootStyle.getPropertyValue('--red').trim() || '#ef4444';
      return rootStyle.getPropertyValue('--phos').trim() || '#10b981';
    },

    /**
     * Annotate a single element with Matrix Hackerish treatment
     * types: 'box', 'bracket', 'underline', 'highlight', 'circle', 'crossed-off', 'reticle'
     */
    annotate(el, options = {}) {
      if (!el || !window.RoughNotation) return null;

      // Anchor element and parent so annotations lock 1:1 on scroll
      el.classList.add('matrix-rough-target');
      const curPos = window.getComputedStyle(el).position;
      if (!curPos || curPos === 'static') {
        el.style.position = 'relative';
      }
      const curDisplay = window.getComputedStyle(el).display;
      if (curDisplay === 'inline') {
        el.style.display = 'inline-block';
      }
      if (el.parentElement) {
        const pPos = window.getComputedStyle(el.parentElement).position;
        if (!pPos || pPos === 'static') {
          el.parentElement.style.position = 'relative';
        }
      }

      const type = options.type || 'box';
      const color = options.color || this.getThemeColor(options.variant || 'phos');
      const strokeWidth = options.strokeWidth || (type === 'highlight' ? 18 : 2);
      const animationDuration = options.duration || 600;
      const padding = options.padding !== undefined ? options.padding : (type === 'highlight' ? 2 : 4);
      const multiline = options.multiline !== undefined ? options.multiline : true;
      const iterations = options.iterations || (type === 'highlight' ? 1 : 2);

      const rnConfig = {
        type: type === 'reticle' ? 'box' : type,
        color: color,
        strokeWidth: strokeWidth,
        animationDuration: animationDuration,
        padding: padding,
        multiline: multiline,
        iterations: iterations,
        animate: options.animate !== false
      };

      if (type === 'bracket') {
        rnConfig.brackets = options.brackets || ['left', 'right'];
      }

      const annotation = window.RoughNotation.annotate(el, rnConfig);

      // Wrap show method to apply matrix cyber-styling & sound
      const originalShow = annotation.show.bind(annotation);
      annotation.show = () => {
        originalShow();
        if (annotation._svg) {
          annotation._svg.classList.add('matrix-rough-svg', 'matrix-type-' + type);
          if (options.variant) annotation._svg.classList.add('variant-' + options.variant);

          // Add digital corner reticle ticks if type is 'box' or 'reticle'
          if (type === 'box' || type === 'reticle') {
            this.injectReticleCorners(annotation._svg, color, el, padding);
          }
        }
        if (options.sound !== false && window.ZOSynth && window.ZOSynth.playClick) {
          window.ZOSynth.playClick();
        }
      };

      activeAnnotations.push(annotation);
      return annotation;
    },

    /**
     * Injects digital matrix crosshairs / corners (┌ ┐ └ ┘) to the annotation SVG
     */
    injectReticleCorners(svg, color, el = null, padding = 4) {
      if (!svg || svg.querySelector('.matrix-corners')) return;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'matrix-corners');
      g.setAttribute('stroke', color);
      g.setAttribute('stroke-width', '1.5');
      g.setAttribute('fill', 'none');

      let ox = 0, oy = 0, w = 80, h = 28;
      if (el) {
        const elRect = el.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        ox = (elRect.left - svgRect.left) - padding;
        oy = (elRect.top - svgRect.top) - padding;
        w = elRect.width + padding * 2;
        h = elRect.height + padding * 2;
      } else {
        const rect = svg.getBoundingClientRect();
        w = Math.max(20, rect.width || 80);
        h = Math.max(16, rect.height || 28);
      }
      const tick = Math.min(6, Math.max(3, Math.floor(h / 3)));

      const pathData = `M${ox},${oy + tick} L${ox},${oy} L${ox + tick},${oy} ` +
        `M${ox + w - tick},${oy} L${ox + w},${oy} L${ox + w},${oy + tick} ` +
        `M${ox + w},${oy + h - tick} L${ox + w},${oy + h} L${ox + w - tick},${oy + h} ` +
        `M${ox + tick},${oy + h} L${ox},${oy + h} L${ox},${oy + h - tick}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', 'matrix-corner-ticks');
      g.appendChild(path);
      svg.appendChild(g);
    },

    /**
     * Annotation group for ordered sequence
     */
    group(annotations) {
      if (!window.RoughNotation) return { show: () => {}, hide: () => {} };
      return window.RoughNotation.annotationGroup(annotations);
    },

    /**
     * Clear all active annotations (on route navigation)
     */
    clear() {
      activeAnnotations.forEach(a => {
        try { a.remove(); } catch (e) {}
      });
      activeAnnotations = [];
    },

    /**
     * Auto-annotate high-value elements in the current view
     */
    autoAnnotate(root = document.getElementById('view')) {
      if (!root || !window.RoughNotation) return;
      this.clear();

      const toShow = [];

      // 1. Elements explicitly tagged with data-notation
      root.querySelectorAll('[data-notation]').forEach(el => {
        const type = el.getAttribute('data-notation') || 'box';
        const variant = el.getAttribute('data-notation-variant') || 'phos';
        const a = this.annotate(el, { type, variant, duration: 600 });
        if (a) toShow.push(a);
      });

      // 2. Overview / Module Hero emphasis
      const heroKey = root.querySelector('.hero b, .module-hero b');
      if (heroKey && !heroKey.dataset.hasAnnotated) {
        heroKey.dataset.hasAnnotated = 'true';
        const a = this.annotate(heroKey, { type: 'highlight', variant: 'phos', duration: 700 });
        if (a) toShow.push(a);
      }

      // 3. Highlight security scope warnings (CFAA / RoE notes)
      root.querySelectorAll('.note.danger b, .note.warn b').forEach(el => {
        if (!el.dataset.hasAnnotated) {
          el.dataset.hasAnnotated = 'true';
          const a = this.annotate(el, { type: 'bracket', variant: 'red', duration: 500 });
          if (a) toShow.push(a);
        }
      });

      // 4. Stagger display with Group
      if (toShow.length > 0) {
        setTimeout(() => {
          const grp = this.group(toShow);
          grp.show();
        }, 200);
      }
    }
  };

  global.ZOMatrixNotation = ZOMatrixNotation;

})(window);
