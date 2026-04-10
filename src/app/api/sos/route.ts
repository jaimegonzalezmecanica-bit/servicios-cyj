import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    return NextResponse.json({
      success: true,
      sosActive: true,
      userId: userId || "default",
      activatedAt: new Date().toISOString(),
      message: "Alerta SOS activada exitosamente",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al activar SOS" },
      { status: 500 }
    );
  }
}
