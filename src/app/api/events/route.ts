// Server-Sent Events (SSE) Endpoint
// All connected devices subscribe to this for real-time notifications
// Events: sos, alert, map-update, announcement

import { eventBus } from "@/lib/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Register this client
      const clientId = eventBus.register((data: any) => {
        try {
          const message = `event: cyj-notification\ndata: ${data}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream closed
          eventBus.unregister(clientId);
          controller.close();
        }
      });

      // Send initial connection confirmation
      const initMsg = `event: connected\ndata: ${JSON.stringify({
        type: "connected",
        clientId,
        message: "Conectado a Servicios CyJ en tiempo real",
        clientsConnected: eventBus.getClientCount(),
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMsg));

      // Send keepalive ping every 25 seconds to prevent connection timeout
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}\n\n`));
        } catch {
          clearInterval(pingInterval);
          eventBus.unregister(clientId);
        }
      }, 25000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        eventBus.unregister(clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
