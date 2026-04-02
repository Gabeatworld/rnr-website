# Home Page — Modular Build System

## How it works
All homepage JS lives in **self-contained modules** compiled into a single `<script>` block that goes into **Webflow Page Settings → Before </body> tag**.

No bundler. `compile.sh` reads `manifest.json` and concatenates `core.js` + all listed modules via `cat`. Output: `home.compiled.html` (with `<style>`/`<script>` tags) and `home.compiled.js` (raw JS for CDN/injection).

## Adding a new module

1. **Write the module** in `modules/your-module.js` using:
   ```js
   RNR.register('moduleName', function (shared) {
     // shared has: container, wrapper, projects, activeIndex, setActiveIndex(), getActiveIndex()
     // Return a public API object (or null if nothing to expose)
     return { rebuild: someFn };
   }, priority);  // lower priority number = runs first
   ```

2. **If your module needs CSS** that can't live in Webflow (e.g., styles for JS-created DOM), add a CSS file and list it in `manifest.json` under `"css"`. The compile script wraps these in a `<style>` block.

3. **Add to manifest.json** — both `"modules"` array and `"css"` array as needed.

4. **Run `bash compile.sh`** — produces updated `home.compiled.html` + `home.compiled.js`.

5. **Paste `home.compiled.html`** into Webflow page body code.

## Module conventions
- Modules self-register via `RNR.register(name, initFn, priority)`
- `core.js` boots on `DOMContentLoaded`, queries shared DOM refs once, then inits all modules in priority order
- Modules should guard against missing DOM elements (`if (!el) return null`)
- Modules can call each other via `RNR.moduleName.methodName()` (the returned API object gets attached to `window.RNR`)
- `priority` controls init order — lower runs first. Feed modules use default (0), later sections use 10+

## File structure
```
pages/home/
├── core.js              ← Orchestrator — do not add module code here
├── manifest.json        ← Source of truth for what gets compiled
├── compile.sh           ← Run after any change to rebuild
├── home.compiled.html   ← Final output → paste into Webflow
├── home.compiled.js     ← Raw JS (no tags) → for CDN/Lantern injection
├── HANDOFF.md           ← Session-to-session context
└── modules/
    ├── feed-animation.js
    ├── feed-slider.js
    ├── image-trail.js
    ├── service-hover.js
    ├── awards-footer-pin.js   ← Awards → footer crossfade pin
    └── awards-footer-pin.css  ← Structural CSS for JS-created wrapper
```

## What NOT to do
- Don't use standalone `<script>` embeds in Webflow for homepage sections — everything goes through this system
- Don't modify `home.compiled.html` or `home.compiled.js` directly — they're generated files
- Don't put presentation CSS here if it can live in Webflow's style panel — only structural CSS that targets JS-created DOM belongs in the CSS files
- Don't wrap module code in IIFE or DOMContentLoaded — `core.js` handles both

## Existing standalone embeds (not yet migrated)
These still run as separate Webflow embeds and are NOT part of this system yet:
- Intro phrase animation (`intro-phrase-v2-standalone.html`)
- Awards countup script (`data-countup` embed inside `.awards_section`)
- Sticky bg / section labels
