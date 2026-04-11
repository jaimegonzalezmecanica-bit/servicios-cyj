// API Client for Servicios CyJ - Connects to the REAL server
// All devices share the same database through the server API
// Falls back to localStorage ONLY if the server is completely unreachable

const SERVER_URL = typeof window !== "undefined"
  ? (window as any).__CYJ_SERVER_URL__ || ""
  : "";

// Detect if running inside native app (Capacitor)
function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (window as any).Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  } catch {
    return false;
  }
}

// Build full URL for API calls (adds server prefix when in native app)
function buildApiUrl(path: string): string {
  if (isNativePlatform() && SERVER_URL) {
    return `${SERVER_URL}${path}`;
  }
  return path; // In web/PWA mode, relative URLs work
}

// Track server availability for fallback
let _serverAvailable: boolean | null = null;

/**
 * Initialize API client
 * In native apps, sets up the connection to the backend server.
 * In web/PWA mode, calls go directly to the same-origin API routes.
 */
export function initApi(): void {
  if (typeof window === "undefined") return;

  // For native apps, verify server connectivity on startup
  if (isNativePlatform() && SERVER_URL) {
    console.log(`[API] Native mode - Server: ${SERVER_URL}`);
    checkServerHealth();
  } else if (isNativePlatform()) {
    console.warn("[API] Native mode but no server URL configured!");
  } else {
    console.log("[API] Web mode - using same-origin API routes");
    _serverAvailable = true;
  }
}

async function checkServerHealth(): Promise<void> {
  try {
    const response = await fetch(buildApiUrl("/api/alerts"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    _serverAvailable = response.ok;
    console.log(`[API] Server health check: ${_serverAvailable ? "OK" : "FAILED"}`);
  } catch {
    _serverAvailable = false;
    console.warn("[API] Server unreachable");
  }
}

/**
 * Enable online mode - all API calls go to the real server
 * This replaces the old offline-api.ts localStorage interceptor
 */
export function enableOfflineMode(): void {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

    // Only handle /api/* calls
    if (!url.startsWith("/api/") && !url.includes("/api/")) {
      return originalFetch(input, init);
    }

    // In native app, redirect to server
    if (isNativePlatform()) {
      const apiPath = url.includes("/api/") ? url.substring(url.indexOf("/api/")) : url;
      const fullUrl = buildApiUrl(apiPath);

      try {
        const response = await originalFetch(fullUrl, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
          },
        });

        if (response.ok) {
          _serverAvailable = true;
          return response;
        }

        // Server error - return the error response
        console.warn(`[API] Server returned ${response.status}`);
        _serverAvailable = true;
        return response;
      } catch (error) {
        console.error("[API] Failed to reach server:", error);
        _serverAvailable = false;
        return new Response(
          JSON.stringify({ success: false, error: "Sin conexión al servidor" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // In web mode, pass through to same-origin
    return originalFetch(input, init);
  };

  console.log("[API] Online mode enabled - all calls go to real server");
}

// Initialize seed data for standalone mode (legacy, kept for compatibility)
export function initOfflineData(): void {
  // No longer needed - data lives in the server database
  // This is a no-op to maintain compatibility with page.tsx imports
  if (typeof window === "undefined") return;
}

// Reset data (only works for server-side now)
export function resetOfflineData(): void {
  // No-op - data reset must be done through admin API
}
