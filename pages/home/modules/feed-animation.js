/* ============================================================
   Module: feedAnimation
   Scroll-triggered text blur reveals + background crossfade
   for feed projects.
   ============================================================ */

RNR.register('feedAnimation', function (shared) {
  const { container, wrapper, projects } = shared;

  if (!container || !wrapper || !projects.length || !window.gsap || !window.SplitText) {
    console.warn('[feedAnimation] Missing required elements or libraries');
    return null;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ── Config ───────────────────────────────────────────────
  const TEXT = {
    duration:  1.1,
    stagger:   0.2,
    blurStart: 10,
    delay:     0.05,
    ease:      'power2.out',
  };

  // ── State ────────────────────────────────────────────────
  const splitInstances = [];
  const textElements   = [];

  // ── Backgrounds ──────────────────────────────────────────
  // Move .feed-background from each project into .feed-bg-sticky
  // (fixes GSAP transform + position:fixed conflict)
  var stickyContainer = container.querySelector('.feed-bg-sticky');
  var backgrounds     = [];

  projects.forEach(function (slide, i) {
    var bg = slide.querySelector('.feed-background');
    if (!bg || !stickyContainer) return;
    bg.dataset.bgIndex = i;
    stickyContainer.appendChild(bg);
    backgrounds.push(bg);
  });

  // Start hidden — intro or scroll will reveal
  if (stickyContainer) gsap.set(stickyContainer, { opacity: 0 });
  backgrounds.forEach(function (bg) { gsap.set(bg, { opacity: 0 }); });

  // ── Background crossfade ─────────────────────────────────
  function showBg(index) {
    if (!stickyContainer) return;
    // Sticky container visible
    gsap.to(stickyContainer, { opacity: 1, duration: 0.3, overwrite: true });
    // Incoming fades in — sits on top of outgoing, no gap
    if (backgrounds[index]) {
      gsap.killTweensOf(backgrounds[index]);
      gsap.to(backgrounds[index], {
        opacity: 1, duration: 0.6, ease: 'power1.inOut'
      });
    }
  }

  function hideBg(index) {
    if (backgrounds[index]) {
      gsap.killTweensOf(backgrounds[index]);
      // Delay long enough that incoming is fully opaque before outgoing fades
      gsap.to(backgrounds[index], {
        opacity: 0, duration: 0.6, delay: 0.6, ease: 'power1.in'
      });
    }
  }

  function hideAllBgs() {
    backgrounds.forEach(function (bg) {
      gsap.killTweensOf(bg);
      gsap.set(bg, { opacity: 0 });
    });
    if (stickyContainer) gsap.set(stickyContainer, { opacity: 0 });
  }

  // ── Parallax ─────────────────────────────────────────────
  function createParallax() {
    projects.forEach(function (slide, i) {
      var bg = backgrounds[i];
      if (!bg) return;
      var bgImage = bg.querySelector('.feed-background-image');
      if (!bgImage) return;
      gsap.fromTo(bgImage,
        { yPercent: -10 },
        {
          yPercent: 10, ease: 'none',
          scrollTrigger: { trigger: slide, start: 'top bottom', end: 'bottom top', scrub: true }
        }
      );
    });
  }

  // ── Setup: split text once ───────────────────────────────
  projects.forEach((slide) => {
    const title       = slide.querySelector('.feed-title');
    const category    = slide.querySelector('.feed-category');
    const description = slide.querySelector('.feed-project-description');
    const words       = [];

    [title, category, description].forEach((el) => {
      if (!el || !el.textContent.trim()) return;
      const split = new SplitText(el, { type: 'words', wordsClass: 'word' });
      splitInstances.push(split);
      words.push(...split.words);
    });

    textElements.push({ words });

    if (words.length) {
      gsap.set(words, {
        opacity: 0,
        filter: `blur(${TEXT.blurStart}px)`,
        willChange: 'transform, opacity, filter',
      });
    }
  });

  // ── Text animations ──────────────────────────────────────
  function animateIn(index) {
    const { words } = textElements[index];
    if (!words.length) return;

    gsap.killTweensOf(words);
    gsap.set(words, { opacity: 0, filter: `blur(${TEXT.blurStart}px)` });
    gsap.to(words, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: TEXT.duration,
      delay: TEXT.delay,
      stagger: { amount: TEXT.stagger },
      ease: TEXT.ease,
      onComplete() {
        gsap.set(this.targets(), { clearProps: 'willChange,filter' });
      },
    });
  }

  function animateOut(index) {
    const { words } = textElements[index];
    if (!words.length) return;

    gsap.killTweensOf(words);
    gsap.to(words, {
      opacity: 0,
      filter: `blur(${TEXT.blurStart}px)`,
      duration: 0.3,
      stagger: 0.02,
      ease: 'power2.in',
    });
  }

  function hideAll() {
    textElements.forEach(({ words }) => {
      if (!words.length) return;
      gsap.killTweensOf(words);
      gsap.set(words, { opacity: 0, filter: `blur(${TEXT.blurStart}px)` });
    });
    projects.forEach((s) => s.classList.remove('is-active'));
    hideAllBgs();
    shared.setActiveIndex(-1);
  }

  // ── Activate slide ───────────────────────────────────────
  function activateSlide(index) {
    // During intro, block ScrollTrigger-driven activations — intro handles the reveal
    if (document.documentElement.classList.contains('has-intro')) return;

    const prev = shared.getActiveIndex();
    if (prev === index) return;

    if (prev >= 0) {
      projects[prev].classList.remove('is-active');
      animateOut(prev);
      hideBg(prev);
    }

    shared.setActiveIndex(index);
    projects[index].classList.add('is-active');
    animateIn(index);
    showBg(index);

    // Tell slider to restart (direct call, no MutationObserver needed)
    if (RNR.feedSlider) {
      RNR.feedSlider.restartSlider(projects[index]);
    }
  }

  // ── Intro: crossfade first bg as overlay dissolves ───────
  // rnr:intro-done fires right before the overlay starts fading.
  // Set first bg + sticky container to full opacity immediately
  // so the bg is revealed as the dark overlay dissolves.
  if (document.documentElement.classList.contains('has-intro')) {
    var introHandler = function () {
      if (stickyContainer) gsap.set(stickyContainer, { opacity: 1 });
      if (backgrounds[0])  gsap.set(backgrounds[0],  { opacity: 1 });
    };
    if (window.__rnrIntroDone) {
      introHandler();
    } else {
      window.addEventListener('rnr:intro-done', introHandler, { once: true });
    }
  }

  // ── ScrollTriggers ───────────────────────────────────────
  var createTriggers = function () {
    var lastIndex = projects.length - 1;

    projects.forEach(function (slide, i) {
      ScrollTrigger.create({
        trigger: slide,
        start: 'top center',
        end: i === lastIndex ? 'bottom 25%' : 'bottom center',
        onEnter:     function () { activateSlide(i); },
        onEnterBack: function () { activateSlide(i); },
      });
    });

    ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      onLeave:     function () { hideAll(); },
      onLeaveBack: function () { hideAll(); },
    });

    createParallax();
  };

  // On homepage: wait for intro to finish before creating scroll triggers
  if (document.documentElement.classList.contains('has-intro')) {
    var startTriggers = function () {
      // Don't pre-set activeIndex — let activateSlide(0) from the intro
      // script run the full activation (text + bg + is-active class)
      createTriggers();
    };
    if (window.__rnrIntroDone) {
      startTriggers();
    } else {
      window.addEventListener('rnr:intro-done', startTriggers, { once: true });
    }
  } else {
    // Non-homepage: fade bg-sticky in on scroll
    if (stickyContainer) {
      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        end: 'top 20%',
        scrub: true,
        onUpdate: function (self) {
          gsap.set(stickyContainer, { opacity: self.progress });
        },
      });
    }
    createTriggers();
  }

  // ── Public API ───────────────────────────────────────────
  return { activateSlide, hideAll };

}, 0); // priority 0 — runs first
