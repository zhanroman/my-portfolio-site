(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    // ========================================================================
    // 1. УНИВЕРСАЛЬНАЯ АНИМАЦИЯ ЭЛЕМЕНТОВ ПРИ ПОЯВЛЕНИИ
    // ========================================================================
    const animatedElements = document.querySelectorAll('[data-animate], .capability-card');

    if (animatedElements.length > 0) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Устанавливаем задержку, если она указана в атрибуте
            const delay = entry.target.dataset.delay;
            if (delay) {
              entry.target.style.transitionDelay = `${delay}ms`;
            }
            entry.target.classList.add('in', 'is-visible'); // Добавляем оба класса для совместимости
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      animatedElements.forEach((el, index) => {
        // Добавляем staggered-задержку для карточек "Возможностей"
        if (el.classList.contains('capability-card')) {
          el.style.setProperty('--delay', `${index * 100}ms`);
        }
        observer.observe(el);
      });
    }


    // ========================================================================
    // 2. СЛАЙДЕР "ИЗБРАННЫЕ РАБОТЫ" (FEATURED WORKS)
    // ========================================================================
    const sliderSection = document.querySelector('[data-slider="featured-works"]');
    if (sliderSection) {
      const container = sliderSection.querySelector('.slider-container');
      const track = sliderSection.querySelector('.slider-track');
      const slides = Array.from(track.children);
      const btnPrev = sliderSection.querySelector('.slider-btn--prev');
      const btnNext = sliderSection.querySelector('.slider-btn--next');

      let currentIndex = 0, slideWidth = 0, gap = 0, maxIndex = 0, isMobile = false;
      const mqMobile = window.matchMedia('(max-width: 767px)');

      const readMetrics = () => {
        isMobile = mqMobile.matches;
        slideWidth = slides[0].offsetWidth;
        gap = parseFloat(getComputedStyle(track).gap) || 0;
        const visibleCount = Math.floor((container.clientWidth + gap) / (slideWidth + gap));
        maxIndex = isMobile ? slides.length - 1 : Math.max(0, slides.length - visibleCount);
      };

      const goTo = (index, animate = true) => {
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        const totalStep = slideWidth + gap;
        let translateX;

        if (isMobile) {
          const containerCenter = container.clientWidth / 2;
          const slideCenter = slideWidth / 2;
          translateX = containerCenter - slideCenter - (currentIndex * totalStep);
        } else {
          translateX = -currentIndex * totalStep;
        }

        track.style.transition = animate ? '' : 'none';
        track.style.transform = `translate3d(${translateX}px, 0, 0)`;

        if (btnPrev && btnNext) {
            btnPrev.disabled = currentIndex <= 0;
            btnNext.disabled = currentIndex >= maxIndex;
        }
      };

      const onResize = () => {
        readMetrics();
        goTo(currentIndex, false);
      };
      
      if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => goTo(currentIndex - 1));
        btnNext.addEventListener('click', () => goTo(currentIndex + 1));
      }
      window.addEventListener('resize', onResize);

      // --- Логика свайпа ---
      let isDragging = false, startX = 0, currentX = 0, diff = 0;
      container.addEventListener('pointerdown', e => {
        isDragging = true;
        startX = e.clientX;
        track.style.transition = 'none';
        container.style.cursor = 'grabbing';
      });

      window.addEventListener('pointermove', e => {
        if (!isDragging) return;
        currentX = e.clientX;
        diff = currentX - startX;
        const currentOffset = isMobile
            ? (container.clientWidth / 2 - slideWidth / 2 - currentIndex * (slideWidth + gap))
            : -currentIndex * (slideWidth + gap);
        track.style.transform = `translate3d(${currentOffset + diff}px, 0, 0)`;
      });

      window.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        container.style.cursor = 'grab';
        track.style.transition = '';
        if (Math.abs(diff) > 50) {
            goTo(diff < 0 ? currentIndex + 1 : currentIndex - 1);
        } else {
            goTo(currentIndex);
        }
        diff = 0;
      });

      // Инициализация
      readMetrics();
      goTo(0, false);
    }


    // ========================================================================
    // 3. ИНДИКАТОР ПРОГРЕССА СЕКЦИИ "ПРОЦЕСС"
    // ========================================================================
    const processTrack = document.getElementById('processTrack');
    const progressBar = document.getElementById('processProgressBar');
    if (processTrack && progressBar) {
      const updateProgress = () => {
        const rect = processTrack.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * 0.15;
        const end = vh * 0.6 + rect.height;
        const raw = (vh - rect.top - start) / (end - start);
        const clamped = Math.min(1, Math.max(0, raw));
        progressBar.style.width = (clamped * 100) + '%';
      };
      document.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress);
      updateProgress();
    }


    // ========================================================================
    // 4. 3D ЭФФЕКТ НАКЛОНА (TILT)
    // ========================================================================
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const tiltEls = document.querySelectorAll('[data-tilt]');
      tiltEls.forEach(el => {
        el.addEventListener('mousemove', e => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          el.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateY(-6px)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
      });
    }


    // ========================================================================
    // 5. АНИМАЦИЯ ЧАСТИЦ В CTA-БЛОКЕ
    // ========================================================================
    const canvas = document.getElementById('ctaParticles');
    if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ctx = canvas.getContext('2d');
      let w, h, particles;
      const resize = () => {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
        particles = Array.from({ length: Math.min(90, Math.floor(w / 16)) }, () => spawn());
      };
      const spawn = () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2 + 0.6, a: Math.random() * Math.PI * 2,
        s: (Math.random() * 0.6 + 0.2), o: Math.random() * 0.4 + 0.2
      });
      const tick = () => {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
          p.x += Math.cos(p.a) * p.s;
          p.y += Math.sin(p.a) * p.s;
          if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) Object.assign(p, spawn());
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${p.o})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(tick);
      };
      resize();
      window.addEventListener('resize', resize);
      tick();
    }

  });
})();