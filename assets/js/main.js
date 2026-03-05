(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const applyMotionPreference = () => {
    root.classList.toggle('reduced-motion', reducedMotionQuery.matches);
  };

  applyMotionPreference();

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', applyMotionPreference);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(applyMotionPreference);
  }

  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const onAnchorClick = (event) => {
    const target = event.currentTarget;
    const hash = target.getAttribute('href');

    if (!hash || hash === '#') {
      return;
    }

    const destination = document.querySelector(hash);
    if (!destination) {
      return;
    }

    event.preventDefault();
    destination.scrollIntoView({
      behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
      block: 'start'
    });

    if (history.replaceState) {
      history.replaceState(null, '', hash);
    }

    const parentNav = target.closest('.nav');
    if (parentNav && parentNav.classList.contains('is-open')) {
      parentNav.classList.remove('is-open');
      root.classList.remove('nav-open');
      document.body.classList.remove('nav-open');
      const toggleButton = parentNav.querySelector('.nav-toggle');
      toggleButton?.setAttribute('aria-expanded', 'false');
    }
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', onAnchorClick);
  });

  const navElement = document.querySelector('.nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const mobileNavQuery = window.matchMedia('(max-width: 860px)');

  if (navElement && navToggle && navLinks) {
    const closeNavMenu = () => {
      navElement.classList.remove('is-open');
      root.classList.remove('nav-open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navElement.classList.contains('is-open');
      const nextState = !isOpen;
      navElement.classList.toggle('is-open', nextState);
      root.classList.toggle('nav-open', nextState);
      document.body.classList.toggle('nav-open', nextState);
      navToggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
    });

    navLinks.addEventListener('click', (event) => {
      if (event.target === navLinks) {
        closeNavMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (!mobileNavQuery.matches || !navElement.classList.contains('is-open')) {
        return;
      }

      if (!(event.target instanceof Node)) {
        return;
      }

      if (!navElement.contains(event.target)) {
        closeNavMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navElement.classList.contains('is-open')) {
        closeNavMenu();
      }
    });

    window.addEventListener(
      'resize',
      () => {
        if (!mobileNavQuery.matches) {
          closeNavMenu();
        }
      },
      { passive: true }
    );
  }

  const heroSection = document.getElementById('hero');
  const headlineZone = document.getElementById('hero-headline-zone');
  const scrollCue = document.getElementById('hero-scroll-cue');
  const titleScreen = document.getElementById('hero-title-screen');
  const titlePrimary = document.getElementById('hero-title-primary');
  const titleRotor = document.getElementById('hero-title-rotor');
  const titleCurrent = titleScreen?.querySelector('.hero-title-current');
  const titleNext = titleScreen?.querySelector('.hero-title-next');
  const titleFinal = document.getElementById('hero-title-final');

  if (titleScreen && titlePrimary && titleRotor && titleCurrent && titleNext && titleFinal) {
    const prefixText = "AI doesn't need to";
    const rotatingSuffixes = ['cost a fortune.', 'be complicated.', 'replace people.'];
    const finalLine = 'Define AI your way.';

    const transitionDuration = 500;
    const finalTransitionDuration = 920;
    const transitionInterval = 1100;
    let currentSuffixIndex = 0;
    let primaryFrameHeight = 0;
    let finalFrameHeight = 0;
    let cycleTimer = 0;
    let transitionTimer = 0;
    let isTransitioning = false;
    let sequenceComplete = false;
    let hasScrolledPastHeadline = false;
    let replayObserver = null;

    const setScrollCueVisible = (isVisible) => {
      if (!scrollCue) {
        return;
      }

      scrollCue.classList.toggle('is-visible', isVisible);
      scrollCue.tabIndex = isVisible ? 0 : -1;
    };

    const syncTitleFrame = () => {
      const isFinalState = titleScreen.classList.contains('is-final');
      const activeSuffix = rotatingSuffixes[Math.min(currentSuffixIndex, rotatingSuffixes.length - 1)];

      titleScreen.classList.remove('is-transitioning-suffix', 'is-transitioning-final', 'is-final');
      titleCurrent.textContent = activeSuffix;
      titleNext.textContent = '';
      titleFinal.textContent = finalLine;

      titleRotor.style.width = 'auto';

      let maxSuffixWidth = 1;
      rotatingSuffixes.forEach((suffix) => {
        titleCurrent.textContent = suffix;
        maxSuffixWidth = Math.max(maxSuffixWidth, Math.ceil(titleCurrent.getBoundingClientRect().width));
      });

      titleCurrent.textContent = activeSuffix;
      const availableRotorWidth = Math.max(1, Math.floor(titleScreen.getBoundingClientRect().width));
      const paddedSuffixWidth = maxSuffixWidth + 2;
      titleRotor.style.width = `${Math.min(paddedSuffixWidth, availableRotorWidth)}px`;

      titleScreen.style.height = 'auto';
      const primaryHeight = Math.max(1, Math.ceil(titlePrimary.getBoundingClientRect().height));

      titleScreen.classList.add('is-final');
      const finalHeight = Math.max(1, Math.ceil(titleFinal.getBoundingClientRect().height));
      titleScreen.classList.remove('is-final');

      primaryFrameHeight = primaryHeight;
      finalFrameHeight = finalHeight;

      const rotatingHeight = Math.max(primaryFrameHeight, finalFrameHeight);
      const targetHeight = isFinalState ? finalFrameHeight : rotatingHeight;
      titleScreen.style.height = `${targetHeight}px`;

      if (isFinalState) {
        titleScreen.classList.add('is-final');
      }
    };

    const setLiveLabel = (text) => {
      titleScreen.setAttribute('aria-label', text);
    };

    const commitSuffix = (index) => {
      currentSuffixIndex = Math.max(0, Math.min(index, rotatingSuffixes.length - 1));
      titleCurrent.textContent = rotatingSuffixes[currentSuffixIndex];
      titleNext.textContent = '';
      titleScreen.classList.remove('is-final');
      setLiveLabel(`${prefixText} ${rotatingSuffixes[currentSuffixIndex]}`);
    };

    const resetTransitionState = () => {
      titleScreen.classList.remove('is-transitioning-suffix', 'is-transitioning-final');
      titleNext.textContent = '';
      isTransitioning = false;
      syncTitleFrame();
    };

    const clearCycleTimer = () => {
      if (cycleTimer) {
        window.clearTimeout(cycleTimer);
        cycleTimer = 0;
      }
    };

    const clearTransitionTimer = () => {
      if (transitionTimer) {
        window.clearTimeout(transitionTimer);
        transitionTimer = 0;
      }
    };

    const runTransition = () => {
      if (isTransitioning || reducedMotionQuery.matches || document.hidden || sequenceComplete) {
        return;
      }

      if (currentSuffixIndex < rotatingSuffixes.length - 1) {
        const nextSuffixIndex = currentSuffixIndex + 1;
        titleNext.textContent = rotatingSuffixes[nextSuffixIndex];

        isTransitioning = true;
        titleScreen.classList.add('is-transitioning-suffix');

        transitionTimer = window.setTimeout(() => {
          titleScreen.classList.remove('is-transitioning-suffix');
          commitSuffix(nextSuffixIndex);
          isTransitioning = false;
          transitionTimer = 0;
          queueNextTransition();
        }, transitionDuration);
        return;
      }

      isTransitioning = true;
      titleScreen.classList.add('is-transitioning-final');
      titleScreen.style.height = `${Math.max(1, finalFrameHeight)}px`;

      transitionTimer = window.setTimeout(() => {
        titleScreen.classList.remove('is-transitioning-final');
        titleScreen.classList.add('is-final');
        setLiveLabel(finalLine);

        isTransitioning = false;
        transitionTimer = 0;
        sequenceComplete = true;
        setScrollCueVisible(true);
        clearCycleTimer();
      }, finalTransitionDuration);
    };

    const stopCycler = () => {
      clearCycleTimer();
      clearTransitionTimer();

      if (isTransitioning) {
        resetTransitionState();
      }
    };

    const queueNextTransition = () => {
      if (sequenceComplete || reducedMotionQuery.matches || document.hidden || isTransitioning) {
        return;
      }

      clearCycleTimer();
      cycleTimer = window.setTimeout(runTransition, transitionInterval);
    };

    const startCycler = () => {
      if (reducedMotionQuery.matches || document.hidden || sequenceComplete) {
        return;
      }

      queueNextTransition();
    };

    const resetAndReplaySequence = () => {
      stopCycler();
      sequenceComplete = false;
      hasScrolledPastHeadline = false;
      currentSuffixIndex = 0;
      titleScreen.classList.remove('is-final', 'is-transitioning-suffix', 'is-transitioning-final');
      setScrollCueVisible(false);
      commitSuffix(currentSuffixIndex);
      syncTitleFrame();
      startCycler();
    };

    const onVisibilityForTitle = () => {
      if (document.hidden) {
        stopCycler();
      } else if (!sequenceComplete) {
        startCycler();
      }
    };

    const onMotionForTitle = () => {
      if (reducedMotionQuery.matches) {
        stopCycler();
        sequenceComplete = true;
        titleScreen.classList.add('is-final');
        titleScreen.style.height = `${Math.max(1, finalFrameHeight)}px`;
        setLiveLabel(finalLine);
        setScrollCueVisible(true);
        return;
      }

      resetAndReplaySequence();
    };

    commitSuffix(currentSuffixIndex);
    syncTitleFrame();
    setScrollCueVisible(false);
    startCycler();
    window.addEventListener('resize', syncTitleFrame, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityForTitle);

    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      document.fonts.ready.then(() => {
        syncTitleFrame();
      });
    }

    if (headlineZone && heroSection && 'IntersectionObserver' in window) {
      replayObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
              hasScrolledPastHeadline = true;
              return;
            }

            if (!entry.isIntersecting) {
              return;
            }

            const nearTop = window.scrollY <= heroSection.offsetHeight;
            if (hasScrolledPastHeadline && nearTop) {
              resetAndReplaySequence();
            }
          });
        },
        {
          threshold: 0.2
        }
      );

      replayObserver.observe(headlineZone);
    }

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', onMotionForTitle);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(onMotionForTitle);
    }
  }

  const footerTitleScreen = document.getElementById('footer-title-screen');
  const footerTitlePrimary = document.getElementById('footer-title-primary');
  const footerTitlePrefix = document.getElementById('footer-title-prefix');
  const footerTitleRotor = document.getElementById('footer-title-rotor');
  const footerTitleCurrent = footerTitleScreen?.querySelector('.footer-title-current');
  const footerTitleNext = footerTitleScreen?.querySelector('.footer-title-next');
  const footerTitleFinal = document.getElementById('footer-title-final');

  if (
    footerTitleScreen &&
    footerTitlePrimary &&
    footerTitlePrefix &&
    footerTitleRotor &&
    footerTitleCurrent &&
    footerTitleNext &&
    footerTitleFinal
  ) {
    const footerPrefixText = "AI doesn't need to";
    const footerRotatingSuffixes = ['cost a fortune.', 'be complicated.', 'replace people.'];
    const footerFinalLine = 'Define AI your way.';

    const footerTransitionDuration = 480;
    const footerFinalTransitionDuration = 740;
    const footerTransitionInterval = 1300;
    let footerSuffixIndex = 0;
    let footerPrimaryHeight = 0;
    let footerFinalHeight = 0;
    let footerCycleTimer = 0;
    let footerTransitionTimer = 0;
    let footerTransitioning = false;
    let footerSequenceComplete = false;

    const syncFooterFrame = () => {
      const isFinalState = footerTitleScreen.classList.contains('is-final');
      const activeSuffix = footerRotatingSuffixes[Math.min(footerSuffixIndex, footerRotatingSuffixes.length - 1)];

      footerTitleScreen.classList.remove('is-transitioning-suffix', 'is-transitioning-final', 'is-final');
      footerTitleCurrent.textContent = activeSuffix;
      footerTitleNext.textContent = '';
      footerTitleFinal.textContent = footerFinalLine;

      footerTitleRotor.style.width = 'auto';

      let maxSuffixWidth = 1;
      footerRotatingSuffixes.forEach((suffix) => {
        footerTitleCurrent.textContent = suffix;
        maxSuffixWidth = Math.max(maxSuffixWidth, Math.ceil(footerTitleCurrent.getBoundingClientRect().width));
      });

      footerTitleCurrent.textContent = activeSuffix;

      const screenWidth = Math.max(1, Math.floor(footerTitleScreen.getBoundingClientRect().width));
      const prefixWidth = Math.ceil(footerTitlePrefix.getBoundingClientRect().width);
      const availableRotorWidth = Math.max(1, screenWidth - prefixWidth - 8);
      const paddedSuffixWidth = maxSuffixWidth + 2;
      footerTitleRotor.style.width = `${Math.min(paddedSuffixWidth, availableRotorWidth)}px`;

      footerTitleScreen.style.height = 'auto';
      const primaryHeight = Math.max(1, Math.ceil(footerTitlePrimary.getBoundingClientRect().height));

      footerTitleScreen.classList.add('is-final');
      const finalHeight = Math.max(1, Math.ceil(footerTitleFinal.getBoundingClientRect().height));
      footerTitleScreen.classList.remove('is-final');

      footerPrimaryHeight = primaryHeight;
      footerFinalHeight = finalHeight;

      const rotatingHeight = Math.max(footerPrimaryHeight, footerFinalHeight);
      const targetHeight = isFinalState ? footerFinalHeight : rotatingHeight;
      footerTitleScreen.style.height = `${targetHeight}px`;

      if (isFinalState) {
        footerTitleScreen.classList.add('is-final');
      }
    };

    const setFooterLiveLabel = (text) => {
      footerTitleScreen.setAttribute('aria-label', text);
    };

    const commitFooterSuffix = (index) => {
      footerSuffixIndex = Math.max(0, Math.min(index, footerRotatingSuffixes.length - 1));
      footerTitleCurrent.textContent = footerRotatingSuffixes[footerSuffixIndex];
      footerTitleNext.textContent = '';
      footerTitleScreen.classList.remove('is-final');
      setFooterLiveLabel(`${footerPrefixText} ${footerRotatingSuffixes[footerSuffixIndex]}`);
    };

    const clearFooterCycleTimer = () => {
      if (footerCycleTimer) {
        window.clearTimeout(footerCycleTimer);
        footerCycleTimer = 0;
      }
    };

    const clearFooterTransitionTimer = () => {
      if (footerTransitionTimer) {
        window.clearTimeout(footerTransitionTimer);
        footerTransitionTimer = 0;
      }
    };

    const stopFooterCycle = () => {
      clearFooterCycleTimer();
      clearFooterTransitionTimer();

      if (footerTransitioning) {
        footerTitleScreen.classList.remove('is-transitioning-suffix', 'is-transitioning-final');
        footerTitleNext.textContent = '';
        footerTransitioning = false;
        syncFooterFrame();
      }
    };

    const queueFooterTransition = () => {
      if (footerSequenceComplete || reducedMotionQuery.matches || document.hidden || footerTransitioning) {
        return;
      }

      clearFooterCycleTimer();
      footerCycleTimer = window.setTimeout(runFooterTransition, footerTransitionInterval);
    };

    const runFooterTransition = () => {
      if (footerTransitioning || reducedMotionQuery.matches || document.hidden || footerSequenceComplete) {
        return;
      }

      if (footerSuffixIndex < footerRotatingSuffixes.length - 1) {
        const nextSuffixIndex = footerSuffixIndex + 1;
        footerTitleNext.textContent = footerRotatingSuffixes[nextSuffixIndex];

        footerTransitioning = true;
        footerTitleScreen.classList.add('is-transitioning-suffix');

        footerTransitionTimer = window.setTimeout(() => {
          footerTitleScreen.classList.remove('is-transitioning-suffix');
          commitFooterSuffix(nextSuffixIndex);
          footerTransitioning = false;
          footerTransitionTimer = 0;
          queueFooterTransition();
        }, footerTransitionDuration);
        return;
      }

      footerTransitioning = true;
      footerTitleScreen.classList.add('is-transitioning-final');
      footerTitleScreen.style.height = `${Math.max(1, footerFinalHeight)}px`;

      footerTransitionTimer = window.setTimeout(() => {
        footerTitleScreen.classList.remove('is-transitioning-final');
        footerTitleScreen.classList.add('is-final');
        setFooterLiveLabel(footerFinalLine);

        footerTransitioning = false;
        footerTransitionTimer = 0;
        footerSequenceComplete = true;
        clearFooterCycleTimer();
      }, footerFinalTransitionDuration);
    };

    const startFooterCycle = () => {
      if (reducedMotionQuery.matches || document.hidden || footerSequenceComplete) {
        return;
      }

      queueFooterTransition();
    };

    const resetFooterSequence = () => {
      stopFooterCycle();
      footerSequenceComplete = false;
      footerSuffixIndex = 0;
      footerTitleScreen.classList.remove('is-final', 'is-transitioning-suffix', 'is-transitioning-final');
      commitFooterSuffix(footerSuffixIndex);
      syncFooterFrame();
      startFooterCycle();
    };

    const onFooterVisibility = () => {
      if (document.hidden) {
        stopFooterCycle();
      } else if (!footerSequenceComplete) {
        startFooterCycle();
      }
    };

    const onFooterMotion = () => {
      if (reducedMotionQuery.matches) {
        stopFooterCycle();
        footerSequenceComplete = true;
        footerTitleScreen.classList.add('is-final');
        footerTitleScreen.style.height = `${Math.max(1, footerFinalHeight)}px`;
        setFooterLiveLabel(footerFinalLine);
        return;
      }

      resetFooterSequence();
    };

    commitFooterSuffix(footerSuffixIndex);
    syncFooterFrame();
    startFooterCycle();

    window.addEventListener('resize', syncFooterFrame, { passive: true });
    document.addEventListener('visibilitychange', onFooterVisibility);

    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      document.fonts.ready.then(() => {
        syncFooterFrame();
      });
    }

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', onFooterMotion);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(onFooterMotion);
    }
  }

  const processSteps = Array.from(document.querySelectorAll('.process-step'));
  const processFill = document.getElementById('process-progress-fill');

  if (processSteps.length > 0 && processFill) {
    const setActiveStep = (activeIndex) => {
      processSteps.forEach((step, index) => {
        const isActive = index === activeIndex;
        step.classList.toggle('is-active', isActive);
        if (isActive) {
          step.setAttribute('aria-current', 'step');
        } else {
          step.removeAttribute('aria-current');
        }
      });

      const progressRatio = (activeIndex + 1) / processSteps.length;
      processFill.style.width = `${(progressRatio * 100).toFixed(2)}%`;
    };

    setActiveStep(0);

    processSteps.forEach((step, index) => {
      step.addEventListener('mouseenter', () => {
        setActiveStep(index);
      });

      step.addEventListener('click', () => {
        setActiveStep(index);
      });

      step.addEventListener('focusin', () => {
        setActiveStep(index);
      });
    });

    if ('IntersectionObserver' in window) {
      const stepObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const stepIndex = Number(entry.target.getAttribute('data-step'));
            if (!Number.isNaN(stepIndex)) {
              setActiveStep(stepIndex);
            }
          });
        },
        {
          threshold: 0.6,
          rootMargin: '-10% 0px -35% 0px'
        }
      );

      processSteps.forEach((step) => stepObserver.observe(step));
    }
  }

  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm && formStatus) {
    const fields = {
      name: {
        input: contactForm.elements.namedItem('name'),
        error: document.getElementById('name-error'),
        validate: (value) => value.trim().length >= 2,
        message: 'Please enter at least 2 characters.'
      },
      email: {
        input: contactForm.elements.namedItem('email'),
        error: document.getElementById('email-error'),
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
        message: 'Please enter a valid email address.'
      },
      message: {
        input: contactForm.elements.namedItem('message'),
        error: document.getElementById('message-error'),
        validate: (value) => value.trim().length >= 20,
        message: 'Please include at least 20 characters so we can understand your context.'
      }
    };

    const setStatus = (message, state) => {
      formStatus.textContent = message;
      formStatus.classList.remove('is-success', 'is-error', 'is-pending');

      if (state) {
        formStatus.classList.add(`is-${state}`);
      }
    };

    const setFieldState = (fieldName, isValid) => {
      const field = fields[fieldName];
      if (!field || !(field.input instanceof HTMLElement)) {
        return true;
      }

      if (isValid) {
        field.input.classList.remove('is-invalid');
        field.input.removeAttribute('aria-invalid');
        if (field.error) {
          field.error.textContent = '';
        }
        return true;
      }

      field.input.classList.add('is-invalid');
      field.input.setAttribute('aria-invalid', 'true');
      if (field.error) {
        field.error.textContent = field.message;
      }
      return false;
    };

    const validateField = (fieldName) => {
      const field = fields[fieldName];
      if (!field || !(field.input instanceof HTMLInputElement || field.input instanceof HTMLTextAreaElement)) {
        return true;
      }

      return setFieldState(fieldName, field.validate(field.input.value));
    };

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      if (!(field.input instanceof HTMLElement)) {
        return;
      }

      field.input.addEventListener('blur', () => {
        validateField(fieldName);
      });

      field.input.addEventListener('input', () => {
        if (field.input.classList.contains('is-invalid')) {
          validateField(fieldName);
        }
      });
    });

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const isFormValid = Object.keys(fields).every((fieldName) => validateField(fieldName));
      if (!isFormValid) {
        setStatus('Please correct the highlighted fields and try again.', 'error');
        return;
      }

      if (contactForm.action.includes('FORM_ID')) {
        setStatus('Replace FORM_ID with your Formspree ID before publishing.', 'error');
        return;
      }

      setStatus('Sending message…', 'pending');

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          let errorMessage = 'Submission failed. Please try again shortly.';
          const payload = await response.json().catch(() => null);

          if (payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
            errorMessage = payload.errors
              .map((entry) => entry.message)
              .filter(Boolean)
              .join(' ');
          }

          throw new Error(errorMessage);
        }

        contactForm.reset();
        Object.keys(fields).forEach((fieldName) => setFieldState(fieldName, true));
        setStatus('Thanks and your message was sent successfully.', 'success');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Network error. Please try again.', 'error');
      }
    });
  }
})();