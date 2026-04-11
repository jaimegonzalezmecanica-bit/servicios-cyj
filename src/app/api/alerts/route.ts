import { NextResponse } from "next/server";
import { getAllAlerts } from "@/lib/store";

export async function GET() {
  const allAlerts = getAllAlerts();
  return NextResponse.json({
    alerts: allAlerts,
    total: allAlerts.length,
  });
}
