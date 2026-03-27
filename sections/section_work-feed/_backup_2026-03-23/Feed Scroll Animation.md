
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

      this.createTriggers();
      this.createParallax();
    }

    // ─────────────────────────────────────────────────────────────
    // BACKGROUNDS: Extract from .feed-project into a sticky layer
    // Fixes position:fixed being broken by GSAP transforms
    // ─────────────────────────────────────────────────────────────
    setupBackgrounds() {
      // Create sticky container
      const stickyContainer = document.createElement('div');
      stickyContainer.className = 'feed-bg-sticky';

      // Move each project's background into the sticky container
      this.slides.forEach((slide, i) => {
        const bg = slide.querySelector('.feed-background');
        if (!bg) return;

        // Tag it so we can link it back to its project
        bg.dataset.bgIndex = i;
        stickyContainer.appendChild(bg);
        this.backgrounds.push(bg);
      });

      // Insert sticky container as first child of feed-section
      this.container.insertBefore(stickyContainer, this.container.firstChild);

      // Start hidden, fade in as you scroll into the section
      gsap.set(stickyContainer, { opacity: 0 });
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

    createTriggers() {
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
      if (this.activeIndex === index) return;

      const prevIndex = this.activeIndex;

      // Instantly kill previous slide — no fade overlap
      if (prevIndex >= 0) {
        this.slides[prevIndex].classList.remove('is-active');
        this.hideText(prevIndex);

        // Fade out previous background
        if (this.backgrounds[prevIndex]) {
          gsap.to(this.backgrounds[prevIndex], {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut'
          });
        }
      }

      this.activeIndex = index;
      this.slides[index].classList.add('is-active');
      this.animateTextIn(index);

      // Fade in active background
      if (this.backgrounds[index]) {
        gsap.to(this.backgrounds[index], {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.inOut'
        });
      }
    }

    deactivateSlide(index) {
      if (this.activeIndex !== index) return;
      this.slides[index].classList.remove('is-active');
      this.hideText(index);
      this.activeIndex = -1;

      // Fade out background
      if (this.backgrounds[index]) {
        gsap.to(this.backgrounds[index], {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut'
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

      // Hide all backgrounds
      this.backgrounds.forEach(bg => {
        gsap.set(bg, { opacity: 0 });
      });

      this.activeIndex = -1;
    }
  }

  window.portfolioAnimation = new PortfolioAnimation();

});
</script>
