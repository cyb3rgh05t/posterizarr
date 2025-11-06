import { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebSocket Hook for real-time status updates (like Sonarr!)
 * Replaces polling for better performance and instant updates
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Fallback to polling if WebSocket fails
 * - Connection state management
 * - Automatic cleanup
 */
export function useWebSocket(url, options = {}) {
  const {
    onMessage = () => {},
    onError = () => {},
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    maxReconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected"); // 'disconnected' | 'connecting' | 'connected' | 'failed'

  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef(null);
  const shouldReconnect = useRef(true);
  const currentReconnectInterval = useRef(reconnectInterval);

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (
      ws.current?.readyState === WebSocket.OPEN ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      return; // Already connected or connecting
    }

    setConnectionState("connecting");
    console.log("🔌 WebSocket: Connecting to", url);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("✅ WebSocket: Connected");
        setIsConnected(true);
        setConnectionState("connected");
        reconnectAttempts.current = 0;
        currentReconnectInterval.current = reconnectInterval;
      };

      ws.current.onmessage = (event) => {
        try {
          // Handle ping/pong
          if (event.data === "ping") {
            ws.current?.send("pong");
            return;
          }
          if (event.data === "pong") {
            return;
          }

          // Parse JSON message
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };

      ws.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setConnectionState("failed");
        onError(error);
      };

      ws.current.onclose = () => {
        console.log("🔌 WebSocket: Disconnected");
        setIsConnected(false);
        setConnectionState("disconnected");

        // Attempt reconnect if enabled
        if (
          shouldReconnect.current &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current++;

          console.log(
            `🔄 WebSocket: Reconnecting in ${currentReconnectInterval.current}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, currentReconnectInterval.current);

          // Exponential backoff
          currentReconnectInterval.current = Math.min(
            currentReconnectInterval.current * reconnectDecay,
            maxReconnectInterval
          );
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error(
            "⛔ WebSocket: Max reconnect attempts reached. Giving up."
          );
          setConnectionState("failed");
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionState("failed");
      onError(error);
    }
  }, [
    url,
    onMessage,
    onError,
    reconnectInterval,
    maxReconnectInterval,
    reconnectDecay,
    maxReconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;

    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionState("disconnected");
  }, []);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(typeof data === "string" ? data : JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Cannot send:", data);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    // Cleanup on unmount
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Only reconnect if URL changes

  return {
    isConnected,
    connectionState,
    send,
    reconnect: connect,
    disconnect,
  };
}
