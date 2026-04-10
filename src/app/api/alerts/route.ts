import { NextResponse } from "next/server";
import { mockAlerts } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    alerts: mockAlerts,
    total: mockAlerts.length,
  });
}
