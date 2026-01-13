export type WebSocketMessage = {
  type: string;
  payload: Record<string, unknown>;
};

export type User = {
  id: string;
  x: number;
  y: number;
  userId: string;
};

export type SpaceJoinedPayload = {
  spawn: { x: number; y: number };
  users: User[];
};

export type UserJoinPayload = {
  id: string;
  x: number;
  y: number;
  userId: string;
};

export type MovementPayload = {
  id: string;
  x: number;
  y: number;
};

export type UserLeftPayload = {
  id: string;
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(payload: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            this.emit(data.type, data.payload);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect(url);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      this.reconnectTimeout = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect(url);
      }, delay);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  joinSpace(spaceId: string, token: string) {
    this.send('join', { spaceId, token });
  }

  move(x: number, y: number) {
    this.send('move', { x, y });
  }

  on<T>(event: string, callback: (payload: T) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (payload: unknown) => void);
  }

  off(event: string, callback: (payload: unknown) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((callback) => callback(payload));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
export default wsService;
