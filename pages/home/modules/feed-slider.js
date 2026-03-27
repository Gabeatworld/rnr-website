/* ============================================================
   Module: feedSlider
   Inner slide navigation, dot nav, video control.
   ============================================================ */

RNR.register('feedSlider', function (shared) {
  const { wrapper, projects } = shared;

  if (!wrapper || !projects.length || !window.gsap) {
    console.warn('[feedSlider] Missing required elements or GSAP');
    return null;
  }

  // ── Helpers ──────────────────────────────────────────────
  function getSlideItems(project) {
    const list = project.querySelector('.feed-inner-slider-list');
    if (!list) return [];
    return Array.from(list.querySelectorAll('.feed-slider-slide:not(.w-condition-invisible)'));
  }

  // ── Video control ────────────────────────────────────────
  function playVideo(video) {
    if (!video || video.tagName !== 'VIDEO') return;
    if (video.preload === 'none' && video.readyState === 0) {
      video.preload = 'auto';
      video.load();
    }
    const p = video.play();
    if (p !== undefined) p.catch(() => {});
  }

  function pauseVideo(video) {
    if (!video || video.tagName !== 'VIDEO') return;
    video.pause();
  }

  function playVisibleVideo(project) {
    const idx   = parseInt(project.dataset.innerIndex || '0', 10);
    const items = getSlideItems(project);
    const slide = items[idx];
    if (!slide) return;
    const v = slide.querySelector('video.feed-video');
    if (v) playVideo(v);
  }

  function pauseAllVideos(project) {
    project.querySelectorAll('video.feed-video').forEach((v) => pauseVideo(v));
  }

  function handleSlideVideoTransition(project, fromIdx, toIdx) {
    const items = getSlideItems(project);
    const fromV = items[fromIdx]?.querySelector('video.feed-video');
    const toV   = items[toIdx]?.querySelector('video.feed-video');
    if (fromV) pauseVideo(fromV);
    if (toV)   playVideo(toV);
  }

  // ── Nav visibility ───────────────────────────────────────
  function updateNavVisibility(project, currentIndex, totalItems) {
    const sliderWrapper = project.querySelector('.feed-project-slider');
    if (!sliderWrapper) return;

    const prevZone = sliderWrapper.querySelector('.slide-prev');
    const nextZone = sliderWrapper.querySelector('.slide-next');
    const isFirst  = currentIndex === 0;
    const isLast   = currentIndex === totalItems - 1;

    if (prevZone) prevZone.style.display = (isFirst || isLast) ? 'none' : 'block';
    if (nextZone) nextZone.style.display = isLast ? 'none' : 'block';

    if (nextZone && !isLast) {
      if (isFirst) {
        nextZone.style.left  = '0';
        nextZone.style.width = '100%';
      } else {
        nextZone.style.left  = '';
        nextZone.style.width = '';
      }
    }
  }

  // ── Setup per project ────────────────────────────────────
  projects.forEach((project, i) => {
    project.dataset.index      = i;
    project.dataset.innerIndex = 0;

    const sliderWrapper = project.querySelector('.feed-project-slider');
    const sliderList    = project.querySelector('.feed-inner-slider-list');
    if (!sliderList) return;

    const slideItems = sliderList.querySelectorAll('.feed-slider-slide:not(.w-condition-invisible)');
    if (slideItems.length <= 1) return;

    // Dots
    const dotsNav = project.querySelector('.feed-inner-slider-nav');
    if (dotsNav) {
      const existing = dotsNav.querySelectorAll('.feed-inner-slider-dot');
      for (let d = existing.length; d < slideItems.length; d++) {
        const dot = document.createElement('div');
        dot.className    = 'feed-inner-slider-dot';
        dot.dataset.index = d;
        dotsNav.appendChild(dot);
      }
      const first = dotsNav.querySelector('.feed-inner-slider-dot');
      if (first) first.classList.add('active');
    }

    // Initial nav state
    const prevZone = sliderWrapper?.querySelector('.slide-prev');
    const nextZone = sliderWrapper?.querySelector('.slide-next');
    if (prevZone) prevZone.style.display = 'none';
    if (nextZone) { nextZone.style.left = '0'; nextZone.style.width = '100%'; }
  });

  // ── Navigation ───────────────────────────────────────────
  function navigateInnerSlider(project, direction) {
    const sliderList = project.querySelector('.feed-inner-slider-list');
    if (!sliderList) return;

    const slideItems = getSlideItems(project);
    const dots       = project.querySelectorAll('.feed-inner-slider-dot');
    if (slideItems.length <= 1 || gsap.isTweening(sliderList)) return;

    let current = parseInt(project.dataset.innerIndex || '0', 10);
    let next    = current + direction;

    if (next < 0) next = 0;
    if (next >= slideItems.length) next = slideItems.length - 1;
    if (next === current) return;

    const w = slideItems[0]?.offsetWidth || 0;
    gsap.to(sliderList, { x: -w * next, duration: 0.55, ease: 'power3.inOut' });

    if (dots[current]) dots[current].classList.remove('active');
    if (dots[next])    dots[next].classList.add('active');
    project.dataset.innerIndex = next;

    handleSlideVideoTransition(project, current, next);
    updateNavVisibility(project, next, slideItems.length);
  }

  function navigateToIndex(project, targetIndex) {
    const sliderList = project.querySelector('.feed-inner-slider-list');
    if (!sliderList) return;

    const slideItems = getSlideItems(project);
    const dots       = project.querySelectorAll('.feed-inner-slider-dot');
    if (slideItems.length <= 1 || gsap.isTweening(sliderList)) return;

    const current = parseInt(project.dataset.innerIndex || '0', 10);
    if (targetIndex === current) return;

    const w = slideItems[0]?.offsetWidth || 0;
    gsap.to(sliderList, { x: -w * targetIndex, duration: 0.55, ease: 'power3.inOut' });

    if (dots[current])     dots[current].classList.remove('active');
    if (dots[targetIndex]) dots[targetIndex].classList.add('active');
    project.dataset.innerIndex = targetIndex;

    handleSlideVideoTransition(project, current, targetIndex);
    updateNavVisibility(project, targetIndex, slideItems.length);
  }

  function restartSlider(project) {
    const current = parseInt(project.dataset.innerIndex || '0', 10);
    navigateToIndex(project, 0);
    if (current === 0) playVisibleVideo(project);
  }

  // ── Active project watcher (direct, no MutationObserver) ─
  // feedAnimation calls restartSlider directly via the public API.
  // We still need to handle video play/pause on activation though.
  // Listen for class changes on projects to manage video state.

  function onProjectActivated(project) {
    playVisibleVideo(project);
  }

  function onProjectDeactivated(project) {
    pauseAllVideos(project);
  }

  // Lightweight observer — only for video play/pause
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName !== 'class') return;
      const project = mutation.target;
      const isActive = project.classList.contains('is-active');

      if (isActive) {
        onProjectActivated(project);
      } else {
        onProjectDeactivated(project);
      }
    });
  });

  projects.forEach((project) => {
    observer.observe(project, { attributes: true, attributeFilter: ['class'] });
  });

  // ── Events (delegated) ──────────────────────────────────
  // Hover: preload adjacent slide video
  wrapper.addEventListener('mouseenter', (e) => {
    const nextZone = e.target.closest('.slide-next');
    const prevZone = e.target.closest('.slide-prev');
    if (!nextZone && !prevZone) return;

    const project = e.target.closest('.feed-project');
    if (!project) return;

    const current = parseInt(project.dataset.innerIndex || '0', 10);
    const items   = getSlideItems(project);
    const target  = nextZone ? current + 1 : current - 1;

    if (target >= 0 && target < items.length) {
      const v = items[target]?.querySelector('video.feed-video');
      if (v && v.preload === 'none' && v.readyState === 0) {
        v.preload = 'auto';
        v.load();
      }
    }
  }, true);

  // Click
  wrapper.addEventListener('click', (e) => {
    const project = e.target.closest('.feed-project');
    if (!project) return;

    if (e.target.closest('.slide-restart')) {
      e.preventDefault(); e.stopPropagation();
      restartSlider(project);
      return;
    }
    if (e.target.closest('.slide-next')) {
      e.preventDefault(); e.stopPropagation();
      navigateInnerSlider(project, 1);
      return;
    }
    if (e.target.closest('.slide-prev')) {
      e.preventDefault(); e.stopPropagation();
      navigateInnerSlider(project, -1);
      return;
    }

    const dot = e.target.closest('.feed-inner-slider-dot');
    if (dot) {
      e.preventDefault(); e.stopPropagation();
      navigateToIndex(project, parseInt(dot.dataset.index, 10));
      return;
    }

    const caseSlide = e.target.closest('.feed-view-case');
    const caseLink  = e.target.closest('.feed-view-case a');
    if (caseSlide && !caseLink) {
      e.preventDefault();
      navigateInnerSlider(project, -1);
    }
  });

  // ── Public API ───────────────────────────────────────────
  return { restartSlider, navigateInnerSlider, navigateToIndex };

}, 1); // priority 1 — runs after feedAnimation
