import { NextRequest, NextResponse } from "next/server";
import { getAllAnnouncements, addAnnouncement } from "@/lib/store";
import type { Announcement } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ announcements: getAllAnnouncements() });
}

export async function POST(request: NextRequest) {
  try {
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

    const newAnnouncement: Announcement = {
      id: `a_${Date.now()}`,
      title,
      description,
      date: dateStr,
      author: author || "Administración CyJ",
      priority: (priority || "info") as "info" | "warning" | "important",
    };

    addAnnouncement(newAnnouncement);

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al crear anuncio" },
      { status: 500 }
    );
  }
}
