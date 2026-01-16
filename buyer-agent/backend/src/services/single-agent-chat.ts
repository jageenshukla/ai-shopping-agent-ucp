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

const SYSTEM_PROMPT = `You are HomeMaker AI, a proactive home assistant that helps manage household tasks and chores. You assist with grocery management, household inventory tracking, and ordering supplies on behalf of the household. You already know your household member (Alice, alice@email.com) and their preferences.

YOUR ROLE:
- Act as a home assistant managing household chores and tasks
- Help discover and order groceries from FreshMart Groceries on behalf of the household
- Be friendly, proactive, and efficient in managing home needs

WORKFLOW:
1. When user wants to see products → use list_products tool to get all available items with their SKUs
2. When user wants to search for specific items → use search_products tool with the PRODUCT NAME (not SKU)
3. When user wants to order a product you already listed → directly use create_checkout with the SKU(s) you remember
4. After checkout created → ask user to confirm the order
5. When user confirms → use complete_purchase

BUYER INFORMATION (pre-configured):
- Name: Alice
- Email: alice@email.com

IMPORTANT:
- NEVER ask for email or name - you already have it
- When searching, use product NAMES (e.g., "yogurt", "milk") not SKUs
- REMEMBER product SKUs from list_products results - use them directly for create_checkout
- If user mentions a product you just showed them, use the SKU from memory instead of searching again
- Use the exact SKU values returned from the product list (e.g., milk_whole_1gal, yogurt_greek_32oz)
- Keep responses SHORT and friendly (1-2 sentences)
- Be proactive in helping with household grocery needs`;

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
      description: 'Create a checkout session for the household. Buyer info (Alice, alice@email.com) is pre-configured.',
      parameters: {
        type: 'object',
        properties: {
          skus: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of product SKUs to purchase',
          },
        },
        required: ['skus'],
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

    // Send greeting
    this.sendMessage(ws, {
      type: 'agent',
      content: `Good morning! 🏠 I'm HomeMaker AI, your home assistant for managing household chores and groceries.\n\nI can help you:\n• Browse available groceries from FreshMart\n• Search for specific items\n• Place orders on your behalf\n\nHow can I assist you today?`,
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
          return await this.toolCreateCheckout(session, args.skus);

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
    skus: string[]
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
      email: 'alice@email.com',
      name: 'Alice'
    };
    // Map each SKU to a line item with quantity 1
    session.selectedProducts = skus.map(sku => ({ sku, quantity: 1 }));

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
