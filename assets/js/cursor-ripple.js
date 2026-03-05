(() => {
  'use strict';

  const canvas = document.getElementById('ripple-canvas');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!(canvas instanceof HTMLCanvasElement) || reducedMotionQuery.matches) {
    return;
  }

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    return;
  }

  if (canvas.parentElement !== document.body) {
    document.body.appendChild(canvas);
  }

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frameId = 0;
  let pageVisible = !document.hidden;
  let pointerInside = false;

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    alpha: 0,
    targetAlpha: 0
  };

  const trail = [];
  const ripples = [];

  const TRAIL_LIMIT = 18;
  const RIPPLE_LIMIT = 24;

  const resizeCanvas = () => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const getPoint = (event) => ({
    x: Math.max(0, Math.min(width, event.clientX)),
    y: Math.max(0, Math.min(height, event.clientY))
  });

  const addTrailPoint = (x, y) => {
    trail.push({ x, y, life: 1 });
    if (trail.length > TRAIL_LIMIT) {
      trail.shift();
    }
  };

  const addRipple = (x, y, strength = 1) => {
    ripples.push({
      x,
      y,
      radius: 10,
      alpha: 0.24 * strength,
      speed: 0.86 + Math.random() * 0.38,
      width: 1.2 + Math.random() * 0.5
    });

    if (ripples.length > RIPPLE_LIMIT) {
      ripples.shift();
    }
  };

  const clear = () => {
    context.clearRect(0, 0, width, height);
  };

  const needsFrame = () => {
    return trail.length > 0 || ripples.length > 0 || pointer.alpha > 0.01 || pointerInside;
  };

  const drawTrail = () => {
    if (trail.length < 2) {
      return;
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';

    for (let index = 1; index < trail.length; index += 1) {
      const previousPoint = trail[index - 1];
      const point = trail[index];
      const progress = index / (trail.length - 1);
      const alpha = point.life * 0.16 * progress;

      context.strokeStyle = `rgba(128, 211, 255, ${alpha.toFixed(3)})`;
      context.lineWidth = 0.8 + progress * 2.4;
      context.beginPath();
      context.moveTo(previousPoint.x, previousPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }

    for (let index = trail.length - 1; index >= 0; index -= 1) {
      trail[index].life *= 0.9;
      if (trail[index].life < 0.06) {
        trail.splice(index, 1);
      }
    }
  };

  const drawPointer = (timestamp) => {
    pointer.alpha += (pointer.targetAlpha - pointer.alpha) * 0.12;

    if (pointer.alpha < 0.01) {
      return;
    }

    const pulse = 1 + Math.sin(timestamp * 0.012) * 0.05;
    const radius = 82 * pulse;

    const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
    gradient.addColorStop(0, `rgba(106, 192, 255, ${(0.13 * pointer.alpha).toFixed(3)})`);
    gradient.addColorStop(1, 'rgba(106, 192, 255, 0)');

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = `rgba(174, 231, 255, ${(0.38 * pointer.alpha).toFixed(3)})`;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(pointer.x, pointer.y, 14, 0, Math.PI * 2);
    context.stroke();
  };

  const updateRipples = () => {
    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const ripple = ripples[index];
      ripple.radius += ripple.speed;
      ripple.alpha *= 0.955;

      if (ripple.alpha < 0.012 || ripple.radius > 140) {
        ripples.splice(index, 1);
        continue;
      }

      context.lineWidth = ripple.width;
      context.strokeStyle = `rgba(120, 205, 255, ${ripple.alpha.toFixed(3)})`;
      context.beginPath();
      context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      context.stroke();
    }
  };

  const render = (timestamp) => {
    if (!pageVisible) {
      frameId = 0;
      return;
    }

    clear();
    context.globalCompositeOperation = 'screen';
    drawTrail();
    updateRipples();
    drawPointer(timestamp);
    context.globalCompositeOperation = 'source-over';

    if (needsFrame()) {
      frameId = requestAnimationFrame(render);
    } else {
      frameId = 0;
      clear();
    }
  };

  const ensureFrame = () => {
    if (frameId || !pageVisible) {
      return;
    }

    frameId = requestAnimationFrame(render);
  };

  const onPointerMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') {
      return;
    }

    const point = getPoint(event);

    pointerInside = true;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.targetAlpha = 0.72;

    addTrailPoint(point.x, point.y);
    ensureFrame();
  };

  const onPointerDown = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') {
      return;
    }

    if (typeof event.button === 'number' && event.button !== 0) {
      return;
    }

    const point = getPoint(event);

    pointerInside = true;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.targetAlpha = 0.8;

    addTrailPoint(point.x, point.y);
    addRipple(point.x, point.y, 1.1);
    ensureFrame();
  };

  const onPointerLeave = () => {
    pointerInside = false;
    pointer.targetAlpha = 0;
    ensureFrame();
  };

  const onWindowBlur = () => {
    pointerInside = false;
    pointer.targetAlpha = 0;
    ensureFrame();
  };

  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
    if (pageVisible) {
      ensureFrame();
      return;
    }

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      clear();
    }
  };

  const onReduceMotion = () => {
    if (reducedMotionQuery.matches) {
      cleanup();
    }
  };

  const cleanup = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    clear();
    trail.length = 0;
    ripples.length = 0;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', resizeCanvas);

    if (typeof reducedMotionQuery.removeEventListener === 'function') {
      reducedMotionQuery.removeEventListener('change', onReduceMotion);
    } else if (typeof reducedMotionQuery.removeListener === 'function') {
      reducedMotionQuery.removeListener(onReduceMotion);
    }
  };

  resizeCanvas();

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('blur', onWindowBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('resize', resizeCanvas, { passive: true });

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', onReduceMotion);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(onReduceMotion);
  }
})();
