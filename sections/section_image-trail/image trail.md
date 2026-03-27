
<script>
document.addEventListener("DOMContentLoaded", function () {
  (function () {
    const container = document.querySelector('.interaction_visual_wrap');
    if (!container) return;
    const trigger = container.parentElement;
    if (!trigger) return;

    const MathUtils = {
      lerp: (a, b, n) => (1 - n) * a + n * b,
      distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
    };

    const getMousePos = (ev) => {
      const rect = container.getBoundingClientRect();
      return {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
      };
    };

    let mousePos = { x: 0, y: 0 },
      cacheMousePos = { x: 0, y: 0 },
      lastMousePos = { x: 0, y: 0 };

    trigger.addEventListener("mousemove", (ev) => {
      mousePos = getMousePos(ev);
    });

    class ImageItem {
      constructor(el) {
        this.DOM = { el: el };
        this.defaultStyle = { scale: 1, x: 0, y: 0, opacity: 0 };
        this.getRect();
        this.initEvents();
      }
      initEvents() {
        window.addEventListener("resize", () => this.resize());
      }
      resize() {
        gsap.set(this.DOM.el, this.defaultStyle);
        this.getRect();
      }
      getRect() {
        this.rect = this.DOM.el.getBoundingClientRect();
      }
      isActive() {
        return gsap.isTweening(this.DOM.el) || this.DOM.el.style.opacity !== "0";
      }
    }

    class ImageTrail {
      constructor() {
        this.DOM = { content: container };
        this.images = [];
        [...this.DOM.content.querySelectorAll('.interaction_img')].forEach((img) =>
          this.images.push(new ImageItem(img))
        );
        this.imagesTotal = this.images.length;
        if (this.imagesTotal === 0) return;
        this.imgPosition = 0;
        this.zIndexVal = 1;
        this.threshold = 100;
        requestAnimationFrame(() => this.render());
      }
      render() {
        let distance = MathUtils.distance(
          mousePos.x, mousePos.y,
          lastMousePos.x, lastMousePos.y
        );
        cacheMousePos.x = MathUtils.lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
        cacheMousePos.y = MathUtils.lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);
        if (distance > this.threshold) {
          this.showNextImage();
          this.zIndexVal++;
          this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
          lastMousePos = { ...mousePos };
        }
        let isIdle = true;
        for (let img of this.images) {
          if (img.isActive()) {
            isIdle = false;
            break;
          }
        }
        if (isIdle && this.zIndexVal !== 1) {
          this.zIndexVal = 1;
        }
        requestAnimationFrame(() => this.render());
      }
      showNextImage() {
        const img = this.images[this.imgPosition];
        if (!img) return;
        gsap.killTweensOf(img.DOM.el);
        gsap.timeline()
          .set(img.DOM.el, {
            opacity: 1,
            scale: 1,
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width / 2,
            y: cacheMousePos.y - img.rect.height / 2,
            immediateRender: true
          })
          .to(img.DOM.el, {
            duration: 0.9,
            ease: "expo.out",
            x: mousePos.x - img.rect.width / 2,
            y: mousePos.y - img.rect.height / 2
          }, 0)
          .to(img.DOM.el, {
            duration: 1,
            ease: "power1.out",
            opacity: 0
          }, 0.4)
          .to(img.DOM.el, {
            duration: 1,
            ease: "quint.out",
            scale: 0.2
          }, 0.4);
      }
    }

    const preloadImages = () => {
      return new Promise((resolve) => {
        if (typeof imagesLoaded !== 'undefined') {
          imagesLoaded(document.querySelectorAll('.interaction_img'), resolve);
        } else {
          resolve();
        }
      });
    };

    preloadImages().then(() => {
      new ImageTrail();
    });
  })();
});
</script>
