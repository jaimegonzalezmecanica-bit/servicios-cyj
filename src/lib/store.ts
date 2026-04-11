// Shared data store - Uses Prisma/SQLite for persistent shared storage
// All devices connected to the server see the SAME data in real-time

import { db } from './db-server';
import { sampleUsers, mockAlerts, conjuntos, guardsOnDuty, announcements } from './mock-data';
import type { SampleUser, Alert, GuardOnDuty, Announcement, Conjunto } from './mock-data';

interface StoredUser extends SampleUser {
  password: string;
}

const defaultPassword = "cyj2025";

/* ═══════════════════════════════════════════════════════════
   DATABASE SEEDING (runs once on first API call)
   ═══════════════════════════════════════════════════════════ */

let _seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (_seeded) return;
  try {
    const userCount = await db.user.count();
    if (userCount > 0) {
      _seeded = true;
      return;
    }

    console.log('[DB] Seeding initial data...');

    // Seed users
    for (const u of sampleUsers) {
      await db.user.create({
        data: {
          id: u.id,
          name: u.name,
          password: defaultPassword,
          role: u.role,
          roleName: u.roleName,
          conjunto: u.conjunto,
          unit: u.unit,
          phone: u.phone,
          email: u.email,
          online: u.online,
          memberSince: u.memberSince,
          avatarInitial: u.avatarInitial,
        },
      }).catch(() => { /* duplicate, skip */ });
    }

    // Seed conjuntos
    for (const c of conjuntos) {
      await db.conjunto.create({
        data: {
          extId: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          houses: c.houses,
          towersCount: c.towersCount,
          units: c.units,
          floors: c.floors,
          lat: c.lat,
          lng: c.lng,
        },
      }).catch(() => { /* duplicate, skip */ });
    }

    // Seed alerts
    for (const a of mockAlerts) {
      await db.alert.create({
        data: {
          id: a.id,
          category: a.category,
          categoryIcon: a.categoryIcon,
          title: a.title,
          description: a.description,
          time: a.time,
          location: a.location,
          status: a.status,
          priority: a.priority,
          comments: a.comments,
          isAnonymous: a.isAnonymous,
          lat: a.lat,
          lng: a.lng,
          photo: a.photo || null,
        },
      }).catch(() => { /* duplicate, skip */ });
    }

    // Seed announcements
    for (const ann of announcements) {
      await db.announcement.create({
        data: {
          title: ann.title,
          description: ann.description,
          date: ann.date,
          author: ann.author,
          priority: ann.priority,
        },
      }).catch(() => { /* duplicate, skip */ });
    }

    // Seed guards
    for (const g of guardsOnDuty) {
      await db.guard.create({
        data: {
          name: g.name,
          shift: g.shift,
          startTime: g.startTime,
          endTime: g.endTime,
          zone: g.zone,
          phone: g.phone,
        },
      }).catch(() => { /* duplicate, skip */ });
    }

    console.log('[DB] Seed complete.');
    _seeded = true;
  } catch (error) {
    console.error('[DB] Seed error:', error);
    _seeded = true; // don't retry
  }
}

/* ═══════════════════════════════════════════════════════════
   USERS (persistent in SQLite)
   ═══════════════════════════════════════════════════════════ */

export async function findUserByIdentifier(identifier: string): Promise<StoredUser | undefined> {
  const idLower = identifier.toLowerCase().trim();
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: idLower } },
      ],
    },
  });
  if (!user) {
    // Also try matching phone (strip spaces)
    const cleanPhone = idLower.replace(/\s/g, "");
    const userByPhone = await db.user.findFirst({
      where: {
        phone: { contains: cleanPhone },
      },
    });
    if (!userByPhone) return undefined;
    return dbUserToStored(userByPhone);
  }
  return dbUserToStored(user);
}

export async function addUser(user: StoredUser): Promise<StoredUser> {
  const created = await db.user.create({
    data: {
      name: user.name,
      password: user.password || defaultPassword,
      role: user.role,
      roleName: user.roleName,
      conjunto: user.conjunto,
      unit: user.unit,
      phone: user.phone,
      email: user.email,
      online: user.online,
      memberSince: user.memberSince,
      avatarInitial: user.avatarInitial,
    },
  });
  return dbUserToStored(created);
}

export async function updateUser(userId: string, updates: Partial<StoredUser>): Promise<StoredUser | undefined> {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.role && { role: updates.role }),
        ...(updates.roleName && { roleName: updates.roleName }),
        ...(updates.conjunto && { conjunto: updates.conjunto }),
        ...(updates.unit && { unit: updates.unit }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.email && { email: updates.email }),
        ...(updates.password && { password: updates.password }),
        ...(updates.online !== undefined && { online: updates.online }),
        ...(updates.memberSince && { memberSince: updates.memberSince }),
        ...(updates.avatarInitial && { avatarInitial: updates.avatarInitial }),
      },
    });
    return dbUserToStored(updated);
  } catch {
    return undefined;
  }
}

export async function deleteUser(userId: string): Promise<StoredUser | undefined> {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return undefined;
    await db.user.delete({ where: { id: userId } });
    return dbUserToStored(user);
  } catch {
    return undefined;
  }
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const users = await db.user.findMany();
  return users.map(dbUserToStored);
}

/* ═══════════════════════════════════════════════════════════
   ALERTS (persistent in SQLite - SHARED across all devices)
   ═══════════════════════════════════════════════════════════ */

