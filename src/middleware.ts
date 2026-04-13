import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CORS middleware - allows APK (Capacitor https://localhost) to access the API
export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const response = NextResponse.next();

  // Allow all origins (needed for APK, PWA, and any client)
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  // Return early for preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// Apply to all API routes
export const config = {
  matcher: ["/api/:path*"],
};
