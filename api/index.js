import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Инициализируем сервер MCP
const mcpServer = new Server(
  { name: 'pollinations-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Список доступных инструментов
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'generate_image',
    description: 'Генерирует изображение по текстовому описанию (промту) с помощью Pollinations.ai. Возвращает прямую ссылку на картинку.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Подробное описание того, что нужно нарисовать' }
      },
      required: ['prompt']
    }
  }]
}));

// Логика генерации ссылки Pollinations
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'generate_image') {
    const { prompt } = request.params.arguments ?? {};
    const sanitizedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://pollinations.ai{sanitizedPrompt}?width=1024&height=1024&seed=${seed}&model=flux`;

    return {
      content: [
        { type: 'text', text: `Изображение успешно сгенерировано! Ссылка: ${imageUrl}` }
      ]
    };
  }
  throw new Error('Инструмент не найден');
});

// Единый обработчик для всех запросов
export default async function handler(req, res) {
  // Настройка CORS-заголовков для интеграции с GigaCowork
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Ответ на предварительные CORS-запросы браузера/платформы
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Если GigaCowork проверяет доступность сервера через обычный GET-запрос
  if (req.method === 'GET') {
    return res.status(200).json({ status: "MCP Server is running via HTTP" });
  }

  // Если летит реальная задача на генерацию картинки через POST
  if (req.method === 'POST') {
    try {
      const response = await mcpServer.handleRequest(req.body);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
