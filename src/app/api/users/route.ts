import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded, getAllUsers, addUser, updateUser, deleteUser } from "@/lib/store";
import { ROLES, type RoleId } from "@/lib/mock-data";

export async function GET() {
  try {
    await ensureSeeded();
    const users = await getAllUsers();
    const safeUsers = users.map(({ password: _, ...rest }) => rest);
    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('[API /users GET] Error:', error);
    return NextResponse.json({ users: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { name, role, conjunto, unit, phone, email, password } = body;

    if (!name || !role || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Nombre, rol, teléfono y email son requeridos" },
        { status: 400 }
      );
    }

    const roleData = ROLES.find((r) => r.id === role);
    if (!roleData) {
      return NextResponse.json(
        { success: false, error: "Rol no válido" },
        { status: 400 }
      );
    }

    const newUser = {
      name,
      role: role as RoleId,
      roleName: roleData.name,
      conjunto: conjunto || "general",
      unit: unit || "N/A",
      phone,
      email,
      online: true,
      memberSince: new Date().getFullYear().toString(),
      avatarInitial: name.charAt(0).toUpperCase(),
      password: password || "cyj2025",
    };

    const created = await addUser(newUser);
    const { password: _, ...safeUser } = created;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[API /users POST] Error:', error);
    return NextResponse.json(
      { success: false, error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { userId, role, name, phone, email, conjunto, unit, password } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (role) {
      const roleData = ROLES.find((r) => r.id === role);
      if (!roleData) {
        return NextResponse.json({ success: false, error: "Rol no válido" }, { status: 400 });
      }
      updates.role = role;
      updates.roleName = roleData.name;
    }
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (conjunto !== undefined) updates.conjunto = conjunto;
    if (unit !== undefined) updates.unit = unit;
    if (password) updates.password = password;

    const updated = await updateUser(userId, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[API /users PUT] Error:', error);
    return NextResponse.json({ success: false, error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "ID de usuario requerido" }, { status: 400 });
    }

    const deleted = await deleteUser(userId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const { password: _, ...safeUser } = deleted;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[API /users DELETE] Error:', error);
    return NextResponse.json({ success: false, error: "Error al eliminar usuario" }, { status: 500 });
  }
}
