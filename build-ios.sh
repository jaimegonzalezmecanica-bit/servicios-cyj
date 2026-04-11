#!/bin/bash
# build-ios.sh - Build standalone iOS project for Servicios Integrales CyJ
# This script prepares the web assets and syncs with the Capacitor iOS project
# NOTE: Final IPA build must be done on a Mac with Xcode

set -e

echo "============================================"
echo "  BUILDING iOS PROJECT - Servicios CyJ"
echo "============================================"

cd /home/z/my-project

# Step 1: Backup API routes (static export can't have API routes)
echo "[1/6] Backing up API routes..."
API_BACKUP="/tmp/api_routes_backup_ios"
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

# Step 5: Sync with Capacitor iOS
echo "[5/6] Syncing with Capacitor iOS..."
npx cap sync ios 2>&1 | tail -10

# Step 6: Restore API routes and config
echo "[6/6] Restoring API routes and config..."
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
echo "  iOS PROJECT READY!"
echo "============================================"
echo ""
echo "The iOS Xcode project is now ready at: ios/"
echo ""
echo "To build the IPA on a Mac:"
echo "  1. Copy the entire project to a Mac"
echo "  2. Open ios/App/App.xcworkspace in Xcode"
echo "  3. Select your team/developer account"
echo "  4. Set deployment target to iOS 15.0+"
echo "  5. Build: Product > Build (Cmd+B)"
echo "  6. Archive: Product > Archive (for App Store)"
echo "  7. Or: Product > Build For > Running (for testing)"
echo ""
echo "For ad-hoc distribution:"
echo "  1. Archive the app in Xcode"
echo "  2. Distribute App > Ad Hoc"
echo "  3. Export the IPA file"
echo ""
echo "App ID: cl.cyj.security"
echo "App Name: Servicios Integrales CyJ"
echo ""
