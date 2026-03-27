# RNR Studio — Performance & Technical Audit
**Date:** March 22, 2026
**Site:** https://rnrstudio.webflow.io/
**Pages audited:** Homepage, Showcase, Services, Sitemap, Robots.txt

---

## The Big Picture

Your site is beautifully built. The animations are polished, the GSAP work is tight, and the schema markup is surprisingly thorough for a creative studio. But underneath the polish, there are real gaps — mostly in SEO fundamentals, accessibility, and asset loading — that are quietly costing you visibility and performance.

Here's the honest breakdown.

---

## 1. Critical Issues (Fix These First)

### robots.txt is blocking the entire site
Your staging `robots.txt` has `Disallow: /` — which tells every crawler to stay away. This is expected for a staging subdomain, but it's worth double-checking that your production domain (`rnr.cool`) doesn't carry this over. If it does, nothing gets indexed. Period.

### Missing meta descriptions across all pages
Homepage, Showcase, Services — none of them have a `<meta description>`. Google will auto-generate snippets from page content, and those snippets are almost always worse than what you'd write yourself.

### Missing Open Graph & Twitter Card tags
No `og:title`, `og:image`, `og:description`, no Twitter cards. Every time someone shares a link to your site on Slack, LinkedIn, or Twitter, it shows up as a blank card. For a design studio, that's a missed branding opportunity on every single share.

### ~70% of images are missing alt text
Across all pages, roughly 56+ images have no alt attribute. Client logos, case study previews, hero images, footer decorative images — almost all of them. This hurts accessibility (screen readers can't describe them) and SEO (Google can't understand them).

**Showcase page is the worst offender:** 40+ portfolio images with zero alt text.

---

## 2. Performance Concerns

### Heavy animation payload
GSAP + ScrollTrigger + SplitText + Lenis are all loading. The custom animation code alone runs 3,000+ lines inline on the Services page. The blur-in page transition (`filter: blur(12px)` on `.page-wrapper`) adds visual weight on every page load.

On mobile, this stack is particularly expensive. Lenis is disabled on touch (good), but SplitText still runs DOM manipulation on every animated text block.

### No lazy loading on images
~80+ images on the homepage, 40+ on Showcase — none have `loading="lazy"`. The browser downloads everything upfront, whether it's in the viewport or not. Adding native lazy loading is a one-line fix per image in Webflow.

### No `srcset` or responsive image variants
Images are served in AVIF (great format choice), but without `srcset`, mobile users download the same resolution as desktop. Webflow generates responsive variants — make sure they're being used.

### Inline CSS is massive
The homepage carries ~15,000+ lines of inline CSS including a full utility system, container queries on `*`, and data-attribute styles for numbers 0-100. Some of this is Webflow's doing, but the custom utility layer adds significant weight.

### Third-party script load
Four tracking/personalization scripts load on every page: Google Analytics, Google Conversion tracking, Microsoft Clarity, and Intellimize. All are async (good), but collectively they add network requests and JavaScript execution time.

### Page transition anti-flicker pattern
The `body { overflow: hidden }` + opacity/blur technique prevents FOUC but adds a perceptible delay to every navigation. Users see a blank screen until fonts load and GSAP initializes. The 2-second fallback timeout is a safety net, but ideally the reveal happens faster.

---

## 3. SEO Findings

### What's working well
- **Schema markup is excellent.** Full `DesignAgency` structured data with founders, location (Mazatlán, Sinaloa), services, email, and founding date. This is better than most agencies bother with.
- **URL structure is clean.** `/work/project-name`, `/services`, `/showcase` — logical and crawlable.
- **Sitemap exists and is comprehensive.** 40+ portfolio pages, service pages, blog posts all accounted for.
- **Single H1 per page** on the homepage — proper hierarchy.

### What needs work
- **No meta descriptions** on any audited page.
- **No OG/Twitter tags** anywhere.
- **No canonical tags** visible — risk of duplicate content between staging and production.
- **Heading hierarchy is flat** on inner pages. Showcase jumps from H1-styled elements to H3 project titles with no H2 in between.
- **Blog section is thin.** Only 4 articles in the sitemap. For SEO traction, this needs consistent publishing.
- **No privacy policy or terms pages** listed in the sitemap.

---

## 4. Accessibility Audit

### Strengths
- Focus states are defined in CSS (`outline-offset`, `outline-color`)
- Some ARIA attributes present (`aria-pressed`, `aria-expanded`)
- Semantic HTML landmarks used (nav, section)
- Font smoothing applied consistently

