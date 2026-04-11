// GPS Location utility - Works in both Web (navigator.geolocation) and Capacitor native
// Capacitor Geolocation is used when running inside the Android APK for accurate GPS
// Falls back to navigator.geolocation on web/PWA

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

const FALLBACK_POSITION: GeoPosition = {
  lat: -33.3273,
  lng: -70.7628,
  accuracy: 100,
  timestamp: Date.now(),
};

/**
 * Check if we're running inside a native Capacitor app
 */
function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (window as any).Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  } catch {
    return false;
  }
}

/**
 * Check current location permission status
 */
export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

export async function checkLocationPermission(): Promise<PermissionStatus> {
  if (!isNativePlatform()) {
    // On web, we can't check before prompting - return "prompt"
    return "prompt";
  }

  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const status = await Geolocation.checkPermissions();
    const locStatus = (status as any).location;
    if (locStatus === "granted") return "granted";
    if (locStatus === "denied") return "denied";
    if (locStatus === "limited") return "granted"; // limited is enough for our use case
    return "prompt";
  } catch {
    return "unavailable";
  }
}

/**
 * Request location permission (required on Android before getting GPS)
 * On web, this is a no-op (permissions are handled by the browser prompt)
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isNativePlatform()) {
    // On web, just return true - browser will handle the prompt
    return true;
  }

  try {
    const { Geolocation } = await import("@capacitor/geolocation");

    // Check current permission status
    const status = await Geolocation.checkPermissions();
    const locStatus = (status as any).location;
    if (locStatus === "granted" || locStatus === "limited") return true;
    if (locStatus === "denied") {
      console.warn("[GPS] Location permission previously denied by user");
      return false;
    }

    // Request permission
    const result = await Geolocation.requestPermissions();
    const resultLoc = (result as any).location;
    return resultLoc === "granted" || resultLoc === "limited";
  } catch (error) {
    console.warn("[GPS] Permission request failed:", error);
    return false;
  }
}

/**
 * Get current GPS position with high accuracy.
 * Uses Capacitor Geolocation on native, navigator.geolocation on web.
 * Falls back to condominio center position if GPS is unavailable.
 */
export async function getCurrentPosition(): Promise<GeoPosition> {
  // Try Capacitor Geolocation first (native Android)
  if (isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");

      // Check/request permissions
      const permStatus = await Geolocation.checkPermissions();
      const locStatus = (permStatus as any).location;
      if (locStatus !== "granted" && locStatus !== "limited") {
        console.log("[GPS] Requesting location permission...");
        const result = await Geolocation.requestPermissions();
        const resultLoc = (result as any).location;
        if (resultLoc !== "granted" && resultLoc !== "limited") {
          console.warn("[GPS] Permission denied, using fallback position");
          return FALLBACK_POSITION;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      });

      if (position.coords && typeof position.coords.latitude === "number") {
        console.log(`[GPS] Native GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} (accuracy: ${Math.round(position.coords.accuracy)}m)`);
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp,
        };
      }
    } catch (error) {
      console.warn("[GPS] Native geolocation failed:", error);
    }
  }

  // Fallback to browser geolocation (web/PWA)
  try {
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        });
      });

      if (position.coords && typeof position.coords.latitude === "number") {
        console.log(`[GPS] Browser GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} (accuracy: ${Math.round(position.coords.accuracy)}m)`);
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp,
        };
      }
    }
  } catch (error) {
    console.warn("[GPS] Browser geolocation failed:", error);
  }

  console.warn("[GPS] All methods failed, using fallback position");
  return FALLBACK_POSITION;
}

/**
 * Watch position changes for real-time tracking
 */
export function watchPosition(callback: (pos: GeoPosition) => void, onError?: (err: string) => void): { clear: () => void } {
  let watchId: string | number | null = null;

  if (isNativePlatform()) {
    (async () => {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const callbackId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          (position, err) => {
            if (err) {
              onError?.(err.message || "Watch error");
              return;
            }
            if (position?.coords) {
              callback({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy || 0,
                timestamp: position.timestamp,
              });
            }
          }
        );
        watchId = callbackId;
      } catch (error) {
        onError?.(String(error));
      }
    })();
  } else {
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          callback({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 0,
            timestamp: pos.timestamp,
          });
        },
        (err) => onError?.(err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }
  }

  return {
    clear: () => {
      if (watchId !== null && !isNativePlatform() && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId as number);
      } else if (watchId !== null && isNativePlatform()) {
        (async () => {
          try {
            const { Geolocation } = await import("@capacitor/geolocation");
            await Geolocation.clearWatch({ id: watchId as string });
          } catch { /* ignore */ }
        })();
      }
      watchId = null;
    },
  };
}
