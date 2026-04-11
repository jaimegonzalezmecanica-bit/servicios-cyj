#!/bin/bash
# build-apk.sh - Build APK for Servicios Integrales CyJ
# The server URL is now CONFIGURABLE FROM THE APP (Profile > Server Config)
# The URL below is just the DEFAULT — users can change it in the app settings
#
# IMPORTANT: All devices MUST connect to the SAME server URL to share:
#   - SOS alerts (real-time alarm on ALL devices)
#   - Regular alerts and reports
#   - Map configuration and markers
#   - User data and announcements

set -e

echo "============================================"
echo "  BUILDING APK - Servicios CyJ v2.1.0"
echo "  Real-Time Security Platform"
echo "============================================"

cd /home/z/my-project

# =============================================
# DEFAULT SERVER URL
# Users can CHANGE this from the app:
#   Profile > Configuracion del Servidor
#
# The URL below is baked-in as default but
# can be overridden in-app at any time.
# =============================================
SERVER_URL="${CYJ_SERVER_URL:-http://10.0.2.2:3000}"
echo ""
echo "[CONFIG] Default Server URL: $SERVER_URL"
echo ""
echo "  USERS CAN CHANGE THE URL IN THE APP:"
echo "    Perfil > Configuracion del Servidor"
echo ""
echo "  EXAMPLES:"
echo "    Android emulator (same PC):   http://10.0.2.2:3000"
echo "    Real devices on same WiFi:    http://192.168.1.100:3000"
echo "    Deployed server (VPS):        https://seguridad.cyj.cl"
echo "    Server with IP:               http://45.67.89.123:3000"
echo ""
echo "  TO CHANGE DEFAULT: export CYJ_SERVER_URL=http://YOUR_SERVER:3000"
echo ""

# Step 1: Backup API routes (static export can't have API routes)
echo "[1/7] Backing up API routes..."
API_BACKUP="/tmp/api_routes_backup"
rm -rf "$API_BACKUP"
cp -r src/app/api "$API_BACKUP"

# Step 2: Remove API routes for static export
echo "[2/7] Removing API routes for static export..."
rm -rf src/app/api

# Step 3: Update next.config.ts for static export
echo "[3/7] Configuring Next.js for static export..."
cat > next.config.ts << 'NEXTCONFIG'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
NEXTCONFIG

# Step 4: Build static export with SERVER_URL baked in
echo "[4/7] Building static export with server URL..."
rm -rf out
NEXT_PUBLIC_SERVER_URL="$SERVER_URL" npx next build 2>&1 | tail -5

# Step 5: Sync with Capacitor
echo "[5/7] Syncing with Capacitor..."
npx cap sync android 2>&1 | tail -3

# Step 6: Build APK
echo "[6/7] Building APK..."
export ANDROID_HOME="/home/z/android-sdk"
export JAVA_HOME="/tmp/jdk-21.0.2"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH"

cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1 | tail -10
cd ..

# Copy APK to download
cp android/app/build/outputs/apk/debug/app-debug.apk download/Servicios-CyJ.apk

# Step 7: Restore API routes and config
echo "[7/7] Restoring API routes and config..."
rm -rf src/app/api
cp -r "$API_BACKUP" src/app/api
rm -rf "$API_BACKUP"

cat > next.config.ts << 'NEXTCONFIG'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
NEXTCONFIG

echo ""
echo "============================================"
echo "  APK BUILT SUCCESSFULLY!"
echo "  Location: download/Servicios-CyJ.apk"
echo "  Default URL: $SERVER_URL"
echo "============================================"
echo ""
echo "  SERVER URL IS NOW CONFIGURABLE IN THE APP!"
echo "  Users can change it from:"
echo "    Perfil > Configuracion del Servidor"
echo ""
echo "  IMPORTANT: The server must be running and"
echo "  accessible from all devices."
echo ""
echo "  To deploy the server (always online):"
echo "    1. Get a VPS/server (DigitalOcean, AWS, etc.)"
echo "    2. Install Node.js and run: node server.js"
echo "    3. Set up HTTPS (recommended)"
echo "    4. All devices connect to your server URL"
echo ""
echo "  To test locally (same WiFi):"
echo "    CYJ_SERVER_URL=http://192.168.1.XXX:3000 bash build-apk.sh"
echo ""
ls -lh download/Servicios-CyJ.apk
