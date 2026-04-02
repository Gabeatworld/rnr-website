/* ============================================================
   Module: awardsFooterPin
   Merges .awards_section + .section_footer-pin into one
   seamless pinned crossfade sequence.

   Flow:
     1. Awards scrolls into view normally (text + numeral fire)
     2. Wrapper pins at viewport top
     3. Awards content staggers OUT (logos → numeral → subtext → heading)
     4. BG crossfades cream → dark
     5. Footer heading + CTA fades IN
     6. Circular images bloom + spin starts
     7. Hold for spin viewing → pin releases

   REPLACES the standalone footer-pin embed script.
   ============================================================ */

RNR.register('awardsFooterPin', function (/* shared */) {
  if (!window.gsap || !window.ScrollTrigger) return null;
  gsap.registerPlugin(ScrollTrigger);

  // ── Elements ──────────────────────────────────────────────
  const awards = document.querySelector('.awards_section');
  const footer = document.querySelector('.section_footer-pin');
  if (!awards || !footer) return null;

  const aHeading = awards.querySelector('.awards_heading');
  const aSubtext = awards.querySelector('.awards_main-text');
  const aNumeral = awards.querySelector('.awards_numeral');
  const aLogos   = awards.querySelector('[data-animate="visual"]');

  const fHeading  = footer.querySelector('.footer-pin_heading');
  const fCarousel = footer.querySelector('.master-cta-images');
  const fImages   = gsap.utils.toArray('.circle-image');

  if (!fCarousel || !fImages.length) return null;

  // ── Countup hijack ────────────────────────────────────────
  // Remove data-countup attrs so the standalone embed never fires.
  // We drive the numbers via the scrubbed timeline instead.
  var countupProxies = Array.from(awards.querySelectorAll('[data-countup]')).map(function (el) {
    var attrVal = el.getAttribute('data-countup') || '';
    var rawText  = el.textContent.trim();
    // Attribute may hold the number, or may just be a hook — fall back to textContent
    var numFromAttr = parseFloat(attrVal.replace(/[^0-9.]/g, ''));
    var target = (numFromAttr > 0 ? numFromAttr : parseFloat(rawText.replace(/[^0-9.]/g, ''))) || 0;
    var suffix = rawText.replace(/^[\d,.\s]+/, '');
    el.removeAttribute('data-countup');
    return { el: el, target: target, val: 0, suffix: suffix };
  });

  // ── Kill conflicting ScrollTriggers on awards + footer ─────
  // The global animation system (setupVisualAnimations / setupSplitAnimations)
  // creates STs for [data-animate] elements inside awards. Their toggleActions
  // (reset/reverse) fire when scrolling away and back, overwriting the state
  // this module's timeline depends on — breaking the countup and blur reveal.
  ScrollTrigger.getAll().forEach(function (st) {
    if (!st.trigger) return;
    if (st.trigger === footer || (st.pin && st.pin === footer) ||
        st.trigger === awards || awards.contains(st.trigger)) {
      st.kill();
    }
  });

  // Strip data-animate from the sections THEMSELVES and all children.
  // On first load, .animations-ready may not be set yet — the CSS rule
  // html:not(.animations-ready) [data-animate] { opacity: 0 } would hide
  // the entire section if only children were stripped.
  awards.removeAttribute('data-animate');
  footer.removeAttribute('data-animate');
  awards.querySelectorAll('[data-animate]').forEach(function (el) {
    el.removeAttribute('data-animate');
  });
  footer.querySelectorAll('[data-animate]').forEach(function (el) {
    el.removeAttribute('data-animate');
  });

  // Fix race condition: if the global animation system ran first,
  // setupSplitAnimations() may have split heading/subtext into .word spans
  // with opacity:0. Setting the parent visible doesn't help — the children
  // stay hidden. Clear those word spans so text is readable.
  awards.querySelectorAll('.word, .word-mask').forEach(function (w) {
    gsap.set(w, { opacity: 1, y: 0, filter: 'none', clearProps: 'willChange,force3D' });
  });

  // ── Create wrapper ────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.className = 'awards-footer-pin';
  awards.parentNode.insertBefore(wrapper, awards);
  wrapper.appendChild(awards);
  wrapper.appendChild(footer);

  // ── Initial states ────────────────────────────────────────
  // Force awards section itself visible (overrides any CSS opacity rule)
  gsap.set(awards, { autoAlpha: 1 });
  gsap.set(footer, { autoAlpha: 0 });
  if (fHeading) gsap.set(fHeading, { opacity: 0, y: 40 });
  gsap.set(fImages, { visibility: 'visible', scale: 0, opacity: 0 });
  // Ensure awards children are visible — global data-animate presets may have hidden them
  if (aHeading) gsap.set(aHeading, { opacity: 1, y: 0, filter: 'blur(0px)', clearProps: 'willChange' });
  if (aSubtext) gsap.set(aSubtext, { opacity: 1, y: 0, filter: 'blur(0px)', clearProps: 'willChange' });
  if (aNumeral) gsap.set(aNumeral, { opacity: 1, y: 0, filter: 'blur(0px)', clearProps: 'willChange' });
  if (aLogos)   gsap.set(aLogos,   { opacity: 1, y: 0, filter: 'blur(0px)', clearProps: 'willChange' });

  // ── Carousel positioning ──────────────────────────────────
  var getRadius = function () {
    var w = window.innerWidth;
    if (w < 479) return w * 0.75;
    if (w < 991) return w * 0.5;
    return 600;
  };

  var positionImages = function () {
    var radius = getRadius();
    var step = (Math.PI * 2) / fImages.length;
    fImages.forEach(function (img, i) {
      var angle = i * step;
      gsap.set(img, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        xPercent: -50,
        yPercent: -50,
        scale: 0,
        opacity: 0
      });
    });
  };
  positionImages();

  // ── Infinite spin (paused) ────────────────────────────────
  var BASE_SPEED = 0.75;
  var currentDir = 1;
  var spinStarted = false;

  var infiniteSpin = gsap.to(fCarousel, {
    rotation: 360, duration: 60, ease: 'none', repeat: -1, paused: true
  });
  var counterSpin = gsap.to(fImages, {
    rotation: -360, duration: 60, ease: 'none', repeat: -1, paused: true
  });

  var updateSpinSpeed = function (factor) {
    if (Math.abs(factor) < 0.01) return;
    currentDir = factor > 0 ? 1 : -1;
    var target = BASE_SPEED * currentDir + factor;
    target = gsap.utils.clamp(-12, 12, target);
    gsap.to([infiniteSpin, counterSpin], {
      timeScale: target, duration: 0.6, overwrite: true
    });
  };

  var startSpin = function () {
    if (spinStarted) return;
    spinStarted = true;
    infiniteSpin.play();
    counterSpin.play();
  };

  var stopSpin = function () {
    if (!spinStarted) return;
    spinStarted = false;
    infiniteSpin.pause();
    counterSpin.pause();
  };

  // ── Timeline builder ──────────────────────────────────────
  var mainTl = null;

  var buildTimeline = function () {
    // Tear down previous if rebuilding (resize)
    if (mainTl) {
      var st = mainTl.scrollTrigger;
      mainTl.kill();
      if (st) st.kill();
      stopSpin();

      gsap.set(awards, { autoAlpha: 1 });
      gsap.set(footer, { autoAlpha: 0 });
      gsap.set(wrapper, { backgroundColor: '#f5f0ec' });
      if (aHeading)  gsap.set(aHeading,  { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (aSubtext)  gsap.set(aSubtext,  { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (aNumeral)  gsap.set(aNumeral,  { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (aLogos)    gsap.set(aLogos,    { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (fHeading)  gsap.set(fHeading,  { opacity: 0, y: 40 });
      positionImages();
    }

    mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          if (p >= 0.32 && !spinStarted) {
            startSpin();
          } else if (p < 0.30 && spinStarted) {
            stopSpin();
          }
          if (p > 0.38 && spinStarted) {
            var sensitivity = window.innerWidth < 991 ? 400 : 200;
            updateSpinSpeed(self.getVelocity() / sensitivity);
          }
        },
        onLeave: function () {
          gsap.set(wrapper, { backgroundColor: '#1a1a1a' });
          gsap.set(fImages, { scale: 1, opacity: 1 });
        },
        onRefresh: function (self) {
          if (self.spacer) {
            self.spacer.style.backgroundColor = '#f5f0ec';
          }
        }
      }
    });

    var tl = mainTl;

    // PHASE 1: Numeral blur-reveal + countup (0 → 0.12)
    // Numeral materialises through blur while numbers tick up underneath
    if (aNumeral) {
      tl.fromTo(aNumeral,
        { opacity: 0, filter: 'blur(12px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 0.06, ease: 'power2.out' },
        0
      );
    }

    countupProxies.forEach(function (d) {
      tl.fromTo(d, { val: 0 }, {
        val: d.target,
        duration: 0.10,
        ease: 'none',
        onUpdate: (function (data) {
          return function () {
            data.el.textContent = Math.round(data.val) + (data.suffix || '');
          };
        })(d)
      }, 0);
    });

    // PHASE 2: Awards stagger OUT — tightened (0.06 → 0.26)
    if (aLogos) {
      tl.to(aLogos, {
        opacity: 0, y: -20, filter: 'blur(4px)',
        duration: 0.06, ease: 'power2.in'
      }, 0.06);
    }
    if (aSubtext) {
      tl.to(aSubtext, {
        opacity: 0, y: -15, filter: 'blur(4px)',
        duration: 0.06, ease: 'power2.in'
      }, 0.10);
    }
    // Numeral exits after countup completes (0.10)
    if (aNumeral) {
      tl.to(aNumeral, {
        opacity: 0, y: -15, filter: 'blur(4px)',
        duration: 0.06, ease: 'power2.in'
      }, 0.13);
    }
    if (aHeading) {
      tl.to(aHeading, {
        opacity: 0, y: -25, filter: 'blur(8px)',
        duration: 0.07, ease: 'power2.in'
      }, 0.16);
    }

    // PHASE 3: Crossfade BG + awards fade (0.20 → 0.34)
    tl.to(wrapper, {
      backgroundColor: '#1a1a1a',
      duration: 0.14, ease: 'power1.inOut'
    }, 0.20);

    tl.to(awards, { autoAlpha: 0, duration: 0.10, ease: 'power1.in' }, 0.20);

    // PHASE 4 + 5: Footer heading + images bloom together (0.32 → 0.50)
    tl.to(footer, { autoAlpha: 1, duration: 0.04 }, 0.32);

    if (fHeading) {
      tl.to(fHeading, {
        opacity: 1, y: 0,
        duration: 0.12, ease: 'power2.out'
      }, 0.34);
    }

    tl.to(fImages, {
      scale: 1, opacity: 1,
      duration: 0.14,
      ease: 'back.out(1.2)',
      stagger: { each: 0.003, from: 'start' }
    }, 0.32);

    // PHASE 6: Hold for spin viewing (0.50 → 1.0)
    tl.to({}, { duration: 0.50 }, 0.50);
  };

  // ── Boot — wait for carousel images ───────────────────────
  var imgEls = fImages.map(function (el) {
    return el.querySelector('img') || el;
  });
  var pending = imgEls.filter(function (el) {
    return el.tagName === 'IMG' && !el.complete;
  });

  var boot = function () {
    buildTimeline();
    ScrollTrigger.refresh();
  };

  if (pending.length) {
    var loaded = 0;
    var check = function () { if (++loaded >= pending.length) boot(); };
    pending.forEach(function (img) {
      img.addEventListener('load', check, { once: true });
      img.addEventListener('error', check, { once: true });
    });
    setTimeout(function () {
      if (loaded < pending.length) { loaded = pending.length; boot(); }
    }, 3000);
  } else {
    boot();
  }

  // ── Scroll end — ease spin back ───────────────────────────
  ScrollTrigger.addEventListener('scrollEnd', function () {
    if (!spinStarted) return;
    gsap.to([infiniteSpin, counterSpin], {
      timeScale: BASE_SPEED * currentDir,
      duration: 1.5, overwrite: true
    });
  });

  // ── Resize — full rebuild ─────────────────────────────────
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      positionImages();
      buildTimeline();
    }, 250);
  });

  // Public API
  return {
    rebuild: buildTimeline
  };

}, 10); // priority 10 — runs after feed modules
