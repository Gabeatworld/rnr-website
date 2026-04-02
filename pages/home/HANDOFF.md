---
**RNR Webflow Site — JS Architecture Handoff**

**What it is:** Modular JS build system for RNR Studio's Webflow site, replacing per-section embeds with a single compiled script per page.

**Current state:** Homepage has a working module system with 4 modules: feed-animation (scroll-triggered text blur reveals), feed-slider (inner slide nav + video control), image-trail (mouse-follow effect on snapshot section), and service-hover (replaces 4 Webflow interactions with one GSAP script). All compile into one `<script>` block via `bash compile.sh`. GitHub repo is live at `Gabeatworld/rnr-website` on `main`. CSS is managed entirely in Webflow — the compiled output is JS only.

**Decisions made:**
- Single JS file per page variant, not modular embeds — easier to debug, profile, and coordinate across sections
- Module system uses `RNR.register(name, initFn, priority)` pattern — no bundler, just `cat` concatenation via shell script. Modules get a shared DOM context (queried once) and can call each other's public APIs directly
- Feed animation calls slider's `restartSlider()` directly instead of using a MutationObserver roundabout. Observer still exists on slider side but only for video play/pause
- Image trail rAF loop pauses via IntersectionObserver when section is offscreen. Uses `offsetWidth`/`offsetHeight` instead of `getBoundingClientRect` for image dimensions to prevent scroll desync
- Service hover handles text color transitions in JS (`color: 'white'` / `color: 'var(--_theme---text)'`) — no Webflow combo classes needed. All animations synced to 0.3s duration
- GitHub + jsDelivr planned for CDN delivery, but not wired up to Webflow yet

**Open threads:**
- Lantern Chrome extension (`/Users/Gabe/Developer/Tools/lantern`) — plan was to hijack it for live JS injection during dev. Needs to be explored in next session
- Compiled output still has `<script>` wrapper tags — need a raw JS output option if serving as external script via jsDelivr
- Other homepage scripts (intro phrase, sticky bg, section labels) still run as standalone embeds — could be consolidated later
- Service hover not yet tested on live site — class names confirmed against DOM but needs visual QA

**File structure:**
```
pages/home/
├── core.js              ← Orchestrator
├── manifest.json        ← Module list
├── compile.sh           ← Builds home.compiled.html
├── home.compiled.html   ← Paste into Webflow page body
└── modules/
    ├── feed-animation.js
    ├── feed-slider.js
    ├── image-trail.js
    ├── service-hover.js
    └── feed-styles.css  ← Exists but not in manifest (CSS in Webflow)
```

**Next step:** Mount Lantern extension, figure out how to use it for live JS injection so the edit → test loop is instant. Then QA the service hover and image trail on the published site.
