import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded, addAlert } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { userName, conjunto, lat, lng, userId } = body;

    const timeStr = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    const newAlert = {
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
      userId: userId || undefined,
      userName: userName || "",
      userConjunto: conjunto || "",
    };

    const saved = await addAlert(newAlert);
    console.log(`[API /sos] *** SOS ACTIVATED by ${userName || 'unknown'} at ${lat}, ${lng} ***`);

    return NextResponse.json({
      success: true,
      alert: saved,
      sosActive: true,
      activatedAt: new Date().toISOString(),
      message: "Alerta SOS activada exitosamente - Servicios Integrales CyJ",
    });
  } catch (error) {
    console.error('[API /sos] Error:', error);
    return NextResponse.json(
      { success: false, error: "Error al activar SOS" },
      { status: 500 }
    );
  }
}
