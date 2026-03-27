<script>
document.addEventListener('DOMContentLoaded', () => {

  class PortfolioSlider {
    constructor() {
      this.container = document.querySelector('.feed-section');
      this.wrapper = document.querySelector('.feed-wrapper');
      this.projects = [];
      this.activeProjectIndex = -1;

      if (!this.container || !this.wrapper || !window.gsap) {
        console.error('PortfolioSlider: Missing container, wrapper, or GSAP');
        return;
      }

      this.init();
    }

    init() {
      this.projects = Array.from(this.wrapper.querySelectorAll('.feed-project'));
      if (this.projects.length === 0) return;

      this.projects.forEach((project, i) => {
        project.dataset.index = i;
        project.dataset.innerIndex = 0;
        this.setupInnerSlider(project);
      });

      this.attachEvents();
      this.setupActiveProjectWatcher();
    }

    // ─────────────────────────────────────────────────────────────
    // ACTIVE PROJECT WATCHER
    // ─────────────────────────────────────────────────────────────

    setupActiveProjectWatcher() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName !== 'class') return;

          const project = mutation.target;
          const index = parseInt(project.dataset.index, 10);
          const isNowActive = project.classList.contains('is-active');

          if (isNowActive && index !== this.activeProjectIndex) {
            this.activeProjectIndex = index;
            this.playVisibleVideo(project);
          } else if (!isNowActive && index === this.activeProjectIndex) {
            this.activeProjectIndex = -1;
            this.pauseAllVideos(project);
          }
        });
      });

      this.projects.forEach(project => {
        observer.observe(project, { attributes: true, attributeFilter: ['class'] });
      });
    }

    // ─────────────────────────────────────────────────────────────
    // VIDEO CONTROL (Native <video>)
    // ─────────────────────────────────────────────────────────────

    playVideo(video) {
      if (!video || video.tagName !== 'VIDEO') return;

      if (video.preload === 'none' && video.readyState === 0) {
        video.preload = 'auto';
        video.load();
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }

    pauseVideo(video) {
      if (!video || video.tagName !== 'VIDEO') return;
      video.pause();
    }

    playVisibleVideo(project) {
      const currentIndex = parseInt(project.dataset.innerIndex || '0', 10);
      const slideItems = this.getSlideItems(project);
      const currentSlide = slideItems[currentIndex];
      if (!currentSlide) return;

      const video = currentSlide.querySelector('video.feed-video');
      if (video) this.playVideo(video);
    }

    pauseAllVideos(project) {
      const videos = project.querySelectorAll('video.feed-video');
      videos.forEach(video => this.pauseVideo(video));
    }

    handleSlideVideoTransition(project, fromIndex, toIndex) {
      const slideItems = this.getSlideItems(project);

      const fromSlide = slideItems[fromIndex];
      if (fromSlide) {
        const fromVideo = fromSlide.querySelector('video.feed-video');
        if (fromVideo) this.pauseVideo(fromVideo);
      }

      const toSlide = slideItems[toIndex];
      if (toSlide) {
        const toVideo = toSlide.querySelector('video.feed-video');
        if (toVideo) this.playVideo(toVideo);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // INNER SLIDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    setupInnerSlider(project) {
      const sliderWrapper = project.querySelector('.feed-project-slider');
      const sliderList = project.querySelector('.feed-inner-slider-list');
      if (!sliderList) return;

      const slideItems = sliderList.querySelectorAll('.feed-slider-slide:not(.w-condition-invisible)');
      if (slideItems.length <= 1) return;

      // Setup dots nav
      const existingDotsNav = project.querySelector('.feed-inner-slider-nav');
      if (existingDotsNav) {
        const existingDots = existingDotsNav.querySelectorAll('.feed-inner-slider-dot');
        for (let i = existingDots.length; i < slideItems.length; i++) {
          const dot = document.createElement('div');
          dot.className = 'feed-inner-slider-dot';
          dot.dataset.index = i;
          existingDotsNav.appendChild(dot);
        }
        const firstDot = existingDotsNav.querySelector('.feed-inner-slider-dot');
        if (firstDot) firstDot.classList.add('active');
      }

      // Hide prev zone initially
      const prevZone = sliderWrapper?.querySelector('.slide-prev');
      if (prevZone) prevZone.style.display = 'none';

      // FIX #4: First slide — next zone covers full width
      const nextZone = sliderWrapper?.querySelector('.slide-next');
      if (nextZone) {
        nextZone.style.left = '0';
        nextZone.style.width = '100%';
      }
    }

    getSlideItems(project) {
      const sliderList = project.querySelector('.feed-inner-slider-list');
      if (!sliderList) return [];
      return Array.from(sliderList.querySelectorAll('.feed-slider-slide:not(.w-condition-invisible)'));
    }

    navigateInnerSlider(project, direction) {
      const sliderList = project.querySelector('.feed-inner-slider-list');
      if (!sliderList) return;

      const slideItems = this.getSlideItems(project);
      const dots = project.querySelectorAll('.feed-inner-slider-dot');

      if (slideItems.length <= 1 || gsap.isTweening(sliderList)) return;

      let currentIndex = parseInt(project.dataset.innerIndex || '0', 10);
      let nextIndex = currentIndex + direction;

      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= slideItems.length) nextIndex = slideItems.length - 1;
      if (nextIndex === currentIndex) return;

      const slideWidth = slideItems[0]?.offsetWidth || 0;
      gsap.to(sliderList, { x: -slideWidth * nextIndex, duration: 0.55, ease: 'power3.inOut' });

      if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
      if (dots[nextIndex]) dots[nextIndex].classList.add('active');
      project.dataset.innerIndex = nextIndex;

      this.handleSlideVideoTransition(project, currentIndex, nextIndex);
      this.updateNavVisibility(project, nextIndex, slideItems.length);
    }

    navigateToIndex(project, targetIndex) {
      const sliderList = project.querySelector('.feed-inner-slider-list');
      if (!sliderList) return;

      const slideItems = this.getSlideItems(project);
      const dots = project.querySelectorAll('.feed-inner-slider-dot');

      if (slideItems.length <= 1 || gsap.isTweening(sliderList)) return;

      const currentIndex = parseInt(project.dataset.innerIndex || '0', 10);
      if (targetIndex === currentIndex) return;

      const slideWidth = slideItems[0]?.offsetWidth || 0;
      gsap.to(sliderList, { x: -slideWidth * targetIndex, duration: 0.55, ease: 'power3.inOut' });

      if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
      if (dots[targetIndex]) dots[targetIndex].classList.add('active');
      project.dataset.innerIndex = targetIndex;

      this.handleSlideVideoTransition(project, currentIndex, targetIndex);
      this.updateNavVisibility(project, targetIndex, slideItems.length);
    }

    restartSlider(project) {
      const currentIndex = parseInt(project.dataset.innerIndex || '0', 10);

      this.navigateToIndex(project, 0);

      if (currentIndex === 0) {
        this.playVisibleVideo(project);
      }
    }

    updateNavVisibility(project, currentIndex, totalItems) {
      const sliderWrapper = project.querySelector('.feed-project-slider');
      if (!sliderWrapper) return;

      const prevZone = sliderWrapper.querySelector('.slide-prev');
      const nextZone = sliderWrapper.querySelector('.slide-next');

      const isFirstSlide = currentIndex === 0;
      const isLastSlide = currentIndex === totalItems - 1;

      // Hide prev on first/last slide, hide next on last slide
      if (prevZone) prevZone.style.display = (isFirstSlide || isLastSlide) ? 'none' : 'block';
      if (nextZone) nextZone.style.display = isLastSlide ? 'none' : 'block';

      // FIX #4: First slide — next zone covers full width (no prev zone visible)
      // Subsequent slides — next zone shrinks to default right-half position
      if (nextZone && !isLastSlide) {
        if (isFirstSlide) {
          nextZone.style.left = '0';
          nextZone.style.width = '100%';
        } else {
          nextZone.style.left = '';
          nextZone.style.width = '';
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────

    attachEvents() {
      // Hover: preload the next/prev slide's video
      this.wrapper.addEventListener('mouseenter', (e) => {
        const nextZone = e.target.closest('.slide-next');
        const prevZone = e.target.closest('.slide-prev');

        if (nextZone || prevZone) {
          const project = e.target.closest('.feed-project');
          if (!project) return;

          const currentIndex = parseInt(project.dataset.innerIndex || '0', 10);
          const slideItems = this.getSlideItems(project);
          const targetIndex = nextZone ? currentIndex + 1 : currentIndex - 1;

          if (targetIndex >= 0 && targetIndex < slideItems.length) {
            const targetSlide = slideItems[targetIndex];
            const video = targetSlide?.querySelector('video.feed-video');
            if (video) {
              if (video.preload === 'none' && video.readyState === 0) {
                video.preload = 'auto';
                video.load();
              }
            }
          }
        }
      }, true);

      // Click events
      this.wrapper.addEventListener('click', (e) => {
        const project = e.target.closest('.feed-project');
        if (!project) return;

        // Restart button
        if (e.target.closest('.slide-restart')) {
          e.preventDefault();
          e.stopPropagation();
          this.restartSlider(project);
          return;
        }

        // Next zone
        if (e.target.closest('.slide-next')) {
          e.preventDefault();
          e.stopPropagation();
          this.navigateInnerSlider(project, 1);
          return;
        }

        // Prev zone
        if (e.target.closest('.slide-prev')) {
          e.preventDefault();
          e.stopPropagation();
          this.navigateInnerSlider(project, -1);
          return;
        }

        // Dot navigation
        const dot = e.target.closest('.feed-inner-slider-dot');
        if (dot) {
          e.preventDefault();
          e.stopPropagation();
          this.navigateToIndex(project, parseInt(dot.dataset.index, 10));
          return;
        }

        // Case study slide click (not on link) — go back
        const caseStudySlide = e.target.closest('.feed-view-case');
        const caseStudyLink = e.target.closest('.feed-view-case a');
        if (caseStudySlide && !caseStudyLink) {
          e.preventDefault();
          this.navigateInnerSlider(project, -1);
        }
      });
    }
  }

  window.PortfolioSlider = PortfolioSlider;
  window.portfolioSlider = new PortfolioSlider();

});
</script>
