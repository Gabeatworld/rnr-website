<!--
  Awards → Footer Crossfade Pin
  ──────────────────────────────
  Merges .awards_section + .section_footer-pin into one seamless pinned sequence.

  Flow:
    1. Awards section scrolls into view normally (text + numeral animations fire via global system)
    2. Wrapper reaches top of viewport → PIN starts
    3. Brief hold so user sees completed awards content
    4. Awards content staggers OUT (logos → numeral → subtext → heading) with blur
    5. Background crossfades cream → dark (#f5f0ec → #1a1a1a) during the overlap
    6. Footer heading + CTA fades IN on dark canvas
    7. Circular images bloom in + spin starts
    8. Hold for spin viewing
    9. Pin releases

  REPLACES: The existing footer pin animation embed inside .section_footer-pin.
  The old embed (div.footer-pin-animation) should be EMPTIED or REMOVED in Webflow.
  The awards section's countup script (data-countup) remains untouched — it fires before the pin.

  PLACEMENT: Add as a page-level custom code embed AFTER both sections,
  or inside the awards section as a new embed element.
-->

<style>
  /* ── Wrapper layout ── */
  .awards-footer-pin {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: #f5f0ec;
  }

  /* Stack both sections absolutely inside the wrapper */
  .awards-footer-pin > .awards_section,
  .awards-footer-pin > .section_footer-pin {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Footer section should not carry its own bg — wrapper handles it */
  .awards-footer-pin > .section_footer-pin {
    background-color: transparent !important;
  }

  /* Hide Webflow spacers inside awards when pinned (centering is via flexbox now) */
  .awards-footer-pin > .awards_section > .g_section_space {
    display: none !important;
  }

  /* Prevent footer images from flashing before JS hides them */
  .awards-footer-pin .circle-image {
    visibility: hidden;
  }
</style>

<script>
(function () {
  const scriptTag = document.currentScript;

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return setTimeout(init, 100);
    }
    gsap.registerPlugin(ScrollTrigger);

    // ════════════════════════════════════════
    //  ELEMENTS
    // ════════════════════════════════════════
    const awards = document.querySelector('.awards_section');
    const footer = document.querySelector('.section_footer-pin');
    if (!awards || !footer) return;

    // Awards content
    const aHeading = awards.querySelector('.awards_heading');
    const aSubtext = awards.querySelector('.awards_main-text');
    const aNumeral = awards.querySelector('.awards_numeral');
    const aLogos   = awards.querySelector('[data-animate="visual"]');

    // Footer content
    const fHeading   = footer.querySelector('.footer-pin_heading');
    const fCarousel  = footer.querySelector('.master-cta-images');
    const fImages    = gsap.utils.toArray('.circle-image');

    if (!fCarousel || !fImages.length) return;

    // ════════════════════════════════════════
    //  KILL OLD FOOTER SCROLLTRIGGERS
    // ════════════════════════════════════════
    // Safety: if the old footer-pin embed script ran first, clean it up
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === footer || (st.pin && st.pin === footer)) {
        st.kill();
      }
    });

    // ════════════════════════════════════════
    //  CREATE WRAPPER
    // ════════════════════════════════════════
    const wrapper = document.createElement('div');
    wrapper.className = 'awards-footer-pin';
    awards.parentNode.insertBefore(wrapper, awards);
    wrapper.appendChild(awards);
    wrapper.appendChild(footer);

    // ════════════════════════════════════════
    //  INITIAL STATES
    // ════════════════════════════════════════
    // Footer: completely hidden
    gsap.set(footer, { autoAlpha: 0 });
    if (fHeading) gsap.set(fHeading, { opacity: 0, y: 40 });

    // Footer images: visible to CSS but scaled to 0
    gsap.set(fImages, { visibility: 'visible', scale: 0, opacity: 0 });

    // ════════════════════════════════════════
    //  CAROUSEL POSITIONING
    // ════════════════════════════════════════
    const getRadius = () => {
      const w = window.innerWidth;
      if (w < 479) return w * 0.75;
      if (w < 991) return w * 0.5;
      return 600;
    };

    const positionImages = () => {
      const radius = getRadius();
      const step = (Math.PI * 2) / fImages.length;
      fImages.forEach((img, i) => {
        const angle = i * step;
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

    // ════════════════════════════════════════
    //  INFINITE SPIN (paused until triggered)
    // ════════════════════════════════════════
    const BASE_SPEED = 0.75;
    let currentDir = 1;
    let spinStarted = false;

    const infiniteSpin = gsap.to(fCarousel, {
      rotation: 360, duration: 60, ease: 'none', repeat: -1, paused: true
    });
    const counterSpin = gsap.to(fImages, {
      rotation: -360, duration: 60, ease: 'none', repeat: -1, paused: true
    });

    const updateSpinSpeed = (factor) => {
      if (Math.abs(factor) < 0.01) return;
      currentDir = factor > 0 ? 1 : -1;
      let target = BASE_SPEED * currentDir + factor;
      target = gsap.utils.clamp(-12, 12, target);
      gsap.to([infiniteSpin, counterSpin], {
        timeScale: target, duration: 0.6, overwrite: true
      });
    };

    const startSpin = () => {
      if (spinStarted) return;
      spinStarted = true;
      infiniteSpin.play();
      counterSpin.play();
    };

    const stopSpin = () => {
      if (!spinStarted) return;
      spinStarted = false;
      infiniteSpin.pause();
      counterSpin.pause();
    };

    // ════════════════════════════════════════
    //  TIMELINE BUILDER
    // ════════════════════════════════════════
    let mainTl = null;

    const buildTimeline = () => {
      // Tear down previous if rebuilding (resize, etc.)
      if (mainTl) {
        const st = mainTl.scrollTrigger;
        mainTl.kill();
        if (st) st.kill();
        stopSpin();

        // Reset everything
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
          end: '+=400%',     // 4× viewport of scroll distance
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Velocity-driven spin speed during footer phase
            if (self.progress > 0.55 && spinStarted) {
              const sensitivity = window.innerWidth < 991 ? 400 : 200;
              updateSpinSpeed(self.getVelocity() / sensitivity);
            }
          },
          onLeave: () => {
            // Persist dark state after pin releases
            gsap.set(wrapper, { backgroundColor: '#1a1a1a' });
            gsap.set(fImages, { scale: 1, opacity: 1 });
          },
          onRefresh: (self) => {
            // Match pin-spacer bg to starting color
            if (self.spacer) {
              self.spacer.style.backgroundColor = '#f5f0ec';
            }
          }
        }
      });

      const tl = mainTl; // shorthand

      // ─── PHASE 1: Hold — awards visible (0 → 0.10) ───
      tl.to({}, { duration: 0.10 }, 0);

      // ─── PHASE 2: Awards stagger OUT (0.10 → 0.38) ───
      // Logos first
      if (aLogos) {
        tl.to(aLogos, {
          opacity: 0, y: -20, filter: 'blur(4px)',
          duration: 0.09, ease: 'power2.in'
        }, 0.10);
      }
      // Numeral
      if (aNumeral) {
        tl.to(aNumeral, {
          opacity: 0, y: -15, filter: 'blur(4px)',
          duration: 0.08, ease: 'power2.in'
        }, 0.16);
      }
      // Subtext
      if (aSubtext) {
        tl.to(aSubtext, {
          opacity: 0, y: -15, filter: 'blur(4px)',
          duration: 0.09, ease: 'power2.in'
        }, 0.20);
      }
      // Heading last
      if (aHeading) {
        tl.to(aHeading, {
          opacity: 0, y: -25, filter: 'blur(8px)',
          duration: 0.10, ease: 'power2.in'
        }, 0.26);
      }

      // ─── PHASE 3: Crossfade BG — cream → dark (0.28 → 0.46) ───
      tl.to(wrapper, {
        backgroundColor: '#1a1a1a',
        duration: 0.18, ease: 'power1.inOut'
      }, 0.28);

      // Hide awards layer once fully faded
      tl.set(awards, { autoAlpha: 0 }, 0.38);

      // ─── PHASE 4: Footer fades IN (0.40 → 0.56) ───
      // Show footer layer
      tl.to(footer, { autoAlpha: 1, duration: 0.04 }, 0.40);

      // Heading + CTA fade in
      if (fHeading) {
        tl.to(fHeading, {
          opacity: 1, y: 0,
          duration: 0.12, ease: 'power2.out'
        }, 0.42);
      }

      // ─── PHASE 5: Images bloom + spin starts (0.50 → 0.68) ───
      tl.to(fImages, {
        scale: 1, opacity: 1,
        duration: 0.18,
        ease: 'back.out(1.2)',
        stagger: {
          each: 0.006,
          from: 'random'
        },
        onStart: startSpin
      }, 0.50);

      // ─── PHASE 6: Hold for spin viewing (0.68 → 1.0) ───
      tl.to({}, { duration: 0.32 }, 0.68);
    };

    // ════════════════════════════════════════
    //  BOOT — wait for carousel images
    // ════════════════════════════════════════
    const imgEls = fImages.map(el => el.querySelector('img') || el);
    const pending = imgEls.filter(el => el.tagName === 'IMG' && !el.complete);

    const boot = () => {
      buildTimeline();
      ScrollTrigger.refresh();
    };

    if (pending.length) {
      let loaded = 0;
      const check = () => { if (++loaded >= pending.length) boot(); };
      pending.forEach(img => {
        img.addEventListener('load', check, { once: true });
        img.addEventListener('error', check, { once: true });
      });
      // Safety timeout
      setTimeout(() => {
        if (loaded < pending.length) { loaded = pending.length; boot(); }
      }, 3000);
    } else {
      boot();
    }

    // ════════════════════════════════════════
    //  SCROLL END — ease spin back to base
    // ════════════════════════════════════════
    ScrollTrigger.addEventListener('scrollEnd', () => {
      if (!spinStarted) return;
      gsap.to([infiniteSpin, counterSpin], {
        timeScale: BASE_SPEED * currentDir,
        duration: 1.5, overwrite: true
      });
    });

    // ════════════════════════════════════════
    //  RESIZE — full rebuild
    // ════════════════════════════════════════
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        positionImages();
        buildTimeline();
      }, 250);
    });
  }

  // ════════════════════════════════════════
  //  INIT — wait for fonts + DOM
  // ════════════════════════════════════════
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.addEventListener('loadingdone', init, { once: true });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
