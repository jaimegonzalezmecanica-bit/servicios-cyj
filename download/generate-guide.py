#!/usr/bin/env python3
"""Generate PDF guide: How to deploy Servicios CyJ to Railway.app"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Fonts ━━
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

# ━━ Palette ━━
ACCENT = colors.HexColor('#cf223f')
TEXT_PRIMARY = colors.HexColor('#222426')
TEXT_MUTED = colors.HexColor('#797f85')
BG_SURFACE = colors.HexColor('#d7dce1')
BG_PAGE = colors.HexColor('#f1f2f3')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ━━ Styles ━━
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    name='MainTitle', fontName='SimHei', fontSize=28,
    leading=36, alignment=TA_CENTER, textColor=TEXT_PRIMARY,
    spaceAfter=6
)
subtitle_style = ParagraphStyle(
    name='Subtitle', fontName='SimHei', fontSize=14,
    leading=20, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceAfter=24
)
h1_style = ParagraphStyle(
    name='H1', fontName='SimHei', fontSize=20,
    leading=28, textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=12,
)
h2_style = ParagraphStyle(
    name='H2', fontName='SimHei', fontSize=16,
    leading=22, textColor=ACCENT, spaceBefore=14, spaceAfter=8,
)
h3_style = ParagraphStyle(
    name='H3', fontName='SimHei', fontSize=13,
    leading=18, textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6,
)
body_style = ParagraphStyle(
    name='Body', fontName='SimHei', fontSize=10.5,
    leading=18, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    wordWrap='CJK', spaceAfter=6,
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='SimHei', fontSize=10.5,
    leading=18, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    wordWrap='CJK', leftIndent=20, bulletIndent=8,
    spaceAfter=4,
)
code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=9,
    leading=14, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    backColor=colors.HexColor('#f5f5f5'),
    leftIndent=16, rightIndent=16,
    topPadding=6, bottomPadding=6,
    spaceAfter=8, spaceBefore=4,
)
note_style = ParagraphStyle(
    name='Note', fontName='SimHei', fontSize=10,
    leading=16, alignment=TA_LEFT, textColor=colors.HexColor('#b91c1c'),
    leftIndent=12, wordWrap='CJK', spaceAfter=8, spaceBefore=4,
)
header_cell = ParagraphStyle(
    name='HeaderCell', fontName='SimHei', fontSize=10,
    leading=14, textColor=colors.white, alignment=TA_CENTER,
)
cell_style = ParagraphStyle(
    name='Cell', fontName='SimHei', fontSize=9.5,
    leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
    wordWrap='CJK',
)
cell_center = ParagraphStyle(
    name='CellCenter', fontName='SimHei', fontSize=9.5,
    leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER,
    wordWrap='CJK',
)
footer_style = ParagraphStyle(
    name='Footer', fontName='SimHei', fontSize=8,
    leading=12, alignment=TA_CENTER, textColor=TEXT_MUTED,
)

# ━━ Helpers ━━
def heading(text, level=1):
    s = {1: h1_style, 2: h2_style, 3: h3_style}[level]
    return Paragraph(f'<b>{text}</b>', s)

def para(text):
    return Paragraph(text, body_style)

def bullet(text):
    return Paragraph(f'- {text}', bullet_style)

def note(text):
    return Paragraph(f'Importante: {text}', note_style)

def code(text):
    return Paragraph(text, code_style)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceBefore=8, spaceAfter=8)

def make_table(headers, rows, col_widths=None):
    data = []
    header_row = [Paragraph(f'<b>{h}</b>', header_cell) for h in headers]
    data.append(header_row)
    for row in rows:
        data.append([Paragraph(str(c), cell_style) for c in row])
    
    available = A4[0] - 2 * inch
    if col_widths is None:
        n = len(headers)
        col_widths = [available / n] * n
    else:
        total = sum(col_widths)
        if total < available * 0.85:
            scale = (available * 0.90) / total
            col_widths = [w * scale for w in col_widths]
    
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_ODD if i % 2 == 0 else TABLE_ROW_EVEN
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


# ━━ Build Document ━━
output_path = '/home/z/my-project/download/Guia-Railway-Servicios-CyJ.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=1.0*inch, rightMargin=1.0*inch,
    topMargin=0.8*inch, bottomMargin=0.8*inch,
)

story = []

# ── COVER ──
story.append(Spacer(1, 120))
story.append(Paragraph('<b>Guia Completa para Desplegar</b>', title_style))
story.append(Paragraph('<b>Servicios Integrales CyJ</b>', title_style))
story.append(Spacer(1, 16))
story.append(Paragraph('Servidor GRATIS en Railway.app', subtitle_style))
story.append(Paragraph('Sin tarjeta de credito - Siempre en linea', subtitle_style))
story.append(Spacer(1, 40))
story.append(hr())
story.append(Spacer(1, 12))
story.append(Paragraph('Esta guia te explica paso a paso como subir tu aplicacion de seguridad comunitaria a Internet de forma gratuita, usando Railway.app. No necesitas tarjeta de credito, solo una cuenta de GitHub. El servidor estara activo las 24 horas, los 7 dias de la semana.', body_style))
story.append(Spacer(1, 8))
story.append(Paragraph('Abril 2026', footer_style))
story.append(PageBreak())

# ── SECTION 1: QUE ES RAILWAY ──
story.append(heading('1. Que es Railway.app'))
story.append(Spacer(1, 8))
story.append(para('Railway.app es una plataforma de hospedaje en la nube que te permite alojar aplicaciones web de forma gratuita. Es ideal para proyectos pequenos como el sistema de seguridad comunitaria Servicios Integrales CyJ. A diferencia de otros servicios gratuitos, Railway tiene una ventaja fundamental: tu servidor <b>nunca se apaga</b>. Esto significa que tu aplicacion estara disponible las 24 horas del dia, los 365 dias del ano, sin interrupciones.'))
story.append(para('El plan gratuito de Railway te da un credito de $1 USD mensual, que se renueva automaticamente cada mes. Para una aplicacion pequena como la de CyJ (Next.js con base de datos SQLite), este credito es mas que suficiente para mantener el servidor funcionando sin costo alguno durante meses o incluso anos. Si en algun momento excedes el credito mensual, el servicio simplemente se pausa hasta el proximo mes, cuando el credito se renueva.'))
story.append(para('Otra ventaja importante es que Railway <b>no requiere tarjeta de credito</b> para registrarse. Solo necesitas una cuenta de GitHub, lo que lo hace accesible para cualquier persona. Ademas, el proceso de despliegue es extremadamente simple: conectas tu repositorio de GitHub y Railway se encarga de compilar y poner en marcha tu aplicacion automaticamente. No necesitas conocimientos avanzados de servidores ni configuraciones complejas.'))

story.append(Spacer(1, 12))
story.append(heading('Comparacion con otras opciones', 3))
story.append(make_table(
    ['Caracteristica', 'Railway.app', 'Oracle Cloud', 'Render', 'Koyeb'],
    [
        ['Costo', 'Gratis ($1/mes)', 'Gratis', 'Gratis', 'Gratis'],
        ['Tarjeta de credito', 'NO necesaria', 'Si, obligatoria', 'Si, obligatoria', 'No necesaria'],
        ['Se apaga solo?', 'NUNCA', 'Nunca', 'Si (15 min)', 'Si (1 hora)'],
        ['RAM', '512 MB', '24 GB', '512 MB', '512 MB'],
        ['Almacenamiento', '500 MB (persistente)', '200 GB', 'Temporal', 'Sin volumen gratis'],
        ['Base de datos SQLite', 'Si, persistente', 'Si, completo', 'No persistente', 'No persistente'],
        ['URL publica', 'Si, automatica', 'Si, IP publica', 'Si, automatica', 'Si, automatica'],
        ['Facilidad de uso', 'Muy facil', 'Complejo', 'Facil', 'Media'],
    ],
    [90, 90, 90, 90, 90]
))
story.append(Spacer(1, 8))

# ── SECTION 2: REQUISITOS ──
story.append(heading('2. Que necesitas antes de empezar'))
story.append(Spacer(1, 8))
story.append(para('Antes de comenzar con el proceso de despliegue, asegurate de tener los siguientes elementos listos. Todo lo que necesitas es gratuito y puedes conseguirlo en minutos:'))

story.append(Spacer(1, 8))
story.append(heading('2.1 Cuenta de GitHub (obligatoria)', 3))
story.append(para('Si ya tienes una cuenta de GitHub, puedes saltar este paso. Si no la tienes, crearla es completamente gratuito y toma menos de 5 minutos. GitHub es una plataforma donde los desarrolladores almacenan su codigo, y Railway la usa para conectarse automaticamente a tu proyecto y desplegarlo.'))
story.append(bullet('Ve a: https://github.com/signup'))
story.append(bullet('Usa tu correo de Gmail para registrarte'))
story.append(bullet('Crea un nombre de usuario (por ejemplo: servidores-cyj)'))
story.append(bullet('Crea una contrasena segura'))
story.append(bullet('Verifica tu correo electronico cuando te llegue el correo de confirmacion'))
story.append(para('La cuenta de GitHub es tu unico requisito para usar Railway. No necesitas tarjeta de credito ni ninguna otra forma de pago.'))

story.append(Spacer(1, 8))
story.append(heading('2.2 El codigo del proyecto', 3))
story.append(para('El codigo fuente de Servicios Integrales CyJ ya esta preparado para ser subido a GitHub. El proyecto ya incluye todos los archivos necesarios para que Railway lo reconozca y despliegue automaticamente, incluyendo el Dockerfile, el archivo de configuracion de Nixpacks, y el .gitignore que excluye los archivos innecesarios. Tu unico trabajo es subir el codigo a GitHub y conectarlo con Railway.'))

# ── SECTION 3: CREAR REPOSITORIO ──
story.append(PageBreak())
story.append(heading('3. Crear un repositorio en GitHub'))
story.append(Spacer(1, 8))
story.append(para('El primer paso tecnico es crear un "repositorio" en GitHub. Piensa en un repositorio como una carpeta en la nube donde se guarda el codigo de tu aplicacion. Una vez que el codigo esta en GitHub, Railway puede leerlo y desplegarlo automaticamente. Sigue estos pasos con mucho detalle:'))

story.append(Spacer(1, 8))
story.append(heading('Paso 1: Iniciar sesion en GitHub', 3))
story.append(bullet('Abre tu navegador web (Chrome, Edge, Firefox, etc.)'))
story.append(bullet('Ve a: https://github.com'))
story.append(bullet('Haz clic en "Sign in" (Iniciar sesion) en la esquina superior derecha'))
story.append(bullet('Ingresa tu correo y contrasena de GitHub'))
story.append(bullet('Ahora estas en tu perfil de GitHub'))

story.append(Spacer(1, 8))
story.append(heading('Paso 2: Crear el nuevo repositorio', 3))
story.append(bullet('En la esquina superior derecha, haz clic en el simbolo de "+" (mas)'))
story.append(bullet('Selecciona "New repository" (Nuevo repositorio) del menu desplegable'))
story.append(bullet('Se abrira una pagina con un formulario. Completa estos campos:'))

story.append(Spacer(1, 6))
story.append(heading('Campos del formulario:', 3))
story.append(make_table(
    ['Campo', 'Que escribir', 'Explicacion'],
    [
        ['Repository name', 'servicios-cyj', 'El nombre de tu proyecto. Usa minusculas y guiones.'],
        ['Description', 'App de seguridad comunitaria', 'Una breve descripcion de lo que es el proyecto.'],
        ['Public/Private', 'Selecciona PUBLIC', 'IMPORTANTE: Debe ser PUBLICO para que Railway pueda leerlo gratis.'],
        ['Add a README', 'NO la marques', 'No marques esta casilla. El proyecto ya tiene README.'],
        ['Add .gitignore', 'NO la marques', 'El proyecto ya tiene .gitignore configurado.'],
        ['Choose a license', 'NO selecciones nada', 'No necesitas licencia para este proyecto.'],
    ],
    [100, 130, 230]
))
story.append(Spacer(1, 6))

story.append(heading('Paso 3: Confirmar la creacion', 3))
story.append(para('Haz clic en el boton verde grande que dice "Create repository" en la parte inferior de la pagina. Se creara tu repositorio vacio. Veras una nueva pagina con instrucciones para subir codigo. No cierres esta pagina, la usaremos en el siguiente paso.'))

# ── SECTION 4: SUBIR CODIGO ──
story.append(Spacer(1, 12))
story.append(heading('4. Subir el codigo a GitHub'))
story.append(Spacer(1, 8))
story.append(para('Ahora vamos a subir todos los archivos del proyecto CyJ a tu nuevo repositorio de GitHub. Como el proyecto ya esta preparado con el archivo .gitignore, no necesitas preocuparte por subir archivos innecesarios como bases de datos locales, imagenes temporales, o archivos de configuracion personales.'))
story.append(para('Tienes dos opciones para subir el codigo. Te recomendamos la Opcion A (subir por el navegador web) porque es mas visual y facil. Si tienes problemas, puedes intentar la Opcion B.'))

story.append(Spacer(1, 8))
story.append(heading('Opcion A: Subir archivos por el navegador (recomendado)', 3))
story.append(para('Esta es la forma mas facil si no tienes experiencia con linea de comandos. Simplemente arrastra tus archivos al navegador:'))
story.append(bullet('En tu computadora, ve a la carpeta donde esta el proyecto CyJ'))
story.append(bullet('Selecciona TODOS los archivos y carpetas del proyecto (NO la carpeta node_modules)'))
story.append(bullet('En la pagina de tu repositorio en GitHub, haz clic en "uploading an existing file"'))
story.append(bullet('Arrastra los archivos seleccionados a la zona indicada (o haz clic en "choose your files")'))
story.append(bullet('Espera a que se suban todos los archivos (puede tardar unos minutos)'))
story.append(bullet('Haz clic en el boton verde "Commit changes"'))
story.append(para('Listo, tu codigo ya esta en GitHub. Ve al paso 5.'))

story.append(Spacer(1, 8))
story.append(heading('Opcion B: Subir por linea de comandos (Git)', 3))
story.append(para('Si estas familiarizado con Git y la terminal, puedes usar estos comandos. Primero descarga e instala Git desde https://git-scm.com si no lo tienes:'))
story.append(code('git init'))
story.append(code('git remote add origin https://github.com/TU-USUARIO/servicios-cyj.git'))
story.append(code('git add .'))
story.append(code('git commit -m "Primera version de Servicios CyJ"'))
story.append(code('git branch -M main'))
story.append(code('git push -u origin main'))
story.append(para('Reemplaza "TU-USUARIO" con tu nombre de usuario real de GitHub. Si aparece un error de autenticacion, GitHub te pedira que crees un "Personal Access Token" en la configuracion de tu cuenta.'))

# ── SECTION 5: DESPLEGAR EN RAILWAY ──
story.append(PageBreak())
story.append(heading('5. Desplegar en Railway.app'))
story.append(Spacer(1, 8))
story.append(para('Este es el paso mas importante y emocionante: vamos a conectar tu repositorio de GitHub con Railway para que tu aplicacion se publique en Internet. Todo el proceso se hace desde el navegador web y toma aproximadamente 5 minutos. Railway se encargara automaticamente de compilar tu codigo, instalar las dependencias, crear la base de datos, y poner en marcha el servidor.'))

story.append(Spacer(1, 8))
story.append(heading('Paso 1: Crear cuenta en Railway', 3))
story.append(bullet('Abre tu navegador y ve a: https://railway.com'))
story.append(bullet('Haz clic en "Login" o "Start a New Project" en la esquina superior derecha'))
story.append(bullet('Selecciona "Login with GitHub" (Iniciar sesion con GitHub)'))
story.append(bullet('Aparecera una ventana pidiendo permiso. Haz clic en "Authorize Railway"'))
story.append(bullet('Listo, ya tienes tu cuenta en Railway creada automaticamente'))

story.append(Spacer(1, 8))
story.append(heading('Paso 2: Crear un nuevo proyecto', 3))
story.append(bullet('Estas en el panel principal (dashboard) de Railway'))
story.append(bullet('Haz clic en el boton grande que dice "New Project" o "Nuevo Proyecto"'))
story.append(bullet('Se abrira una ventana con opciones. Selecciona "Deploy from GitHub repo"'))
story.append(bullet('Aparecera una lista de tus repositorios de GitHub'))
story.append(bullet('Busca y selecciona "servicios-cyj" (el repositorio que creaste)'))
story.append(bullet('Haz clic en "Deploy Now" o "Import"'))

story.append(Spacer(1, 8))
story.append(heading('Paso 3: Esperar el despliegue', 3))
story.append(para('Railway comenzara automaticamente a construir tu aplicacion. Este proceso incluye los siguientes pasos que se realizan solos sin que tengas que hacer nada:'))
story.append(bullet('<b>Compilar:</b> Railway lee tu Dockerfile y prepara el entorno de ejecucion'))
story.append(bullet('<b>Instalar dependencias:</b> Se descargan todas las librerias necesarias (Next.js, Prisma, React, etc.)'))
story.append(bullet('<b>Generar base de datos:</b> Se ejecuta "prisma db push" para crear las tablas de SQLite'))
story.append(bullet('<b>Iniciar servidor:</b> Se lanza el servidor Next.js en el puerto 3000'))
story.append(para('Este proceso puede tardar entre 3 y 10 minutos la primera vez. Veras un indicador de progreso en la pantalla. No cierres la ventana del navegador mientras se despliega.'))

story.append(Spacer(1, 8))
story.append(heading('Paso 4: Verificar que funciona', 3))
story.append(para('Cuando el despliegue termine, veras que el estado cambia a "Active" o "Running" con un punto verde. Para verificar que tu aplicacion funciona correctamente:'))
story.append(bullet('En el panel de Railway, haz clic en tu proyecto "servicios-cyj"'))
story.append(bullet('Haz clic en "Settings" en el menu lateral'))
story.append(bullet('Busca la seccion "Networking" o "Public Networking"'))
story.append(bullet('Asegurate de que "Public Networking" este activado (encendido)'))
story.append(bullet('Genera o busca la URL publica (algo como: https://servicios-cyj-production.up.railway.app)'))
story.append(bullet('Haz clic en esa URL o copiala y abrela en una nueva pestana del navegador'))
story.append(para('Deberias ver la aplicacion de Servicios Integrales CyJ cargando en tu navegador. Si ves la pantalla de inicio de sesion, significa que todo funciono correctamente.'))

story.append(Spacer(1, 12))
story.append(heading('Paso 5: Agregar la variable DATABASE_URL', 3))
story.append(para('Para que la base de datos SQLite sea persistente (es decir, que los datos no se borren cuando el servidor se reinicie), necesitamos configurar una variable de entorno. Esto es muy facil en Railway:'))
story.append(bullet('En tu proyecto de Railway, haz clic en "Variables" en el menu lateral'))
story.append(bullet('Haz clic en "Add Variable" (Agregar variable)'))
story.append(bullet('En el campo "Name" (Nombre), escribe: DATABASE_URL'))
story.append(bullet('En el campo "Value" (Valor), escribe: file:/app/data/custom.db'))
story.append(bullet('Haz clic en "Add" o "Save"'))
story.append(bullet('Railway reiniciara tu servidor automaticamente con la nueva configuracion'))
story.append(para('Esta variable le dice a la aplicacion donde guardar la base de datos. La ruta "/app/data/custom.db" es una ruta persistente dentro del contenedor de Railway, lo que significa que los datos sobreviviran a reinicios del servidor.'))

# ── SECTION 6: CONFIGURAR APP ──
story.append(PageBreak())
story.append(heading('6. Configurar la aplicacion CyJ'))
story.append(Spacer(1, 8))
story.append(para('Una vez que tu servidor esta corriendo en Railway, necesitas configurar la aplicacion en tu celular para que se conecte al nuevo servidor en la nube en lugar de intentar conectarse al servidor local. Este proceso se hace directamente desde la aplicacion CyJ en tu celular:'))

story.append(Spacer(1, 8))
story.append(heading('6.1 Obtener la URL de tu servidor', 3))
story.append(para('Primero necesitas copiar la URL publica de tu servidor en Railway. Esta URL se ve algo asi:'))
story.append(code('https://servicios-cyj-production-xxxx.up.railway.app'))
story.append(para('Puedes encontrar esta URL en Railway yendo a tu proyecto, luego a "Settings" y buscando la seccion "Public Networking". Haz clic en el enlace para copiarlo al portapapeles.'))

story.append(Spacer(1, 8))
story.append(heading('6.2 Configurar la URL desde la app CyJ', 3))
story.append(para('La aplicacion CyJ tiene una seccion de configuracion del servidor integrada. Para acceder a ella:'))
story.append(bullet('Abre la aplicacion CyJ en tu celular'))
story.append(bullet('Ve a la pestana de "Perfil" (el icono de persona en la barra inferior)'))
story.append(bullet('Desplazate hacia abajo hasta encontrar la seccion "Configuracion del Servidor"'))
story.append(bullet('En el campo de texto, pega la URL de tu servidor de Railway (la que copiaste antes)'))
story.append(bullet('Asegurate de incluir "https://" al inicio de la URL'))
story.append(bullet('Haz clic en el boton "Guardar" o "Test Connection" para verificar la conexion'))
story.append(bullet('Deberias ver un indicador verde que dice "Conectado" si todo esta bien'))

story.append(Spacer(1, 8))
story.append(heading('6.3 Verificar la conexion', 3))
story.append(para('Despues de guardar la URL del servidor, puedes verificar que todo funciona correctamente mirando el indicador de conexion en la barra superior de la aplicacion. Si ves un punto verde junto al nombre de la app, significa que la conexion al servidor esta activa y funcionando. Si ves un punto rojo, verifica que la URL sea correcta y que no tenga espacios al final.'))

# ── SECTION 7: DATOS IMPORTANTES ──
story.append(Spacer(1, 12))
story.append(heading('7. Datos importantes que debes saber'))
story.append(Spacer(1, 8))
story.append(para('A continuacion te presento informacion clave sobre como funciona tu servidor gratuito en Railway y que esperar de el:'))

story.append(Spacer(1, 8))
story.append(heading('7.1 Creditos y costos', 3))
story.append(para('Railway funciona con un sistema de creditos. Cada mes recibes $1 USD de credito gratis que se renueva automaticamente. Para la aplicacion CyJ (que es una app relativamente ligera), este credito es mas que suficiente. El consumo tipico de un servidor como el nuestro es de aproximadamente $0.10 a $0.30 USD por mes, por lo que te quedara credito sobrante. Si por alguna razon excedes el credito mensual (lo cual es muy improbable), Railway simplemente pausara tu servidor hasta el proximo mes, cuando los creditos se renuevan. Nunca te cobraran sin tu autorizacion explicita.'))

story.append(Spacer(1, 8))
story.append(heading('7.2 Limitaciones del plan gratuito', 3))
story.append(make_table(
    ['Recurso', 'Limite gratuito', 'Nota'],
    [
        ['Memoria RAM', '512 MB', 'Suficiente para Next.js + SQLite'],
        ['CPU', '1 núcleo (compartido)', 'Adecuado para la cantidad de usuarios actual'],
        ['Almacenamiento', '500 MB', 'La base de datos SQLite pesa muy poco'],
        ['Ancho de banda', '100 GB/mes', 'Mas que suficiente para una app comunitaria'],
        ['Tiempo activo', 'Siempre activo', 'El servidor NUNCA se apaga solo'],
        ['Creditos mensuales', '$1 USD/mes', 'Se renuevan cada mes automaticamente'],
    ],
    [120, 120, 230]
))

story.append(Spacer(1, 8))
story.append(heading('7.3 Datos de inicio de sesion', 3))
story.append(para('La aplicacion CyJ tiene usuarios predeterminados que se crean automaticamente la primera vez que se inicia el servidor. Estos son los datos de acceso por defecto:'))
story.append(make_table(
    ['Email', 'Contrasena', 'Rol'],
    [
        ['admin@cyj.cl', 'cyj2025', 'Super Administrador'],
        ['guardia@cyj.cl', 'cyj2025', 'Residente Guardia'],
        ['residente@cyj.cl', 'cyj2025', 'Residente'],
    ],
    [180, 120, 160]
))
story.append(note('Recomendacion: Cambia las contrasenas por defecto despues del primer inicio de sesion por razones de seguridad.'))

# ── SECTION 8: PROBLEMAS COMUNES ──
story.append(PageBreak())
story.append(heading('8. Solucion de problemas comunes'))
story.append(Spacer(1, 8))
story.append(para('A continuacion se presentan los problemas mas frecuentes que pueden surgir durante el despliegue y como solucionarlos. Cada problema incluye una descripcion clara del sintoma y pasos concretos para resolverlo.'))

story.append(Spacer(1, 8))
story.append(heading('Problema: El despliegue falla con error de "Build"', 3))
story.append(para('<b>Causa:</b> El servidor de Railway no puede compilar tu codigo. Esto generalmente ocurre si falta algun archivo en el repositorio de GitHub o si el Dockerfile tiene un error.'))
story.append(para('<b>Solucion:</b>'))
story.append(bullet('Ve a la pestana "Deployments" en Railway para ver el log de errores'))
story.append(bullet('Busca la linea que dice "ERROR" o "FAILED" en el log'))
story.append(bullet('Los errores mas comunes son: falta el archivo package.json o el archivo .gitignore no esta correctamente configurado'))
story.append(bullet('Verifica que todos los archivos del proyecto esten en tu repositorio de GitHub'))
story.append(bullet('Haz clic en "Redeploy" en Railway para intentar de nuevo'))

story.append(Spacer(1, 8))
story.append(heading('Problema: La aplicacion carga pero no puedo iniciar sesion', 3))
story.append(para('<b>Causa:</b> La base de datos SQLite no se creo correctamente durante el despliegue. Esto puede ocurrir si la variable DATABASE_URL no esta configurada.'))
story.append(para('<b>Solucion:</b>'))
story.append(bullet('Ve a "Variables" en tu proyecto de Railway'))
story.append(bullet('Verifica que la variable DATABASE_URL exista y tenga el valor: file:/app/data/custom.db'))
story.append(bullet('Si no existe, creala siguiendo los pasos del Paso 5 de esta guia'))
story.append(bullet('Despues de agregarla, Railway reiniciara el servidor automaticamente'))
story.append(bullet('Espera 1-2 minutos e intenta iniciar sesion de nuevo'))

story.append(Spacer(1, 8))
story.append(heading('Problema: El servidor funciona pero la app del celular no se conecta', 3))
story.append(para('<b>Causa:</b> La URL del servidor en la configuracion de la app CyJ es incorrecta o esta mal escrita.'))
story.append(para('<b>Solucion:</b>'))
story.append(bullet('Abre la app CyJ y ve a Perfil > Configuracion del Servidor'))
story.append(bullet('Verifica que la URL sea correcta y empiece con "https://"'))
story.append(bullet('Asegurate de que no haya espacios al inicio o al final de la URL'))
story.append(bullet('Presiona "Test Connection" para verificar la conexion'))
story.append(bullet('Si sigue sin funcionar, verifica que tu celular tenga conexion a Internet (datos moviles o WiFi)'))

story.append(Spacer(1, 8))
story.append(heading('Problema: El servidor se detiene despues de un tiempo', 3))
story.append(para('<b>Causa:</b> Excediste los creditos mensuales de Railway ($1 USD). Esto es muy poco probable con la app CyJ, pero puede ocurrir si hay mucho trafico inusual.'))
story.append(para('<b>Solucion:</b>'))
story.append(bullet('Ve a Railway.com e inicia sesion'))
story.append(bullet('Revisa el panel de uso (Usage) para ver cuanto credito has consumido'))
story.append(bullet('Si excediste el credito, espera al proximo mes cuando se renueven los $1 USD'))
story.append(bullet('Para evitarlo en el futuro, revisa que no haya procesos innecesarios consumiendo recursos'))

story.append(Spacer(1, 8))
story.append(heading('Problema: Quiero actualizar el codigo de la aplicacion', 3))
story.append(para('<b>Solucion:</b>'))
story.append(bullet('Sube los cambios actualizados a tu repositorio de GitHub (arrastra los archivos o usa git push)'))
story.append(bullet('Ve a Railway.com y busca tu proyecto'))
story.append(bullet('Railway detectara automaticamente los cambios y ofrecera "Redeploy"'))
story.append(bullet('Haz clic en "Redeploy" y espera a que termine el nuevo despliegue'))
story.append(bullet('La actualizacion se reflejara en 3-5 minutos aproximadamente'))

# ── SECTION 9: RESUMEN ──
story.append(Spacer(1, 12))
story.append(heading('9. Resumen rapido de pasos'))
story.append(Spacer(1, 8))
story.append(para('A continuacion se presenta un resumen rapido de todos los pasos necesarios para tener tu servidor en linea. Puedes usar esta lista como referencia rapida una vez que hayas leido la guia completa:'))

steps = [
    ('1', 'Crear cuenta en GitHub', 'https://github.com/signup'),
    ('2', 'Crear repositorio "servicios-cyj"', 'github.com > New Repository > PUBLIC'),
    ('3', 'Subir archivos del proyecto al repositorio', 'Arrastra archivos al navegador'),
    ('4', 'Crear cuenta en Railway', 'https://railway.com > Login with GitHub'),
    ('5', 'Nuevo proyecto > Deploy from GitHub', 'Selecciona "servicios-cyj" > Deploy Now'),
    ('6', 'Esperar 3-10 minutos', 'Railway compila e instala todo automaticamente'),
    ('7', 'Agregar variable DATABASE_URL', 'Variables > Add > file:/app/data/custom.db'),
    ('8', 'Activar Public Networking', 'Settings > Networking > Activar'),
    ('9', 'Copiar la URL publica', 'Algo como: https://xxx.up.railway.app'),
    ('10', 'Configurar la app CyJ en tu celular', 'Perfil > Config Servidor > Pegar URL > Guardar'),
]

story.append(make_table(
    ['Paso', 'Accion', 'Detalles'],
    steps,
    [40, 180, 240]
))

story.append(Spacer(1, 16))
story.append(hr())
story.append(Spacer(1, 8))
story.append(Paragraph('Una vez completados estos 10 pasos, tu aplicacion de seguridad comunitaria estara completamente en linea y accesible desde cualquier celular con conexion a Internet. Todos los residentes del condominio podran usar la app CyJ conectandose al servidor en la nube, y las alertas, reportes y demas datos se sincronizaran automaticamente entre todos los dispositivos.', body_style))

# ━━ BUILD ━━
doc.build(story)
print(f'PDF generado exitosamente: {output_path}')
