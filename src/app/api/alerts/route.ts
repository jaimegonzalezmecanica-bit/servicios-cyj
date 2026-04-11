import { NextResponse } from "next/server";
import { ensureSeeded, getAllAlerts } from "@/lib/store";

export async function GET() {
  try {
    await ensureSeeded();
    const allAlerts = await getAllAlerts();
    return NextResponse.json({
      alerts: allAlerts,
      total: allAlerts.length,
    });
  } catch (error) {
    console.error('[API /alerts] Error:', error);
    return NextResponse.json(
      { success: false, error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}
