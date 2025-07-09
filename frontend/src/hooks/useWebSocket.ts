import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketHookOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onClose?: (event?: CloseEvent) => void;
  onOpen?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: WebSocketHookOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  const reconnectInterval = options.reconnectInterval ?? 3000;

  const setupHeartbeat = useCallback((ws: WebSocket) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000); // 15 seconds
  }, []);

  const connect = useCallback(() => {
    if (isConnected || isConnecting) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(options.url);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer'; // Important for audio data

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        setupHeartbeat(ws);
        options.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          // Handle both binary and text messages
          let message: WebSocketMessage;
          
          if (typeof event.data === 'string') {
            message = JSON.parse(event.data);
          } else {
            // For binary data, you might want to handle differently
            console.log('Received binary data');
            return;
          }
          
          if (message.type === 'pong') {
            // Heartbeat response
            return;
          }
          
          options.onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnecting(false);
        options.onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Cleanup
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        options.onClose?.(event);

        // Attempt to reconnect if not normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [options.url, options.onMessage, options.onError, options.onClose, options.onOpen, maxReconnectAttempts, reconnectInterval, isConnected, isConnecting, setupHeartbeat]);

  const disconnect = useCallback((code = 1000, reason?: string) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(code, reason);
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage | ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }

    try {
      if (message instanceof ArrayBuffer) {
        wsRef.current.send(message);
      } else {
        wsRef.current.send(JSON.stringify(message));
      }
      return true;
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect(1000, 'Component unmounted');
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    websocket: wsRef.current
  };
};