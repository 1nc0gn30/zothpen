/* ==========================================================================
   ZothPen — Matrix-Style Hacker Typography & Text Emphasize Animation Tool
   Inspired by @teknium's Uncommon Web (webdev.teknium.io) Domain 04 Typography
   Zero external dependencies. Pure Vanilla JS & WebAudio Integration.
   ========================================================================== */
(function (global) {
  'use strict';

  // Authentic Matrix Katakana + Greek + Cyber Cipher Set
  const SCRAMBLE_CHARS = 'ｦｱｳｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789ΔΣΩΨλπ#*+-=<>_';

  const ZOMatrixText = {
    /**
     * Scramble-decode animation on any DOM element
     * Inspired by baffle.js / scramble-text / Uncommon Web
     */
    scramble(el, targetText = null, options = {}) {
      if (!el) return;
      const text = targetText !== null ? targetText : (el.getAttribute('data-original-text') || el.textContent || '');
      if (!el.getAttribute('data-original-text')) {
        el.setAttribute('data-original-text', text);
      }

      const duration = options.duration || 650; // ms
      const chars = options.chars || SCRAMBLE_CHARS;
      const length = text.length;
      const startTime = performance.now();

      // Cancel previous animation on this element if running
      if (el._matrixAnimId) {
        cancelAnimationFrame(el._matrixAnimId);
      }

      let lastTickIndex = -1;

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        const resolvedCount = Math.floor(progress * length);

        if (resolvedCount > lastTickIndex && resolvedCount < length) {
          lastTickIndex = resolvedCount;
          if (options.sound !== false && window.ZOSynth && window.ZOSynth.playClick && Math.random() < 0.4) {
            window.ZOSynth.playClick();
          }
        }

        let output = '';
        for (let i = 0; i < length; i++) {
          if (text[i] === ' ' || text[i] === '\n') {
            output += text[i];
          } else if (i < resolvedCount) {
            output += text[i];
          } else if (i === resolvedCount && progress < 0.95) {
            output += `<span class="matrix-cursor">${chars[Math.floor(Math.random() * chars.length)]}</span>`;
          } else {
            output += `<span class="matrix-scramble-char">${chars[Math.floor(Math.random() * chars.length)]}</span>`;
          }
        }

        el.innerHTML = output;

        if (progress < 1.0) {
          el._matrixAnimId = requestAnimationFrame(step);
        } else {
          el.textContent = text;
          el._matrixAnimId = null;
          if (options.onComplete) options.onComplete();
        }
      };

      el._matrixAnimId = requestAnimationFrame(step);
    },

    /**
     * Highlight & Emphasize Key Concepts with Cyber Brackets & Matrix Shimmer
     */
    emphasizeText(container, keyword, badgeType = 'matrix') {
      if (!container) return;
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      container.innerHTML = container.innerHTML.replace(regex, `<span class="matrix-pill ${badgeType}">[ <span class="matrix-pill-text">$1</span> ]</span>`);
    },

    /**
     * Auto-init scramble animations on route change
     */
    autoEnhance() {
      // Find main page title and animate
      const h1 = document.querySelector('#view h1.h1, #view h1');
      if (h1 && !h1.dataset.scrambled) {
        h1.dataset.scrambled = 'true';
        this.scramble(h1, null, { duration: 750, sound: true });
      }

      // Add hover decrypt effect to action buttons and brand marks
      document.querySelectorAll('[data-scramble]').forEach(el => {
        if (el.dataset.wiredScramble) return;
        el.dataset.wiredScramble = 'true';
        el.addEventListener('mouseenter', () => {
          this.scramble(el, null, { duration: 400, sound: true });
        });
      });

      // Trigger matrix rough notation annotations
      if (window.ZOMatrixNotation && window.ZOMatrixNotation.autoAnnotate) {
        window.ZOMatrixNotation.autoAnnotate();
      }
    }
  };

  global.ZOMatrixText = ZOMatrixText;

})(window);
