(function () {
  'use strict';

  // Вспомогательные функции для краткости
  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  // Запускаем весь код после полной загрузки HTML
  document.addEventListener('DOMContentLoaded', () => {

    // ========================================================================
    // 1. ОБЩИЕ ФУНКЦИИ И НАСТРОЙКИ
    // ========================================================================

    document.documentElement.classList.remove('no-js');

    // --- Переключение темы (универсальная функция) ---
    const docEl = document.documentElement;

    function applyTheme(theme) {
      docEl.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }

    function getInitialTheme() {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    qsa('[data-theme-toggle]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const currentTheme = docEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
      });
    });

    applyTheme(getInitialTheme()); // Применяем тему при загрузке

    // --- Переключение языка (универсальная функция) ---
    const langSwitchers = qsa('[data-lang-switcher]');
    langSwitchers.forEach(switcher => {
      const btn = qs('.lang__btn', switcher);
      const list = qs('.lang__list', switcher);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = switcher.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        // Закрываем все другие экземпляры
        langSwitchers.forEach(other => {
          if (other !== switcher) {
            other.classList.remove('open');
            qs('.lang__btn', other).setAttribute('aria-expanded', 'false');
          }
        });
      });

      list.addEventListener('click', e => {
        const option = e.target.closest('button[data-lang-set]');
        if (!option) return;

        const langValue = option.getAttribute('data-lang-set');
        const langText = langValue === 'ru' ? 'Ru' : 'En';

        // Обновляем текст на ВСЕХ переключателях
        qsa('.lang__current').forEach(el => el.textContent = langText);

        // Обновляем aria-selected на ВСЕХ переключателях
        langSwitchers.forEach(s => {
          qsa('li[role="option"]', s).forEach(li => {
            const button = qs('button', li);
            li.setAttribute('aria-selected', button.getAttribute('data-lang-set') === langValue);
          });
        });

        switcher.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Закрываем выпадающий список языка при клике вне его
    document.addEventListener('click', () => {
      langSwitchers.forEach(switcher => {
        switcher.classList.remove('open');
        qs('.lang__btn', switcher).setAttribute('aria-expanded', 'false');
      });
    });


    // ========================================================================
    // 2. ЛОГИКА ШАПКИ (HEADER)
    // ========================================================================
    const header = qs('#siteHeader');
    if (header) {
      // --- Появление/скрытие шапки при скролле ---
      let lastScroll = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        const goingDown = y > lastScroll;
        const isScrolled = y > 40;

        header.classList.toggle('is-scrolled', isScrolled);
        if (isScrolled) {
          header.classList.toggle('hide', goingDown);
        } else {
          header.classList.remove('hide');
        }
        lastScroll = y < 0 ? 0 : y;
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      // --- Мега-меню (Desktop) ---
      const menuItems = qsa('.nav__item.has-panel');
      const megaContainer = qs('#mega-container');
      const allMegas = qsa('.mega', megaContainer);
      let openItem = null;
      let intentTimeout = null;

      const openMenu = (item, focusFirst = false) => {
        if (openItem) closeMenu();
        openItem = item;
        const btn = qs('.nav__btn', item);
        const panel = qs(`#mega-${btn.dataset.menuId}`);
        btn.setAttribute('aria-expanded', 'true');
        panel.classList.add('is-active');
        if (focusFirst) panel.querySelector('a, button')?.focus();
      };

      const closeMenu = () => {
        if (!openItem) return;
        qs('.nav__btn', openItem).setAttribute('aria-expanded', 'false');
        qs('.mega.is-active', megaContainer)?.classList.remove('is-active');
        openItem = null;
      };

      menuItems.forEach(item => {
        const btn = qs('.nav__btn', item);
        item.addEventListener('pointerenter', () => {
          clearTimeout(intentTimeout);
          intentTimeout = setTimeout(() => openMenu(item), 50);
        });
        item.addEventListener('pointerleave', () => clearTimeout(intentTimeout));
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openItem === item ? closeMenu() : openMenu(item, true);
        });
      });

      megaContainer?.addEventListener('pointerleave', () => {
        intentTimeout = setTimeout(closeMenu, 200);
      });
      megaContainer?.addEventListener('pointerenter', () => clearTimeout(intentTimeout));
      
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && openItem) {
          const btn = qs('.nav__btn', openItem);
          closeMenu();
          btn?.focus();
        }
      });
      
      document.addEventListener('pointerdown', e => {
        if (!header.contains(e.target)) closeMenu();
      });
    }

    // --- Мобильная навигация ---
    const burger = qs('.burger');
    const mnav = qs('#mobilePanel');
    const closeMobileBtn = qs('.mnav__close');

    if (burger && mnav && closeMobileBtn) {
      const openMobile = () => {
        mnav.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('overflow-hidden');
      };
      const closeMobile = () => {
        mnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
      };

      burger.addEventListener('click', () => mnav.classList.contains('open') ? closeMobile() : openMobile());
      closeMobileBtn.addEventListener('click', closeMobile);
      
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mnav.classList.contains('open')) closeMobile();
      });
      
      qsa('.mnav__acc').forEach(acc => {
        acc.addEventListener('click', () => {
          const expanded = acc.getAttribute('aria-expanded') === 'true';
          acc.setAttribute('aria-expanded', String(!expanded));
        });
      });
    }
    
    // Закрываем меню при ресайзе окна
    window.matchMedia('(max-width:1024px)').addEventListener('change', (e) => {
      if (!e.matches && qs('.nav__item.has-panel .nav__btn[aria-expanded="true"]')) {
        qs('.nav__item.has-panel .nav__btn[aria-expanded="true"]').click(); // Закрываем мега-меню
      }
      if (e.matches && mnav?.classList.contains('open')) {
        closeMobile(); // Закрываем мобильное меню
      }
    });

    // ========================================================================
    // 3. ЛОГИКА ПОДВАЛА (FOOTER)
    // ========================================================================
    const footer = qs('.ftr');
    if (footer) {
      // --- Установка текущего года ---
      const yearEl = qs('[data-current-year]');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      // --- Сворачиваемые группы в футере на мобильных ---
      const groups = qsa('.ftr-group[data-ftr-acc]');
      const mq = window.matchMedia('(max-width:860px)');

      const handleFooterAccordion = () => {
        groups.forEach(g => {
          const head = qs('.ftr-group__head', g);
          const list = qs('.ftr-group__list', g);
          if (mq.matches) { // Mobile view
            const isOpen = g.classList.contains('open');
            head.setAttribute('aria-expanded', isOpen);
            list.style.maxHeight = isOpen ? list.scrollHeight + 'px' : '0';
          } else { // Desktop view
            head.setAttribute('aria-expanded', 'true');
            list.style.maxHeight = 'none';
          }
        });
      };
      
      groups.forEach(g => {
        qs('.ftr-group__head', g).addEventListener('click', () => {
          if (mq.matches) {
            g.classList.toggle('open');
            handleFooterAccordion();
          }
        });
      });
      
      mq.addEventListener('change', handleFooterAccordion);
      handleFooterAccordion();

      // --- Форма подписки ---
      const nlForm = qs('#newsletterForm');
      if (nlForm) {
        nlForm.addEventListener('submit', e => {
          e.preventDefault();
          const emailInput = qs('input[type="email"]', nlForm);
          const msg = qs('#nl-msg', nlForm);
          msg.textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()) 
            ? 'Подписка оформлена!' 
            : 'Введите корректный email';
        });
      }

      // --- Копирование Email ---
      const copyBtn = qs('.ftr-email');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const feedback = qs('.copy-feedback');
          try {
            await navigator.clipboard.writeText(copyBtn.dataset.copyEmail);
            feedback.classList.add('active');
            setTimeout(() => feedback.classList.remove('active'), 1600);
          } catch (err) {
            console.error('Failed to copy: ', err);
          }
        });
      }

      // --- Кнопка "Наверх" ---
      const toTopBtn = qs('#toTopBtn');
      if (toTopBtn) {
        toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        const toggleToTopVisibility = () => {
          toTopBtn.classList.toggle('visible', window.scrollY > 500);
        };
        window.addEventListener('scroll', toggleToTopVisibility, { passive: true });
        toggleToTopVisibility();
      }

      // --- Анимация цифр при скролле ---
      const counters = qsa('[data-anim-count]');
      if (counters.length > 0) {
        const counterObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const el = entry.target;
              const target = parseInt(el.dataset.animCount, 10);
              let current = 0;
              const step = () => {
                const increment = Math.ceil((target - current) / 10);
                current += increment;
                el.textContent = current + (el.dataset.suffix || '');
                if (current < target) requestAnimationFrame(step);
                else el.textContent = target + (el.dataset.suffix || '');
              };
              requestAnimationFrame(step);
              counterObserver.unobserve(el);
            }
          });
        }, { threshold: 0.5 });
        counters.forEach(c => counterObserver.observe(c));
      }
    }
  });
})();

document.addEventListener("DOMContentLoaded", function() {
    // Функция для загрузки и вставки HTML
    const loadComponent = (selector, url) => {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                document.querySelector(selector).innerHTML = data;
            })
            .catch(error => console.error(`Error loading ${url}:`, error));
    };

    // Загружаем шапку и подвал
    loadComponent("#header-placeholder", "header.html");
    loadComponent("#footer-placeholder", "footer.html");
});