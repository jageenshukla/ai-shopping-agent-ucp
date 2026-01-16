import { WebSocket } from 'ws';
import { UCPCheckoutClient } from '../ucp/checkout.js';
import { UCPProductsClient } from '../ucp/products.js';
import { discoverMerchant } from '../ucp/discovery.js';
import { generateCartMandate, generatePaymentCredential } from '../ap2/generator.js';
import { Product, BuyerInfo, CheckoutSession } from '../types/index.js';
import { OllamaProvider, Message, Tool } from '../agent/ollama-provider.js';

interface ChatMessage {
  type: 'user' | 'agent' | 'products' | 'error' | 'checkout' | 'confirmation' | 'system';
  content?: string;
  products?: Product[];
  session?: CheckoutSession;
  orderId?: string;
}

interface ChatSession {
  ws: WebSocket;
  merchantUrl: string;
  checkoutClient?: UCPCheckoutClient;
  productsClient?: UCPProductsClient;
  currentSession?: CheckoutSession;
  buyerInfo?: BuyerInfo;
  selectedProducts?: Array<{ sku: string; quantity: number }>;
  merchantId?: string;
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  discoveredProducts?: Product[];
}

const SYSTEM_PROMPT = `You are HomeMaker AI, a proactive home grocery management assistant for the household. You already know your household member (John Smith, john.smith@email.com) and their preferences.

YOUR ROLE:
- Monitor household grocery inventory and suggest items running low
- Help order groceries from FreshMart Groceries on behalf of the household
- Be friendly, proactive, and efficient

INITIAL GREETING (when chat opens):
"Good morning! I've checked our grocery inventory and noticed we're running low on a few items:
- Whole Milk (only 2 left)
- Coffee Beans (only 1 left)
- Red Wine (only 3 bottles)
- Bread (only 4 loaves)
- Cheddar Cheese (only 2 packs)

Would you like me to order these items from FreshMart Groceries?"

WORKFLOW:
1. Start conversations by listing low-stock items proactively
2. When user agrees to order → use create_checkout with pre-filled buyer info
3. After checkout created → ask user to confirm the order
4. When user confirms → use complete_purchase

BUYER INFORMATION (pre-configured):
- Name: John Smith
- Email: john.smith@email.com

IMPORTANT:
- NEVER ask for email or name - you already have it
- Keep responses SHORT and friendly (1-2 sentences)
- Be proactive about suggesting replenishment
- Track what the user wants to buy and guide them efficiently`;

