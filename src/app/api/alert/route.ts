import { NextRequest, NextResponse } from "next/server";
import { mockAlerts } from "@/lib/mock-data";

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

    const newAlert = {
      id: String(Date.now()),
      category: category || "Otro",
      categoryIcon: "flag",
      title: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
      description,
      time: "hace un momento",
      location: location || "Ubicación no especificada",
      status: "activa" as const,
      priority: priority || "medium",
      comments: 0,
      isAnonymous: isAnonymous || false,
      lat: 0,
      lng: 0,
    };

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
  return NextResponse.json({
    alerts: mockAlerts,
  });
}
