import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, notifications, privacy } = body;

    return NextResponse.json({
      success: true,
      profile: {
        name: name || "Carlos Pérez",
        phone: phone || "+56 9 1234 5678",
        email: email || "carlos.perez@email.com",
        notifications: notifications || {},
        privacy: privacy || {},
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
