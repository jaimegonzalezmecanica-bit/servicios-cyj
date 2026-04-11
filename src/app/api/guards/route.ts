import { NextRequest, NextResponse } from "next/server";
import { getAllGuards, addGuard, updateGuard, removeGuard } from "@/lib/store";
import type { GuardOnDuty } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ guards: getAllGuards() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, shift, startTime, endTime, zone, phone } = body;

    if (!name || !shift || !startTime || !endTime || !zone) {
      return NextResponse.json(
        { success: false, error: "Nombre, turno, horario y zona son requeridos" },
        { status: 400 }
      );
    }

    const newGuard: GuardOnDuty = {
      id: `g_${Date.now()}`,
      name,
      shift,
      startTime,
      endTime,
      zone,
      phone: phone || "",
    };

    addGuard(newGuard);

    return NextResponse.json({ success: true, guard: newGuard });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al asignar turno" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { guardId, ...updates } = body;

    if (!guardId) {
      return NextResponse.json(
        { success: false, error: "ID de guardia requerido" },
        { status: 400 }
      );
    }

    const updated = updateGuard(guardId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Guardia no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, guard: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al actualizar turno" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { guardId } = body;

    if (!guardId) {
      return NextResponse.json(
        { success: false, error: "ID de guardia requerido" },
        { status: 400 }
      );
    }

    removeGuard(guardId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al eliminar turno" },
      { status: 500 }
    );
  }
}
