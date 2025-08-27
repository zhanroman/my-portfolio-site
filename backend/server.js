const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");
require("dotenv").config(); // Убедитесь, что эта строка есть для загрузки переменных окружения

const app = express();
const port = process.env.PORT || 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// --- ИСПРАВЛЕННЫЙ ЭНДПОИНТ ДЛЯ ЧАТА GEMINI ---
app.post("/api/gemini", async (req, res) => {
  try {
    const { systemPrompt, history, userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: "Сообщение не может быть пустым" });
    }

    // 1. Используем systemInstruction для передачи системного промпта.
    // Это самый правильный и надежный способ задать поведение модели.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    // 2. Формируем историю диалога в формате, который требует API Gemini.
    // История должна быть чистой, без дублирования системных промптов или приветствий.
    const conversationHistory = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        conversationHistory.push({
          // Корректно преобразуем роли: 'ai' на 'model'
          role: msg.role === "ai" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      });
    }

    // 3. Инициализируем сессию чата с полученной историей.
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 200, // Ограничение длины ответа
      },
    });

    // 4. Отправляем новое сообщение от пользователя.
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error("Ошибка в /api/gemini:", error);
    res.status(500).json({ error: "Не удалось получить ответ от Gemini" });
  }
});

// --- Эндпоинт для отправки переписки на email ---
app.post("/api/send-chat-email", async (req, res) => {
  try {
    const { chatHistory } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Нет переписки для отправки" });
    }

    let emailText = "Переписка с AI-ассистентом на сайте ZhanRoman:\n\n";
    chatHistory.forEach((msg, idx) => {
      emailText += `${idx + 1}. ${msg.role === "user" ? "Пользователь" : "AI"}: ${msg.text}\n`;
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"AI Assistant ZhanRoman" <${process.env.EMAIL_USER}>`,
      to: "zhanroman2610@gmail.com",
      subject: "Новая переписка с AI-ассистентом",
      text: emailText,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Ошибка при отправке email:", error);
    res.status(500).json({ error: "Не удалось отправить переписку на email" });
  }
});

// --- ЕДИНЫЙ И ИСПРАВЛЕННЫЙ ЭНДПОИНТ ДЛЯ КОНТАКТНОЙ ФОРМЫ ---
app.post("/api/send-contact-form", async (req, res) => {
  try {
    const {
      name,
      contact_method,
      telegram,
      whatsapp,
      email,
      callable,
      prefilled_details,
    } = req.body;

    if (!name || !contact_method) {
      return res.status(400).json({ error: "Не заполнены обязательные поля" });
    }

    // 1. Определяем контактные данные
    let contactDetail = "";
    switch (contact_method) {
      case "telegram":
        contactDetail = `Telegram: ${telegram || "не указан"}`;
        break;
      case "whatsapp":
        contactDetail = `WhatsApp: ${whatsapp || "не указан"}`;
        break;
      case "email":
        contactDetail = `Email: ${email || "не указан"}`;
        break;
    }

    // 2. Формируем текст письма
    let emailText = `Новая заявка с сайта-портфолио ZhanRoman!\n\n`;

    if (prefilled_details) {
      emailText += `--- Детали заявки ---\n${prefilled_details}\n----------------------\n\n`;
    }

    emailText += `--- Контактные данные ---\n`;
    emailText += `Имя клиента: ${name}\n`;
    emailText += `Способ связи: ${contact_method}\n`;
    emailText += `Контакт: ${contactDetail}\n`;

    if (contact_method === "whatsapp") {
      emailText += `Разрешил(а) звонить: ${callable ? "Да" : "Нет"}\n`;
    }

    emailText += `-------------------------\n`;

    // 3. Создаем транспорт и отправляем письмо
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Формируем тему письма, чтобы она была информативной
    const subjectTopic = prefilled_details
      ? prefilled_details.split("\n")[0].replace("Тема: ", "")
      : "Общий вопрос";

    await transporter.sendMail({
      from: `"Сайт-портфолио" <${process.env.EMAIL_USER}>`,
      to: "zhanroman2610@gmail.com",
      subject: `Новая заявка (${name}): ${subjectTopic}`,
      text: emailText.trim(), // Убираем лишние пробелы в начале и конце
    });

    res.status(200).json({ message: "Форма успешно отправлена!" });
  } catch (error) {
    console.error("Ошибка при отправке контактной формы:", error);
    res.status(500).json({ error: "Не удалось отправить заявку." });
  }
});

// --- ЗАПУСК СЕРВЕРА ---
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
