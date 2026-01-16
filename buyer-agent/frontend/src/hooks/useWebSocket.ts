import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  type: 'user' | 'agent' | 'error' | 'system';
  content: string;
  timestamp?: string;
}

interface UseWebSocketReturn {
  messages: Message[];
  sendMessage: (message: string) => void;
  isConnected: boolean;
  error: string | null;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple connections
    if (connectingRef.current || wsRef.current) {
      return;
    }

    const connect = () => {
      if (connectingRef.current) return;

      connectingRef.current = true;

      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
          connectingRef.current = false;
        };

        ws.onmessage = (event) => {
          try {
            const message: Message = JSON.parse(event.data);
            setMessages((prev) => [...prev, message]);
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('Connection error');
          connectingRef.current = false;
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          wsRef.current = null;
          connectingRef.current = false;

          // Only reconnect if component is still mounted
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('Failed to connect:', err);
        setError('Failed to connect to server');
        connectingRef.current = false;
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      connectingRef.current = false;
    };
  }, [url]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
      setMessages((prev) => [
        ...prev,
        {
          type: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setError('Not connected to server');
    }
  }, []);

  return {
    messages,
    sendMessage,
    isConnected,
    error,
  };
}
