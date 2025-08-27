const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// --- СУЩЕСТВУЮЩИЕ ЭНДПОИНТЫ ---

// Эндпоинт для чата Gemini
app.post("/api/gemini", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Сообщение не может быть пустым" });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error("Ошибка в /api/gemini:", error);
    res.status(500).json({ error: "Не удалось получить ответ от Gemini" });
  }
});

// Эндпоинт для отправки переписки на email
app.post("/api/send-chat-email", async (req, res) => {
  try {
    const { chatHistory } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Нет переписки для отправки" });
    }

    // Формируем текст письма
    let emailText = "Переписка с AI-ассистентом на сайте ZhanRoman:\n\n";
    chatHistory.forEach((msg, idx) => {
      emailText += `${idx + 1}. ${msg.role === "user" ? "Пользователь" : "AI"}: ${msg.text}\n`;
    });

    // Настройка почты (используй Gmail или SMTP-почту Render, если доступно)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // твоя почта Gmail
        pass: process.env.EMAIL_PASS, // пароль приложения Gmail
      },
    });

    await transporter.sendMail({
      from: '"AI Assistant ZhanRoman" <' + process.env.EMAIL_USER + ">",
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

// --- НОВЫЙ ЭНДПОИНТ ДЛЯ КОНТАКТНОЙ ФОРМЫ ---
app.post("/api/send-contact-form", async (req, res) => {
  try {
    const { name, contact_method, telegram, whatsapp, email, callable } =
      req.body;

    if (!name || !contact_method) {
      return res.status(400).json({ error: "Не заполнены обязательные поля" });
    }

    // Определяем контактные данные
    let contactDetail = "";
    switch (contact_method) {
      case "telegram":
        contactDetail = `Telegram: ${telegram}`;
        break;
      case "whatsapp":
        contactDetail = `WhatsApp: ${whatsapp}`;
        break;
      case "email":
        contactDetail = `Email: ${email}`;
        break;
    }

    // Формируем красивый текст письма
    let emailText = `
      Новая заявка с сайта-портфолио ZhanRoman!
      ------------------------------------------
      Имя клиента: ${name}
      
      Выбранный способ связи: ${contact_method.charAt(0).toUpperCase() + contact_method.slice(1)}
      Контактные данные: ${contactDetail}
    `;

    // Добавляем информацию о звонке, если это WhatsApp
    if (contact_method === "whatsapp") {
      emailText += `\n      Разрешил(а) звонить: ${callable ? "Да" : "Нет"}`;
    }

    emailText += `
      ------------------------------------------
      Письмо сгенерировано автоматически.
    `;

    // Используем тот же транспорт для отправки почты
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // ваша почта Gmail
        pass: process.env.EMAIL_PASS, // пароль приложения Gmail
      },
    });

    await transporter.sendMail({
      from: `"Сайт-портфолио" <${process.env.EMAIL_USER}>`,
      to: "zhanroman2610@gmail.com", // Ваша почта для получения заявок
      subject: `Новая заявка от клиента: ${name}`,
      text: emailText,
    });

    res.status(200).json({ message: "Форма успешно отправлена!" });
  } catch (error) {
    console.error("Ошибка при отправке контактной формы:", error);
    res.status(500).json({ error: "Не удалось отправить заявку." });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
