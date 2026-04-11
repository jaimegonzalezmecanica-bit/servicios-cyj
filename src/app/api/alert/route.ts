import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded, addAlert, getAllAlerts, updateAlertStatus, updateAlertResponse } from "@/lib/store";
import { reportCategories } from "@/lib/mock-data";
import { eventBus } from "@/lib/event-bus";

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { category, description, location, isAnonymous, priority, photo, lat, lng, userId, userName, userConjunto } = body;

    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: "Categoría y descripción son requeridos" },
        { status: 400 }
      );
    }

    const isSOS = category === "sos";
    const catData = reportCategories.find((c) => c.id === category);

    const newAlert = {
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
      userId: userId || undefined,
      userName: userName || "",
      userConjunto: userConjunto || "",
    };

    const saved = await addAlert(newAlert);
    console.log(`[API /alert] Created alert ${saved.id} (${saved.category}) by ${userName || 'anonymous'}`);

    // ─── BROADCAST TO ALL CONNECTED DEVICES IN REAL-TIME ───
    if (isSOS) {
      // SOS gets the urgent broadcast (triggers alarm on ALL devices)
      eventBus.broadcast("sos", {
        alert: saved,
        message: "ALERTA SOS ACTIVADA",
        triggerUser: userName || "Residente",
        conjunto: userConjunto || "",
        lat: typeof lat === "number" ? lat : -33.3276,
        lng: typeof lng === "number" ? lng : -70.7630,
        time: saved.time,
      });
    } else {
      // Regular alerts get a notification broadcast
      eventBus.broadcast("alert", {
        alert: saved,
        message: "Nueva alerta de la comunidad",
      });
    }

    return NextResponse.json({
      success: true,
      alert: saved,
    });
  } catch (error) {
    console.error('[API /alert] Error:', error);
    return NextResponse.json(
      { success: false, error: "Error al crear alerta" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { alertId, status, responseText, responsePhoto } = body;

    if (!alertId || !status) {
      return NextResponse.json(
        { success: false, error: "alertId y status son requeridos" },
        { status: 400 }
      );
    }

    const validStatuses = ["activa", "en_revision", "resuelta"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido" },
        { status: 400 }
      );
    }

    const updated = await updateAlertStatus(alertId, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    // If response text/photo provided, update that too
    if (responseText) {
      await updateAlertResponse(alertId, responseText, responsePhoto);
    }

    console.log(`[API /alert] Updated alert ${alertId} → ${status}`);

    // ─── BROADCAST STATUS CHANGE TO ALL DEVICES ───
    eventBus.broadcast("alert-update", {
      alertId,
      status,
      responseText,
      message: `Alerta actualizada: ${status}`,
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error) {
    console.error('[API /alert] Error:', error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar alerta" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureSeeded();
    const allAlerts = await getAllAlerts();
    return NextResponse.json({ alerts: allAlerts });
  } catch (error) {
    console.error('[API /alert GET] Error:', error);
    return NextResponse.json(
      { success: false, error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}
