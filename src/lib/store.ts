// Shared in-memory data store for the application
// Both /api/auth and /api/users use this store so that
// dynamically created users can authenticate.

import { sampleUsers, type SampleUser, type RoleId, mockAlerts, type Alert, guardsOnDuty as initialGuards, type GuardOnDuty, announcements as initialAnnouncements, type Announcement, towers as initialTowers, type Tower } from "@/lib/mock-data";

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

/* ═══════════════════════════════════════════════════════════
   ANNOUNCEMENTS STORE
   ═══════════════════════════════════════════════════════════ */

export let announcements: Announcement[] = [...initialAnnouncements];

export function addAnnouncement(a: Announcement): void {
  announcements.unshift(a);
}

export function getAllAnnouncements(): Announcement[] {
  return announcements;
}

/* ═══════════════════════════════════════════════════════════
   TOWERS STORE
   ═══════════════════════════════════════════════════════════ */

export let towers: Tower[] = [...initialTowers];

export function addTower(tower: Tower): void {
  towers.push(tower);
}

export function updateTower(towerId: string, updates: Partial<Tower>): Tower | undefined {
  const index = towers.findIndex((t) => t.id === towerId);
  if (index === -1) return undefined;
  towers[index] = { ...towers[index], ...updates };
  return towers[index];
}

export function deleteTower(towerId: string): Tower | undefined {
  const index = towers.findIndex((t) => t.id === towerId);
  if (index === -1) return undefined;
  const deleted = towers[index];
  towers = towers.filter((t) => t.id !== towerId);
  return deleted;
}

export function getAllTowers(): Tower[] {
  return towers;
}

/* ═══════════════════════════════════════════════════════════
   GUARDS / SHIFTS STORE
   ═══════════════════════════════════════════════════════════ */

export let guards: GuardOnDuty[] = [...initialGuards];

export function addGuard(g: GuardOnDuty): void {
  guards.push(g);
}

export function updateGuard(guardId: string, updates: Partial<GuardOnDuty>): GuardOnDuty | undefined {
  const index = guards.findIndex((g) => g.id === guardId);
  if (index === -1) return undefined;
  guards[index] = { ...guards[index], ...updates };
  return guards[index];
}

export function removeGuard(guardId: string): void {
  guards = guards.filter((g) => g.id !== guardId);
}

export function getAllGuards(): GuardOnDuty[] {
  return guards;
}
