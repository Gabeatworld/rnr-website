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
            // Project just became active
            this.activeProjectIndex = index;
            this.playVisibleVideo(project);
          } else if (!isNowActive && index === this.activeProjectIndex) {
            // Project just became inactive — pause all its videos
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

    /**
     * Play a single <video> element.
     * Handles the promise rejection that browsers throw
     * when autoplay is blocked.
     */
    playVideo(video) {
      if (!video || video.tagName !== 'VIDEO') return;

      // Load the video if it hasn't started loading yet
      if (video.preload === 'none' && video.readyState === 0) {
        video.preload = 'auto';
        video.load();
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — silently fail, video stays paused
        });
      }
    }

    /**
     * Pause a single <video> element.
     */
    pauseVideo(video) {
      if (!video || video.tagName !== 'VIDEO') return;
      video.pause();
    }

    /**
     * Play the video in the currently visible slide of a project.
     */
    playVisibleVideo(project) {
      const currentIndex = parseInt(project.dataset.innerIndex || '0', 10);
      const slideItems = this.getSlideItems(project);
      const currentSlide = slideItems[currentIndex];
      if (!currentSlide) return;

      const video = currentSlide.querySelector('video.feed-video');
      if (video) this.playVideo(video);
    }

    /**
     * Pause ALL videos within a project.
     */
    pauseAllVideos(project) {
      const videos = project.querySelectorAll('video.feed-video');
      videos.forEach(video => this.pauseVideo(video));
    }

    /**
     * When navigating slides: pause the old slide's video,
     * play the new slide's video.
     */
    handleSlideVideoTransition(project, fromIndex, toIndex) {
      const slideItems = this.getSlideItems(project);

      // Pause video on the slide we're leaving
      const fromSlide = slideItems[fromIndex];
      if (fromSlide) {
        const fromVideo = fromSlide.querySelector('video.feed-video');
        if (fromVideo) this.pauseVideo(fromVideo);
      }

      // Play video on the slide we're entering
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

      // Clamp to valid range
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= slideItems.length) nextIndex = slideItems.length - 1;
      if (nextIndex === currentIndex) return;

      const slideWidth = slideItems[0]?.offsetWidth || 0;
      gsap.to(sliderList, { x: -slideWidth * nextIndex, duration: 0.55, ease: 'power3.inOut' });

      // Update dots
      if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
      if (dots[nextIndex]) dots[nextIndex].classList.add('active');
      project.dataset.innerIndex = nextIndex;

      // Handle video play/pause on slide change
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

      // Handle video play/pause on slide change
      this.handleSlideVideoTransition(project, currentIndex, targetIndex);

      this.updateNavVisibility(project, targetIndex, slideItems.length);
    }

    restartSlider(project) {
      const currentIndex = parseInt(project.dataset.innerIndex || '0', 10);

      // Navigate to first slide
      this.navigateToIndex(project, 0);

      // If navigateToIndex skipped because already at 0,
      // still make sure the cover video is playing
      if (currentIndex === 0) {
        this.playVisibleVideo(project);
      }
    }

    updateNavVisibility(project, currentIndex, totalItems) {
      const sliderWrapper = project.querySelector('.feed-project-slider');
      if (!sliderWrapper) return;

      const prevZone = sliderWrapper.querySelector('.slide-prev');
      const nextZone = sliderWrapper.querySelector('.slide-next');

      const isLastSlide = currentIndex === totalItems - 1;

      // Hide both on last slide, otherwise show/hide based on position
      if (prevZone) prevZone.style.display = (currentIndex === 0 || isLastSlide) ? 'none' : 'block';
      if (nextZone) nextZone.style.display = isLastSlide ? 'none' : 'block';
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
              // Preload the video so it's ready when they click
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