export async function addAlert(alert: Alert & { userId?: string; userName?: string; userConjunto?: string }): Promise<Alert> {
  const created = await db.alert.create({
    data: {
      category: alert.category,
      categoryIcon: alert.categoryIcon,
      title: alert.title,
      description: alert.description,
      time: alert.time,
      location: alert.location,
      status: alert.status,
      priority: alert.priority,
      comments: alert.comments,
      isAnonymous: alert.isAnonymous,
      lat: alert.lat,
      lng: alert.lng,
      photo: alert.photo || null,
      userId: alert.userId || null,
      userName: alert.userName || "",
      userConjunto: alert.userConjunto || "",
    },
  });
  return dbAlertToAlert(created);
}

export async function getAllAlerts(): Promise<Alert[]> {
  const alerts = await db.alert.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return alerts.map(dbAlertToAlert);
}

export async function updateAlertStatus(alertId: string, status: Alert["status"]): Promise<Alert | undefined> {
  try {
    const updated = await db.alert.update({
      where: { id: alertId },
      data: { status },
    });
    return dbAlertToAlert(updated);
  } catch {
    return undefined;
  }
}

export async function updateAlertResponse(alertId: string, responseText: string, responsePhoto?: string): Promise<Alert | undefined> {
  try {
    const updated = await db.alert.update({
      where: { id: alertId },
      data: {
        responseText,
        responsePhoto: responsePhoto || null,
        respondedAt: new Date(),
      },
    });
    return dbAlertToAlert(updated);
  } catch {
    return undefined;
  }
}

/* ═══════════════════════════════════════════════════════════
   CONJUNTOS (persistent in SQLite)
   ═══════════════════════════════════════════════════════════ */

export async function getAllConjuntos(): Promise<Conjunto[]> {
  const conj = await db.conjunto.findMany();
  return conj.map(dbConjuntoToConjunto);
}

export async function updateConjunto(extId: string, updates: Partial<Conjunto>): Promise<Conjunto | undefined> {
  try {
    const existing = await db.conjunto.findUnique({ where: { extId } });
    if (!existing) return undefined;
    const updated = await db.conjunto.update({
      where: { extId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.type && { type: updates.type }),
        ...(updates.status && { status: updates.status }),
        ...(updates.houses !== undefined && { houses: updates.houses }),
        ...(updates.towersCount !== undefined && { towersCount: updates.towersCount }),
        ...(updates.units !== undefined && { units: updates.units }),
        ...(updates.floors !== undefined && { floors: updates.floors }),
        ...(updates.lat !== undefined && { lat: updates.lat }),
        ...(updates.lng !== undefined && { lng: updates.lng }),
      },
    });
    return dbConjuntoToConjunto(updated);
  } catch {
    return undefined;
  }
}

/* ═══════════════════════════════════════════════════════════
   ANNOUNCEMENTS (persistent in SQLite)
   ═══════════════════════════════════════════════════════════ */

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const anns = await db.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  return anns.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date,
    author: a.author,
    priority: a.priority as Announcement['priority'],
  }));
}

export async function addAnnouncement(a: Announcement): Promise<Announcement> {
  const created = await db.announcement.create({
    data: { title: a.title, description: a.description, date: a.date, author: a.author, priority: a.priority },
  });
  return {
    id: created.id,
    title: created.title,
    description: created.description,
    date: created.date,
    author: created.author,
    priority: created.priority as Announcement['priority'],
  };
}

/* ═══════════════════════════════════════════════════════════
   GUARDS (persistent in SQLite)
   ═══════════════════════════════════════════════════════════ */

export async function getAllGuards(): Promise<GuardOnDuty[]> {
  const guards = await db.guard.findMany();
  return guards.map(g => ({
    id: g.id,
    name: g.name,
    shift: g.shift,
    startTime: g.startTime,
    endTime: g.endTime,
    zone: g.zone,
    phone: g.phone,
  }));
}

export async function addGuard(g: GuardOnDuty): Promise<GuardOnDuty> {
  const created = await db.guard.create({
    data: { name: g.name, shift: g.shift, startTime: g.startTime, endTime: g.endTime, zone: g.zone, phone: g.phone },
  });
  return {
    id: created.id,
    name: created.name,
    shift: created.shift,
    startTime: created.startTime,
    endTime: created.endTime,
    zone: created.zone,
    phone: created.phone,
  };
}

/* ═══════════════════════════════════════════════════════════
   CONVERTERS: Database ↔ App types
   ═══════════════════════════════════════════════════════════ */

function dbUserToStored(u: any): StoredUser {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    roleName: u.roleName,
    conjunto: u.conjunto,
    unit: u.unit,
    phone: u.phone,
    email: u.email,
    online: u.online,
    memberSince: u.memberSince,
    avatarInitial: u.avatarInitial,
    password: u.password,
  };
}

function dbAlertToAlert(a: any): Alert {
  return {
    id: a.id,
    category: a.category,
    categoryIcon: a.categoryIcon,
    title: a.title,
    description: a.description,
    time: a.time,
    location: a.location,
    status: a.status,
    priority: a.priority,
    comments: a.comments,
    isAnonymous: a.isAnonymous,
    lat: a.lat,
    lng: a.lng,
    photo: a.photo,
  };
}

function dbConjuntoToConjunto(c: any): Conjunto {
  return {
    id: c.extId,
    name: c.name,
    type: c.type,
    status: c.status,
    houses: c.houses,
    towersCount: c.towersCount,
    units: c.units,
    floors: c.floors,
    lat: c.lat,
    lng: c.lng,
  };
}
