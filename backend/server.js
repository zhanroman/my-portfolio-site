// /backend/server.js

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Используем PORT из окружения Render или 3001 для локальной разработки
const port = process.env.PORT || 3001;

// Получаем API-ключ из переменных окружения
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Включаем CORS, чтобы твой сайт мог общаться с этим сервером
app.use(cors());
// Включаем парсинг JSON-тела запросов
app.use(express.json());

// Создаем эндпоинт для нашего API
app.post('/api/gemini', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Сообщение не может быть пустым' });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        console.error('Ошибка в /api/gemini:', error);
        res.status(500).json({ error: 'Не удалось получить ответ от Gemini' });
    }
});

// Запускаем сервер
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});