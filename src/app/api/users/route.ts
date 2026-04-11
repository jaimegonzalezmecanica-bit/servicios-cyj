import { NextRequest, NextResponse } from "next/server";
import { sampleUsers, ROLES, type SampleUser, type RoleId } from "@/lib/mock-data";

// In-memory user list (resets on server restart — this is a demo)
let users: SampleUser[] = [...sampleUsers];

export async function GET() {
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, tower, unit, phone, email } = body;

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

    const newUser: SampleUser = {
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
    };

    users.push(newUser);

    return NextResponse.json({ success: true, user: newUser });
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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "ID de usuario y rol son requeridos" },
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

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      role: role as RoleId,
      roleName: roleData.name,
    };

    return NextResponse.json({ success: true, user: users[userIndex] });
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

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const deletedUser = users[userIndex];
    users = users.filter((u) => u.id !== userId);

    return NextResponse.json({ success: true, user: deletedUser });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
