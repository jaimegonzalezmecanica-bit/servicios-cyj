// API Client for Servicios CyJ - Connects to the REAL server
// All devices share the same database through the server API
// Server URL is configurable from the app settings (Profile > Server Config)

// ─── SERVER URL RESOLUTION ───
// Priority: 1. User-configured URL (localStorage)  2. Baked-in URL (build time)  3. Same-origin (web)

function getServerUrl(): string {
  if (typeof window === "undefined") return "";

  // 1. Check if user configured a custom server URL in settings
  try {
    const customUrl = localStorage.getItem("cyj_server_url");
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, ""); // Remove trailing slashes
    }
  } catch { /* localStorage not available */ }

  // 2. Fall back to the URL baked at build time (NEXT_PUBLIC_SERVER_URL)
  return (window as any).__CYJ_SERVER_URL__ || "";
}

function setServerUrl(url: string): void {
  if (typeof window === "undefined") return;
  const cleaned = url.trim().replace(/\/+$/, "");
  if (cleaned) {
    localStorage.setItem("cyj_server_url", cleaned);
    console.log("[API] Server URL updated to:", cleaned);
  } else {
    localStorage.removeItem("cyj_server_url");
    console.log("[API] Server URL reset to default");
  }
  // Update the window variable too
  (window as any).__CYJ_SERVER_URL__ = getServerUrl();
}

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
  const url = getServerUrl();
  if (url) {
    return `${url}${path}`;
  }
  return path; // In web/PWA mode, relative URLs work
}

// Track server availability
let _serverAvailable: boolean | null = null;

export function isServerAvailable(): boolean {
  return _serverAvailable === true;
}

/**
 * Test connection to server URL
 * Returns { success, message }
 */
export async function testServerConnection(url?: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const testUrl = (url || getServerUrl()).trim().replace(/\/+$/, "");
  if (!testUrl) {
    return { success: false, message: "No hay URL configurada" };
  }

  const startTime = Date.now();
  try {
    const response = await fetch(`${testUrl}/api/alerts`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const alertCount = Array.isArray(data.alerts) ? data.alerts.length : (Array.isArray(data) ? data.length : 0);
      return {
        success: true,
        message: `Conectado (${elapsed}ms) — ${alertCount} alertas en el servidor`,
        responseTime: elapsed,
      };
    } else {
      return {
        success: false,
        message: `Error del servidor: ${response.status} ${response.statusText}`,
        responseTime: elapsed,
      };
    }
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : "Desconocido";
    if (elapsed >= 7500) {
      return { success: false, message: `Tiempo de espera agotado — Verifica que el servidor esté activo`, responseTime: elapsed };
    }
    return { success: false, message: `No se pudo conectar: ${errMsg}`, responseTime: elapsed };
  }
}

/**
 * Get the current server URL (for display in settings)
 */
export function getCurrentServerUrl(): string {
  return getServerUrl();
}

/**
 * Change the server URL (used by settings screen)
 */
export async function changeServerUrl(newUrl: string): Promise<{ success: boolean; message: string }> {
  const cleaned = newUrl.trim().replace(/\/+$/, "");

  if (!cleaned) {
    // Reset to default
    setServerUrl("");
    const test = await testServerConnection();
    return test;
  }

  // Test the new URL first
  const test = await testServerConnection(cleaned);
  if (test.success) {
    setServerUrl(cleaned);
    return { success: true, message: `Servidor configurado correctamente (${test.responseTime}ms)` };
  } else {
    // Even if test fails, save it (user might be setting up server offline)
    setServerUrl(cleaned);
    return { success: false, message: `URL guardada pero no se pudo conectar: ${test.message}` };
  }
}

/**
 * Initialize API client
 * In native apps, sets up the connection to the backend server.
 * In web/PWA mode, calls go directly to the same-origin API routes.
 */
export function initApi(): void {
  if (typeof window === "undefined") return;

  // Initialize from user config if available
  const userUrl = getServerUrl();
  if (userUrl) {
    (window as any).__CYJ_SERVER_URL__ = userUrl;
  }

  const currentUrl = getServerUrl();

  // For native apps, verify server connectivity on startup
  if (isNativePlatform()) {
    if (currentUrl) {
      console.log(`[API] Native mode - Server: ${currentUrl}`);
      checkServerHealth();
    } else {
      console.warn("[API] Native mode but no server URL configured! Go to Profile > Server Config");
    }
  } else {
    if (currentUrl) {
      console.log(`[API] Web mode - Custom server: ${currentUrl}`);
      checkServerHealth();
    } else {
      console.log("[API] Web mode - using same-origin API routes");
      _serverAvailable = true;
    }
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

    // Get current server URL (might have been updated by user in settings)
    const serverUrl = getServerUrl();

    if (serverUrl) {
      // Redirect to configured server (works for both native and web)
      const apiPath = url.includes("/api/") ? url.substring(url.indexOf("/api/")) : url;
      const fullUrl = `${serverUrl}${apiPath}`;

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
          JSON.stringify({ success: false, error: "Sin conexion al servidor. Verifica la configuracion en Perfil > Servidor" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // No custom server URL - pass through to same-origin (web/PWA mode)
    return originalFetch(input, init);
  };

  console.log("[API] Online mode enabled - all calls go to real server");
}

// Initialize seed data for standalone mode (legacy, kept for compatibility)
export function initOfflineData(): void {
  // No longer needed - data lives in the server database
  if (typeof window === "undefined") return;
}

// Reset data (only works for server-side now)
export function resetOfflineData(): void {
  // No-op - data reset must be done through admin API
}
