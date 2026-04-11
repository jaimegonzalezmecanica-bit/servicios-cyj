import { NextRequest, NextResponse } from "next/server";
import { ROLES, type RoleId } from "@/lib/mock-data";
import { getAllUsers, addUser, updateUser, deleteUser } from "@/lib/store";

export async function GET() {
  // Return users without password field
  const safeUsers = getAllUsers().map(({ password: _, ...rest }) => rest);
  return NextResponse.json({ users: safeUsers });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, tower, unit, phone, email, password } = body;

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
      id: `u_${Date.now()}`,
      name,
      role: role as RoleId,
      roleName: roleData.name,
      tower: tower || "N/A",
      unit: unit || "N/A",
      phone,
      email,
      online: true,
      memberSince: new Date().getFullYear().toString(),
      avatarInitial: name.charAt(0).toUpperCase(),
      password: password || "cyj2025", // Default password for new users
    };

    addUser(newUser);

    // Return without password
    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, name, phone, email, tower, unit, password } = body;

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
        return NextResponse.json(
          { success: false, error: "Rol no válido" },
          { status: 400 }
        );
      }
      updates.role = role;
      updates.roleName = roleData.name;
    }
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (tower !== undefined) updates.tower = tower;
    if (unit !== undefined) updates.unit = unit;
    if (password) updates.password = password;

    const updated = updateUser(userId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Return without password
    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ success: true, user: safeUser });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    const deleted = deleteUser(userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Return without password
    const { password: _, ...safeUser } = deleted;
    return NextResponse.json({ success: true, user: safeUser });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
