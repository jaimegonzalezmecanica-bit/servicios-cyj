import { NextRequest, NextResponse } from "next/server";
import { sampleUsers } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Email, teléfono y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const idLower = identifier.toLowerCase().trim();
    const user = sampleUsers.find(
      (u) =>
        u.email.toLowerCase() === idLower ||
        u.phone.replace(/\s/g, "") === idLower.replace(/\s/g, "")
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas. Usuario no encontrado." },
        { status: 401 }
      );
    }

    // Simple password check for testing (accept any non-empty password for now)
    if (password.length < 1) {
      return NextResponse.json(
        { success: false, error: "Contraseña inválida" },
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
