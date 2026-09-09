import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const mcpServer = new Server(
  { name: 'pollinations-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

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

export default async function handler(req, res) {
  const transport = new SSEServerTransport('/mcp/message', res);
  await mcpServer.connect(transport);
}
