import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Servicios CyJ API v1.0" });
}
