// Оборачиваем в IIFE для изоляции
(function () {
    "use strict";

    /**
     * Инициализирует логику фильтрации кейсов на странице.
     */
    function initCaseFilters() {
        const filtersContainer = document.querySelector(".cases-filters .filters-container");
        const caseCards = document.querySelectorAll(".cases-grid .case-card");

        if (!filtersContainer || caseCards.length === 0) {
            return;
        }

        filtersContainer.addEventListener("click", (e) => {
            const target = e.target;
            if (!target.matches(".filter-btn")) {
                return;
            }

            filtersContainer.querySelector(".filter-btn.active").classList.remove("active");
            target.classList.add("active");

            const filterValue = target.dataset.filter;

            caseCards.forEach((card) => {
                const cardCategory = card.dataset.category;
                const shouldShow = filterValue === "all" || cardCategory === filterValue;
                card.classList.toggle('is-hidden', !shouldShow);
            });
        });
    }

    /**
     * Инициализирует анимацию появления элементов при прокрутке.
     */
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.case-card, .interstitial-block');

        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }

    /**
    * Инициализирует анимацию счетчиков.
    */
    function initValueCounters() {
        const valueElements = document.querySelectorAll(".results-block .highlight__value");

        if (valueElements.length === 0) return;

        const animateValue = (obj, start, end, duration) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(easedProgress * (end - start) + start);
                const prefix = obj.innerText.match(/^\D*/)?.[0] || "";
                const suffix = obj.innerText.match(/\D*$/)?.[0] || "";
                obj.innerHTML = prefix + currentValue + suffix;
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const val = parseInt(el.dataset.value, 10);
                    if (!isNaN(val)) {
                        animateValue(el, 0, val, 2000);
                    }
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        valueElements.forEach((el) => observer.observe(el));
    }

    /**
     * НОВАЯ ФУНКЦИЯ
     * Синхронизирует позицию липкого фильтра с поведением шапки сайта.
     */
    function initStickyFilterBehavior() {
        const header = document.querySelector("#siteHeader.hdr");
        const filterBar = document.querySelector(".cases-filters");

        if (!header || !filterBar) return;

        const headerHeight = header.offsetHeight;

        // Устанавливаем начальное смещение
        filterBar.style.top = `${headerHeight}px`;

        // Создаем "наблюдателя", который следит за изменениями классов на шапке
        const observer = new MutationObserver(() => {
            const isHeaderHidden = header.classList.contains('hide');
            // Меняем смещение фильтра в зависимости от того, скрыта шапка или нет
            filterBar.style.top = isHeaderHidden ? '0px' : `${headerHeight}px`;
        });

        // Запускаем наблюдение
        observer.observe(header, { attributes: true, attributeFilter: ['class'] });
    }


    // Запускаем все инициализации после загрузки DOM
    document.addEventListener("DOMContentLoaded", () => {
        initCaseFilters();
        initScrollAnimations();
        initValueCounters();
        initStickyFilterBehavior(); // <-- Добавили вызов новой функции
    });

})();