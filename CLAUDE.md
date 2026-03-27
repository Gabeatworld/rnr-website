# RNR Studio — Webflow Site

## Platform & Workflow
- **Webflow site** — no local dev server, no build step
- Code lives as **HTML/CSS/JS snippets** in markdown files, pasted into Webflow custom code fields (Project Settings > Head/Body, or page-level embeds)
- **Backup convention:** Before modifying a section folder, copy originals into `_backup_YYYY-MM-DD/` subfolder
- **Add-on scripts:** New functionality goes in a separate file within the section folder (don't modify originals unless necessary)

## Libraries (loaded via Webflow CDN)
- GSAP + ScrollTrigger + SplitText
- Lenis (smooth scroll)

## Project Structure
```
global/                    — Head/body code, animation presets
section_<name>/            — Per-section CSS, JS, animation scripts
  _backup_YYYY-MM-DD/      — Pre-change snapshots
reference/                 — Webflow variables, form references
audits/                    — Performance/technical audits
```

## DOM Tree (Homepage)
```
body
└── main.page-wrapper
    ├── section.feed-section              ← Work feed (section 1)
    │   ├── div.feed-bg-sticky            ← Static HTML, backgrounds moved here by JS
    │   ├── component.spacer-content
    │   ├── div.u-container
    │   │   └── div.grid
    │   │       └── div.u-alignment-center
    │   │           └── h2.label          ← "Moments"
    │   └── div.feed-wrapper-cms
    │       └── div.feed-wrapper
    │           └── div.feed-project      ← Repeated per CMS item
    │               ├── div.feed-info
    │               │   ├── .feed-category
    │               │   └── .feed-title
    │               └── div.feed-project-slider
    │                   ├── div.slide-prev
    │                   ├── div.slide-next
    │                   ├── div.feed-inner-slider-nav
    │                   └── div.feed-inner-slider-list
    │                       └── div.feed-slider-slide (repeated)
    ├── section (other sections...)
    └── ...
```

## Animation System

### Page transitions
- `.page-wrapper` starts `opacity:0; filter:blur(12px)`
- On load: `body.page-entering` triggers CSS transition to visible
- On nav click: `body.page-exiting` blurs out, then navigates

### Homepage intro
- `intro-phrase-v2-standalone.html` runs an overlay with word-by-word blur reveal
- On completion, dispatches `window.dispatchEvent(new CustomEvent('rnr:intro-done'))`
- Any section can listen: `window.addEventListener('rnr:intro-done', fn, { once: true })`

### Shared animation presets (`global/animation-presets.js`)
- `RNR.fx.blurReveal(targets, opts)` — opacity 0→1 + blur→0
- `RNR.fx.fadeUp(targets, opts)` — opacity 0→1 + y offset→0
- `RNR.fx.fadeIn(targets, opts)` — simple opacity
- `RNR.fx.hideBlur/hideUp/hideOpacity` — set initial hidden states

### Feed section scripts (load order matters)
1. `Feed CSS.md` — styles for sticky bg, active states, mobile overrides
2. `Feed Scroll Animation.md` — `PortfolioAnimation` class, scroll-triggered bg/text reveals
3. `Feed Slider.md` — `PortfolioSlider` class, inner slide navigation + video control
4. `Feed Intro Animation.md` — add-on, staged entrance after intro phrase

### CSS classes used by animation JS
- `.is-active` — added to `.feed-project` when in viewport center
- `.has-intro` — on `<html>`, homepage only, removed after intro
- `.hero-ready` — added after intro phrase completes
- `.page-entering` / `.page-exiting` — page transition states
- `.animations-ready` — general animation system ready

## Key Conventions
- Feed backgrounds are **moved by JS** from `.feed-project` into `.feed-bg-sticky` at init (fixes GSAP transform + position:fixed conflict)
- `.feed-bg-sticky` is **static HTML in Webflow**, not JS-created
- Section label uses Webflow class `.label` inside `.u-alignment-center`
- CMS items use Webflow conditional visibility (`.w-condition-invisible`)
