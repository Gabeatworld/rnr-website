# Awards → Footer Crossfade Pin — Webflow Setup

## What this replaces
The standalone footer pin animation (`div.footer-pin-animation` embed inside `.section_footer-pin`).

## What stays untouched
- The awards countup script (`data-countup` embed inside `.awards_section`) — fires before the pin
- All global text/visual animations (`data-animate="text"`, `data-animate="visual"`) — fire on scroll before pin

## Webflow changes needed

### 1. Empty the old footer pin embed
In `.section_footer-pin`, find the embed element `div.footer-pin-animation.w-embed.w-script` and **delete its contents** (or remove the element entirely). The old script will conflict if left in place.

### 2. Add the new combined script
Paste the contents of `Awards-Footer Crossfade Pin.md` as **one** of these:
- A new **HTML Embed** element placed **after** `.section_footer-pin` in the page structure (recommended)
- Or in **Page Settings → Before </body> tag** for that page

### 3. Verify DOM order
The script expects `.awards_section` to be the **immediate previous sibling** of `.section_footer-pin`. No elements should sit between them.

### 4. CSS note
The `<style>` block in the script handles all layout overrides (absolute stacking, spacer hiding, etc.). No Webflow style changes needed.

## How it works
The script wraps both sections in a `.awards-footer-pin` div at runtime, pins it for 400% viewport scroll distance, and runs a 6-phase GSAP timeline:

1. **Hold** — awards fully visible (brief pause)
2. **Awards out** — staggered: logos → numeral → subtext → heading (each fades + drifts up + blurs)
3. **BG crossfade** — wrapper shifts `#f5f0ec` → `#1a1a1a` during the overlap
4. **Footer in** — heading + CTA fade up on the now-dark canvas
5. **Images bloom** — circular carousel scales in with random stagger, spin starts
6. **Spin hold** — scroll distance for the user to enjoy the carousel

## Tuning
- `end: '+=400%'` — total scroll distance. Increase for slower pacing, decrease for faster.
- Phase timing is normalized 0→1 across that distance. Adjust the position values (e.g., `0.10`, `0.28`) to shift when each phase starts.
- `BASE_SPEED` — idle spin speed of the carousel.
- `getRadius()` — orbital radius per breakpoint.
