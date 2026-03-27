/* ============================================================
   Module: imageTrail
   Snapshot section — mouse-follow image trail effect.
   Active only while .section_snapshot is in viewport.
   Positions are viewport-relative so scroll can't desync.
   ============================================================ */

RNR.register('imageTrail', function (/* shared */) {
  const section   = document.querySelector('.section_snapshot');
  const container = document.querySelector('.trail_wrap');
  if (!section || !container || !window.gsap) return null;

  // ── Math utils ───────────────────────────────────────────
  const lerp     = (a, b, n) => (1 - n) * a + n * b;
  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ── Mouse position — viewport-relative to container ──────
  let mousePos     = { x: 0, y: 0 };
  let cacheMousePos = { x: 0, y: 0 };
  let lastMousePos  = { x: 0, y: 0 };

  section.addEventListener('mousemove', (ev) => {
    const rect = container.getBoundingClientRect();
    mousePos = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  });

  // ── Image items ──────────────────────────────────────────
  class ImageItem {
    constructor(el) {
      this.el = el;
      this.width  = el.offsetWidth;
      this.height = el.offsetHeight;
      gsap.set(el, { scale: 0, x: 0, y: 0, opacity: 1 });
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      gsap.set(this.el, { scale: 0, x: 0, y: 0 });
      this.width  = this.el.offsetWidth;
      this.height = this.el.offsetHeight;
    }
    isActive() {
      return gsap.isTweening(this.el) || this.el.style.transform.indexOf('scale(0)') === -1;
    }
  }

  const images = Array.from(container.querySelectorAll('.trail_scale-img')).map((el) => new ImageItem(el));
  if (images.length === 0) return null;

  let imgPosition = 0;
  let zIndexVal   = 1;
  const threshold = 100;

  // ── Visibility gating (pause when offscreen) ─────────────
  let isVisible = false;
  let rafId     = null;

  const visObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !rafId) {
          rafId = requestAnimationFrame(render);
        }
      });
    },
    { threshold: 0 }
  );
  visObserver.observe(section);

  // ── Render loop ──────────────────────────────────────────
  function render() {
    if (!isVisible) { rafId = null; return; }

    const dist = distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

    cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
    cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

    if (dist > threshold) {
      showNextImage();
      zIndexVal++;
      imgPosition = imgPosition < images.length - 1 ? imgPosition + 1 : 0;
      lastMousePos = { ...mousePos };
    }

    // Reset z-index when idle
    let idle = true;
    for (const img of images) {
      if (img.isActive()) { idle = false; break; }
    }
    if (idle && zIndexVal !== 1) zIndexVal = 1;

    rafId = requestAnimationFrame(render);
  }

  function showNextImage() {
    const img = images[imgPosition];
    if (!img) return;

    // Use offsetWidth/Height (layout size, not scroll-dependent)
    const hw = img.width / 2;
    const hh = img.height / 2;

    gsap.killTweensOf(img.el);
    gsap.timeline()
      .set(img.el, {
        scale: 0,
        zIndex: zIndexVal,
        x: cacheMousePos.x - hw,
        y: cacheMousePos.y - hh,
        immediateRender: true,
      })
      .to(img.el, {
        duration: 0.6,
        ease: 'expo.out',
        scale: 1,
        x: mousePos.x - hw,
        y: mousePos.y - hh,
      }, 0)
      .to(img.el, {
        duration: 0.8,
        ease: 'power2.in',
        scale: 0,
      }, 0.5);
  }

  // ── Preload images then start ────────────────────────────
  const preload = () => new Promise((resolve) => {
    if (typeof imagesLoaded !== 'undefined') {
      imagesLoaded(document.querySelectorAll('.trail_scale-img'), resolve);
    } else {
      resolve();
    }
  });

  preload().then(() => {
    if (isVisible && !rafId) {
      rafId = requestAnimationFrame(render);
    }
  });

  return null;

}, 10); // priority 10 — independent, runs last
