import { NextRequest, NextResponse } from "next/server";
import { addAlert, getAllAlerts, updateAlertStatus } from "@/lib/store";
import { reportCategories } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, description, location, isAnonymous, priority, photo, lat, lng } = body;

    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: "Categoría y descripción son requeridos" },
        { status: 400 }
      );
    }

    const isSOS = category === "sos";
    // Find category icon from reportCategories
    const catData = reportCategories.find((c) => c.id === category);

    const newAlert = {
      id: String(Date.now()),
      category: isSOS ? "sos" : (catData?.label || category),
      categoryIcon: isSOS ? "flag" : (catData?.icon || "flag"),
      title: isSOS
        ? `ALERTA SOS - ${description.split(" - ")[1]?.split(" (")[0]?.trim() || "Residente"}`
        : (description.substring(0, 50) + (description.length > 50 ? "..." : "")),
      description,
      time: isSOS
        ? new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
        : "hace un momento",
      location: location || "Av. La Montaña Norte 3650, Condominio Laguna Norte, Lampa, Chile",
      status: "activa" as const,
      priority: (priority || "medium") as "low" | "medium" | "high" | "critical",
      comments: 0,
      isAnonymous: isAnonymous || false,
      lat: typeof lat === "number" ? lat : -33.3276,
      lng: typeof lng === "number" ? lng : -70.7630,
      photo: photo || null,
    };

    addAlert(newAlert);

    return NextResponse.json({
      success: true,
      alert: newAlert,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al crear alerta" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) {
      return NextResponse.json(
        { success: false, error: "alertId y status son requeridos" },
        { status: 400 }
      );
    }

    const validStatuses = ["activa", "en_revision", "resuelta"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido. Use: activa, en_revision, resuelta" },
        { status: 400 }
      );
    }

    const updated = updateAlertStatus(alertId, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, alert: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al actualizar alerta" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const allAlerts = getAllAlerts();
  return NextResponse.json({
    alerts: allAlerts,
  });
}
