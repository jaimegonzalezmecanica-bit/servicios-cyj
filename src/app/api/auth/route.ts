import { NextRequest, NextResponse } from "next/server";
import { findUserByIdentifier } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Email/teléfono y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const user = findUserByIdentifier(identifier);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado. Verifica tus credenciales." },
        { status: 401 }
      );
    }

    // Password validation
    if (password !== user.password) {
      return NextResponse.json(
        { success: false, error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        role: user.role,
        roleName: user.roleName,
        condo: "Servicios Integrales CyJ",
        phone: user.phone,
        email: user.email,
        address: user.tower !== "N/A" ? `Torre ${user.tower} - Unidad ${user.unit}` : "Guardia de Seguridad",
        unit: user.unit,
        tower: user.tower,
        reports: 0,
        memberSince: user.memberSince,
        avatarInitial: user.avatarInitial,
        familyMembers: user.role === "familiar" ? 0 : 2,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
