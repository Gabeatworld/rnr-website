/* ============================================================
   Module: feedAnimation
   Scroll-triggered text blur reveals for feed projects.
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
    shared.setActiveIndex(-1);
  }

  // ── Activate slide ───────────────────────────────────────
  function activateSlide(index) {
    const prev = shared.getActiveIndex();
    if (prev === index) return;

    if (prev >= 0) {
      projects[prev].classList.remove('is-active');
      animateOut(prev);
    }

    shared.setActiveIndex(index);
    projects[index].classList.add('is-active');
    animateIn(index);

    // Tell slider to restart (direct call, no MutationObserver needed)
    if (RNR.feedSlider) {
      RNR.feedSlider.restartSlider(projects[index]);
    }
  }

  // ── ScrollTriggers ───────────────────────────────────────
  const lastIndex = projects.length - 1;

  projects.forEach((slide, i) => {
    ScrollTrigger.create({
      trigger: slide,
      start: 'top center',
      end: i === lastIndex ? 'bottom 25%' : 'bottom center',
      onEnter:     () => activateSlide(i),
      onEnterBack: () => activateSlide(i),
    });
  });

  ScrollTrigger.create({
    trigger: container,
    start: 'top bottom',
    end: 'bottom top',
    onLeave:     () => hideAll(),
    onLeaveBack: () => hideAll(),
  });

  // ── Public API ───────────────────────────────────────────
  return { activateSlide, hideAll };

}, 0); // priority 0 — runs first
