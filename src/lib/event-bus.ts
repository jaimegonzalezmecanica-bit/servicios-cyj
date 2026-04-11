// Server-Sent Events (SSE) Event Bus
// Broadcasts real-time events to ALL connected devices
// When SOS is activated or an alert is created, ALL connected clients get notified instantly

type EventCallback = (data: any) => void;

interface EventClient {
  id: string;
  send: EventCallback;
  lastPing: number;
}

class EventBus {
  private clients: Map<string, EventClient> = new Map();
  private maxClients = 500;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up dead connections every 30 seconds
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    }
  }

  /**
   * Register a new SSE client connection
   * Returns an ID that can be used to unregister
   */
  register(send: EventCallback): string {
    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.clients.set(id, { id, send, lastPing: Date.now() });

    console.log(`[EventBus] Client connected: ${id} (total: ${this.clients.size})`);
    return id;
  }

  /**
   * Unregister a client (on disconnect)
   */
  unregister(id: string): void {
    this.clients.delete(id);
    console.log(`[EventBus] Client disconnected: ${id} (total: ${this.clients.size})`);
  }

  /**
   * Broadcast an event to ALL connected clients
   * Used when SOS is activated or a new alert is created
   */
  broadcast(eventType: string, data: any): void {
    const payload = JSON.stringify({ type: eventType, data, timestamp: Date.now() });
    let sent = 0;

    this.clients.forEach((client, id) => {
      try {
        client.send(payload);
        client.lastPing = Date.now();
        sent++;
      } catch (error) {
        // Client likely disconnected - remove it
        console.log(`[EventBus] Removing dead client: ${id}`);
        this.clients.delete(id);
      }
    });

    console.log(`[EventBus] Broadcast "${eventType}" to ${sent}/${this.clients.size} clients`);
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Clean up stale connections (no activity for 2+ minutes)
   */
  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    this.clients.forEach((client, id) => {
      if (now - client.lastPing > staleThreshold) {
        console.log(`[EventBus] Cleaning stale client: ${id}`);
        this.clients.delete(id);
      }
    });
  }
}

// Singleton instance — shared across all API routes in the server process
export const eventBus = new EventBus();
