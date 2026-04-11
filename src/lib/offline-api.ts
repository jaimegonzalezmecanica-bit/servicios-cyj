// Offline API interceptor - replaces server API calls with localStorage operations
// This enables the app to work 100% standalone without a server

import {
  sampleUsers,
  mockAlerts,
  announcements as initialAnnouncements,
  guardsOnDuty as initialGuards,
  conjuntos as initialTowers,
  type Alert,
  type SampleUser,
  type Announcement,
  type GuardOnDuty,
  type Conjunto,
} from "@/lib/mock-data";

const KEYS = {
  users: "cyj_offline_users",
  alerts: "cyj_offline_alerts",
  towers: "cyj_offline_towers",
  announcements: "cyj_offline_announcements",
  guards: "cyj_offline_guards",
  profile: "cyj_offline_profile",
  initialized: "cyj_offline_init",
  markerPositions: "cyj_marker_positions",
};

/* ── PERMANENT FIXED POSITIONS (never change unless admin edits) ── */
const FIXED_POSITIONS: Record<string, { lat: number; lng: number }> = {
  faisanes:   { lat: -33.3258, lng: -70.7618 },
  garzas:     { lat: -33.3262, lng: -70.7628 },
  flamencos:  { lat: -33.3264, lng: -70.7642 },
  gaviotas:   { lat: -33.3274, lng: -70.7638 },
  becacinas:  { lat: -33.3278, lng: -70.7625 },
  bandurrias: { lat: -33.3285, lng: -70.7635 },
  albatros:   { lat: -33.3288, lng: -70.7618 },
  canquen:    { lat: -33.3294, lng: -70.7630 },
};

const FIXED_ENTRANCE = { lat: -33.3298, lng: -70.7630 };

const FIXED_PERIMETER = [
  { lat: -33.3250, lng: -70.7610 },
  { lat: -33.3250, lng: -70.7650 },
  { lat: -33.3298, lng: -70.7650 },
  { lat: -33.3298, lng: -70.7610 },
];

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── Seed initial data on first launch ──
export function initOfflineData(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.initialized)) return;

  // Add password field to sample users (same as server default)
  const usersWithPass: (SampleUser & { password: string })[] = sampleUsers.map((u) => ({
    ...u,
    password: "cyj2025",
  }));

  // Seed towers with FIXED positions baked in (never generic defaults)
  const towersWithPositions: Conjunto[] = initialTowers.map((t) => ({
    ...t,
    lat: FIXED_POSITIONS[t.id]?.lat ?? t.lat,
    lng: FIXED_POSITIONS[t.id]?.lng ?? t.lng,
  }));

  setLocal(KEYS.users, usersWithPass);
  setLocal(KEYS.alerts, mockAlerts);
  setLocal(KEYS.towers, towersWithPositions);
  setLocal(KEYS.announcements, initialAnnouncements);
  setLocal(KEYS.guards, initialGuards);

  // Save fixed positions as permanent backup (never overwritten by defaults)
  localStorage.setItem(KEYS.markerPositions, JSON.stringify(FIXED_POSITIONS));

  localStorage.setItem(KEYS.initialized, "true");
}

// ── Build a Response-like object ──
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Route handlers ──
function handleAuth(body: Record<string, unknown>): Response {
  const users = getLocal<(SampleUser & { password: string })>(KEYS.users);
  const id = String(body.identifier || "").toLowerCase().trim();
  const pwd = String(body.password || "");

  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === id || u.phone.replace(/\s/g, "") === id.replace(/\s/g, "")) &&
      u.password === pwd
  );

  if (!user) {
    return jsonResponse({ success: false, error: "Credenciales inválidas" }, 401);
  }
  // Return user without password
  const { password: _p, ...safeUser } = user;
  return jsonResponse({ success: true, user: safeUser });
}

function handleAlert(method: string, body: Record<string, unknown>): Response {
  const alerts = getLocal<Alert>(KEYS.alerts);

  if (method === "POST") {
    const now = new Date();
    const newAlert: Alert = {
      id: `a${Date.now()}`,
      category: String(body.category || "Otro"),
      categoryIcon: getCatIcon(String(body.category)),
      title: `${String(body.category || "Incidente")} reportado`,
      description: String(body.description || ""),
      time: `hace un momento`,
      location: String(body.location || "No especificada"),
      status: "activa",
      priority: (body.priority as Alert["priority"]) || "medium",
      comments: 0,
      isAnonymous: Boolean(body.isAnonymous),
      lat: typeof body.lat === "number" ? body.lat : -33.3273,
      lng: typeof body.lng === "number" ? body.lng : -70.7628,
      photo: body.photo ? String(body.photo) : undefined,
    };
    alerts.unshift(newAlert);
    setLocal(KEYS.alerts, alerts);
    return jsonResponse({ success: true, alert: newAlert });
  }

  if (method === "PUT") {
    const alertId = String(body.alertId);
    const newStatus = body.status as Alert["status"];
    const idx = alerts.findIndex((a) => a.id === alertId);
    if (idx === -1) return jsonResponse({ success: false, error: "Alerta no encontrada" }, 404);
    alerts[idx] = { ...alerts[idx], status: newStatus };
    setLocal(KEYS.alerts, alerts);
    return jsonResponse({ success: true, alert: alerts[idx] });
  }

  return jsonResponse({ success: false, error: "Método no soportado" }, 405);
}

