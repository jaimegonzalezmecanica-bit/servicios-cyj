module.exports = {
  apps: [{
    name: "cyj-server",
    script: "node",
    args: ".next/standalone/server.js",
    cwd: "/root/cyj-server",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      DATABASE_URL: "file:/root/cyj-server/data/custom.db",
      HOSTNAME: "0.0.0.0"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    error_file: "/root/cyj-server/logs/error.log",
    out_file: "/root/cyj-server/logs/out.log",
    time: true
  }]
};
