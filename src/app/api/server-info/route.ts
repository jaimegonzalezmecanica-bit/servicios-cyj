import { NextResponse } from "next/server";

export async function GET() {
  try {
    let userCount = 0;
    let alertCount = 0;
    try {
      const { db } = await import("@/lib/db-server");
      const [users, alerts] = await Promise.all([
        db.user.count(),
        db.alert.count(),
      ]);
      userCount = users;
      alertCount = alerts;
    } catch {
      // DB not available
    }

    return NextResponse.json({
      success: true,
      server: {
        name: "Servicios Integrales CyJ",
        version: "2.1.0",
        environment: process.env.NODE_ENV || "production",
        url: process.env.NEXT_PUBLIC_SERVER_URL || "",
        timestamp: new Date().toISOString(),
      },
      stats: {
        users: userCount,
        alerts: alertCount,
      },
      message: "Servidor activo y respondiendo",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Error al obtener informacion del servidor",
    }, { status: 500 });
  }
}
