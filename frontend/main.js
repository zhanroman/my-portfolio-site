// Оборачиваем весь код в самовызывающуюся анонимную функцию (IIFE).
// Это стандартная практика для защиты от конфликтов с глобальными переменными и другими библиотеками.
(function () {
  "use strict";

  /**
   * Вспомогательная функция для сокращенного поиска одного элемента в DOM.
   * @param {string} selector - CSS-селектор для поиска.
   * @param {Element} [parent=document] - Родительский элемент, в котором искать.
   * @returns {Element|null} - Найденный элемент или null.
   */
  const qs = (selector, parent = document) => parent.querySelector(selector);

  /**
   * Вспомогательная функция для сокращенного поиска всех элементов в DOM.
   * @param {string} selector - CSS-селектор для поиска.
   * @param {Element} [parent=document] - Родительский элемент, в котором искать.
   * @returns {Element[]} - Массив найденных элементов.
   */
  const qsa = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  /**
   * @description Инициализирует общие компоненты страницы, не связанные с модальными окнами.
   * Включает: переключение темы, языков, поведение хедера (включая МЕГА-МЕНЮ), мобильное меню, логику подвала.
   */
  function initCommonComponents() {
    document.documentElement.classList.remove("no-js");

    // --- Логика переключения темы (светлая/тёмная) ---
    const docEl = document.documentElement;
    const applyTheme = (theme) => {
      docEl.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    };
    const getInitialTheme = () =>
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    qsa("#theme-toggle, #theme-toggle-mobile, #theme-toggle-footer").forEach(
      (toggle) => {
        toggle.addEventListener("click", () =>
          applyTheme(
            docEl.getAttribute("data-theme") === "dark" ? "light" : "dark"
          )
        );
      }
    );
    applyTheme(getInitialTheme());

    // --- Логика переключения языков (открытие/закрытие выпадающего списка) ---
    const langSwitchers = qsa(
      "[data-lang], [data-lang-mobile], [data-lang-footer]"
    );
    langSwitchers.forEach((switcher) => {
      const btn = qs(".lang__btn", switcher);
      if (!btn) return;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = switcher.classList.toggle("open");
        btn.setAttribute("aria-expanded", isOpen);
      });
    });
    document.addEventListener("click", () => {
      langSwitchers.forEach((switcher) => {
        switcher.classList.remove("open");
        qs(".lang__btn", switcher)?.setAttribute("aria-expanded", "false");
      });
    });

    // --- Поведение хедера при скролле ---
    const header = qs("#siteHeader.hdr");
    if (header) {
      let lastScroll = 0;
      window.addEventListener(
        "scroll",
        () => {
          const y = window.scrollY;
          header.classList.toggle("is-scrolled", y > 40);
          if (y > 40) {
            header.classList.toggle("hide", y > lastScroll);
          } else {
            header.classList.remove("hide");
          }
          lastScroll = y < 0 ? 0 : y;
        },
        { passive: true }
      );

      // --- ВОССТАНОВЛЕННАЯ ЛОГИКА ДЛЯ ДЕСКТОПНОГО МЕГА-МЕНЮ ---
      const menuItems = qsa(".nav__item.has-panel");
      const megaContainer = qs("#mega-container");
      let openItem = null;
      let intentTimeout = null;

      const openMenu = (item) => {
        if (openItem) closeMenu();
        openItem = item;
        const btn = qs(".nav__btn", item);
        const panel = qs(`#mega-${btn.dataset.menuId}`);
        btn.setAttribute("aria-expanded", "true");
        megaContainer.setAttribute("aria-hidden", "false");
        panel.classList.add("is-active");
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
        item.addEventListener("pointerleave", () => {
          intentTimeout = setTimeout(closeMenu, 200);
        });
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          openItem === item ? closeMenu() : openMenu(item);
        });
      });
      megaContainer?.addEventListener("pointerenter", () =>
        clearTimeout(intentTimeout)
      );
      megaContainer?.addEventListener(
        "pointerleave",
        () => (intentTimeout = setTimeout(closeMenu, 200))
      );

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && openItem) {
          qs(".nav__btn", openItem)?.focus();
          closeMenu();
        }
      });
    }

    // --- Логика мобильного меню (бургер) ---
    const burger = qs(".burger");
    const mnav = qs("#mobilePanel");
    if (burger && mnav) {
      const openMobileMenu = () => {
        mnav.classList.add("open");
        burger.setAttribute("aria-expanded", "true");
        document.body.classList.add("overflow-hidden");
      };
      const closeMobileMenu = () => {
        mnav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("overflow-hidden");
      };

      burger.addEventListener("click", () =>
        mnav.classList.contains("open") ? closeMobileMenu() : openMobileMenu()
      );
      qs(".mnav__close", mnav).addEventListener("click", closeMobileMenu);
      qsa(".mnav__acc", mnav).forEach((acc) => {
        acc.addEventListener("click", () => {
          const panel = acc.nextElementSibling;
          const isExpanded = acc.getAttribute("aria-expanded") === "true";
          acc.setAttribute("aria-expanded", !isExpanded);
          panel.style.maxHeight = isExpanded ? null : `${panel.scrollHeight}px`;
        });
      });
    }

    // --- Логика подвала (footer) ---
    const footer = qs(".ftr");
    if (footer) {
      qs("[data-current-year]").textContent = new Date().getFullYear();
      qs("#toTopBtn")?.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      );
      qs(".ftr-email")?.addEventListener("click", async (e) => {
        const feedback = qs(".copy-feedback", e.currentTarget.parentElement);
        await navigator.clipboard.writeText(e.currentTarget.dataset.copyEmail);
        feedback.classList.add("active");
        setTimeout(() => feedback.classList.remove("active"), 1600);
      });
    }
  }

  /**
   * @description Инициализирует всю логику, связанную с модальными окнами.
   * Включает: открытие/закрытие, передачу данных между формами, валидацию и отправку.
   */
  function initAllModals() {
    let lastClickedTrigger = null;

    // --- Общие функции управления модальными окнами ---
    const openModal = (modal) => {
      if (!modal) return;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("overflow-hidden");
    };
    const closeModal = (modal) => {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("overflow-hidden");
      if (lastClickedTrigger) lastClickedTrigger.focus();
    };

    // Назначаем обработчики открытия на все триггеры [data-modal-trigger]
    qsa("[data-modal-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        lastClickedTrigger = trigger;
        const modalToOpen = document.getElementById(
          trigger.dataset.modalTrigger
        );
        document.querySelectorAll(".modal-wrapper.is-open").forEach(closeModal);
        setTimeout(() => openModal(modalToOpen), 50);
      });
    });

    // Назначаем обработчики закрытия (крестик, оверлей, Escape) на все модальные окна
    document.querySelectorAll(".modal-wrapper").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("modal-overlay") ||
          e.target.closest(".modal-close")
        ) {
          closeModal(modal);
        }
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-wrapper.is-open").forEach(closeModal);
      }
    });

    // --- Логика lightbox для отзывов ---
    const lightboxTriggers = qsa("[data-lightbox-src]");
    const lightboxModal = document.getElementById("testimonialLightbox");
    if (lightboxModal && lightboxTriggers.length > 0) {
      lightboxTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (e) => {
          e.preventDefault();
          qs("img", lightboxModal).src = trigger.dataset.lightboxSrc;
          openModal(lightboxModal);
        });
      });
    }

    // --- Логика передачи данных из предварительных окон в основное ---
    const mainContactForm = qs("#mainContactForm");
    const prefilledGroup = qs("#prefilled-group");
    const prefilledTextarea = qs("#prefilled-details");

    const handlePreliminaryFormSubmit = (formId, summaryGenerator) => {
      const form = qs(`#${formId}`);
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        prefilledTextarea.value = summaryGenerator(new FormData(form));
        prefilledGroup.style.display = "block";
        const currentModal = form.closest(".modal-wrapper");
        closeModal(currentModal);
        setTimeout(() => openModal(qs("#contactModal")), 300);
      });
    };

    handlePreliminaryFormSubmit(
      "mvpForm",
      (f) =>
        `Тема: Заявка на MVP\nИдея: ${f.get("idea") || "не уст."}\nБюджет: ${f.get("budget") || "не уст."}`
    );
    handlePreliminaryFormSubmit(
      "auditForm",
      (f) =>
        `Тема: Заявка на Аудит\nСайт: ${f.get("site_url") || "не уст."}\nПроблемы: ${f.getAll("problems").join(", ") || "не уст."}`
    );
    handlePreliminaryFormSubmit(
      "turnkeyForm",
      (f) =>
        `Тема: Разработка под ключ\nЭтапы: ${f.getAll("stages").join(", ") || "не уст."}`
    );
    handlePreliminaryFormSubmit(
      "supportForm",
      (f) => `Тема: Поддержка\nФормат: ${f.get("support_type") || "не уст."}`
    );

    // --- Логика основной контактной формы (`contactModal`) ---
    if (mainContactForm) {
      const submitButton = qs(".form-submit-btn", mainContactForm);
      const contactInputs = {
        telegram: qs("#telegram-input", mainContactForm),
        whatsapp: qs("#whatsapp-input", mainContactForm),
        email: qs("#email-input", mainContactForm),
      };

      const updateMainFormState = (selectedValue) => {
        Object.values(contactInputs).forEach(
          (input) => input && input.removeAttribute("required")
        );
        if (contactInputs[selectedValue])
          contactInputs[selectedValue].setAttribute("required", "true");

        qsa(".input-group", mainContactForm).forEach(
          (group) => (group.style.display = "none")
        );
        qs(`#input-group-${selectedValue}`, mainContactForm).style.display =
          "flex";
      };

      qsa('input[name="contact_method"]', mainContactForm).forEach((radio) =>
        radio.addEventListener("change", (e) =>
          updateMainFormState(e.target.value)
        )
      );
      const initiallyChecked = qs(
        'input[name="contact_method"]:checked',
        mainContactForm
      );
      if (initiallyChecked) updateMainFormState(initiallyChecked.value);

      mainContactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Отправка...";
        submitButton.disabled = true;

        try {
          const response = await fetch(
            "https://retailcrm-proxy.onrender.com/api/send-contact-form",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                Object.fromEntries(new FormData(mainContactForm))
              ),
            }
          );
          if (!response.ok)
            throw new Error(`Ошибка сервера: ${response.statusText}`);

          submitButton.textContent = "Отправлено!";
          setTimeout(() => {
            closeModal(qs("#contactModal"));
            mainContactForm.reset();
            prefilledGroup.style.display = "none";
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            if (initiallyChecked) updateMainFormState(initiallyChecked.value);
          }, 2500);
        } catch (error) {
          console.error("Ошибка отправки:", error);
          submitButton.textContent = "Ошибка!";
          setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          }, 3000);
        }
      });

      // Логика копирования в основной форме
      qsa(".copy-btn", qs("#contactModal")).forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          navigator.clipboard.writeText(button.dataset.copyText).then(() => {
            const originalContent = button.innerHTML;
            button.innerHTML = "✓";
            button.classList.add("copied");
            setTimeout(() => {
              button.innerHTML = originalContent;
              button.classList.remove("copied");
            }, 2000);
          });
        });
      });
    }
  }

  /**
   * @description Инициализирует скрипты, которые должны запускаться после основного рендеринга страницы.
   * Включает: анимацию цифр, AI-чат, i18n (перевод).
   */
  function initPostLoadScripts() {
    // --- Анимация цифр при скролле ---
    const valueElements = qsa(".highlight__value");
    if (valueElements.length > 0) {
      const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          const currentValue = Math.floor(
            easedProgress * (end - start) + start
          );
          const prefix = obj.innerText.match(/^\D*/)?.[0] || "";
          const suffix = obj.innerText.match(/\D*$/)?.[0] || "";
          obj.innerHTML = prefix + currentValue + suffix;
          if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      };
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              const val = parseInt(el.dataset.value, 10);
              if (!isNaN(val)) animateValue(el, 0, val, 2000);
              obs.unobserve(el);
            }
          });
        },
        { threshold: 0.5 }
      );
      valueElements.forEach((el) => observer.observe(el));
    }

    // --- Логика AI-чата ---

    function initAiChat() {
      const aiModal = qs("#aiAssistantModal");
      if (!aiModal) return;

      const chatMessages = qs(".chat-messages", aiModal);
      const chatInput = qs(".chat-input-area input", aiModal);
      const sendButton = qs(".chat-input-area button", aiModal);

      if (!chatMessages || !chatInput || !sendButton) {
        console.error(
          "Ошибка в AI-чате: не найдены все необходимые элементы (chat-messages, input или button)."
        );
        return;
      }

      let chatHistory = [];

      // --- ВОССТАНОВЛЕННЫЙ ПОЛНЫЙ СИСТЕМНЫЙ ПРОМПТ ДЛЯ AI-АССИСТЕНТА ---
      const systemPrompt = `
Ты — AI-ассистент на сайте zhanroman.online. Твоя задача — помогать пользователям по вопросам создания и развития цифровых продуктов, веб-сервисов, ускорения сайтов, автоматизации бизнес-процессов, интеграций, e-commerce, SEO, UI/UX-дизайна, оптимизации и поддержки проектов. Общайся по-человечески, дружелюбно и с эмпатией, избегай сухих или формальных ответов. Избегай слишком роботизированного звучания: вместо канцелярита используй простую речь, показывай понимание и желание помочь.
Начинай диалог с уточняющих открытых вопросов, чтобы вовлечь пользователя и помочь ему раскрыть проблему. Сначала концентрируйся на понимании ситуации: что именно не работает, когда это началось, как влияет на бизнес. Давай небольшую пользу сразу — простые гипотезы, пояснения, подсказки, которые показывают экспертность.
Услуги и сотрудничество упоминай только тогда, когда проблема уже ясна и пользователь видит, что ты понимаешь его ситуацию. В этот момент мягко переходи к закрытию: скажи, что задача понятна и её можно решить, предложи передать информацию владельцу сайта и вежливо попроси имя и контакт для связи.
Если вопрос пользователя не касается этих тем (например, кулинария, политика, природа), отвечай вежливо и кратко: «Извините, я консультирую только по вопросам цифровых продуктов, автоматизации, веб-разработки и оптимизации бизнеса.»
Главная цель — вовлечь клиента в разговор, выявить слабые места, показать ценность возможного решения, и затем закрыть на сделку через передачу контакта владельцу сайта. Отвечай кратко и по сути, максимум 2–3 предложения.
Контекст сайта: услуги — разработка веб-сервисов, UI/UX-дизайна, автоматизация, интеграции, ускорение сайтов, SEO, e-commerce; проекты — MVP, комплексные решения, поддержка, оптимизация; технологии — HTML, CSS, JS, WordPress, 1С-Битрикс, Tilda, Webflow, API, CRM-интеграции, GitHub; цель — ускорить запуск, снизить издержки, увеличить прибыль, автоматизировать рутину, повысить стабильность и масштабируемость бизнеса.
Правила общения: 1) начинай с открытых вопросов, 2) слушай и уточняй, 3) давай небольшую пользу сразу, 4) только после понимания проблемы предлагай помощь владельца сайта и проси контакты, 5) если вопрос не по теме — вежливо отказывайся.
`.trim();

      const addMessage = (sender, text) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${sender}`;
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "chat-avatar";
        avatarDiv.textContent = sender === "ai" ? "AI" : "Вы";
        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "chat-bubble";
        bubbleDiv.innerHTML =
          sender === "ai" && window.marked ? window.marked.parse(text) : text;
        messageDiv.append(avatarDiv, bubbleDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (text !== "печатает...") {
          chatHistory.push({ role: sender, text });
          if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
        }
      };

      const handleSendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage("user", userMessage);
        const currentChatHistory = [...chatHistory];

        chatInput.value = "";
        sendButton.disabled = true;

        try {
          const response = await fetch(
            "https://retailcrm-proxy.onrender.com/api/gemini",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemPrompt: systemPrompt,
                history: currentChatHistory.slice(0, -1),
                userMessage: userMessage,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Ошибка сети");
          }

          const data = await response.json();
          addMessage("ai", data.response);

          fetch("https://retailcrm-proxy.onrender.com/api/send-chat-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatHistory: chatHistory }),
          });
        } catch (error) {
          console.error("Ошибка AI-чата:", error);
          addMessage("ai", "К сожалению, произошла ошибка. Попробуйте позже.");
        } finally {
          sendButton.disabled = false;
          chatInput.focus();
        }
      };

      sendButton.addEventListener("click", handleSendMessage);
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSendMessage();
        }
      });
    }

    initAiChat();

    // --- ВОССТАНОВЛЕННАЯ ЛОГИКА ПЕРЕВОДА (i18n) С ПЛАВНОЙ АНИМАЦИЕЙ ---
    const animateTextChange = (el, newText) => {
      el.classList.add("lang-fade");
      setTimeout(() => {
        el.innerHTML = newText; // Используем innerHTML чтобы работали теги вроде <br>
        el.classList.remove("lang-fade");
      }, 300);
    };

    const setLang = (lang) => {
      localStorage.setItem("site-lang", lang);
      fetch(`./lang.${lang}.json`)
        .then((res) => res.json())
        .then((dict) => {
          qsa("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            if (dict[key] && el.innerHTML !== dict[key]) {
              animateTextChange(el, dict[key]); // Вызываем функцию с анимацией
            }
          });
          qsa(".lang__current").forEach(
            (el) => (el.textContent = lang === "ru" ? "Ru" : "En")
          );
        });
    };
    qsa("[data-lang-set]").forEach((btn) =>
      btn.addEventListener("click", () => setLang(btn.dataset.langSet))
    );
    setLang(localStorage.getItem("site-lang") || "ru");
  }

  // --- ГЛАВНЫЙ ВЫЗОВ ПОСЛЕ ЗАГРУЗКИ DOM ---
  document.addEventListener("DOMContentLoaded", () => {
    initCommonComponents();
    initAllModals();
    initPostLoadScripts();
  });
})();
