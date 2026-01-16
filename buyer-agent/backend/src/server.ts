import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { SingleAgentChatService } from './services/single-agent-chat.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002');
const SELLER_URL = process.env.SELLER_URL || 'http://localhost:3001';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    seller_url: SELLER_URL,
    ollama_host: OLLAMA_HOST,
    ollama_model: OLLAMA_MODEL,
  });
});

app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    seller_url: SELLER_URL,
    websocket_url: `ws://localhost:${PORT}`,
    ai_enabled: true,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const chatService = new SingleAgentChatService();

wss.on('connection', (ws) => {
  chatService.handleConnection(ws, SELLER_URL);
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     UCP AI Buyer Agent - Backend Running              ║
╠════════════════════════════════════════════════════════╣
║  Port:          ${PORT}                                  ║
║  Health Check:  http://localhost:${PORT}/health            ║
║  WebSocket:     ws://localhost:${PORT}                     ║
║  Seller URL:    ${SELLER_URL}                    ║
║  Ollama Host:   ${OLLAMA_HOST}              ║
║  Ollama Model:  ${OLLAMA_MODEL}                         ║
╠════════════════════════════════════════════════════════╣
║  🤖 Single Agent: Qwen2.5 with Native Tools        ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
