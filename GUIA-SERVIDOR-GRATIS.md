# ═══════════════════════════════════════════════════════════════════════════
#  GUÍA DE DESPLIEGUE - SERVIDOR GRATIS PARA SIEMPRE
#  Servicios Integrales CyJ - Seguridad Comunitaria
# ═══════════════════════════════════════════════════════════════════════════
#
#  Resumen rápido: Oracle Cloud te da un servidor GRATIS PARA SIEMPRE.
#  Con ese servidor, tu app CyJ estará online 24 horas, 7 días.
#  Todos los dispositivos (celulares, PCs) se conectan a ese servidor
#  y comparten alertas SOS, reportes, datos del mapa, etc.
#
# ═══════════════════════════════════════════════════════════════════════════
#  OPCIÓN 1: ORACLE CLOUD ALWAYS FREE (RECOMENDADA)
# ═══════════════════════════════════════════════════════════════════════════
#
#  ¿Qué obtienes GRATIS para siempre?
#  - Servidor VPS: 4 núcleos ARM, 24 GB RAM
#  - Disco: 200 GB (suficiente para años de datos)
#  - Ancho de banda: 10 TB por mes (enorme)
#  - No caduca nunca, no hay cobros si no excedes los límites free
#
#  ¿Qué necesitas?
#  - Una cuenta de email
#  - Una tarjeta de crédito o débito (SOLO para verificación,
#    NO se hace ningún cargo. Puedes usar una tarjeta virtual/prepaga)
#  - 30 minutos de tu tiempo
#
# ─── PASO 1: Crear cuenta en Oracle Cloud ─────────────────────────────
#
#  1. Ve a: https://cloud.oracle.com/es/cl/tryit
#  2. Haz clic en "Comenzar gratis"
#  3. Llena tus datos: nombre, email, país (Chile)
#  4. Verifica tu email
#  5. Ingresa datos de facturación (tarjeta de crédito/débito)
#     - Se hace un cargo temporal de ~$1 USD que se devuelve
#     - NO se te cobrará nada mientras uses solo los servicios "Always Free"
#  6. Elige tu "Home Region": sa-santiago-1 (Santiago, Chile)
#     Si no está disponible: sa-vinhedo-1 (Brasil) o us-ashburn-1 (EE.UU.)
#  7. Espera la activación (puede tardar unos minutos a horas)
#
# ─── PASO 2: Crear la instancia del servidor ──────────────────────────
#
#  1. Inicia sesión en: https://cloud.oracle.com
#  2. En el menú (hamburguesa ☰) ve a:
#     Compute > Instances
#  3. Haz clic en "Create Instance"
#  4. Configura:
#     - Name: cyj-server
#     - Image: Canonical Ubuntu 22.04 (o 24.04)
#     - Shape: Selecciona "Ampere A1" (es el gratis)
#       IMPORTANTE: Debe decir "Always Free Eligible"
#       Si dice A1 Flex, pon:
#       - OCPU: 4
#       - Memory: 24 GB
#       (Esto sigue siendo gratis dentro del límite)
#     - SSH Key: 
#       OPCIÓN A: Genera una nueva (descarga la key privada .key)
#       OPCIÓN B: Pega tu clave pública SSH si ya tienes una
#     - Boot volume: 200 GB (el máximo gratis)
#  5. Haz clic en "Create"
#  6. Espera ~5 minutos a que se cree la instancia
#  7. Anota la "Public IP Address" que aparece
#
# ─── PASO 3: Configurar el firewall del servidor ──────────────────────
#
#  1. En tu instancia, ve a "Subnet" > clic en el link del subnet
#  2. Ve a "Security Lists" > clic en la default
#  3. Haz clic en "Add Ingress Rules"
#  4. Agrega estas reglas:
#     - Source CIDR: 0.0.0.0/0
#     - Protocol: TCP
#     - Destination Port: 3000
#     (Esto permite que los celulares se conecten al servidor)
#  5. Guarda
#
#  También necesitas abrir el puerto en la instancia:
#  1. Vuelve a Compute > Instances > cyj-server
#  2. Ve a "Networking" > "Virtual Cloud Network" > clic en el link
#  3. "Security Lists" > la default > "Add Ingress Rules"
#  4. Source: 0.0.0.0/0, Protocol: TCP, Port: 3000
#
# ─── PASO 4: Conectarte al servidor por SSH ───────────────────────────
#
#  DESDE LINUX/MAC:
#  1. Abre terminal
#  2. chmod 600 la-key-que-descargaste.key
#  3. ssh -i la-key-que-descargaste.key ubuntu@TU_PUBLIC_IP
#
#  DESDE WINDOWS:
#  1. Abre PowerShell o CMD
#  2. ssh -i la-key-que-descargaste.key ubuntu@TU_PUBLIC_IP
#  O usa PuTTY (necesitas convertir la key a .ppk)
#
#  Si preguntas la contraseña de ubuntu, prueba:
#  - La clave SSH no tiene contraseña (solo presiona Enter)
#
# ─── PASO 5: Instalar todo en el servidor ─────────────────────────────
#
#  COPIA Y PEGA ESTE BLOQUE ENTERO EN EL SSH:
#
#  ┌─────────────────────────────────────────────────────────────────┐
#  │  # Actualizar sistema                                           │
#  │  sudo apt update && sudo apt upgrade -y                         │
#  │                                                                 │
#  │  # Instalar Node.js 20                                          │
#  │  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -│
#  │  sudo apt install -y nodejs                                      │
#  │  node --version    # Debe decir v20.x                           │
#  │  npm --version                                                  │
#  │                                                                 │
#  │  # Instalar PM2 (para que el servidor se reinicie solo)         │
#  │  sudo npm install -g pm2                                       │
#  │                                                                 │
#  │  # Crear carpeta del proyecto                                   │
#  │  mkdir -p ~/cyj-server/data ~/cyj-server/logs                   │
#  │  cd ~/cyj-server                                                │
#  │                                                                 │
#  │  # Crear archivo de variable de entorno                         │
#  │  echo "DATABASE_URL=file:/root/cyj-server/data/custom.db" > .env│
#  │  echo "NODE_ENV=production" >> .env                              │
#  │  echo "PORT=3000" >> .env                                       │
#  └─────────────────────────────────────────────────────────────────┘
#
# ─── PASO 6: Subir los archivos del proyecto ──────────────────────────
#
#  DESDE TU COMPUTADORA LOCAL (después de cerrar SSH):
#
#  OPCIÓN A: Con SCP (desde terminal):
#  ┌─────────────────────────────────────────────────────────────────┐
#  │  # Subir archivos (reemplaza TU_KEY y TU_IP)                   │
#  │  scp -i TU_KEY.key -r /home/z/my-project/* \                    │
#  │      ubuntu@TU_IP:~/cyj-server/                                 │
#  │                                                                 │
#  │  EXCLUIR carpetas pesadas (node_modules, .next, android, ios): │
#  │  rsync -avz --exclude='node_modules' --exclude='.next' \        │
#  │    --exclude='android' --exclude='ios' --exclude='.git' \       │
#  │    -e "ssh -i TU_KEY.key" \                                     │
#  │    /home/z/my-project/ ubuntu@TU_IP:~/cyj-server/               │
#  └─────────────────────────────────────────────────────────────────┘
#
#  OPCIÓN B: Con WinSCP (Windows):
#  1. Descarga WinSCP: https://winscp.net
#  2. Conéctate con tu IP, usuario ubuntu, y la clave SSH
#  3. Arrastra los archivos del proyecto a ~/cyj-server/
#
# ─── PASO 7: Construir e iniciar el servidor ─────────────────────────
#
#  CONÉCTATE POR SSH NUEVAMENTE y ejecuta:
#
#  ┌─────────────────────────────────────────────────────────────────┐
#  │  cd ~/cyj-server                                               │
#  │                                                                 │
#  │  # Instalar dependencias                                       │
#  │  npm install                                                   │
#  │                                                                 │
#  │  # Generar cliente Prisma                                       │
#  │  npx prisma generate                                           │
#  │                                                                 │
#  │  # Crear la base de datos                                      │
#  │  npx prisma db push                                            │
#  │                                                                 │
#  │  # Construir la app (Next.js standalone)                       │
#  │  npx next build                                                │
#  │  cp -r .next/static .next/standalone/.next/                    │
#  │  cp -r public .next/standalone/                                │
#  │                                                                 │
#  │  # Iniciar con PM2                                             │
#  │  pm2 start ecosystem.config.cjs                                │
#  │  pm2 save                                                      │
#  │  pm2 startup                                                   │
#  │                                                                 │
#  │  # Verificar que funciona                                      │
#  │  curl http://localhost:3000/api/alerts                          │
#  │                                                                 │
#  │  # PROBAR DESDE TU CELULAR:                                    │
#  │  # Abre el navegador y ve a:                                   │
#  │  # http://TU_PUBLIC_IP:3000                                     │
#  └─────────────────────────────────────────────────────────────────┘
#
# ─── PASO 8: Configurar la app CyJ ───────────────────────────────────
#
#  1. En tu celular, abre la app CyJ
#  2. Ve a Perfil > Configuración del Servidor
#  3. Escribe: http://TU_PUBLIC_IP:3000
#  4. Presiona "Probar Conexión" — debe decir "Conectado"
#  5. Presiona "Guardar URL"
#  6. ¡Listo! Tu app está online para siempre
#
# ─── PASO 9: (OPCIONAL) Configurar dominio + HTTPS ───────────────────
#
#  Si quieres una URL más bonita (ej: https://seguridad-cyj.cl):
#
#  1. Compra un dominio (.cl en nic.cl, .com en namecheap, etc.)
#  2. Crea un registro DNS tipo A apuntando a TU_PUBLIC_IP
#  3. Instala Nginx + Certbot en el servidor:
#
#     sudo apt install nginx certbot python3-certbot-nginx -y
#
#     sudo tee /etc/nginx/sites-available/cyj << 'EOF'
#     server {
#         listen 80;
#         server_name tu-dominio.cl;
#         location / {
#             proxy_pass http://localhost:3000;
#             proxy_http_version 1.1;
#             proxy_set_header Upgrade $http_upgrade;
#             proxy_set_header Connection "upgrade";
#             proxy_set_header Host $host;
#             proxy_cache_bypass $http_upgrade;
#         }
#     }
#     EOF
#
#     sudo ln -s /etc/nginx/sites-available/cyj /etc/nginx/sites-enabled/
#     sudo nginx -t && sudo systemctl restart nginx
#     sudo certbot --nginx -d tu-dominio.cl
#
#  4. En la app, configura: https://tu-dominio.cl
#
# ═══════════════════════════════════════════════════════════════════════════
#  OPCIÓN 2: KOYEB FREE TIER (más fácil, sin tarjeta)
# ═══════════════════════════════════════════════════════════════════════════
#
#  Ventajas:
#  - NO requiere tarjeta de crédito
#  - Despliegue desde GitHub en minutos
#  - Incluye base de datos gratis
#
#  Desventajas:
#  - El servidor se "duerme" si no hay actividad (se despierta en ~30s)
#  - Los datos de SQLite pueden perderse al redeploy (usa la DB de Koyeb)
#
#  Pasos:
#  1. Ve a: https://www.koyeb.com y crea cuenta (con GitHub)
#  2. Sube tu proyecto a GitHub (repo privado o público)
#  3. En Koyeb: "Create Service" > "Git" > elige tu repo
#  4. Build command: npm install && npx prisma generate && npx next build
#  5. Run command: node .next/standalone/server.js
#  6. Port: 3000
#  7. Agrega environment variable: DATABASE_URL=file:/app/data/custom.db
#  8. Deploy
#  9. Koyeb te dará una URL como: https://cyj-server-xxx.koyeb.app
#  10. En la app, configura esa URL
#
# ═══════════════════════════════════════════════════════════════════════════
#  OPCIÓN 3: RENDER FREE (sin tarjeta, se apaga)
# ═══════════════════════════════════════════════════════════════════════════
#
#  1. Ve a: https://render.com y crea cuenta (con GitHub)
#  2. "New" > "Web Service"
#  3. Conecta tu repo de GitHub
#  4. Build: npm install && npx prisma generate && npx next build
#  5. Start: node .next/standalone/server.js
#  6. Agrega env var: DATABASE_URL=file:/app/data/custom.db
#  7. Deploy
#  8. NOTA: Se apaga tras 15 min sin uso. La primera petición tarda ~30s
#
# ═══════════════════════════════════════════════════════════════════════════
#  COMPARACIÓN RÁPIDA
# ═══════════════════════════════════════════════════════════════════════════
#
#  ┌─────────────┬────────────┬──────────┬──────────┬────────────────┐
#  │             │ GRATIS     │ TARJETA  │ 24/7     │ DATOS          │
#  │             │ PARA SIEMPRE│ DE CREDITO│ ONLINE   │ PERSISTENTES  │
#  ├─────────────┼────────────┼──────────┼──────────┼────────────────┤
#  │ Oracle Cloud│    SÍ      │    SÍ    │   SÍ     │     SÍ         │
#  │ Koyeb       │    SÍ      │    NO    │   NO*    │  LIMITADO**    │
#  │ Render      │    SÍ      │    NO    │   NO*    │     SÍ         │
#  └─────────────┴────────────┴──────────┴──────────┴────────────────┘
#
#  * Se duerme si no hay actividad, se despierta al recibir un request
#  ** Los datos en SQLite pueden perderse al redeploy; mejor usar DB de Koyeb
#
#  RECOMENDACIÓN: Oracle Cloud es la mejor opción porque:
#  - Es gratis PARA SIEMPRE (los otros pueden cambiar sus planes)
#  - Está online 24/7 (no se duerme)
#  - Tiene disco persistente de 200 GB
#  - Es un VPS real (tienes control total)
#  - 4 núcleos y 24 GB RAM son más que suficiente
#
# ═══════════════════════════════════════════════════════════════════════════
