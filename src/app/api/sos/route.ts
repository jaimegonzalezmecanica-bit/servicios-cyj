import { NextRequest, NextResponse } from "next/server";
import { addAlert } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, conjunto, lat, lng } = body;

    const timeStr = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    const newAlert = {
      id: `sos-${Date.now()}`,
      category: "sos",
      categoryIcon: "flag",
      title: `ALERTA SOS - ${userName || "Residente"}`,
      description: `ALERTA SOS - ${userName || "Residente"}${conjunto ? " (" + conjunto + ")" : ""} - Emergencia activada a las ${timeStr}`,
      time: timeStr,
      location: `Lat: ${lat?.toFixed(6) || "-33.3276"}, Lng: ${lng?.toFixed(6) || "-70.7630"}`,
      status: "activa" as const,
      priority: "critical" as const,
      comments: 0,
      isAnonymous: false,
      lat: typeof lat === "number" ? lat : -33.3276,
      lng: typeof lng === "number" ? lng : -70.7630,
      photo: null,
    };

    addAlert(newAlert);

    return NextResponse.json({
      success: true,
      alert: newAlert,
      sosActive: true,
      activatedAt: new Date().toISOString(),
      message: "Alerta SOS activada exitosamente - Servicios Integrales CyJ",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al activar SOS" },
      { status: 500 }
    );
  }
}
