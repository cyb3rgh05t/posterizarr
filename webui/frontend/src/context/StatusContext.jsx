import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useWebSocket } from "../hooks/useWebSocket";

const StatusContext = createContext();

export function useStatus() {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useStatus must be used within StatusProvider");
  }
  return context;
}

export function StatusProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingInterval = useRef(null);
  const [usePolling, setUsePolling] = useState(false);
  const hasInitialized = useRef(false);

  // Determine WebSocket URL (ws:// or wss:// based on current protocol)
  // In development (Vite dev server on 3000), connect directly to backend on 8000
  // In production (served from backend), use current host
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const isDevelopment = window.location.port === "3000"; // Vite dev server
  const wsHost = isDevelopment ? "localhost:8000" : window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;

  // Prevent multiple WebSocket connections in Strict Mode
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    console.log(
      "📡 StatusProvider: Initializing WebSocket connection to",
      wsUrl
    );
  }, [wsUrl]);

  // WebSocket connection with fallback to polling
  const { isConnected, connectionState } = useWebSocket(wsUrl, {
    onMessage: (data) => {
      if (data.type === "status") {
        setStatus(data.data);
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("WebSocket error, falling back to polling:", error);
      setUsePolling(true);
    },
    maxReconnectAttempts: 5,
  });

  // Fallback: Traditional polling if WebSocket fails
  useEffect(() => {
    // Only start polling if WebSocket has actually failed AND is not currently connected
    if ((usePolling || connectionState === "failed") && !isConnected) {
      console.log("📡 Falling back to HTTP polling (WebSocket unavailable)");

      const pollStatus = async () => {
        try {
          const response = await fetch("/api/status");
          const data = await response.json();
          setStatus(data);
          setIsLoading(false);
        } catch (error) {
          console.error("Polling error:", error);
        }
      };

      // Initial fetch
      pollStatus();

      // Poll every 3 seconds (old behavior)
      pollingInterval.current = setInterval(pollStatus, 3000);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [usePolling, connectionState, isConnected]);

  // Stop polling when WebSocket connects
  useEffect(() => {
    if (isConnected) {
      // WebSocket connected - stop polling and disable polling flag
      if (pollingInterval.current) {
        console.log("✅ WebSocket connected, stopping polling");
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      setUsePolling(false); // Reset polling flag when WebSocket connects
    }
  }, [isConnected]);

  const value = {
    status,
    isLoading,
    isConnected,
    connectionState,
    transportMode: isConnected ? "websocket" : "polling",
  };

  return (
    <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
  );
}