// UCP Tools for Qwen2.5
const UCP_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'list_products',
      description: 'Get all available products from the merchant',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products by keyword',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword (e.g., "coffee", "mug")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_checkout',
      description: 'Create a checkout session for the household. Buyer info (John Smith, john.smith@email.com) is pre-configured.',
      parameters: {
        type: 'object',
        properties: {
          sku: {
            type: 'string',
            description: 'Product SKU to purchase',
          },
        },
        required: ['sku'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_purchase',
      description: 'Complete the purchase after checkout is created',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

export class SingleAgentChatService {
  private sessions: Map<WebSocket, ChatSession> = new Map();
  private agent: OllamaProvider;

  constructor() {
    // Single Qwen2.5 agent handles everything
    this.agent = new OllamaProvider({
      baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      temperature: 0.7,
      maxTokens: 500,
    });

    console.log('[SINGLE-AGENT] Chat service initialized');
    console.log('[SINGLE-AGENT] Model:', process.env.OLLAMA_MODEL || 'qwen2.5:7b');
  }

  handleConnection(ws: WebSocket, merchantUrl: string) {
    console.log('[SINGLE-AGENT] New WebSocket connection');

    const session: ChatSession = {
      ws,
      merchantUrl,
      conversationHistory: [{ role: 'system', content: SYSTEM_PROMPT }],
    };

    this.sessions.set(ws, session);

    // Send proactive greeting with low-stock items
    this.sendMessage(ws, {
      type: 'agent',
      content: `Good morning! 🏠 I'm HomeMaker AI, your household grocery assistant.\n\nI've checked our inventory at FreshMart Groceries and noticed we're running low on:\n\n• Whole Milk (only 2 left)\n• Coffee Beans (only 1 left)\n• Red Wine (only 3 bottles)\n• Bread (only 4 loaves)\n• Cheddar Cheese (only 2 packs)\n\nWould you like me to order these items for you?`,
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message = data.toString();
        console.log('[SINGLE-AGENT] Received:', message);
        await this.handleMessage(ws, message);
      } catch (error: any) {
        console.error('[SINGLE-AGENT] Error:', error);
        this.sendMessage(ws, {
          type: 'error',
          content: `Error: ${error.message}`,
        });
      }
    });

    ws.on('close', () => {
      console.log('[SINGLE-AGENT] Connection closed');
      this.sessions.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[SINGLE-AGENT] WebSocket error:', error);
      this.sessions.delete(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: string) {
    const session = this.sessions.get(ws);
    if (!session) return;

    session.conversationHistory.push({
      role: 'user',
      content: message,
    });

    this.sendMessage(ws, {
      type: 'system',
      content: 'Thinking...',
    });

    // Call Qwen with tool support
    const messages: Message[] = session.conversationHistory.map(entry => ({
      role: entry.role,
      content: entry.content,
    }));

    const response = await this.agent.chat(messages, UCP_TOOLS);

    // Check if tool was called
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const toolCall = response.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;

      console.log('[SINGLE-AGENT] Tool call:', toolName, toolArgs);

      // Execute tool
      const toolResult = await this.executeTool(session, toolName, toolArgs);

      // Check if tool execution resulted in an error
      if (toolResult && toolResult.error) {
        // Send error message directly to user
        this.sendMessage(session.ws, {
          type: 'error',
          content: `❌ Error: ${toolResult.error}`,
        });

        session.conversationHistory.push({
          role: 'assistant',
          content: `I encountered an error: ${toolResult.error}`,
        });
        return;
      }

      // Add tool execution context for AI to respond
      let hint = '';
      if (toolName === 'list_products' || toolName === 'search_products') {
        hint = 'Products are displayed as cards. Just say something brief like "Here are the products!"';
      } else if (toolName === 'create_checkout') {
        hint = 'Checkout created. Ask user to confirm.';
      } else if (toolName === 'complete_purchase') {
        hint = 'Purchase complete! Congratulate them briefly.';
      }

      session.conversationHistory.push({
        role: 'user',
        content: `[SYSTEM: Tool "${toolName}" completed. ${hint}]\nResult: ${JSON.stringify(toolResult)}`,
      });

      // Get conversational response
      const finalMessages: Message[] = session.conversationHistory.map(entry => ({
        role: entry.role,
        content: entry.content,
      }));

      const finalResponse = await this.agent.chat(finalMessages);
      const responseText = finalResponse.message.content;

      // Clean up system messages from AI response
      const cleanedResponse = responseText
        .replace(/\[Tool:.*?\]/g, '')
        .replace(/\[SYSTEM:.*?\]/g, '')
        .trim();

      session.conversationHistory.push({
        role: 'assistant',
        content: cleanedResponse,
      });

      this.sendMessage(ws, {
        type: 'agent',
        content: cleanedResponse,
      });
    } else {
      // No tool call - direct conversation
      const responseText = response.message.content;

      session.conversationHistory.push({
        role: 'assistant',
        content: responseText,
      });

      this.sendMessage(ws, {
        type: 'agent',
        content: responseText,
      });
    }
  }

  private async executeTool(session: ChatSession, toolName: string, args: any): Promise<any> {
    try {
      switch (toolName) {
        case 'list_products':
          return await this.toolListProducts(session);

        case 'search_products':
          return await this.toolSearchProducts(session, args.query);

        case 'create_checkout':
          return await this.toolCreateCheckout(session, args.sku);

        case 'complete_purchase':
          return await this.toolCompletePurchase(session);

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  private async toolListProducts(session: ChatSession): Promise<any> {
    if (!session.productsClient) {
      await discoverMerchant(session.merchantUrl);
      // Use merchant URL as ID since UCP spec doesn't define merchant.id
      session.merchantId = session.merchantUrl;
      session.productsClient = new UCPProductsClient(session.merchantUrl);
      session.checkoutClient = new UCPCheckoutClient(session.merchantUrl);
    }

    const products = await session.productsClient!.listProducts();
    session.discoveredProducts = products;

    this.sendMessage(session.ws, {
      type: 'products',
      content: `Found ${products.length} products:`,
      products,
    });

    return {
      count: products.length,
      products: products.map(p => ({ sku: p.sku, name: p.name, price: p.price })),
    };
  }

  private async toolSearchProducts(session: ChatSession, query: string): Promise<any> {
    if (!session.productsClient) {
      await discoverMerchant(session.merchantUrl);
      // Use merchant URL as ID since UCP spec doesn't define merchant.id
      session.merchantId = session.merchantUrl;
      session.productsClient = new UCPProductsClient(session.merchantUrl);
      session.checkoutClient = new UCPCheckoutClient(session.merchantUrl);
    }

    const allProducts = await session.productsClient!.listProducts();
    const results = session.productsClient!.searchProducts(allProducts, query);
    session.discoveredProducts = results;

    this.sendMessage(session.ws, {
      type: 'products',
      content: `Found ${results.length} matching products:`,
      products: results,
    });

    return {
      count: results.length,
      products: results.map(p => ({ sku: p.sku, name: p.name, price: p.price })),
    };
  }

  private async toolCreateCheckout(
    session: ChatSession,
    sku: string
  ): Promise<any> {
    if (!session.checkoutClient) {
      await discoverMerchant(session.merchantUrl);
      // Use merchant URL as ID since UCP spec doesn't define merchant.id
      session.merchantId = session.merchantUrl;
      session.productsClient = new UCPProductsClient(session.merchantUrl);
      session.checkoutClient = new UCPCheckoutClient(session.merchantUrl);
    }

    // Use pre-configured household buyer info
    session.buyerInfo = {
      email: 'john.smith@email.com',
      name: 'John Smith'
    };
    session.selectedProducts = [{ sku, quantity: 1 }];

    const checkoutSession = await session.checkoutClient!.createSession(session.selectedProducts);
    await session.checkoutClient!.updateSession(checkoutSession.id, session.buyerInfo);

    session.currentSession = checkoutSession;

    this.sendMessage(session.ws, {
      type: 'checkout',
      content: `Order Summary:\n${checkoutSession.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}\nTotal: $${(checkoutSession.total_amount / 100).toFixed(2)}`,
      session: checkoutSession,
    });

    return {
      session_id: checkoutSession.id,
      total: checkoutSession.total_amount,
      items: checkoutSession.items,
    };
  }

  private async toolCompletePurchase(session: ChatSession): Promise<any> {
    if (!session.currentSession || !session.checkoutClient || !session.merchantId) {
      throw new Error('No active checkout session');
    }

    const ap2Mandate = generateCartMandate(
      session.merchantId,
      session.currentSession.id,
      session.currentSession.items,
      session.currentSession.total_amount,
      session.currentSession.currency
    );

    const paymentCredential = generatePaymentCredential();

    const result = await session.checkoutClient.completeCheckout(
      session.currentSession.id,
      ap2Mandate,
      paymentCredential
    );

    this.sendMessage(session.ws, {
      type: 'confirmation',
      content: `✅ Purchase Complete!\nOrder ID: ${result.order_id}`,
      orderId: result.order_id,
    });

    session.currentSession = undefined;
    session.selectedProducts = undefined;

    return {
      order_id: result.order_id,
      status: result.status,
    };
  }

  private sendMessage(ws: WebSocket, message: ChatMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
