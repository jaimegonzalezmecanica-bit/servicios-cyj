#!/bin/bash
# build-apk.sh - Build APK for Servicios Integrales CyJ
# Architecture: Client-Server (APK connects to real backend)
# All devices share data through the server's SQLite database

set -e

echo "============================================"
echo "  BUILDING APK - Servicios CyJ"
echo "  (Client-Server Architecture)"
echo "============================================"

cd /home/z/my-project

# =============================================
# CONFIGURE SERVER URL HERE
# This is the URL where your Next.js server runs
# All devices must be able to reach this URL
# =============================================
SERVER_URL="${CYJ_SERVER_URL:-http://10.0.2.2:3000}"
echo "[CONFIG] Server URL: $SERVER_URL"
echo "[NOTE] For Android emulator, 10.0.2.2 = host machine localhost"
echo "[NOTE] For real devices on same WiFi, use your computer's LAN IP"
echo "[NOTE] For production, use your deployed server URL (https://...)"
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
echo "  Server URL: $SERVER_URL"
echo "============================================"
echo ""
echo "IMPORTANT: The server must be running at:"
echo "  $SERVER_URL"
echo ""
echo "To start the server:"
echo "  bun run dev"
echo ""
echo "For real devices on the same WiFi:"
echo "  CYJ_SERVER_URL=http://YOUR_LAN_IP:3000 bash build-apk.sh"
echo ""
ls -lh download/Servicios-CyJ.apk
