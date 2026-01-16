import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WEBSOCKET_URL = 'ws://localhost:3002';

export function ChatInterface() {
  const { messages, sendMessage, isConnected, error } = useWebSocket(WEBSOCKET_URL);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-500 text-white ml-auto';
      case 'agent':
        return 'bg-gray-200 text-gray-900';
      case 'error':
        return 'bg-red-100 text-red-900 border border-red-300';
      case 'system':
        return 'bg-yellow-50 text-yellow-900 border border-yellow-200 text-sm italic';
      case 'checkout':
        return 'bg-green-50 text-gray-900 border border-green-200';
      case 'confirmation':
        return 'bg-green-100 text-green-900 border border-green-300';
      case 'products':
        return 'bg-blue-50 text-gray-900 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">UCP AI Buyer Agent</h1>
          <p className="text-blue-100 text-sm">
            Powered by Genkit + Ollama | {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${getMessageStyle(
                  message.type
                )}`}
              >
                {message.type !== 'user' && message.type !== 'system' && (
                  <div className="text-xs font-semibold mb-1 opacity-70">
                    {message.type === 'agent' && '🤖 AI Agent'}
                    {message.type === 'error' && '⚠️ Error'}
                    {message.type === 'checkout' && '🛒 Checkout'}
                    {message.type === 'confirmation' && '✅ Confirmation'}
                    {message.type === 'products' && '📦 Products'}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{message.content}</div>

                {/* Display products if present */}
                {message.products && message.products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.products.map((product: any) => (
                      <div key={product.sku} className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.description}</div>
                        <div className="mt-1 text-lg font-bold text-blue-600">
                          ${product.price} {product.currency}
                        </div>
                        <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                      </div>
                    ))}
                  </div>
                )}

                {message.timestamp && (
                  <div className="text-xs opacity-50 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isConnected
                ? 'Type a message... (e.g., "show me products" or "buy a coffee maker")'
                : 'Connecting...'
            }
            disabled={!isConnected}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isConnected || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
        <div className="max-w-4xl mx-auto mt-2 text-xs text-gray-500 text-center">
          Powered by Firebase Genkit + Ollama | Universal Commerce Protocol Demo
        </div>
      </footer>
    </div>
  );
}
