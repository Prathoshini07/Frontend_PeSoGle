import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Constants from 'expo-constants';

export interface WebSocketMessage {
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  text: string;
  timestamp: string;    
  _id: string;
  read: boolean;
}

export function useChatWebSocket(userId: string | undefined) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const getWsBaseUrl = useCallback(() => {
    const apiBase = process.env.EXPO_PUBLIC_API_URL;
    if (apiBase) {
      // Turn http(s)://host:port into ws(s)://host:port
      return apiBase.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
    }

    const debuggerHost = Constants.expoConfig?.hostUri || Constants.experienceId;
    const address = debuggerHost?.split(':')[0] || 'localhost';
    return `ws://${address}:8081`;
  }, []);

  const connect = useCallback(() => {
    if (!userId || !token) return;

    // Avoid creating multiple sockets
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Gateway routes by service name; configure if your gateway uses a different prefix.
    // Example docs: http://localhost:8081/chat-service/docs
    // WS: ws://localhost:8081/chat-service/api/v1/ws/<userId>?token=...
    const CHAT_SERVICE_PATH = process.env.EXPO_PUBLIC_CHAT_SERVICE_PATH ?? '/chat';
    const wsBaseUrl = getWsBaseUrl();
    const wsUrl = `${wsBaseUrl}${CHAT_SERVICE_PATH}/api/v1/ws/${userId}?token=${encodeURIComponent(token)}`;
    
    console.log('[WebSocket] Connecting to:', wsUrl);
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received message:', data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error('[WebSocket] Error parsing message:', e);
      }
    };

    ws.current.onerror = (e) => {
      console.error('[WebSocket] Error:', e);
    };

    ws.current.onclose = (e) => {
      console.log('[WebSocket] Closed:', e.code, e.reason);
      setIsConnected(false);
      // Reconnect after a delay
      setTimeout(connect, 3000);
    };
  }, [userId, token, getWsBaseUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((chatId: string, text: string) => {
    if (ws.current && isConnected) {
      console.log('[WebSocket] Sending message:', { chat_id: chatId, text });
      ws.current.send(JSON.stringify({ chat_id: chatId, text }));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }, [isConnected]);

  return { messages, isConnected, sendMessage };
}