function handleUsers(method: string, body: Record<string, unknown>): Response {
  const users = getLocal<(SampleUser & { password: string })>(KEYS.users);

  if (method === "POST") {
    const newUser: SampleUser & { password: string } = {
      id: `u${Date.now()}`,
      name: String(body.name || "Sin nombre"),
      role: (body.role as SampleUser["role"]) || "residente",
      roleName: getRoleName(String(body.role || "residente")),
      conjunto: String(body.conjunto || "general"),
      unit: String(body.unit || "-"),
      phone: String(body.phone || ""),
      email: String(body.email || ""),
      online: true,
      memberSince: new Date().getFullYear().toString(),
      avatarInitial: String(body.name || "U").charAt(0).toUpperCase(),
      password: String(body.password || "cyj2025"),
    };
    users.push(newUser);
    setLocal(KEYS.users, users);
    const { password: _p, ...safeUser } = newUser;
    return jsonResponse({ success: true, user: safeUser });
  }

  if (method === "PUT") {
    const userId = String(body.userId);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return jsonResponse({ success: false, error: "Usuario no encontrado" }, 404);
    if (body.role) {
      users[idx].role = body.role as SampleUser["role"];
      users[idx].roleName = getRoleName(String(body.role));
    }
    setLocal(KEYS.users, users);
    return jsonResponse({ success: true, user: users[idx] });
  }

  if (method === "DELETE") {
    const userId = String(body.userId);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return jsonResponse({ success: false, error: "Usuario no encontrado" }, 404);
    users.splice(idx, 1);
    setLocal(KEYS.users, users);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, error: "Método no soportado" }, 405);
}

function handleTowers(method: string, body: Record<string, unknown>): Response {
  const towers = getLocal<Conjunto>(KEYS.towers);

  if (method === "GET") {
    // ALWAYS ensure positions are present — merge with permanent backup
    let savedPositions: Record<string, { lat: number; lng: number }> = {};
    try {
      const raw = localStorage.getItem(KEYS.markerPositions);
      if (raw) savedPositions = JSON.parse(raw);
    } catch { /* ignore */ }

    const ensuredTowers = towers.map((t) => {
      if (savedPositions[t.id]) {
        return { ...t, lat: savedPositions[t.id].lat, lng: savedPositions[t.id].lng };
      }
      if (FIXED_POSITIONS[t.id]) {
        return { ...t, lat: FIXED_POSITIONS[t.id].lat, lng: FIXED_POSITIONS[t.id].lng };
      }
      return t;
    });

    return jsonResponse({ towers: ensuredTowers });
  }

  if (method === "POST") {
    const newTower: Conjunto = {
      id: String(body.id || `t${Date.now()}`).trim().toLowerCase().replace(/\s+/g, "_"),
      name: String(body.name || "Sin nombre").trim(),
      type: (body.type as Conjunto["type"]) || "casas",
      status: (body.status as Conjunto["status"]) || "operativo",
      houses: body.houses !== undefined ? Number(body.houses) : undefined,
      towersCount: body.towersCount !== undefined ? Number(body.towersCount) : undefined,
      units: body.units !== undefined ? Number(body.units) : undefined,
      floors: body.floors !== undefined ? Number(body.floors) : undefined,
      lat: body.lat !== undefined ? Number(body.lat) : undefined,
      lng: body.lng !== undefined ? Number(body.lng) : undefined,
    };
    towers.push(newTower);
    setLocal(KEYS.towers, towers);
    return jsonResponse({ success: true, tower: newTower });
  }

  if (method === "PUT") {
    const towerId = String(body.towerId);
    const idx = towers.findIndex((t) => t.id === towerId);
    if (idx === -1) return jsonResponse({ success: false, error: "Conjunto no encontrado" }, 404);
    const { towerId: _tid, ...updates } = body;
    towers[idx] = { ...towers[idx], ...updates };
    setLocal(KEYS.towers, towers);

    // Also update permanent position backup when lat/lng changes
    if (updates.lat !== undefined && updates.lng !== undefined) {
      try {
        const saved = JSON.parse(localStorage.getItem(KEYS.markerPositions) || "{}");
        saved[towerId] = { lat: Number(updates.lat), lng: Number(updates.lng) };
        localStorage.setItem(KEYS.markerPositions, JSON.stringify(saved));
      } catch { /* ignore */ }
    }

    return jsonResponse({ success: true, tower: towers[idx] });
  }

  if (method === "DELETE") {
    const towerId = String(body.towerId);
    const idx = towers.findIndex((t) => t.id === towerId);
    if (idx === -1) return jsonResponse({ success: false, error: "Conjunto no encontrado" }, 404);
    towers.splice(idx, 1);
    setLocal(KEYS.towers, towers);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, error: "Método no soportado" }, 405);
}

