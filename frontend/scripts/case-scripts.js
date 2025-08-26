(function () {
  "use strict";

  /**
   * Запускаем весь код только после того, как HTML-документ будет полностью загружен.
   * Это предотвращает ошибки, связанные с поиском еще не существующих элементов.
   */
  document.addEventListener("DOMContentLoaded", () => {
    // ========================================================================
    // 1. Анимация появления элементов при скролле
    // ========================================================================
    const animatedElements = document.querySelectorAll("[data-animate]");
    if (animatedElements.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      animatedElements.forEach((el) => observer.observe(el));
    }

    // ========================================================================
    // 2. Индикатор прогресса чтения
    // ========================================================================
    const readingProgressBar = document.querySelector(".js-reading-progress");
    if (readingProgressBar) {
      const updateProgress = () => {
        const docElement = document.documentElement;
        const scrollPercent =
          docElement.scrollTop /
          (docElement.scrollHeight - docElement.clientHeight);
        readingProgressBar.style.transform = `scaleX(${scrollPercent})`;
      };
      document.addEventListener("scroll", updateProgress, { passive: true });
      updateProgress(); // Вызываем сразу для корректного отображения при перезагрузке
    }

    // ========================================================================
    // 3. Содержание (TOC), "шпион" скролла и мобильное меню
    // ========================================================================
    const tocContainer = document.querySelector(".js-case-toc");
    const tocFab = document.querySelector(".js-toc-fab"); // Кнопка для открытия мобильного TOC
    const tocCloseButton = document.querySelector(".js-toc-close");
    const tocLinks = document.querySelectorAll(".js-toc-list a");
    const scrollSpySections = document.querySelectorAll("#hero, .case-section");

    // Проверяем, что все необходимые для TOC элементы существуют
    if (
      tocContainer &&
      tocFab &&
      tocCloseButton &&
      tocLinks.length > 0 &&
      scrollSpySections.length > 0
    ) {
      // --- Логика открытия/закрытия мобильного TOC ---
      const toggleTOC = (forceState) => {
        const isOpen =
          forceState !== undefined
            ? forceState
            : !tocContainer.classList.contains("open");
        tocContainer.classList.toggle("open", isOpen);
        tocFab.setAttribute("aria-expanded", isOpen);
        document.body.classList.toggle("toc-open", isOpen);
      };

      tocFab.addEventListener("click", () => toggleTOC());
      tocCloseButton.addEventListener("click", () => toggleTOC(false));

      // Закрытие по клику вне области TOC на мобильных
      document.addEventListener("click", (event) => {
        if (
          window.matchMedia("(max-width: 1024px)").matches &&
          tocContainer.classList.contains("open") &&
          !event.target.closest(".js-case-toc") &&
          !event.target.closest(".js-toc-fab")
        ) {
          toggleTOC(false);
        }
      });

      // --- Логика "шпиона" скролла ---
      const onScrollSpy = () => {
        let currentSectionId = scrollSpySections[0].id;
        const fromTop = window.scrollY + 140; // Смещение для более точного определения

        for (const section of scrollSpySections) {
          if (section.offsetTop - 120 <= fromTop) {
            currentSectionId = section.id;
          }
        }
        tocLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + currentSectionId
          );
        });
      };
      document.addEventListener("scroll", onScrollSpy, { passive: true });
      onScrollSpy(); // Вызываем при загрузке страницы

      // --- Плавный скролл к якорям ---
      document.addEventListener("click", (event) => {
        const anchorLink = event.target.closest('a[href^="#"]');
        if (!anchorLink) return;

        // Убедимся, что это ссылка именно из нашего содержания
        if (!Array.from(tocLinks).includes(anchorLink)) return;

        const id = anchorLink.getAttribute("href").slice(1);
        const targetElement = document.getElementById(id);

        if (targetElement) {
          event.preventDefault();
          window.scrollTo({
            top: targetElement.offsetTop - 80, // Смещение для липкой шапки
            behavior: "smooth",
          });
          // Закрываем мобильное меню после клика по ссылке
          if (tocContainer.classList.contains("open")) {
            toggleTOC(false);
          }
        }
      });
    }

    // ========================================================================
    // 4. Аккордеон для секции FAQ
    // ========================================================================
    const faqContainer = document.querySelector(".js-faq-accordion");
    if (faqContainer) {
      faqContainer.querySelectorAll(".faq-item").forEach((item) => {
        const head = item.querySelector(".faq-item__head");
        const panel = item.querySelector(".faq-item__panel");

        if (!head || !panel) return;

        const setInitialState = () => {
          const isExpanded = head.getAttribute("aria-expanded") === "true";
          item.classList.toggle("open", isExpanded);
          panel.style.maxHeight = isExpanded ? panel.scrollHeight + "px" : "0";
        };

        head.addEventListener("click", () => {
          const isExpanded = head.getAttribute("aria-expanded") === "true";
          head.setAttribute("aria-expanded", String(!isExpanded));
          item.classList.toggle("open", !isExpanded);
          panel.style.maxHeight = !isExpanded ? panel.scrollHeight + "px" : "0";
        });

        setInitialState(); // Устанавливаем начальное состояние
      });
    }

    // ========================================================================
    // 5. Лайтбокс для изображений
    // ========================================================================
    const lightbox = document.querySelector(".js-lightbox");
    if (lightbox) {
      const lightboxImage = lightbox.querySelector(".js-lightbox-image");
      const lightboxCaption = lightbox.querySelector(".js-lightbox-caption");
      const lightboxClose = lightbox.querySelector(".js-lightbox-close");

      const openLightbox = (imageElement) => {
        const src = imageElement.dataset.full || imageElement.src;
        const alt = imageElement.alt || "";
        const caption =
          imageElement
            .closest(".shot")
            ?.querySelector(".shot__cap")
            ?.textContent.trim() ||
          imageElement
            .closest(".case-inline-shot")
            ?.querySelector(".case-inline-shot__cap")
            ?.textContent.trim() ||
          "";

        lightboxImage.src = src;
        lightboxImage.alt = alt;
        lightboxCaption.textContent = caption;
        lightbox.classList.add("open");
        document.body.classList.add("lightbox-open");
      };

      const closeLightbox = () => {
        lightbox.classList.remove("open");
        document.body.classList.remove("lightbox-open");
        // Очищаем src чтобы остановить загрузку/проигрывание (для видео в будущем)
        setTimeout(() => {
          lightboxImage.src = "";
        }, 300);
      };

      document
        .querySelectorAll("[data-lightbox-trigger]")
        .forEach((trigger) => {
          trigger.addEventListener("click", () => openLightbox(trigger));
        });

      lightboxClose.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLightbox();
      });
    }
  });
})();
