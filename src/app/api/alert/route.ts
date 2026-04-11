import { NextRequest, NextResponse } from "next/server";
import { addAlert, getAllAlerts } from "@/lib/store";
import { reportCategories } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, description, location, isAnonymous, priority } = body;

    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: "Categoría y descripción son requeridos" },
        { status: 400 }
      );
    }

    // Find category icon from reportCategories
    const catData = reportCategories.find((c) => c.id === category);

    const newAlert = {
      id: String(Date.now()),
      category: catData?.label || category,
      categoryIcon: catData?.icon || "flag",
      title: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
      description,
      time: "hace un momento",
      location: location || "Ubicación no especificada",
      status: "activa" as const,
      priority: (priority || "medium") as "low" | "medium" | "high" | "critical",
      comments: 0,
      isAnonymous: isAnonymous || false,
      lat: 0,
      lng: 0,
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

export async function GET() {
  const allAlerts = getAllAlerts();
  return NextResponse.json({
    alerts: allAlerts,
  });
}
