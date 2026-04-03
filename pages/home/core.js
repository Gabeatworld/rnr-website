/* ============================================================
   RNR Home — Module Orchestrator
   ============================================================
   Single DOMContentLoaded. Queries DOM once. Passes shared
   context to every registered module in order.
   ============================================================ */

(function () {
  'use strict';

  const RNR = (window.RNR = window.RNR || {});
  RNR.version = '__GIT_HASH__';

  // ── Module registry ──────────────────────────────────────
  const _modules = [];

  RNR.register = function (name, initFn, priority) {
    _modules.push({ name, initFn, priority: priority || 0 });
  };

  // ── Boot ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Shared DOM refs — queried once, used everywhere
    const container = document.querySelector('.feed-section');
    const wrapper   = document.querySelector('.feed-wrapper');
    const projects  = wrapper
      ? Array.from(wrapper.querySelectorAll('.feed-project'))
      : [];

    const shared = {
      container,
      wrapper,
      projects,
      activeIndex: -1,

      // Shared setters so modules stay in sync
      setActiveIndex(i) { shared.activeIndex = i; },
      getActiveIndex()  { return shared.activeIndex; },
    };

    // Sort by priority (lower runs first) then init in order
    _modules.sort((a, b) => a.priority - b.priority);

    _modules.forEach((mod) => {
      try {
        const api = mod.initFn(shared);
        if (api) RNR[mod.name] = api;
      } catch (err) {
        console.error(`[RNR] Module "${mod.name}" failed to init:`, err);
      }
    });

    console.log(
      `[RNR] v${RNR.version} — ${_modules.length} module(s):`,
      _modules.map((m) => m.name).join(', ')
    );
  });
})();
