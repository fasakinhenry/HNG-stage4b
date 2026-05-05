import type { ConversationMessage, MessagePayload } from '../types/messaging';
import { getApiBaseUrl } from '../lib/api';

interface WebSocketMessage {
  type: 'message' | 'message.new' | 'message.receive' | 'error' | 'ping' | 'pong' | 'message.send' | 'message.send.success' | 'message.send.error';
  event?: string;
  data?: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    payload: MessagePayload;
    delivered: boolean;
    created_at: string;
  };
  to?: string;
  payload?: MessagePayload;
  error?: string;
}

function toConversationMessage(data: WebSocketMessage['data']) {
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fromUserId: data.from_user_id,
    toUserId: data.to_user_id,
    payload: data.payload,
    delivered: data.delivered,
    createdAt: data.created_at
  } satisfies ConversationMessage;
}

interface WebSocketCallbacks {
  onMessage?: (message: ConversationMessage) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

function buildWebSocketCandidates(baseUrl: string, accessToken: string) {
  const encodedToken = encodeURIComponent(accessToken);

  try {
    const parsed = new URL(baseUrl);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    const origin = `${wsProtocol}//${parsed.host}`;
    const fullBase = `${wsProtocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}`;

    return [`${origin}/ws?token=${encodedToken}`, `${fullBase}/ws?token=${encodedToken}`];
  } catch {
    const wsUrl = baseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:').replace(/\/$/, '');
    return [`${wsUrl}/ws?token=${encodedToken}`];
  }
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionallyClosed = false;

  connect(accessToken: string, callbacks: WebSocketCallbacks = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.callbacks = callbacks;
        this.isIntentionallyClosed = false;

        const candidates = buildWebSocketCandidates(getApiBaseUrl(), accessToken);
        let index = 0;
        let settled = false;

        const connectNext = () => {
          if (index >= candidates.length) {
            const errorMsg = 'WebSocket connection failed';
            if (!settled) {
              settled = true;
              reject(new Error(errorMsg));
            }
            return;
          }

          const url = candidates[index++];
          this.ws = new WebSocket(url);

          this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.callbacks.onConnected?.();
            this.startPingInterval();
            if (!settled) {
              settled = true;
              resolve();
            }
          };

          this.ws.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          };

          this.ws.onerror = () => {
            // Browser websocket errors are intentionally opaque; rely on close and retry candidates.
          };

          this.ws.onclose = () => {
            this.stopPingInterval();
            this.callbacks.onDisconnected?.();

            if (!settled) {
              connectNext();
              return;
            }

            if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
              setTimeout(() => {
                this.connect(accessToken, callbacks).catch(() => {
                  this.callbacks.onError?.('Realtime unavailable. Using REST fallback.');
                });
              }, delay);
            }
          };
        };

        connectNext();
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    const messageType = message.type || message.event;

    switch (messageType) {
      case 'message':
      case 'message.new':
      case 'message.receive':
      case 'message.send.success': {
        const conversationMessage = toConversationMessage(message.data);
        if (conversationMessage) {
          this.callbacks.onMessage?.(conversationMessage);
        }
        break;
      }
      case 'pong':
        // Keep-alive pong, do nothing
        break;
      case 'error':
      case 'message.send.error':
        this.callbacks.onError?.(message.error ?? 'Unknown WebSocket error');
        break;
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  sendMessage(to: string, payload: MessagePayload): void {
    if (!this.isConnected()) {
      const error = 'WebSocket not connected';
      console.warn(error);
      this.callbacks.onError?.(error);
      return;
    }

    try {
      this.ws!.send(
        JSON.stringify({
          type: 'message.send',
          to,
          payload
        })
      );
    } catch (error) {
      console.error('Failed to send message via WebSocket:', error);
      this.callbacks.onError?.('Failed to send message');
    }
  }
}

export const websocketManager = new WebSocketManager();
