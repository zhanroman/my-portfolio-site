(function () {
    'use strict';

    /**
     * Загружает Lottie-анимацию.
     */
    function initLottieAnimation() {
        const container = document.getElementById('lottie-container');
        if (typeof lottie !== 'undefined' && container) {
            lottie.loadAnimation({
                container: container,
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: "./assets/animation.json", // Убедитесь, что путь к файлу верный
            });
        }
    }

    /**
     * Анимирует числа от 0 до целевого значения.
     */
    function initAnimatedCounters() {
        const counters = document.querySelectorAll('.counter');
        if (!counters.length) return;

        const animateValue = (obj, start, end, duration) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
                obj.innerHTML = Math.floor(easedProgress * (end - start) + start);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const targetValue = parseInt(el.dataset.target, 10);
                    if (!isNaN(targetValue)) {
                        animateValue(el, 0, targetValue, 2000);
                    }
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.8 });

        counters.forEach(counter => observer.observe(counter));
    }

    /**
     * Добавляет класс .in-view секциям при их появлении во вьюпорте.
     */
    function initScrollAnimations() {
        const sections = document.querySelectorAll('.sec');
        if (!sections.length) return;

        // Откладываем запуск, чтобы дать странице прогрузиться
        setTimeout(() => {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

            sections.forEach(sec => {
                // Первая секция видна сразу
                if (sec.classList.contains('perf-hero-v3')) {
                    sec.classList.add('in-view');
                } else {
                    observer.observe(sec);
                }
            });
        }, 100);
    }

    // Запуск
    document.addEventListener('DOMContentLoaded', () => {
        initLottieAnimation();
        initAnimatedCounters();
        initScrollAnimations();
    });

})();