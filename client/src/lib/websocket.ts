import { type BattleState } from "@shared/schema";

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Handle different environments (Replit, localhost, etc.)
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        let host = window.location.host;
        
        // Ensure host is valid
        if (!host || host === 'undefined') {
          host = 'localhost:5000';
        }
        
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('Attempting to connect to WebSocket:', wsUrl);
        console.log('Current location:', window.location);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to battle system');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket received:', data.type, data);
            this.emit(data.type, data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from battle system');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  startBattle(formation1: any, formation2: any): void {
    this.send({
      type: 'START_BATTLE',
      formation1,
      formation2
    });
  }

  joinBattle(battleId: string): void {
    this.send({
      type: 'JOIN_BATTLE',
      battleId
    });
  }
}

export const wsManager = new WebSocketManager();
