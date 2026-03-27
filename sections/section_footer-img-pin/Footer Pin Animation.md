<style>
  /* CSS-first hide: prevent flash before JS initializes */
  .circle-image {
    visibility: hidden;
  }
</style>
<script>
document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector('.section_footer-pin');
  const container = document.querySelector('.master-cta-images');
  const images = gsap.utils.toArray('.circle-image');
  const heading = section ? section.querySelector('.footer-pin_heading') : null;

  if (!section || !container || !images.length) return;

  // Immediately hide via GSAP (scale:0 + opacity:0) then reveal visibility
  gsap.set(images, { scale: 0, opacity: 0, visibility: 'visible' });


  // Targets: this section + the one right before it
  const prevSection = section.previousElementSibling;
  const bgTargets = [section, prevSection].filter(Boolean);

  const applyThemeProgress = (p) => {
    const c = gsap.utils.clamp(0, 1, p);
    bgTargets.forEach(el => {
      el.style.backgroundColor = gsap.utils.interpolate('#f5f0ec', '#1a1a1a', c);
    });
    if (heading) {
      heading.style.color = gsap.utils.interpolate('#1a1a1a', '#ffffff', c);
    }
  };

  const clearThemeOverrides = () => {
    bgTargets.forEach(el => { el.style.backgroundColor = ''; });
    if (heading) { heading.style.color = ''; }
  };

  // CONFIG
  const baseSpeed = 0.75;
  let currentDirection = 1;
  let spinStarted = false;
  let pinTl = null;
  let bloomST = null;

  const getRadius = () => {
    const w = window.innerWidth;
    if (w < 479) return w * 0.75;
    if (w < 991) return w * 0.5;
    return 600;
  };

  // INFINITE SPIN (paused until triggered)
  const infiniteSpin = gsap.to(container, {
    rotation: 360,
    duration: 60,
    ease: 'none',
    repeat: -1,
    paused: true
  });

  const counterRotation = gsap.to(images, {
    rotation: -360,
    duration: 60,
    ease: 'none',
    repeat: -1,
    paused: true
  });

  // SCROLL VELOCITY -> SPIN SPEED
  const updateSpeed = (factor) => {
    if (Math.abs(factor) < 0.01) return;
    currentDirection = factor > 0 ? 1 : -1;
    let target = baseSpeed * currentDirection + factor;
    target = gsap.utils.clamp(-12, 12, target);
    gsap.to([infiniteSpin, counterRotation], {
      timeScale: target,
      duration: 0.6,
      overwrite: true
    });
  };

  // BUILD (or rebuild) the pinned scroll timeline
  const buildTimeline = () => {
    // Kill previous ScrollTriggers if rebuilding
    if (bloomST) { bloomST.kill(); bloomST = null; }
    if (pinTl) {
      const st = pinTl.scrollTrigger;
      pinTl.kill();
      if (st) st.kill();
      clearThemeOverrides();
      gsap.set(images, { scale: 0, opacity: 0 });
      if (spinStarted) {
        spinStarted = false;
        infiniteSpin.pause();
        counterRotation.pause();
      }
    }

    const radius = getRadius();
    const step = (Math.PI * 2) / images.length;
    // Place images at final orbital positions, just hidden
    images.forEach((img, i) => {
      const angle = i * step;
      gsap.set(img, {
        scale: 0,
        opacity: 0,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        xPercent: -50,
        yPercent: -50
      });
    });

    // How far images scale during pre-pin (rest finishes in pinned tl)
    const preScale = 0.65;

    // PRE-PIN: bloom images as section scrolls into view
    // Starts when section center hits viewport bottom, ends at pin point
    bloomST = ScrollTrigger.create({
      trigger: section,
      start: 'center bottom',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        if (!spinStarted) {
          spinStarted = true;
          infiniteSpin.play();
          counterRotation.play();
        }
      },
      onLeaveBack: () => {
        if (spinStarted) {
          spinStarted = false;
          infiniteSpin.pause();
          counterRotation.pause();
        }
        // Fully revert theme when scrolling back above the bloom zone
        clearThemeOverrides();
      },
      onRefresh: (self) => {
        // On refresh/load, snap to correct state based on actual scroll position
        const p = gsap.utils.clamp(0, 1, self.progress);
        if (p > 0 && !spinStarted) {
          spinStarted = true;
          infiniteSpin.play();
          counterRotation.play();
        }
        const s = p * preScale;
        images.forEach(img => {
          gsap.set(img, { scale: s, opacity: p });
        });
        applyThemeProgress(p);
      },
      onUpdate: (self) => {
        const p = self.progress; // 0→1
        const s = p * preScale;  // 0→preScale
        images.forEach(img => {
          gsap.set(img, { scale: s, opacity: p });
        });
        applyThemeProgress(p);
      }
    });

    // PINNED: finish bloom + bg shift + hold for spin
    pinTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'bottom bottom',
        end: '+=120%',
        pin: true,
        pinReparent: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeave: () => {
          // Persist dark theme after pin ends
          applyThemeProgress(1);
          gsap.set(images, { scale: 1, opacity: 1 });
        },
        onEnterBack: () => {
          // Let the timeline take control again when scrolling back
        },
        onRefresh: (self) => {
          if (self.spacer) {
            self.spacer.style.backgroundColor = '#f5f0ec';
          }
        },
        onUpdate: (self) => {
          const sensitivity = window.innerWidth < 991 ? 400 : 200;
          updateSpeed(self.getVelocity() / sensitivity);
        }
      }
    });

    // Finish bloom: preScale→1 (matches bg shift duration so they end together)
    // immediateRender:false in BOTH from and to vars to prevent flash
    pinTl.fromTo(images, {
      scale: preScale,
      opacity: 1,
      immediateRender: false
    }, {
      scale: 1,
      duration: 0.15,
      ease: 'none',
      immediateRender: false
    }, 0);

    // BG + text color already at dark by pin time (driven by bloomST)
    // Hold for spin viewing
    pinTl.to({}, { duration: 1 }, 0);
  };

  // INITIAL BUILD — wait for carousel images to load so ScrollTrigger
  // measures correct positions (avoids layout shift after late-loading images)
  const imgEls = images.map(el => el.querySelector('img') || el);
  const realImgs = imgEls.filter(el => el.tagName === 'IMG' && !el.complete);

  if (realImgs.length) {
    let loaded = 0;
    const onAllLoaded = () => {
      buildTimeline();
      ScrollTrigger.refresh();
    };
    realImgs.forEach(img => {
      img.addEventListener('load', () => { if (++loaded >= realImgs.length) onAllLoaded(); }, { once: true });
      img.addEventListener('error', () => { if (++loaded >= realImgs.length) onAllLoaded(); }, { once: true });
    });
    // Safety: build anyway after 3s even if images haven't loaded
    setTimeout(() => { if (loaded < realImgs.length) { loaded = realImgs.length; onAllLoaded(); } }, 3000);
  } else {
    buildTimeline();
  }

  // SCROLL END: ease back to base speed
  ScrollTrigger.addEventListener('scrollEnd', () => {
    gsap.to([infiniteSpin, counterRotation], {
      timeScale: baseSpeed * currentDirection,
      duration: 1.5,
      overwrite: true
    });
  });

  // RESIZE: full rebuild with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildTimeline();
    }, 250);
  });
});
</script>
