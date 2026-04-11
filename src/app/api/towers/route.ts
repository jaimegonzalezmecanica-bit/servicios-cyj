import { NextRequest, NextResponse } from "next/server";
import { getAllTowers, addTower, updateTower, deleteTower } from "@/lib/store";

// GET /api/towers — list all towers
export async function GET() {
  return NextResponse.json({ towers: getAllTowers() });
}

// POST /api/towers — create new tower
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, units, floors, status } = body;

    if (!id || !name || !units || !floors) {
      return NextResponse.json(
        { success: false, error: "id, name, units y floors son requeridos" },
        { status: 400 }
      );
    }

    if (units < 1 || floors < 1) {
      return NextResponse.json(
        { success: false, error: "units y floors deben ser mayor a 0" },
        { status: 400 }
      );
    }

    const validStatuses = ["operativa", "mantención"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido. Use: operativa o mantención" },
        { status: 400 }
      );
    }

    const newTower = {
      id,
      name,
      units: Number(units),
      floors: Number(floors),
      status: status || "operativa",
    };

    addTower(newTower);

    return NextResponse.json({ success: true, tower: newTower });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al crear torre" },
      { status: 500 }
    );
  }
}

// PUT /api/towers — update tower
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { towerId, ...updates } = body;

    if (!towerId) {
      return NextResponse.json(
        { success: false, error: "towerId es requerido" },
        { status: 400 }
      );
    }

    if (updates.units !== undefined) updates.units = Number(updates.units);
    if (updates.floors !== undefined) updates.floors = Number(updates.floors);

    const validStatuses = ["operativa", "mantención"];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido. Use: operativa o mantención" },
        { status: 400 }
      );
    }

    const updated = updateTower(towerId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Torre no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tower: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al actualizar torre" },
      { status: 500 }
    );
  }
}

// DELETE /api/towers — delete tower
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { towerId } = body;

    if (!towerId) {
      return NextResponse.json(
        { success: false, error: "towerId es requerido" },
        { status: 400 }
      );
    }

    const deleted = deleteTower(towerId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Torre no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tower: deleted });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al eliminar torre" },
      { status: 500 }
    );
  }
}
