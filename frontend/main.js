(function () {
  "use strict";

  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  function initCommonComponents() {
    document.documentElement.classList.remove("no-js");

    const docEl = document.documentElement;
    function applyTheme(theme) {
      docEl.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
    function getInitialTheme() {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) return storedTheme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    qsa("#theme-toggle, #theme-toggle-mobile, #theme-toggle-footer").forEach(
      (toggle) => {
        toggle.addEventListener("click", () => {
          const currentTheme = docEl.getAttribute("data-theme");
          const newTheme = currentTheme === "dark" ? "light" : "dark";
          applyTheme(newTheme);
        });
      }
    );
    applyTheme(getInitialTheme());

    const langSwitchers = qsa(
      "[data-lang], [data-lang-mobile], [data-lang-footer]"
    );
    langSwitchers.forEach((switcher) => {
      const btn = qs(".lang__btn", switcher);
      const list = qs(".lang__list", switcher);
      if (!btn || !list) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = switcher.classList.toggle("open");
        btn.setAttribute("aria-expanded", isOpen);
        langSwitchers.forEach((other) => {
          if (other !== switcher) {
            other.classList.remove("open");
            qs(".lang__btn", other)?.setAttribute("aria-expanded", "false");
          }
        });
      });

      list.addEventListener("click", (e) => {
        const option = e.target.closest("button[data-lang-set]");
        if (!option) return;
        const langValue = option.getAttribute("data-lang-set");
        const langText = langValue === "ru" ? "Ru" : "En";
        qsa(".lang__current").forEach((el) => (el.textContent = langText));
        langSwitchers.forEach((s) => {
          qsa('li[role="option"]', s).forEach((li) => {
            const button = qs("button", li);
            li.setAttribute(
              "aria-selected",
              button.getAttribute("data-lang-set") === langValue
            );
          });
        });
        switcher.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", () => {
      langSwitchers.forEach((switcher) => {
        switcher.classList.remove("open");
        qs(".lang__btn", switcher)?.setAttribute("aria-expanded", "false");
      });
    });

    const header = qs("#siteHeader.hdr");
    if (header) {
      let lastScroll = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        const goingDown = y > lastScroll;
        const isScrolled = y > 40;
        header.classList.toggle("is-scrolled", isScrolled);
        if (isScrolled) {
          header.classList.toggle("hide", goingDown);
        } else {
          header.classList.remove("hide");
        }
        lastScroll = y < 0 ? 0 : y;
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      const menuItems = qsa(".nav__item.has-panel");
      const megaContainer = qs("#mega-container");
      let openItem = null;
      let intentTimeout = null;
      const openMenu = (item, focusFirst = false) => {
        if (openItem) closeMenu();
        openItem = item;
        const btn = qs(".nav__btn", item);
        const panel = qs(`#mega-${btn.dataset.menuId}`);
        btn.setAttribute("aria-expanded", "true");
        megaContainer.setAttribute("aria-hidden", "false");
        panel.classList.add("is-active");
        if (focusFirst) panel.querySelector("a, button")?.focus();
      };
      const closeMenu = () => {
        if (!openItem) return;
        qs(".nav__btn", openItem).setAttribute("aria-expanded", "false");
        qs(".mega.is-active", megaContainer)?.classList.remove("is-active");
        megaContainer.setAttribute("aria-hidden", "true");
        openItem = null;
      };
      menuItems.forEach((item) => {
        const btn = qs(".nav__btn", item);
        item.addEventListener("pointerenter", () => {
          clearTimeout(intentTimeout);
          intentTimeout = setTimeout(() => openMenu(item), 50);
        });
        item.addEventListener("pointerleave", () =>
          clearTimeout(intentTimeout)
        );
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          openItem === item ? closeMenu() : openMenu(item, true);
        });
      });
      megaContainer?.addEventListener("pointerleave", () => {
        intentTimeout = setTimeout(closeMenu, 200);
      });
      megaContainer?.addEventListener("pointerenter", () =>
        clearTimeout(intentTimeout)
      );
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && openItem) {
          const btn = qs(".nav__btn", openItem);
          closeMenu();
          btn?.focus();
        }
      });
      document.addEventListener("pointerdown", (e) => {
        if (!header.contains(e.target)) closeMenu();
      });
    }

    const burger = qs(".burger");
    const mnav = qs("#mobilePanel");
    const closeMobileBtn = qs(".mnav__close");
    let closeMobile;
    if (burger && mnav && closeMobileBtn) {
      const openMobile = () => {
        mnav.classList.add("open");
        mnav.setAttribute("aria-hidden", "false");
        burger.setAttribute("aria-expanded", "true");
        document.body.classList.add("overflow-hidden");
      };
      closeMobile = () => {
        mnav.classList.remove("open");
        mnav.setAttribute("aria-hidden", "true");
        burger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("overflow-hidden");
      };
      burger.addEventListener("click", () =>
        mnav.classList.contains("open") ? closeMobile() : openMobile()
      );
      closeMobileBtn.addEventListener("click", closeMobile);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mnav.classList.contains("open"))
          closeMobile();
      });
      qsa(".mnav__acc").forEach((acc) => {
        acc.addEventListener("click", () => {
          const panel = acc.nextElementSibling;
          if (!panel) return;

          const isExpanded = acc.getAttribute("aria-expanded") === "true";
          acc.setAttribute("aria-expanded", String(!isExpanded));

          if (!isExpanded) {
            panel.style.maxHeight = panel.scrollHeight + "px";
          } else {
            panel.style.maxHeight = null;
          }
        });
      });
    }

    window.matchMedia("(min-width: 1025px)").addEventListener("change", (e) => {
      if (
        e.matches &&
        mnav?.classList.contains("open") &&
        typeof closeMobile === "function"
      ) {
        closeMobile();
      }
    });

    const footer = qs(".ftr");
    if (footer) {
      const yearEl = qs("[data-current-year]");
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      const copyBtn = qs(".ftr-email");
      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const feedback = qs(".copy-feedback");
          try {
            await navigator.clipboard.writeText(copyBtn.dataset.copyEmail);
            feedback.classList.add("active");
            setTimeout(() => feedback.classList.remove("active"), 1600);
          } catch (err) {
            console.error("Failed to copy: ", err);
          }
        });
      }

      const toTopBtn = qs("#toTopBtn");
      if (toTopBtn) {
        toTopBtn.addEventListener("click", () =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      }
    }
  }

  function initModals() {
    const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
    let activeModalAnimation = null;
    let lastClickedTrigger = null;

    modalTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const modalId = trigger.dataset.modalTrigger;
        const modal = document.getElementById(modalId);
        if (modal) {
          lastClickedTrigger = trigger;
          openModal(modal);
        }
      });
    });

    function openModal(modal) {
      const modalContainer = modal.querySelector(".modal-container");

      document.body.classList.add("overflow-hidden");
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("is-open");

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusableElement = focusableElements[0];

      // Delay focus to allow for animations
      setTimeout(() => firstFocusableElement?.focus(), 100);

      modal.addEventListener("click", closeModalHandler);
      document.addEventListener("keydown", trapFocus);
    }

    function closeModal(modal) {
      document.body.classList.remove("overflow-hidden");
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");

      modal.removeEventListener("click", closeModalHandler);
      document.removeEventListener("keydown", trapFocus);

      lastClickedTrigger?.focus();
    }

    function closeModalHandler(e) {
      if (
        e.target.classList.contains("modal-overlay") ||
        e.target.closest(".modal-close")
      ) {
        closeModal(e.currentTarget);
      }
    }

    function trapFocus(e) {
      const openModalEl = document.querySelector(".modal-wrapper.is-open");
      if (!openModalEl) return;

      const focusableElements = openModalEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (e.key === "Escape") {
        closeModal(openModalEl);
      }

      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCommonComponents();
    initModals();
  });
})();

