
<script>
document.addEventListener('DOMContentLoaded', () => {

  class PortfolioAnimation {
    constructor() {
      this.container = document.querySelector('.feed-section');
      this.wrapper = document.querySelector('.feed-wrapper');
      this.slides = [];
      this.backgrounds = [];
      this.textElements = [];
      this.splitInstances = [];
      this.activeIndex = -1;
      this._lastSlideLingering = false;

      this.textConfig = {
        duration: 1.1,
        stagger: 0.2,
        blurStart: 10,
        delay: 0.05,
        ease: 'power2.out'
      };

      if (!this.container || !this.wrapper || !window.gsap || !window.SplitText) {
        console.error('PortfolioAnimation: Missing required elements, GSAP, or SplitText');
        return;
      }

      gsap.registerPlugin(ScrollTrigger, SplitText);
      this.init();
    }

    init() {
      this.slides = Array.from(this.wrapper.querySelectorAll('.feed-project'));
      if (this.slides.length === 0) return;

      // ── Extract backgrounds into sticky container ──
      this.setupBackgrounds();

      this.slides.forEach((slide, i) => {
        const title = slide.querySelector('.feed-title');
        const category = slide.querySelector('.feed-category');
        const description = slide.querySelector('.feed-project-description');

        const words = [];

        [title, category, description].forEach(el => {
          if (!el || !el.textContent.trim()) return;

          const split = new SplitText(el, {
            type: 'words',
            wordsClass: 'word'
          });
          this.splitInstances.push(split);
          words.push(...split.words);
        });

        this.textElements.push({ words });

        if (words.length) {
          gsap.set(words, {
            opacity: 0,
            filter: `blur(${this.textConfig.blurStart}px)`,
            willChange: 'transform, opacity, filter'
          });
        }
      });

      // On homepage: defer scroll triggers until intro finishes
      // so activateSlide(0) doesn't fire behind the overlay
      if (document.documentElement.classList.contains('has-intro')) {
        const startTriggers = () => {
          // Intro already activated slide 0 (bg + is-active class)
          // Sync our state so ScrollTrigger's activateSlide(0) is a no-op
          this.activeIndex = 0;
          this.createTriggers();
          this.createParallax();
        };
        if (window.__rnrIntroDone) {
          startTriggers();
        } else {
          window.addEventListener('rnr:intro-done', startTriggers, { once: true });
        }
      } else {
        this.createTriggers();
        this.createParallax();
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BACKGROUNDS: Move from .feed-project into static .feed-bg-sticky
    // Container is static HTML in Webflow (not JS-created)
    // Fixes position:fixed being broken by GSAP transforms
    // ─────────────────────────────────────────────────────────────
    setupBackgrounds() {
      // Use existing static container from Webflow DOM
      const stickyContainer = this.container.querySelector('.feed-bg-sticky');
      if (!stickyContainer) {
        console.warn('PortfolioAnimation: .feed-bg-sticky not found in DOM');
        return;
      }

      // Move each project's background into the sticky container
      this.slides.forEach((slide, i) => {
        const bg = slide.querySelector('.feed-background');
        if (!bg) return;

        bg.dataset.bgIndex = i;
        stickyContainer.appendChild(bg);
        this.backgrounds.push(bg);
      });

      this.stickyContainer = stickyContainer;

      // Init: container and all individual backgrounds start hidden
      gsap.set(stickyContainer, { opacity: 0 });
      this.backgrounds.forEach(bg => gsap.set(bg, { opacity: 0 }));

      // On non-homepage: fade in on scroll as before
      if (!document.documentElement.classList.contains('has-intro')) {
        ScrollTrigger.create({
          trigger: this.container,
          start: 'top 85%',
          end: 'top 20%',
          scrub: true,
          onUpdate: (self) => {
            gsap.set(stickyContainer, { opacity: self.progress });
          }
        });
      }
    }

    createTriggers() {
      const lastIndex = this.slides.length - 1;

      this.slides.forEach((slide, i) => {
        ScrollTrigger.create({
          trigger: slide,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => this.activateSlide(i),
          onEnterBack: () => this.activateSlide(i),
          onLeave: () => this.deactivateSlide(i),
          onLeaveBack: () => this.deactivateSlide(i),
        });
      });

      // Section-level cleanup when entire feed exits viewport
      ScrollTrigger.create({
        trigger: this.container,
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => this.hideAll(),
        onLeaveBack: () => this.hideAll()
      });
    }

    // ─────────────────────────────────────────────────────────────
    // PARALLAX — top-to-bottom on background images
    // Uses the original slide as trigger, but animates the
    // extracted background image
    // ─────────────────────────────────────────────────────────────
    createParallax() {
      this.slides.forEach((slide, i) => {
        const bg = this.backgrounds[i];
        if (!bg) return;

        const bgImage = bg.querySelector('.feed-background-image');
        if (!bgImage) return;

        gsap.fromTo(bgImage,
          { yPercent: -10 },
          {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: slide,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      });
    }

    activateSlide(index) {
      // If last slide is lingering (text still showing, bg already faded)
      // and we're re-activating it (scrolled back up), cancel the linger
      if (this._lastSlideLingering && index === this.slides.length - 1) {
        this._lastSlideLingering = false;
        // bg is already faded, just re-show it
        if (this.backgrounds[index]) {
          gsap.to(this.backgrounds[index], { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
        }
        if (this.stickyContainer) {
          gsap.to(this.stickyContainer, { opacity: 1, duration: 0.3, overwrite: true });
        }
        this.activeIndex = index;
        return;
      }

      if (this.activeIndex === index) return;

      const prevIndex = this.activeIndex;

      // Crossfade — incoming fades in first, outgoing fades after delay
      // to prevent seam where both are partially transparent
      if (prevIndex >= 0) {
        // If previous was lingering last slide, clean it up
        if (this._lastSlideLingering) {
          this._lastSlideLingering = false;
          this.slides[prevIndex].classList.remove('is-active');
          this.hideText(prevIndex);
        } else {
          this.slides[prevIndex].classList.remove('is-active');
          this.hideText(prevIndex);
        }

        if (this.backgrounds[prevIndex]) {
          gsap.to(this.backgrounds[prevIndex], {
            opacity: 0,
            duration: 0.4,
            delay: 0.3,
            ease: 'power1.inOut'
          });
        }
      }

      this.activeIndex = index;
      this.slides[index].classList.add('is-active');
      this.animateTextIn(index);

      // Ensure sticky container is visible (may have been faded out by hideAll)
      if (this.stickyContainer) {
        gsap.to(this.stickyContainer, { opacity: 1, duration: 0.3, overwrite: true });
      }

      if (this.backgrounds[index]) {
        gsap.to(this.backgrounds[index], {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.inOut'
        });
      }
    }

    deactivateSlide(index) {
      if (this.activeIndex !== index) return;

      const isLast = index === this.slides.length - 1;

      if (isLast) {
        // Last slide: fade bg fast, but keep text + is-active visible.
        // Text lingers until hideAll cleans up (section exits viewport).
        this._lastSlideLingering = true;

        if (this.backgrounds[index]) {
          gsap.to(this.backgrounds[index], {
            opacity: 0,
            duration: 0.4,
            ease: 'power1.out'
          });
        }
        if (this.stickyContainer) {
          gsap.to(this.stickyContainer, { opacity: 0, duration: 0.4, delay: 0.3, overwrite: true });
        }
        // activeIndex stays, is-active stays, text stays
        return;
      }

      this.slides[index].classList.remove('is-active');
      this.hideText(index);
      this.activeIndex = -1;

      if (this.backgrounds[index]) {
        gsap.to(this.backgrounds[index], {
          opacity: 0,
          duration: 0.6,
          ease: 'power1.inOut'
        });
      }
    }

    animateTextIn(index) {
      const { words } = this.textElements[index];
      if (!words.length) return;

      gsap.killTweensOf(words);

      gsap.set(words, {
        opacity: 0,
        filter: `blur(${this.textConfig.blurStart}px)`
      });

      gsap.to(words, {
        opacity: 1,
        filter: 'blur(0px)',
        duration: this.textConfig.duration,
        delay: this.textConfig.delay,
        stagger: { amount: this.textConfig.stagger },
        ease: this.textConfig.ease,
        onComplete: function() {
          gsap.set(this.targets(), { clearProps: 'willChange,filter' });
        }
      });
    }

    hideText(index) {
      const { words } = this.textElements[index];
      if (!words.length) return;

      gsap.killTweensOf(words);
      gsap.set(words, {
        opacity: 0,
        filter: `blur(${this.textConfig.blurStart}px)`
      });
    }

    hideAll() {
      this._lastSlideLingering = false;

      this.textElements.forEach(({ words }) => {
        if (words.length) {
          gsap.killTweensOf(words);
          gsap.set(words, {
            opacity: 0,
            filter: `blur(${this.textConfig.blurStart}px)`
          });
        }
      });

      this.slides.forEach(s => s.classList.remove('is-active'));

      // Hide all backgrounds + container
      this.backgrounds.forEach(bg => {
        gsap.set(bg, { opacity: 0 });
      });
      if (this.stickyContainer) gsap.set(this.stickyContainer, { opacity: 0 });

      this.activeIndex = -1;
    }
  }

  window.portfolioAnimation = new PortfolioAnimation();

});
</script>
