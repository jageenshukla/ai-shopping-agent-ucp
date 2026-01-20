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
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white ml-auto border border-cyan-500/30 shadow-lg shadow-cyan-500/20';
      case 'agent':
        return 'bg-slate-800/80 text-cyan-50 border border-cyan-500/20 backdrop-blur-sm';
      case 'error':
        return 'bg-red-900/30 text-red-200 border border-red-500/50 shadow-lg shadow-red-500/10';
      case 'system':
        return 'bg-yellow-900/20 text-yellow-200 border border-yellow-500/30 text-sm italic';
      case 'checkout':
        return 'bg-emerald-900/30 text-emerald-100 border border-emerald-500/50 shadow-lg shadow-emerald-500/10';
      case 'confirmation':
        return 'bg-green-900/30 text-green-100 border border-green-500/50 shadow-lg shadow-green-500/10';
      case 'products':
        return 'bg-indigo-900/30 text-indigo-100 border border-indigo-500/30';
      default:
        return 'bg-slate-800/50 text-gray-100 border border-slate-600/30';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 scanline">
      <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-cyan-50 p-6 shadow-2xl border-b border-cyan-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),transparent)]"></div>
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-3xl font-bold mb-2 glow-text tracking-wider" style={{fontFamily: 'Orbitron'}}>
            🏠 HOMEMAKER AI
          </h1>
          <p className="text-cyan-300 text-sm flex items-center gap-2">
            <span className="font-mono">Home Assistant Protocol v1.0</span>
            <span className="text-cyan-500">|</span>
            <span className={isConnected ? 'text-green-400 pulse' : 'text-red-400'}>
              {isConnected ? '● ONLINE' : '● OFFLINE'}
            </span>
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 grid-bg">
        <div className="max-w-4xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-lg shadow-red-500/20 backdrop-blur-sm">
              <p className="font-semibold text-red-100">⚠️ CONNECTION ERROR</p>
              <p className="text-sm text-red-300">{error}</p>
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
                  <div className="text-xs font-bold mb-1 opacity-80 tracking-wider text-cyan-300" style={{fontFamily: 'Share Tech Mono'}}>
                    {message.type === 'agent' && '🤖 HOMEMAKER AI'}
                    {message.type === 'error' && '⚠️ SYSTEM ERROR'}
                    {message.type === 'checkout' && '🛒 ORDER PROCESSING'}
                    {message.type === 'confirmation' && '✅ CONFIRMED'}
                    {message.type === 'products' && '📦 CATALOG DATA'}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words font-light">{message.content}</div>

                {/* Display products if present */}
                {message.products && message.products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.products.map((product: any) => (
                      <div key={product.sku} className="bg-slate-900/60 p-3 rounded border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
                        <div className="font-semibold text-cyan-100">{product.name}</div>
                        <div className="text-sm text-slate-400">{product.description}</div>
                        <div className="mt-1 text-lg font-bold text-cyan-400">
                          ${product.price} {product.currency}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">SKU: {product.sku}</div>
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

      <footer className="bg-slate-900/95 border-t border-cyan-500/20 p-4 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isConnected
                ? '> Enter command... (e.g., "show me products" or "order groceries")'
                : '> System initializing...'
            }
            disabled={!isConnected}
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-cyan-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 disabled:bg-slate-900/50 disabled:cursor-not-allowed font-mono backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={!isConnected || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none"
            style={{fontFamily: 'Orbitron'}}
          >
            TRANSMIT
          </button>
        </form>
        <div className="max-w-4xl mx-auto mt-2 text-xs text-slate-500 text-center font-mono">
          <span className="text-cyan-500">◆</span> Universal Commerce Protocol v1.0 <span className="text-cyan-500">◆</span> Powered by Ollama AI
        </div>
      </footer>
    </div>
  );
}
