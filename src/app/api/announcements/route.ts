import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded, getAllAnnouncements, addAnnouncement } from "@/lib/store";

export async function GET() {
  try {
    await ensureSeeded();
    const announcements = await getAllAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('[API /announcements GET] Error:', error);
    return NextResponse.json({ announcements: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { title, description, priority, author } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Título y descripción son requeridos" },
        { status: 400 }
      );
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const newAnnouncement = await addAnnouncement({
      id: `a_${Date.now()}`,
      title,
      description,
      date: dateStr,
      author: author || "Administración CyJ",
      priority: (priority || "info") as "info" | "warning" | "important",
    });

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('[API /announcements POST] Error:', error);
    return NextResponse.json({ success: false, error: "Error al crear anuncio" }, { status: 500 });
  }
}
