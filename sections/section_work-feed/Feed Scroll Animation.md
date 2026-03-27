
<script>
document.addEventListener('DOMContentLoaded', () => {

  class PortfolioAnimation {
    constructor() {
      this.container = document.querySelector('.feed-section');
      this.wrapper = document.querySelector('.feed-wrapper');
      this.slides = [];
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
    }

    createTriggers() {
      const lastIndex = this.slides.length - 1;

      this.slides.forEach((slide, i) => {
        const isLast = i === lastIndex;
        ScrollTrigger.create({
          trigger: slide,
          start: 'top center',
          // FIX #2: Last slide gets extra scroll distance so sticky text
          // reaches the bottom of its container before deactivation
          end: isLast ? 'bottom 25%' : 'bottom center',
          onEnter: () => this.activateSlide(i),
          onEnterBack: () => this.activateSlide(i),
        });
      });

      // Section-level trigger for complete hide on exit
      ScrollTrigger.create({
        trigger: this.container,
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => this.hideAll(),
        onLeaveBack: () => this.hideAll()
      });
    }

    activateSlide(index) {
      if (this.activeIndex === index) return;

      const prevIndex = this.activeIndex;

      // Deactivate previous
      if (prevIndex >= 0) {
        this.slides[prevIndex].classList.remove('is-active');
        this.animateTextOut(prevIndex);
      }

      this.activeIndex = index;
      this.slides[index].classList.add('is-active');
      this.animateTextIn(index);

      // FIX #3: Reset inner slider to first slide when project becomes active
      if (window.portfolioSlider) {
        window.portfolioSlider.restartSlider(this.slides[index]);
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

    animateTextOut(index) {
      const { words } = this.textElements[index];
      if (!words.length) return;

      gsap.killTweensOf(words);
      gsap.to(words, {
        opacity: 0,
        filter: `blur(${this.textConfig.blurStart}px)`,
        duration: 0.3,
        stagger: 0.02,
        ease: 'power2.in'
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
      this.activeIndex = -1;
    }
  }

  window.portfolioAnimation = new PortfolioAnimation();

});
</script>
