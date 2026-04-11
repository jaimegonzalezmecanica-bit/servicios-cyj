#!/bin/bash
# deploy-server.sh - Deploy Servicios CyJ to a server with fixed IP
# This script makes the app "always online" by setting up a production server
#
# USAGE:
#   1. Copy this project to your server (VPS, dedicated server, etc.)
#   2. Run: bash deploy-server.sh
#   3. The app will be available 24/7 on your server's IP
#
# REQUIREMENTS: A server (VPS) with Ubuntu/Debian, 1GB RAM minimum
# Recommended: DigitalOcean, Linode, AWS Lightsail, Hetzner ($5-10/month)

set -e

echo "============================================"
echo "  DEPLOY SERVER - Servicios CyJ"
echo "  24/7 Online Security Platform"
echo "============================================"
echo ""

# ─── CONFIGURATION ───
# Change these values to match your server
APP_NAME="servicios-cyj"
APP_DIR="/opt/servicios-cyj"
APP_PORT=3000
DOMAIN=""  # Set this if you have a domain (e.g., "seguridad.cyj.cl")

# ─── INSTALL DEPENDENCIES ───
echo "[1/6] Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq curl unzip sqlite3 > /dev/null 2>&1
fi

# Install Bun if not present
if ! command -v bun &> /dev/null; then
    echo "[INFO] Installing Bun runtime..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# ─── SETUP APP DIRECTORY ───
echo "[2/6] Setting up application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$USER "$APP_DIR"

# Copy project files to app directory
if [ "$(pwd)" != "$APP_DIR" ]; then
    echo "[INFO] Copying project files to $APP_DIR..."
    rsync -a --exclude='node_modules' --exclude='.next' --exclude='android' --exclude='ios' --exclude='upload' \
        ./ "$APP_DIR/"
    cd "$APP_DIR"
fi

# ─── INSTALL NPM DEPENDENCIES ───
echo "[3/6] Installing dependencies..."
bun install --production 2>&1 | tail -3

# ─── SETUP DATABASE ───
echo "[4/6] Setting up database..."
mkdir -p db
if [ ! -f db/custom.db ]; then
    echo "[INFO] Creating new database..."
    bunx prisma db push --skip-generate 2>&1 | tail -3
    bunx prisma generate 2>&1 | tail -2
fi

# ─── BUILD APPLICATION ───
echo "[5/6] Building production application..."
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 bun run build 2>&1 | tail -5

# ─── SETUP SYSTEMD SERVICE (auto-start on boot) ───
echo "[6/6] Creating systemd service for auto-start..."
sudo tee /etc/systemd/system/${APP_NAME}.service > /dev/null << EOF
[Unit]
Description=Servicios Integrales CyJ - Security Platform
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
Environment=DATABASE_URL=file:./db/custom.db
ExecStart=$(which bun) run start
Restart=always
RestartSec=5
StandardOutput=append:/var/log/${APP_NAME}.log
StandardError=append:/var/log/${APP_NAME}-error.log

# Resource limits
MemoryMax=512M
CPUQuota=100%

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ${APP_NAME}
sudo systemctl restart ${APP_NAME}

echo ""
echo "============================================"
echo "  DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "  Server Status: Running"
echo "  App URL: http://$(hostname -I | awk '{print $1}'):$APP_PORT"
echo "  Log file: /var/log/${APP_NAME}.log"
echo ""
echo "  Commands:"
echo "    sudo systemctl status $APP_NAME    # Check status"
echo "    sudo systemctl restart $APP_NAME   # Restart"
echo "    sudo journalctl -u $APP_NAME -f    # Live logs"
echo ""
echo "  To build the APK with this server URL:"
echo "    CYJ_SERVER_URL=http://$(hostname -I | awk '{print $1}'):3000 bash build-apk.sh"
echo ""

# Show status
sleep 2
sudo systemctl status ${APP_NAME} --no-pager -l 2>&1 | head -15
