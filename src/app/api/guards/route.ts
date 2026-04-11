import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded, getAllGuards, addGuard } from "@/lib/store";
import { db } from "@/lib/db-server";

export async function GET() {
  try {
    await ensureSeeded();
    const guards = await getAllGuards();
    return NextResponse.json({ guards });
  } catch (error) {
    console.error('[API /guards GET] Error:', error);
    return NextResponse.json({ guards: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { name, shift, startTime, endTime, zone, phone } = body;

    if (!name || !shift || !startTime || !endTime || !zone) {
      return NextResponse.json(
        { success: false, error: "Nombre, turno, horario y zona son requeridos" },
        { status: 400 }
      );
    }

    const newGuard = { name, shift, startTime, endTime, zone, phone: phone || "" };
    const created = await addGuard(newGuard);
    return NextResponse.json({ success: true, guard: created });
  } catch (error) {
    console.error('[API /guards POST] Error:', error);
    return NextResponse.json({ success: false, error: "Error al asignar turno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { guardId, ...updates } = body;

    if (!guardId) {
      return NextResponse.json({ success: false, error: "ID de guardia requerido" }, { status: 400 });
    }

    const updated = await db.guard.update({
      where: { id: guardId },
      data: updates,
    }).catch(() => null);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Guardia no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, guard: updated });
  } catch (error) {
    console.error('[API /guards PUT] Error:', error);
    return NextResponse.json({ success: false, error: "Error al actualizar turno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { guardId } = body;

    if (!guardId) {
      return NextResponse.json({ success: false, error: "ID de guardia requerido" }, { status: 400 });
    }

    await db.guard.delete({ where: { id: guardId } }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /guards DELETE] Error:', error);
    return NextResponse.json({ success: false, error: "Error al eliminar turno" }, { status: 500 });
  }
}
