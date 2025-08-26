// Импортируем всё необходимое
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Получаем наш секретный API-ключ из переменных окружения
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Экспортируем асинхронную функцию, которая будет обрабатывать запросы
module.exports = async (req, res) => {
  // Убедимся, что это POST-запрос
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Получаем модель Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Получаем сообщение пользователя из тела запроса
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Генерируем ответ
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Отправляем сгенерированный текст обратно на сайт
    res.status(200).json({ response: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate content" });
  }
};
