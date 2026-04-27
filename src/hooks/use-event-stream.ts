"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { DomainEvent, DomainEventType } from "@/lib/events";

interface UseEventStreamOptions {
  cerId?: string;
  eventTypes?: DomainEventType[];
  onEvent?: (event: DomainEvent) => void;
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
}

interface EventStreamState {
  connected: boolean;
  lastEvent: DomainEvent | null;
  events: DomainEvent[];
  error: string | null;
  reconnectCount: number;
}

export function useEventStream(options: UseEventStreamOptions = {}) {
  const {
    cerId = "cer-bertinoro",
    eventTypes,
    onEvent,
    autoReconnect = true,
    reconnectDelayMs = 3000,
  } = options;

  const [state, setState] = useState<EventStreamState>({
    connected: false,
    lastEvent: null,
    events: [],
    error: null,
    reconnectCount: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/events?cerId=${encodeURIComponent(cerId)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState(prev => ({ ...prev, connected: true, error: null }));
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DomainEvent;

        // Filter by event types if specified
        if (eventTypes && !eventTypes.includes(data.type as DomainEventType)) {
          return;
        }

        setState(prev => ({
          ...prev,
          lastEvent: data,
          events: [...prev.events.slice(-99), data],
        }));

        onEventRef.current?.(data);
      } catch {
        // Ignore parse errors (e.g., heartbeat comments)
      }
    };

    es.onerror = () => {
      es.close();
      setState(prev => ({
        ...prev,
        connected: false,
        error: "Connessione persa",
      }));

      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            reconnectCount: prev.reconnectCount + 1,
          }));
          connect();
        }, reconnectDelayMs);
      }
    };
  }, [cerId, eventTypes, autoReconnect, reconnectDelayMs]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false }));
  }, []);

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [], lastEvent: null }));
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    disconnect,
    reconnect: connect,
    clearEvents,
  };
}
