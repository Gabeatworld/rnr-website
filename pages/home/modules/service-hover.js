/* ============================================================
   Module: serviceHover
   Service item hover — text color, image scale, BG fade,
   mouse-driven move + rotate on the image wrap.
   Replaces 4 Webflow interactions with one script.
   ============================================================ */

RNR.register('serviceHover', function (/* shared */) {
  // Disable entirely on mobile/tablet — hover interactions don't apply
  if (window.innerWidth <= 768) return null;

  const serviceList = document.querySelector('.service-list');
  if (!serviceList || !window.gsap) return null;

  const items  = Array.from(serviceList.querySelectorAll('.service-item'));
  const bgWrap = document.querySelector('.services-bg');
  const bgImages = bgWrap
    ? Array.from(bgWrap.querySelectorAll('.service-bg-image'))
    : [];

  if (!items.length) return null;

  // ── Config ───────────────────────────────────────────────
  const MOVE_RANGE   = 150;  // px
  const ROTATE_RANGE = 4;    // degrees
  const HOVER_IN     = { duration: 0.3, ease: 'circ.out' };
  const HOVER_OUT    = { duration: 0.3, ease: 'power2.in' };

  // ── State ────────────────────────────────────────────────
  let activeItem  = null;
  let mouseX      = 0;
  let mouseY      = 0;
  let currentX   = 0;
  let currentY   = 0;
  let currentRot = 0;
  let rafId       = null;

  // ── Initial states ───────────────────────────────────────
  items.forEach((item) => {
    const imgWrap = item.querySelector('.image-wrap-service');
    if (imgWrap) {
      gsap.set(imgWrap, { scale: 0, opacity: 0 });
    }
  });

  bgImages.forEach((bg) => {
    gsap.set(bg, { opacity: 0 });
  });

  // ── Mouse tracking loop ──────────────────────────────────
  function trackMouse() {
    if (!activeItem) { rafId = null; return; }

    const imgWrap = activeItem.querySelector('.image-wrap-service');
    if (!imgWrap) { rafId = null; return; }

    const rect = activeItem.getBoundingClientRect();
    // Normalise mouse X within item: -1 to 1
    const nx = ((mouseX - rect.left) / rect.width) * 2 - 1;

    const targetX   = nx * MOVE_RANGE;
    const targetRot = nx * ROTATE_RANGE;

    // Lerp for smoothness
    currentX   += (targetX   - currentX)   * 0.12;
    currentRot += (targetRot - currentRot) * 0.12;

    gsap.set(imgWrap, {
      x: currentX,
      rotation: currentRot,
    });

    rafId = requestAnimationFrame(trackMouse);
  }

  function startTracking() {
    if (!rafId) rafId = requestAnimationFrame(trackMouse);
  }

  function stopTracking() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // ── Hover in ─────────────────────────────────────────────
  function activate(item, index) {
    if (activeItem === item) return;
    if (activeItem) deactivate();

    activeItem = item;

    // Reset lerp values
    currentX = 0; currentY = 0; currentRot = 0;

    // All hover-in animations — same duration + ease
    gsap.to(serviceList, { color: 'white', ...HOVER_IN });
    item.classList.add('is-active');

    const imgWrap = item.querySelector('.image-wrap-service');
    if (imgWrap) {
      gsap.killTweensOf(imgWrap);
      gsap.to(imgWrap, { scale: 1, opacity: 1, ...HOVER_IN });
    }

    const bg = bgImages[index];
    if (bg) {
      gsap.killTweensOf(bg);
      gsap.to(bg, { opacity: 1, ...HOVER_IN });
    }

    startTracking();
  }

  // ── Hover out ────────────────────────────────────────────
  function deactivate() {
    if (!activeItem) return;

    const item  = activeItem;
    const index = items.indexOf(item);

    stopTracking();
    activeItem = null;

    // All hover-out animations — same duration + ease
    gsap.to(serviceList, { color: 'var(--_theme---text)', ...HOVER_OUT });
    item.classList.remove('is-active');

    const imgWrap = item.querySelector('.image-wrap-service');
    if (imgWrap) {
      gsap.killTweensOf(imgWrap);
      gsap.to(imgWrap, { scale: 0, opacity: 0, x: 0, rotation: 0, ...HOVER_OUT });
    }

    const bg = bgImages[index];
    if (bg) {
      gsap.killTweensOf(bg);
      gsap.to(bg, { opacity: 0, ...HOVER_OUT });
    }
  }

  // ── Events ───────────────────────────────────────────────
  items.forEach((item, i) => {
    item.addEventListener('mouseenter', () => activate(item, i));
    item.addEventListener('mouseleave', () => deactivate());
  });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  return { activate, deactivate };

}, 5); // priority 5
