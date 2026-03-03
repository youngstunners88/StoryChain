import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '../lib/api';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  channel: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  channel,
  onMessage,
  onConnect,
  onDisconnect,
  autoConnect = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const token = api.getToken();
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws').replace('/api/ws', '');
    const ws = new WebSocket(`${wsUrl}/api/ws/${channel}`);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      
      // Authenticate with token
      if (token) {
        ws.send(JSON.stringify({ type: 'auth', token }));
      }
      
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage?.(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (event) => {
      setError('WebSocket error');
      console.error('WebSocket error:', event);
    };

    ws.onclose = () => {
      setIsConnected(false);
      onDisconnect?.();
      
      // Attempt to reconnect after 3 seconds
      if (autoConnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    wsRef.current = ws;
  }, [channel, onMessage, onConnect, onDisconnect, autoConnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendChat = useCallback((content: string, metadata: Partial<WebSocketMessage> = {}) => {
    send({
      type: 'chat',
      content,
      ...metadata,
    });
  }, [send]);

  const broadcastPingUpdate = useCallback((ping: any) => {
    send({
      type: 'ping_update',
      ping,
    });
  }, [send]);

  const broadcastRankStatusUpdate = useCallback((status: any) => {
    send({
      type: 'rank_status_update',
      status,
    });
  }, [send]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send,
    sendChat,
    broadcastPingUpdate,
    broadcastRankStatusUpdate,
  };
}
