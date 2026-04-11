---
Task ID: 2
Agent: Main Agent
Task: Resolver problema de IP/servidor - Hacer configurable la URL del servidor desde la app

Work Log:
- Rewrote `/src/lib/offline-api.ts` - Server URL now configurable from app settings (localStorage priority over baked-in URL)
- Added `testServerConnection()` - Tests any URL and returns success/failure with response time
- Added `changeServerUrl()` - Changes server URL with connection test
- Added `getCurrentServerUrl()` - Returns current active URL for display
- Added `/src/app/api/server-info/route.ts` - API endpoint returning server stats
- Updated `/src/app/page.tsx` ProfileTab - New "Configuracion del Servidor" section with:
  - URL input field with globe icon
  - Connection test button (with spinner animation)
  - Save and Reset buttons
  - Status indicator (Conectado/Desconectado/Probando)
  - Example URLs (WiFi, cloud, public IP, emulator)
  - Auto-test connection on mount
- Updated TopBar with real-time connection status (Wifi/WifiOff icon + dot indicator)
- Added server connection monitor (checks every 30s when logged in)
- Updated `build-apk.sh` - Better docs about configurable URL feature
- Created `deploy-server.sh` - Complete deployment guide with 4 options:
  - Option 1: Local server (same WiFi)
  - Option 2: VPS/Cloud server (DigitalOcean, Hetzner, etc.)
  - Option 3: Domain + HTTPS (Nginx + Let's Encrypt)
  - Option 4: Cloudflare Tunnel (quick, free, no VPS needed)
- Rebuilt APK (9.5MB) at download/Servicios-CyJ.apk

Stage Summary:
- Server URL is now CONFIGURABLE from the app (Profile > Configuracion del Servidor)
- Users can test connection before saving
- Connection status shown in TopBar (green/red Wifi icon)
- APK default: http://10.0.2.2:3000 (emulator) — users change it in-app
- deploy-server.sh provides complete guide for 4 deployment scenarios
- All devices connect to same server URL = shared alerts, SOS, map data
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
