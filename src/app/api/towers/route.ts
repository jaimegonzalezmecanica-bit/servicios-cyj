import { NextRequest, NextResponse } from "next/server";
import { getAllTowers, addTower, updateTower, deleteTower } from "@/lib/store";

// GET /api/towers — list all conjuntos habitacionales
export async function GET() {
  return NextResponse.json({ towers: getAllTowers() });
}

// POST /api/towers — create new conjunto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, houses, towersCount, units, floors, status, lat, lng } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { success: false, error: "ID, nombre y tipo son requeridos" },
        { status: 400 }
      );
    }

    const validTypes = ["casas", "torres"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipo inválido. Use: casas o torres" },
        { status: 400 }
      );
    }

    const validStatuses = ["operativo", "mantención"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido. Use: operativo o mantención" },
        { status: 400 }
      );
    }

    const newConjunto: Record<string, unknown> = {
      id: id.trim().toLowerCase().replace(/\s+/g, "_"),
      name: name.trim(),
      type,
      status: status || "operativo",
    };

    // All numeric fields are optional
    if (houses !== undefined && houses !== "") newConjunto.houses = Number(houses);
    if (towersCount !== undefined && towersCount !== "") newConjunto.towersCount = Number(towersCount);
    if (units !== undefined && units !== "") newConjunto.units = Number(units);
    if (floors !== undefined && floors !== "") newConjunto.floors = Number(floors);
    if (lat !== undefined && lat !== "") newConjunto.lat = Number(lat);
    if (lng !== undefined && lng !== "") newConjunto.lng = Number(lng);

    addTower(newConjunto as any);

    return NextResponse.json({ success: true, tower: newConjunto });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al crear conjunto" },
      { status: 500 }
    );
  }
}

// PUT /api/towers — update conjunto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { towerId, ...updates } = body;

    if (!towerId) {
      return NextResponse.json(
        { success: false, error: "ID del conjunto es requerido" },
        { status: 400 }
      );
    }

    // Clean up empty numeric fields — remove them instead of storing empty
    if (updates.houses !== undefined && (updates.houses === "" || updates.houses === null)) delete updates.houses;
    else if (updates.houses !== undefined) updates.houses = Number(updates.houses);

    if (updates.towersCount !== undefined && (updates.towersCount === "" || updates.towersCount === null)) delete updates.towersCount;
    else if (updates.towersCount !== undefined) updates.towersCount = Number(updates.towersCount);

    if (updates.units !== undefined && (updates.units === "" || updates.units === null)) delete updates.units;
    else if (updates.units !== undefined) updates.units = Number(updates.units);

    if (updates.floors !== undefined && (updates.floors === "" || updates.floors === null)) delete updates.floors;
    else if (updates.floors !== undefined) updates.floors = Number(updates.floors);

    if (updates.lat !== undefined && (updates.lat === "" || updates.lat === null)) delete updates.lat;
    else if (updates.lat !== undefined) updates.lat = Number(updates.lat);

    if (updates.lng !== undefined && (updates.lng === "" || updates.lng === null)) delete updates.lng;
    else if (updates.lng !== undefined) updates.lng = Number(updates.lng);

    const validStatuses = ["operativo", "mantención"];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido. Use: operativo o mantención" },
        { status: 400 }
      );
    }

    const updated = updateTower(towerId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Conjunto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tower: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al actualizar conjunto" },
      { status: 500 }
    );
  }
}

// DELETE /api/towers — delete conjunto
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { towerId } = body;

    if (!towerId) {
      return NextResponse.json(
        { success: false, error: "ID del conjunto es requerido" },
        { status: 400 }
      );
    }

    const deleted = deleteTower(towerId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Conjunto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tower: deleted });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al eliminar conjunto" },
      { status: 500 }
    );
  }
}
