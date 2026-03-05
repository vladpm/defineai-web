(() => {
  'use strict';

  const hero = document.getElementById('hero');
  const canvas = document.getElementById('hero-neural-canvas');

  if (!hero || !(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const supportsCanvas = () => {
    try {
      return typeof canvas.getContext === 'function' && !!canvas.getContext('2d');
    } catch (_error) {
      return false;
    }
  };

  class NeuralField {
    constructor(targetCanvas, container) {
      this.canvas = targetCanvas;
      this.container = container;
      this.context = this.canvas.getContext('2d', { alpha: true });
      this.particles = [];
      this.maxDistance = 120;
      this.frameId = 0;
      this.lastTimestamp = 0;
      this.pageVisible = !document.hidden;
      this.heroVisible = true;
      this.observer = null;
      this.width = 0;
      this.height = 0;
      this.pixelRatio = 1;

      this.onResize = this.onResize.bind(this);
      this.onVisibilityChange = this.onVisibilityChange.bind(this);
      this.render = this.render.bind(this);
    }

    init() {
      if (!this.context) {
        return;
      }

      this.resize();
      this.createParticles();

      window.addEventListener('resize', this.onResize, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibilityChange);

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              this.heroVisible = entry.isIntersecting;
              if (this.heroVisible) {
                this.start();
              } else {
                this.stop();
              }
            });
          },
          {
            threshold: 0.08
          }
        );

        this.observer.observe(this.container);
      }

      this.start();
    }

    destroy() {
      this.stop();
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.context) {
        this.context.clearRect(0, 0, this.width, this.height);
      }
    }

    onResize() {
      this.resize();
      this.createParticles();
      this.drawFrame(16);
    }

    onVisibilityChange() {
      this.pageVisible = !document.hidden;
      if (this.pageVisible) {
        this.start();
      } else {
        this.stop();
      }
    }

    start() {
      if (!this.context || this.frameId || !this.pageVisible || !this.heroVisible) {
        return;
      }

      this.lastTimestamp = 0;
      this.frameId = requestAnimationFrame(this.render);
    }

    stop() {
      if (!this.frameId) {
        return;
      }

      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }

    resize() {
      this.width = Math.max(1, this.container.clientWidth);
      this.height = Math.max(1, this.container.clientHeight);
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = Math.floor(this.width * this.pixelRatio);
      this.canvas.height = Math.floor(this.height * this.pixelRatio);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      if (this.context) {
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      }

      this.maxDistance = Math.max(96, Math.min(160, this.width * 0.13));
    }

    createParticles() {
      const area = this.width * this.height;
      const desiredCount = Math.max(30, Math.min(86, Math.floor(area / 18000)));

      this.particles = Array.from({ length: desiredCount }, () => ({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        radius: Math.random() * 1.7 + 0.7
      }));
    }

    drawFrame(delta) {
      if (!this.context) {
        return;
      }

      const speedFactor = Math.min(delta, 32) / 16;
      const maxDistanceSquared = this.maxDistance * this.maxDistance;

      this.context.clearRect(0, 0, this.width, this.height);

      for (let index = 0; index < this.particles.length; index += 1) {
        const particle = this.particles[index];

        particle.x += particle.vx * speedFactor;
        particle.y += particle.vy * speedFactor;

        if (particle.x <= 0 || particle.x >= this.width) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(this.width, particle.x));
        }

        if (particle.y <= 0 || particle.y >= this.height) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(this.height, particle.y));
        }

        for (let next = index + 1; next < this.particles.length; next += 1) {
          const other = this.particles[next];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared > maxDistanceSquared) {
            continue;
          }

          const alpha = (1 - distanceSquared / maxDistanceSquared) * 0.24;
          this.context.strokeStyle = `rgba(132, 174, 255, ${alpha.toFixed(3)})`;
          this.context.lineWidth = 1;
          this.context.beginPath();
          this.context.moveTo(particle.x, particle.y);
          this.context.lineTo(other.x, other.y);
          this.context.stroke();
        }

        this.context.fillStyle = 'rgba(201, 223, 255, 0.92)';
        this.context.beginPath();
        this.context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.context.fill();
      }
    }

    render(timestamp) {
      if (!this.pageVisible || !this.heroVisible) {
        this.frameId = 0;
        return;
      }

      const delta = this.lastTimestamp ? timestamp - this.lastTimestamp : 16;
      this.lastTimestamp = timestamp;
      this.drawFrame(delta);
      this.frameId = requestAnimationFrame(this.render);
    }
  }

  let field = null;

  const startField = () => {
    if (reducedMotionQuery.matches || !supportsCanvas()) {
      hero.classList.remove('is-animated');
      return;
    }

    if (field) {
      return;
    }

    field = new NeuralField(canvas, hero);
    field.init();
    hero.classList.add('is-animated');
  };

  const stopField = () => {
    if (!field) {
      return;
    }

    field.destroy();
    field = null;
    hero.classList.remove('is-animated');
  };

  const onMotionPreferenceChange = () => {
    if (reducedMotionQuery.matches) {
      stopField();
    } else {
      startField();
    }
  };

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', onMotionPreferenceChange);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(onMotionPreferenceChange);
  }

  startField();
})();