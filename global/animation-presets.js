/* ============================================================
   RNR STUDIO — Animation Presets
   Shared effects for consistent motion across sections.
   Requires GSAP (loaded globally via Webflow).

   Usage in any section script:
     window.RNR.fx.blurReveal('.my-element', { blur: 14, duration: 0.6 });
     window.RNR.fx.fadeUp('.my-element', { y: 12, stagger: 0.05 });

   Or build a timeline:
     const tl = gsap.timeline();
     tl.add(window.RNR.fx.blurReveal('.bg', { blur: 20 }), 0);
     tl.add(window.RNR.fx.fadeUp('.content'), 0.2);
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') {
    console.warn('RNR animation-presets: GSAP not found');
    return;
  }

  window.RNR = window.RNR || {};

  // ── Default configs ──
  const DEFAULTS = {
    blurReveal: {
      blur: 10,
      duration: 0.8,
      stagger: 0,
      delay: 0,
      ease: 'power2.out',
      clearAfter: true       // remove filter after animation for perf
    },
    fadeUp: {
      y: 8,
      duration: 0.5,
      stagger: 0.06,
      delay: 0,
      ease: 'power2.out'
    },
    fadeIn: {
      duration: 0.6,
      delay: 0,
      ease: 'power2.out'
    }
  };

  // ── Helpers ──
  function merge(defaults, overrides) {
    return Object.assign({}, defaults, overrides);
  }

  // ── Preset: Blur Reveal ──
  // Fades in while unblurring. Used for backgrounds, hero images, text.
  function blurReveal(targets, opts) {
    const o = merge(DEFAULTS.blurReveal, opts);
    const tween = gsap.fromTo(targets,
      { opacity: 0, filter: 'blur(' + o.blur + 'px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: o.duration,
        delay: o.delay,
        stagger: o.stagger,
        ease: o.ease,
        onComplete: function () {
          if (o.clearAfter) {
            gsap.set(this.targets(), { clearProps: 'filter,willChange' });
          }
        }
      }
    );
    return tween;
  }

  // ── Preset: Fade Up ──
  // Slides up + fades in. Used for content blocks, labels, nav items.
  function fadeUp(targets, opts) {
    const o = merge(DEFAULTS.fadeUp, opts);
    return gsap.fromTo(targets,
      { opacity: 0, y: o.y },
      {
        opacity: 1,
        y: 0,
        duration: o.duration,
        delay: o.delay,
        stagger: o.stagger,
        ease: o.ease
      }
    );
  }

  // ── Preset: Fade In ──
  // Simple opacity fade. Used for images, overlays.
  function fadeIn(targets, opts) {
    const o = merge(DEFAULTS.fadeIn, opts);
    return gsap.fromTo(targets,
      { opacity: 0 },
      {
        opacity: 1,
        duration: o.duration,
        delay: o.delay,
        ease: o.ease
      }
    );
  }

  // ── Preset: Hide (instant set) ──
  // Sets initial hidden state. Pair with a reveal preset.
  function hideBlur(targets, blur) {
    gsap.set(targets, { opacity: 0, filter: 'blur(' + (blur || 10) + 'px)' });
  }

  function hideUp(targets, y) {
    gsap.set(targets, { opacity: 0, y: y || 8 });
  }

  function hideOpacity(targets) {
    gsap.set(targets, { opacity: 0 });
  }

  // ── Export ──
  window.RNR.fx = {
    blurReveal: blurReveal,
    fadeUp: fadeUp,
    fadeIn: fadeIn,
    hideBlur: hideBlur,
    hideUp: hideUp,
    hideOpacity: hideOpacity,
    DEFAULTS: DEFAULTS
  };

})();
