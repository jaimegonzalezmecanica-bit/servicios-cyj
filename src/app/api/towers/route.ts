import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded, getAllConjuntos, updateConjunto } from "@/lib/store";
import { db } from "@/lib/db-server";

export async function GET() {
  try {
    await ensureSeeded();
    const towers = await getAllConjuntos();
    return NextResponse.json({ towers });
  } catch (error) {
    console.error('[API /towers GET] Error:', error);
    return NextResponse.json({ towers: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { id, name, type, houses, towersCount, units, floors, status, lat, lng } = body;

    if (!id || !name || !type) {
      return NextResponse.json({ success: false, error: "ID, nombre y tipo son requeridos" }, { status: 400 });
    }

    const validTypes = ["casas", "torres"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: "Tipo inválido" }, { status: 400 });
    }

    const extId = id.trim().toLowerCase().replace(/\s+/g, "_");
    const created = await db.conjunto.create({
      data: {
        extId,
        name: name.trim(),
        type,
        status: status || "operativo",
        houses: houses !== undefined && houses !== "" ? Number(houses) : null,
        towersCount: towersCount !== undefined && towersCount !== "" ? Number(towersCount) : null,
        units: units !== undefined && units !== "" ? Number(units) : null,
        floors: floors !== undefined && floors !== "" ? Number(floors) : null,
        lat: lat !== undefined && lat !== "" ? Number(lat) : null,
        lng: lng !== undefined && lng !== "" ? Number(lng) : null,
      },
    });

    return NextResponse.json({ success: true, tower: { id: created.extId, ...created } });
  } catch (error) {
    console.error('[API /towers POST] Error:', error);
    return NextResponse.json({ success: false, error: "Error al crear conjunto" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { towerId, ...updates } = body;

    if (!towerId) {
      return NextResponse.json({ success: false, error: "ID del conjunto es requerido" }, { status: 400 });
    }

    const updated = await updateConjunto(towerId, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Conjunto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tower: updated });
  } catch (error) {
    console.error('[API /towers PUT] Error:', error);
    return NextResponse.json({ success: false, error: "Error al actualizar conjunto" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { towerId } = body;

    if (!towerId) {
      return NextResponse.json({ success: false, error: "ID del conjunto es requerido" }, { status: 400 });
    }

    await db.conjunto.delete({ where: { extId: towerId } }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /towers DELETE] Error:', error);
    return NextResponse.json({ success: false, error: "Error al eliminar conjunto" }, { status: 500 });
  }
}
