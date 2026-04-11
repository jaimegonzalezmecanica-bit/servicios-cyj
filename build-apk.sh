#!/bin/bash
# build-apk.sh - Build standalone APK for Servicios Integrales CyJ
# This script creates a fully offline APK that works without any server

set -e

echo "============================================"
echo "  BUILDING STANDALONE APK - Servicios CyJ"
echo "============================================"

cd /home/z/my-project

# Step 1: Backup API routes (static export can't have API routes)
echo "[1/6] Backing up API routes..."
API_BACKUP="/tmp/api_routes_backup"
rm -rf "$API_BACKUP"
cp -r src/app/api "$API_BACKUP"

# Step 2: Remove API routes for static export
echo "[2/6] Removing API routes for static export..."
rm -rf src/app/api

# Step 3: Update next.config.ts for static export
echo "[3/6] Configuring Next.js for static export..."
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

# Step 4: Build static export
echo "[4/6] Building static export..."
rm -rf out
npx next build 2>&1 | tail -5

# Step 5: Sync with Capacitor
echo "[5/6] Syncing with Capacitor..."
npx cap sync android 2>&1 | tail -3

# Step 6: Build APK
echo "[6/6] Building APK..."
export ANDROID_HOME="/home/z/android-sdk"
export JAVA_HOME="/tmp/jdk-21.0.2"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH"

cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1 | tail -10
cd ..

# Copy APK to download
cp android/app/build/outputs/apk/debug/app-debug.apk download/Servicios-CyJ.apk
echo ""
echo "============================================"
echo "  APK BUILT SUCCESSFULLY!"
echo "  Location: download/Servicios-CyJ.apk"
echo "============================================"

# Step 7: Restore API routes and config
echo "[RESTORE] Restoring API routes and config..."
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

# Restart dev server
echo "[DONE] Dev server config restored. Run 'bun run dev' to continue development."
echo ""
ls -lh download/Servicios-CyJ.apk
