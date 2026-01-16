# UCP AI Buyer Agent

An intelligent AI shopping agent for the Universal Commerce Protocol (UCP), powered by local Ollama with Qwen2.5.

## Overview

This buyer agent uses:
- **Single-Agent Architecture** with Qwen2.5:7b
- **Direct Ollama API** integration (no framework overhead)
- **Native tool calling** for intelligent UCP operation selection
- **WebSocket** for real-time chat interface
- **React + TypeScript** for modern web UI

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                       │
│  - Chat UI with WebSocket connection                   │
│  - Product card display                                │
│  - Message styling and formatting                      │
└──────────────────┬────────────────────────────────────┘
                   │ WebSocket
┌──────────────────▼────────────────────────────────────┐
│          Backend (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────┐    │
│  │   SingleAgentChatService                     │    │
│  │   • Manages WebSocket connections            │    │
│  │   • Maintains conversation history           │    │
│  │   • Orchestrates AI + tool execution         │    │
│  └──────────┬───────────────────────────────────┘    │
│             │                                         │
│  ┌──────────▼───────────────────────────────────┐    │
│  │   OllamaProvider (Direct API)                │    │
│  │   • Native Ollama tool calling               │    │
│  │   • Full conversation context                │    │
│  └──────────┬───────────────────────────────────┘    │
│             │                                         │
│  ┌──────────▼───────────────────────────────────┐    │
│  │         UCP Client Tools                     │    │
│  │  • list_products()                           │    │
│  │  • search_products(query)                    │    │
│  │  • create_checkout(sku, email, name)         │    │
│  │  • complete_purchase()                       │    │
│  └──────────┬───────────────────────────────────┘    │
└─────────────┼─────────────────────────────────────────┘
              │ HTTP/UCP
┌─────────────▼─────────────────────────────────────────┐
│          Seller Platform (UCP API)                    │
│  - Product catalog                                    │
│  - Checkout sessions                                  │
│  - AP2 mandate validation                             │
└───────────────────────────────────────────────────────┘
```

## Why Single-Agent Architecture?

We evolved through multiple architectures before settling on single-agent:

| Architecture | Pros | Cons | Result |
|--------------|------|------|--------|
| Pattern Matching | Simple | No intelligence | ❌ Abandoned |
| XML Tool Tags | Custom format | Fragile parsing | ❌ Abandoned |
| Two-Agent System | Specialized roles | Router lacks context | ❌ Abandoned |
| **Single-Agent** | Full context, intelligent | Slightly higher latency | ✅ **Current** |

See `/ARCHITECTURE.md` and `/TROUBLESHOOTING.md` for detailed explanation.

## Prerequisites

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from https://ollama.com/download

### 2. Pull the Qwen2.5 Model

```bash
ollama pull qwen2.5:7b
```

Model size: ~4.7GB
RAM requirement: ~6GB

### 3. Start Ollama Server

```bash
ollama serve
```

Ollama will run on `http://localhost:11434`

## Installation

### Backend Setup

```bash
cd buyer-agent/backend
npm install
```

Create `.env`:
```bash
PORT=3002
SELLER_URL=http://localhost:3001
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### Frontend Setup

```bash
cd buyer-agent/frontend
npm install
```

## Running the System

You need **4 services** running simultaneously:

### Terminal 1: Ollama
```bash
ollama serve
```

### Terminal 2: Seller Platform
```bash
cd seller-platform
npm run dev
# Runs on http://localhost:3001
```

### Terminal 3: Buyer Agent Backend
```bash
cd buyer-agent/backend
npm run dev
# Runs on http://localhost:3002
```

### Terminal 4: Buyer Agent Frontend
```bash
cd buyer-agent/frontend
npm run dev
# Runs on http://localhost:5173
```

Then open **http://localhost:5173** in your browser!

## Usage Examples

### Example 1: Browse Products
```
You: show me all products
AI: [Calls list_products tool]
    [Displays 5 product cards]
    Here are the products!
```

### Example 2: Search Products
```
You: I'm looking for a coffee maker
AI: [Calls search_products tool with query="coffee maker"]
    [Shows matching products]
    Found these coffee makers!
```

### Example 3: Complete Purchase
```
You: I want to buy KETTLE-001
AI: Great choice! Could you provide your email and name?

You: my email is john@example.com and my name is John Doe
AI: [Calls create_checkout tool]
    [Shows order summary]
    Ready to confirm your purchase?

You: yes
AI: [Calls complete_purchase tool]
    [Generates AP2 mandate]
    Purchase complete! Order ID: abc-123
```

## How the AI Agent Works

### 1. Intelligent Tool Calling

The AI doesn't use pattern matching. Instead:

1. **Full Context**: Sees entire conversation history
2. **Intent Understanding**: Understands references like "yes", "that one", "buy it"
3. **Smart Decision**: Decides if tool is needed and which one
4. **Natural Response**: Generates contextual response after tool execution

### 2. Conversation Flow

```
User Message
    ↓
Add to History
    ↓
Call Ollama with History + Tools
    ↓
AI Decision: Tool Needed?
    ↓
├─ YES → Execute Tool → Add Result → Generate Response
└─ NO → Direct Response
    ↓
Clean & Send to User
```

### 3. Tool Definitions

```typescript
list_products      → Get all products
search_products    → Search by keyword (requires: query)
create_checkout    → Create order (requires: sku, email, name)
complete_purchase  → Finalize order
```

## Project Structure

```
buyer-agent/
├── README.md              ← You are here
├── IMPLEMENTATION.md      ← Implementation details
│
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   │   └── ollama-provider.ts    # Direct Ollama API client
│   │   ├── services/
│   │   │   └── single-agent-chat.ts  # Main chat service
│   │   ├── ucp/
│   │   │   ├── discovery.ts          # UCP discovery
│   │   │   ├── products.ts           # Products client
│   │   │   └── checkout.ts           # Checkout client
│   │   ├── ap2/
│   │   │   └── generator.ts          # AP2 mandate
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   └── server.ts                 # Express + WebSocket
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ChatInterface.tsx     # Chat UI
    │   ├── hooks/
    │   │   └── useWebSocket.ts       # WebSocket hook
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## Configuration

### Backend .env

```bash
PORT=3002                              # Backend port
SELLER_URL=http://localhost:3001      # Seller platform
OLLAMA_HOST=http://localhost:11434    # Ollama server
OLLAMA_MODEL=qwen2.5:7b               # AI model
```

### Using Different Models

```bash
# Pull a different model
ollama pull llama3.2

# Update .env
OLLAMA_MODEL=llama3.2

# Restart backend
```

**Recommended models:**
- `qwen2.5:7b` - Best for tool calling (current)
- `llama3.2` - Smaller, faster, less accurate
- `mistral` - Good general purpose
- `mixtral` - More capable, slower

## Troubleshooting

### Ollama Issues

```bash
# Check if running
curl http://localhost:11434/api/version

# Check available models
ollama list

# Test model
ollama run qwen2.5:7b "hello"
```

### WebSocket Connection Failed

- Ensure backend is running on port 3002
- Check seller platform is on port 3001
- Verify `.env` configuration
- Check browser console for errors

### Slow AI Response

- **First response**: 5-10s (model loading)
- **Subsequent responses**: 2-4s
- Model requires ~6GB RAM
- CPU inference is slower than GPU

### Products Not Showing

- Check browser console for errors
- Verify seller platform is running
- Check network tab for API calls
- Ensure products exist in seller database

### Wrong Tool Called

This should not happen with single-agent architecture. If it does:
1. Check conversation history is being maintained
2. Verify system prompt is loaded
3. Check Ollama version supports tool calling
4. Try different temperature (lower = more consistent)

## Advanced Topics

### Custom System Prompt

Edit `backend/src/services/single-agent-chat.ts:30-45` to customize AI behavior:

```typescript
const SYSTEM_PROMPT = `You are a helpful UCP shopping agent...`;
```

### Adding New Tools

1. Define tool in `UCP_TOOLS` array
2. Add case in `executeTool()` method
3. Implement tool function
4. Update system prompt with usage guidelines

### Multi-User Support

Current implementation: Single-session per server

To add multi-user:
1. Use session IDs
2. Map sessions to users
3. Add authentication
4. Isolate conversation histories

### Production Deployment

Considerations:
- Use PostgreSQL instead of in-memory store
- Add Redis for session management
- Implement rate limiting
- Add authentication/authorization
- Use HTTPS and WSS
- Scale Ollama horizontally
- Add logging and monitoring

## Documentation

- **IMPLEMENTATION.md** - Detailed implementation guide
- **/ARCHITECTURE.md** - Technical architecture deep-dive
- **/TROUBLESHOOTING.md** - All errors and solutions
- **/PROJECT_SUMMARY.md** - Project overview

## Technologies

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Ollama (qwen2.5:7b) with native tool calling
- **Protocol**: Universal Commerce Protocol (UCP) + AP2
- **Communication**: WebSocket for real-time chat

## Performance

- **Model load time**: 5-10 seconds (first request)
- **Response time**: 2-4 seconds
- **Model size**: 4.7GB disk
- **RAM usage**: ~6GB
- **Concurrent users**: 1-3 (Ollama limitation)

## License

MIT

---

**Status**: Production-ready POC

**Model**: qwen2.5:7b with native tool calling

**Architecture**: Single-agent with full context

**Ready for**: Demonstration and further development