### Weaknesses
- **Alt text coverage: ~30%.** Most images are invisible to screen readers.
- **No skip-to-content link.** Users navigating by keyboard have to tab through the entire nav on every page.
- **No `prefers-reduced-motion` detection.** The heavy animation system runs regardless of user preference. Some users get motion-sick from parallax and blur transitions.
- **Form labels unclear.** Contact form elements weren't verified but are likely missing explicit `<label>` associations based on the pattern across the site.
- **Color contrast untested.** Dark theme with light text — likely passes, but needs formal WCAG contrast testing.

---

## 5. Asset & Loading Summary

| Category | Status | Notes |
|----------|--------|-------|
| Image format | AVIF + SVG | Modern, good compression |
| Lazy loading | Not implemented | All images load upfront |
| Responsive images | No srcset detected | Single resolution served |
| Font loading | Waits for `document.fonts` | Can delay render |
| JS libraries | GSAP, ScrollTrigger, SplitText, Lenis | Heavy but async |
| Tracking scripts | GA, Clarity, Intellimize, GConversion | 4 third-party scripts |
| CSS delivery | Massive inline block | ~15K+ lines on homepage |
| Placeholder images | Broken references | Some case studies show `placeholder.svg` |

---

## 6. Priority Action Items

### Immediate (This Week)
1. Add meta descriptions to every page — write them yourself, 150-160 chars, keyword-rich
2. Add OG and Twitter Card tags (at minimum: `og:title`, `og:description`, `og:image`)
3. Add `loading="lazy"` to all below-fold images
4. Fix placeholder.svg broken image references in case studies
5. Verify production `robots.txt` allows crawling

### Short-Term (This Month)
6. Write alt text for every image — descriptive for content images, empty `alt=""` for decorative
7. Add a skip-to-content link
8. Implement `prefers-reduced-motion` media query to disable animations for users who need it
9. Add canonical tags pointing to production URLs
10. Add responsive `srcset` attributes to images

### Ongoing
11. Publish blog content consistently (aim for 2-4x/month for SEO lift)
12. Add privacy policy and terms of service pages
13. Run formal WCAG 2.1 AA contrast audit on the dark theme
14. Consider deferring non-critical GSAP animations until after first contentful paint
15. Audit Intellimize ROI — if it's not moving the needle, it's just extra weight

---

## 7. From 9/10 to 10/10 — Visual Polish Ideas

The design is already exceptional. These three moves are about closing the gap between "this is great" and "this feels inevitable."

### A. Give the monochrome a single moment of color
The cream/dark palette is mature and restrained — don't break that. But right now, every element on the page carries the same visual weight. One carefully placed accent color — even just on a single CTA or a hover state — would create a focal point that the eye naturally lands on. Think of it like a whisper in a quiet room. The restraint makes the moment louder. Consider a warm tone that lives in the same family as the cream — something like a muted terracotta or aged brass — applied only to the primary action on each page.

### B. Choreograph the entrance like a title sequence
The GSAP work is already strong, but the page load currently feels like several good animations happening near each other rather than one unified reveal. The blur-in, the text stagger, the nav fade — they're each well-timed individually, but they don't quite breathe as a single movement. Tightening the choreography so that every element enters as part of one continuous gesture — like a title sequence where each beat flows into the next — would make the first 1.5 seconds feel cinematic instead of sequential. Also worth considering: the mobile experience strips blur entirely right now, which creates a noticeable downgrade. A lighter version of the same choreography (opacity-only, shorter duration) would keep the feeling intact.

### C. Lock the portfolio grid into a deliberate rhythm
The Showcase page uses mixed aspect ratios across project cards, which creates energy but occasionally reads as accidental rather than editorial. The difference between "dynamic" and "messy" is whether the viewer trusts that every choice was intentional. Two options here: either commit fully to a masonry editorial layout with clearly varied sizes (large feature + small supporting), or lock everything into a consistent aspect ratio with hover-driven differentiation (subtle scale, brightness shift, or parallax on the thumbnail). Either approach works — but the current middle ground leaves the grid feeling 90% there.

---

## Scorecard

| Area | Score | Verdict |
|------|-------|---------|
| Visual Design & Build Quality | 9/10 | Exceptional |
| Schema & Structured Data | 9/10 | Thorough |
| URL Structure & IA | 8/10 | Clean |
| Performance & Loading | 5/10 | Animation-heavy, no lazy loading |
| SEO Fundamentals | 4/10 | Missing meta, OG, thin content |
| Accessibility | 4/10 | Alt text and motion are the gaps |
| Image Optimization | 5/10 | Good format, bad delivery |
| **Overall** | **6.3/10** | **Beautiful site, needs the invisible stuff** |

---

*The craft is there. The systems thinking is there. Now it's about applying that same rigor to the parts users and crawlers see that you don't.*
