import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/store";
import { db } from "@/lib/db-server";

// GET /api/map-config - Get map configuration (perimeter, entrance, etc.)
export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      // Get specific config value
      const config = await db.mapConfig.findUnique({ where: { key } });
      if (!config) {
        // Return defaults for perimeter and entrance
        if (key === "perimeter") {
          return NextResponse.json({
            key,
            value: [
              { lat: -33.3250, lng: -70.7610 },
              { lat: -33.3250, lng: -70.7650 },
              { lat: -33.3298, lng: -70.7650 },
              { lat: -33.3298, lng: -70.7610 },
            ],
          });
        }
        if (key === "entrance") {
          return NextResponse.json({
            key,
            value: { lat: -33.3298, lng: -70.7630 },
          });
        }
        return NextResponse.json({ key, value: null });
      }
      return NextResponse.json({ key, value: JSON.parse(config.value) });
    }

    // Get all config values
    const configs = await db.mapConfig.findMany();
    const result: Record<string, any> = {};
    for (const c of configs) {
      result[c.key] = JSON.parse(c.value);
    }

    // Ensure defaults exist
    if (!result.perimeter) {
      result.perimeter = [
        { lat: -33.3250, lng: -70.7610 },
        { lat: -33.3250, lng: -70.7650 },
        { lat: -33.3298, lng: -70.7650 },
        { lat: -33.3298, lng: -70.7610 },
      ];
    }
    if (!result.entrance) {
      result.entrance = { lat: -33.3298, lng: -70.7630 };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /map-config GET] Error:', error);
    return NextResponse.json({ error: "Error al obtener configuración del mapa" }, { status: 500 });
  }
}

// PUT /api/map-config - Save map configuration
export async function PUT(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "key y value son requeridos" }, { status: 400 });
    }

    await db.mapConfig.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });

    console.log(`[API /map-config] Updated ${key}`);
    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error('[API /map-config PUT] Error:', error);
    return NextResponse.json({ success: false, error: "Error al guardar configuración" }, { status: 500 });
  }
}