function handleAnnouncements(body: Record<string, unknown>): Response {
  const announcements = getLocal<Announcement>(KEYS.announcements);
  const now = new Date();
  const newAnn: Announcement = {
    id: `an${Date.now()}`,
    title: String(body.title || ""),
    description: String(body.description || ""),
    date: `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`,
    author: String(body.author || "Administración"),
    priority: (body.priority as Announcement["priority"]) || "info",
  };
  announcements.unshift(newAnn);
  setLocal(KEYS.announcements, announcements);
  return jsonResponse({ success: true, announcement: newAnn });
}

function handleGuards(method: string, body: Record<string, unknown>): Response {
  const guards = getLocal<GuardOnDuty>(KEYS.guards);

  if (method === "POST") {
    const newGuard: GuardOnDuty = {
      id: `g${Date.now()}`,
      name: String(body.name || ""),
      shift: String(body.shift || ""),
      startTime: String(body.startTime || ""),
      endTime: String(body.endTime || ""),
      zone: String(body.zone || ""),
      phone: String(body.phone || ""),
    };
    guards.push(newGuard);
    setLocal(KEYS.guards, guards);
    return jsonResponse({ success: true, guard: newGuard });
  }

  if (method === "DELETE") {
    const guardId = String(body.guardId);
    const idx = guards.findIndex((g) => g.id === guardId);
    if (idx === -1) return jsonResponse({ success: false, error: "Guardia no encontrado" }, 404);
    guards.splice(idx, 1);
    setLocal(KEYS.guards, guards);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, error: "Método no soportado" }, 405);
}

function handleProfile(body: Record<string, unknown>): Response {
  setLocal(KEYS.profile, body);
  return jsonResponse({ success: true });
}

// ── Helper functions ──
function getCatIcon(category: string): string {
  const icons: Record<string, string> = {
    persona: "user-x", ruido: "volume-2", vehiculo: "car",
    robo: "shield-alert", acceso: "door-open", mascota: "paw-print",
    incendio: "flame", otro: "more-horizontal",
  };
  return icons[category] || "more-horizontal";
}

function getRoleName(roleId: string): string {
  const names: Record<string, string> = {
    super_admin: "Super Administrador", admin: "Administrador",
    comite: "Comité de Seguridad", guardia: "Guardia de Seguridad",
    residente_p: "Residente Principal", residente: "Residente",
    familiar: "Familiar Autorizado", visitante: "Visitante Temporal",
  };
  return names[roleId] || "Residente";
}

// ── Main interceptor ──
export function enableOfflineMode(): void {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

    // Only intercept /api/* calls
    if (!url.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    // Parse the request
    let body: Record<string, unknown> = {};
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string);
      } catch { /* ignore */ }
    }

    const method = (init?.method || "GET").toUpperCase();
    const path = url.replace(/\/api\/?/, "");

    // Route to the appropriate handler
    switch (path) {
      case "auth":
        return handleAuth(body);
      case "alert":
      case "alerts":
        return handleAlert(method, body);
      case "users":
        return handleUsers(method, body);
      case "towers":
        return handleTowers(method, body);
      case "announcements":
        return handleAnnouncements(body);
      case "guards":
        return handleGuards(method, body);
      case "profile":
        return handleProfile(body);
      case "sos":
        // SOS just creates an alert
        return handleAlert("POST", {
          ...body,
          category: "sos",
          priority: "critical",
        });
      default:
        // For unknown routes, try original fetch (in case server is available)
        try {
          return await originalFetch(input, init);
        } catch {
          return jsonResponse({ error: "Endpoint no disponible offline" }, 503);
        }
    }
  };
}

/* ── Position Guardian: ensures positions are NEVER lost ── */
function guardPositions(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = JSON.parse(localStorage.getItem(KEYS.markerPositions) || "{}");
    // If saved positions are empty or missing, restore from FIXED_POSITIONS
    if (Object.keys(saved).length === 0) {
      localStorage.setItem(KEYS.markerPositions, JSON.stringify(FIXED_POSITIONS));
    }
    // Also verify each known barrio has a position
    let needsUpdate = false;
    for (const [id, pos] of Object.entries(FIXED_POSITIONS)) {
      if (!saved[id]) {
        saved[id] = pos;
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      localStorage.setItem(KEYS.markerPositions, JSON.stringify(saved));
    }
  } catch { /* ignore */ }
}

// Run guardian on every enableOfflineMode call
if (typeof window !== "undefined") {
  guardPositions();
  // Also run periodically (every 5 seconds) to catch any data loss
  setInterval(guardPositions, 5000);
}

// ── Utility to reset all offline data ──
export function resetOfflineData(): void {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  initOfflineData();
}
