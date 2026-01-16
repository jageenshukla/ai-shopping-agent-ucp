import axios from 'axios';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  function: {
    name: string;
    arguments: string | object;
  };
}

export interface ChatResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: ToolCall[];
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export class OllamaProvider {
  private baseUrl: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: {
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
  }) {
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
  }

  async chat(messages: Message[], tools?: Tool[]): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages,
          tools,
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens,
          },
        },
        { timeout: 60000 }
      );

      return response.data;
    } catch (error: any) {
      console.error(`[${this.model}] Chat error:`, error.message);
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  getModelInfo() {
    return {
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }
}
