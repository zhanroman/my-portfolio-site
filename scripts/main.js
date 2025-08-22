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
          if (!panel) return; // Проверка, что панель существует

          const isExpanded = acc.getAttribute("aria-expanded") === "true";
          acc.setAttribute("aria-expanded", String(!isExpanded));

          // Если панель была закрыта, открываем её, установив высоту
          if (!isExpanded) {
            panel.style.maxHeight = panel.scrollHeight + "px";
          } else {
            // Иначе, если была открыта, закрываем
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
      const groups = qsa(".ftr-group[data-ftr-acc]");
      const mq = window.matchMedia("(max-width:860px)");
      const handleFooterAccordion = () => {
        groups.forEach((g) => {
          const head = qs(".ftr-group__head", g);
          const list = qs(".ftr-group__list", g);
          if (mq.matches) {
            const isOpen = g.classList.contains("open");
            head.setAttribute("aria-expanded", isOpen);
            list.style.maxHeight = isOpen ? list.scrollHeight + "px" : null;
          } else {
            head.setAttribute("aria-expanded", "true");
            list.style.maxHeight = "";
          }
        });
      };
      groups.forEach((g) => {
        qs(".ftr-group__head", g).addEventListener("click", () => {
          if (mq.matches) {
            g.classList.toggle("open");
            handleFooterAccordion();
          }
        });
      });
      mq.addEventListener("change", handleFooterAccordion);
      handleFooterAccordion();

      const nlForm = qs("#newsletterForm");
      if (nlForm) {
        nlForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const emailInput = qs('input[type="email"]', nlForm);
          const msg = qs("#nl-msg", nlForm);
          msg.textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            emailInput.value.trim()
          )
            ? "Подписка оформлена!"
            : "Введите корректный email";
        });
      }

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
        const toggleToTopVisibility = () => {
          toTopBtn.classList.toggle("visible", window.scrollY > 500);
        };
        window.addEventListener("scroll", toggleToTopVisibility, {
          passive: true,
        });
        toggleToTopVisibility();
      }

      const counters = qsa("[data-anim-count]");
      if (counters.length > 0) {
        const counterObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.animCount, 10);
                const suffix = el.dataset.suffix || "";
                let current = 0;
                const step = () => {
                  const increment = Math.ceil((target - current) / 20);
                  current += increment;
                  el.textContent = current + suffix;
                  if (current < target) {
                    requestAnimationFrame(step);
                  } else {
                    el.textContent = target + suffix;
                  }
                };
                requestAnimationFrame(step);
                observer.unobserve(el);
              }
            });
          },
          { threshold: 0.5 }
        );
        counters.forEach((c) => counterObserver.observe(c));
      }
    }
  }

  function initHomePage() {
    const animatedElements = document.querySelectorAll(
      "[data-animate], .capability-card"
    );

    if (animatedElements.length > 0) {
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const delay = entry.target.dataset.delay;
              if (delay) {
                entry.target.style.transitionDelay = `${delay}ms`;
              }
              entry.target.classList.add("in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      animatedElements.forEach((el, index) => {
        if (el.classList.contains("capability-card")) {
          el.style.setProperty("--delay", `${index * 100}ms`);
        }
        observer.observe(el);
      });
    }

    const sliderSection = document.querySelector(
      '[data-slider="featured-works"]'
    );
    if (sliderSection) {
      const container = sliderSection.querySelector(".slider-container");
      const track = sliderSection.querySelector(".slider-track");
      if (!track) return;
      const slides = Array.from(track.children);
      const btnPrev = sliderSection.querySelector(".slider-btn--prev");
      const btnNext = sliderSection.querySelector(".slider-btn--next");

      let currentIndex = 0,
        slideWidth = 0,
        gap = 0,
        maxIndex = 0,
        isMobile = false;
      const mqMobile = window.matchMedia("(max-width: 767px)");

      const readMetrics = () => {
        if (slides.length === 0) return;
        isMobile = mqMobile.matches;
        slideWidth = slides[0].offsetWidth;
        gap = parseFloat(getComputedStyle(track).gap) || 0;
        const visibleCount = Math.round(
          container.clientWidth / (slideWidth + gap)
        );
        maxIndex = isMobile
          ? slides.length - 1
          : Math.max(0, slides.length - visibleCount);
      };

      const goTo = (index, animate = true) => {
        if (slides.length === 0) return;
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        const totalStep = slideWidth + gap;
        let translateX;

        if (isMobile) {
          const containerCenter = container.clientWidth / 2;
          const slideCenter = slideWidth / 2;
          translateX = containerCenter - slideCenter - currentIndex * totalStep;
        } else {
          translateX = -currentIndex * totalStep;
        }

        track.style.transition = animate ? "" : "none";
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
        btnPrev.addEventListener("click", () => goTo(currentIndex - 1));
        btnNext.addEventListener("click", () => goTo(currentIndex + 1));
      }
      window.addEventListener("resize", onResize);

      let isDragging = false,
        startX = 0,
        currentTranslate = 0,
        prevTranslate = 0;

      container.addEventListener("pointerdown", (e) => {
        isDragging = true;
        startX = e.clientX;
        track.style.transition = "none";
        container.style.cursor = "grabbing";
        container.setPointerCapture(e.pointerId);
        prevTranslate = new DOMMatrix(getComputedStyle(track).transform).e;
      });

      container.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        currentTranslate = prevTranslate + currentX - startX;
        track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
      });

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        container.style.cursor = "grab";

        const movedBy = currentTranslate - prevTranslate;

        if (movedBy < -100 && currentIndex < maxIndex) {
          currentIndex++;
        }
        if (movedBy > 100 && currentIndex > 0) {
          currentIndex--;
        }
        goTo(currentIndex);
      };

      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointerleave", onPointerUp);

      readMetrics();
      goTo(0, false);
    }

    const processTrack = document.getElementById("processTrack");
    const progressBar = document.getElementById("processProgressBar");
    if (processTrack && progressBar) {
      const updateProgress = () => {
        const rect = processTrack.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = rect.top + window.scrollY;
        const end = start + rect.height - vh * 0.5;
        const progress = (window.scrollY - start) / (end - start);
        const clamped = Math.min(1, Math.max(0, progress));
        progressBar.style.width = clamped * 100 + "%";
      };
      document.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);
      updateProgress();
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const tiltEls = document.querySelectorAll("[data-tilt]");
      tiltEls.forEach((el) => {
        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          el.style.transform = `perspective(1000px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) scale(1.03)`;
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform =
            "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
        });
      });
    }

    const canvas = document.getElementById("ctaParticles");
    if (
      canvas &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const ctx = canvas.getContext("2d");
      let w, h, particles;
      const resize = () => {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
        particles = Array.from(
          { length: Math.min(90, Math.floor(w / 16)) },
          () => spawn()
        );
      };
      const spawn = () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * Math.PI * 2,
        s: Math.random() * 0.4 + 0.1,
        o: Math.random() * 0.3 + 0.1,
      });
      const tick = () => {
        if (!w || !h) return;
        ctx.clearRect(0, 0, w, h);
        particles.forEach((p) => {
          p.x += Math.cos(p.a) * p.s;
          p.y += Math.sin(p.a) * p.s;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;

          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.o})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(tick);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            resize();
            tick();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(canvas);
      window.addEventListener("resize", resize);
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
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      const triggerRect = lastClickedTrigger.getBoundingClientRect();
      const modalRect = modalContainer.getBoundingClientRect();

      const scaleX = triggerRect.width / modalRect.width;
      const scaleY = triggerRect.height / modalRect.height;
      const translateX =
        triggerRect.left -
        modalRect.left +
        (triggerRect.width / 2 - modalRect.width / 2);
      const translateY =
        triggerRect.top -
        modalRect.top +
        (triggerRect.height / 2 - modalRect.height / 2);

      activeModalAnimation = modalContainer.animate(
        [
          {
            transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
            opacity: 0.2,
          },
          {
            transform: "translate(0, 0) scale(1)",
            opacity: 1,
          },
        ],
        {
          duration: 450,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          fill: "forwards",
        }
      );

      activeModalAnimation.onfinish = () => {
        firstFocusableElement?.focus();
      };

      document.body.classList.add("modal-active");
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("is-open");

      modal.addEventListener("click", closeModalHandler);
      document.addEventListener("keydown", trapFocus);
    }

    function closeModal(modal) {
      document.body.classList.remove("modal-active");

      if (activeModalAnimation) {
        activeModalAnimation.reverse();
        activeModalAnimation.onfinish = () => {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
          activeModalAnimation = null;
          lastClickedTrigger?.focus();
        };
      } else {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        lastClickedTrigger?.focus();
      }

      modal.removeEventListener("click", closeModalHandler);
      document.removeEventListener("keydown", trapFocus);
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
    const loadComponent = (selector, url) => {
      return fetch(url)
        .then((response) =>
          response.ok ? response.text() : Promise.reject(response.status)
        )
        .then((data) => {
          const element = document.querySelector(selector);
          if (element) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = data;

            while (tempDiv.firstChild) {
              element.parentNode.insertBefore(tempDiv.firstChild, element);
            }
            element.parentNode.removeChild(element);
          }
        })
        .catch((error) => {
          console.error(`Error loading ${url}:`, error);
        });
    };

    const headerPromise = loadComponent("#header-placeholder", "header.html");
    const footerPromise = loadComponent("#footer-placeholder", "footer.html");

    Promise.all([headerPromise, footerPromise]).then(() => {
      initCommonComponents();
      initHomePage();
      initModals();
    });
  });
})();
