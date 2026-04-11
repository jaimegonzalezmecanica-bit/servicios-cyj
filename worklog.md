---
Task ID: 1
Agent: Main Agent
Task: Implementar sistema de notificaciones en tiempo real (SSE) y deployment para servidor siempre online

Work Log:
- Created `/src/lib/event-bus.ts` - In-memory event broadcaster for Server-Sent Events
- Created `/src/app/api/events/route.ts` - SSE endpoint for real-time notifications
- Updated `/src/app/api/sos/route.ts` - Now broadcasts SOS to ALL connected devices
- Updated `/src/app/api/alert/route.ts` - Now broadcasts alerts and status changes
- Updated `/src/app/api/map-config/route.ts` - Now broadcasts map changes
- Updated `/src/app/page.tsx` - Replaced polling with SSE + polling fallback
- Created `deploy-server.sh` - Systemd deployment script for 24/7 server
- Updated `build-apk.sh` - Better documentation and URL configuration
- Updated `Caddyfile` - Reverse proxy with SSE support and HTTPS guide
- Built APK (9.5MB) at download/Servicios-CyJ.apk

Stage Summary:
- SOS now sounds on ALL connected devices instantly via SSE (not just polling)
- Map sync works via /api/map-config (perimeter + entrance shared across devices)
- Server can be deployed 24/7 using deploy-server.sh (systemd service)
- APK built with placeholder URL that needs to be configured with real server IP
- Caddyfile ready for HTTPS reverse proxy setup
