// Shared in-memory data store for the application
// Both /api/auth and /api/users use this store so that
// dynamically created users can authenticate.

import { sampleUsers, type SampleUser, type RoleId } from "@/lib/mock-data";

/* ═══════════════════════════════════════════════════════════
   USERS STORE (shared across API routes)
   ═══════════════════════════════════════════════════════════ */

// Initialize with sample users (includes a default password for each)
interface StoredUser extends SampleUser {
  password: string;
}

const defaultPassword = "cyj2025";

export let users: StoredUser[] = sampleUsers.map((u) => ({
  ...u,
  password: defaultPassword,
}));

export function findUserByIdentifier(identifier: string): StoredUser | undefined {
  const idLower = identifier.toLowerCase().trim();
  return users.find(
    (u) =>
      u.email.toLowerCase() === idLower ||
      u.phone.replace(/\s/g, "") === idLower.replace(/\s/g, "")
  );
}

export function addUser(user: StoredUser): void {
  users.push(user);
}

export function updateUser(userId: string, updates: Partial<StoredUser>): StoredUser | undefined {
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return undefined;
  users[index] = { ...users[index], ...updates };
  return users[index];
}

export function deleteUser(userId: string): StoredUser | undefined {
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return undefined;
  const deleted = users[index];
  users = users.filter((u) => u.id !== userId);
  return deleted;
}

export function getAllUsers(): StoredUser[] {
  return users;
}

/* ═══════════════════════════════════════════════════════════
   ALERTS STORE (shared across API routes)
   ═══════════════════════════════════════════════════════════ */

import { mockAlerts, type Alert } from "@/lib/mock-data";

export let alerts: Alert[] = [...mockAlerts];

export function addAlert(alert: Alert): void {
  alerts.unshift(alert);
}

export function getAllAlerts(): Alert[] {
  return alerts;
}

export function updateAlertStatus(alertId: string, status: Alert["status"]): Alert | undefined {
  const index = alerts.findIndex((a) => a.id === alertId);
  if (index === -1) return undefined;
  alerts[index] = { ...alerts[index], status };
  return alerts[index];
}
