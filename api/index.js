// Финальный обходной SSE-код специально для Vercel + GigaCowork
export default async function handler(req, res) {
  // Настройка CORS заголовков
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ответ на GET запрос (проверка связи от GigaCowork)
  if (req.method === 'GET') {
    return res.status(200).json({ status: "MCP Server is running via HTTP" });
  }

  // Ответ на POST запрос (GigaCowork ищет стриминг)
  if (req.method === 'POST') {
    // Включаем заголовки имитации непрерывного SSE-потока, которые требует Streamable HTTP
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Вытаскиваем промт, который написал пользователь в чате коворка
      const promptText = req.body?.params?.arguments?.prompt || req.body?.prompt || "beautiful landscape";
      const sanitizedPrompt = encodeURIComponent(promptText);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://pollinations.ai{sanitizedPrompt}?width=1024&height=1024&seed=${seed}&model=flux`;

      // Формируем правильный пакет ответа протокола MCP
      const mcpResponse = {
        result: {
          content: [
            {
              type: "text",
              text: `Изображение успешно сгенерировано! Ссылка: ${imageUrl}`
            }
          ]
        }
      };

      // Отправляем данные в поток в формате, который ожидает шлюз GigaCowork
      res.write(`data: ${JSON.stringify(mcpResponse)}\n\n`);
      res.end(); // Сразу мягко закрываем соединение, чтобы Vercel не выдал ошибку 500
      return;
    } catch (error) {
      const errorResponse = { result: { content: [{ type: "text", text: `Ошибка: ${error.message}` }] } };
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
      return;
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
