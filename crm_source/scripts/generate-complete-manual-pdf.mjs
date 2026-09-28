import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const baseDir = process.cwd();
const imagesDir = path.join(baseDir, 'public', 'manual_images');

function getBase64Image(filename) {
  const filePath = path.join(imagesDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Image not found: ${filePath}`);
    return '';
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).replace('.', '');
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fileBuffer.toString('base64')}`;
}

console.log('Encoding manual screenshots to Base64...');
const img1 = getBase64Image('01_directorio_360.png');
const img2 = getBase64Image('02_expediente_360.png');
const img3 = getBase64Image('03_embudo_kanban.png');
const img4 = getBase64Image('04_grafo_interactivo.png');
const img5 = getBase64Image('05_redes_sociales_ia.png');
const img6 = getBase64Image('06_centro_whatsapp.png');
const img7 = getBase64Image('07_sidebar_branding.png');

console.log('Base64 encoding completed successfully. Generating full HTML template...');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual Oficial de Usuario — Outcrop Silver CRM v2.1</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=Fira+Code:wght@400;600&display=swap');

    :root {
      --primary: #0284c7;
      --primary-light: #38bdf8;
      --accent-lime: #65a30d;
      --dark-bg: #0f172a;
      --text-dark: #1e293b;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      color: var(--text-dark);
      line-height: 1.6;
      padding: 30px;
    }

    .manual-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .cover-header {
      border-bottom: 3px solid var(--primary);
      padding-bottom: 24px;
      margin-bottom: 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-title p {
      color: var(--primary);
      font-weight: 700;
      font-size: 15px;
      margin-top: 6px;
    }

    .badge-v2 {
      background: #f1f5f9;
      color: #0f172a;
      border: 2px solid #0f172a;
      padding: 6px 14px;
      border-radius: 50px;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 40px;
      margin-bottom: 16px;
      border-left: 5px solid var(--primary);
      padding-left: 14px;
      page-break-after: avoid;
    }

    h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 24px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    p {
      color: #334155;
      font-size: 14px;
      margin-bottom: 14px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 18px;
      color: #334155;
      font-size: 14px;
    }

    li {
      margin-bottom: 6px;
    }

    .callout-info {
      background: #f0f9ff;
      border-left: 4px solid var(--primary);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }

    .callout-info h4 {
      color: var(--primary);
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .callout-tip {
      background: #f7fee7;
      border-left: 4px solid var(--accent-lime);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }

    .callout-tip h4 {
      color: var(--accent-lime);
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    /* Embedded Figure & Images */
    .img-figure {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 12px;
      margin: 24px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .img-figure img {
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      display: block;
    }

    .img-figure figcaption {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 10px;
      font-weight: 600;
      font-style: italic;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      page-break-inside: avoid;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 12px 14px;
    }

    td {
      background: #ffffff;
      color: #334155;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-color);
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .cmd-code {
      font-family: 'Fira Code', monospace;
      background: #0f172a;
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .chat-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 16px;
      margin: 16px 0;
      font-size: 13px;
      page-break-inside: avoid;
    }

    .chat-box.inbound {
      border-left: 4px solid var(--primary);
    }

    .chat-box.outbound {
      border-left: 4px solid var(--accent-lime);
      background: #f7fee7;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <div class="manual-container">
    <div class="cover-header">
      <div class="brand-title">
        <h1>OUTCROP SILVER CRM v2.1</h1>
        <p>Manual Oficial de Operaciones e Investor Relations (IR)</p>
      </div>
      <div class="badge-v2">Documento Oficial</div>
    </div>

    <div class="callout-info">
      <h4>📌 Manual Práctico de Usuario</h4>
      <p>Este documento es la guía definitiva para operar la plataforma <strong>Outcrop Silver CRM v2.1</strong>. Ha sido redactado en lenguaje sencillo e ilustrado con <strong>capturas de pantalla reales capturadas directamente de la plataforma</strong> para facilitar la inducción del equipo de relaciones con inversionistas, directores y representantes de la compañía.</p>
    </div>

    <h2>1. Visión General del Sistema & Propósito Corporativo</h2>
    <p><strong>Outcrop Silver CRM v2.1</strong> es una plataforma de última generación desarrollada para centralizar, calificar y gestionar las interacciones con inversionistas interesados en el proyecto minero de plata de alta ley <strong>Santa Ana</strong> en Colombia (operado por Outcrop Silver Corp., TSX: OCG).</p>
    <p>El sistema está optimizado para los siguientes perfiles de usuarios:</p>
    <ul>
      <li><strong>Ejecutivos de Investor Relations (IR):</strong> Para hacer seguimiento a conversaciones, enviar informes de ensaye y programar reuniones post-convenciones (ej. PDAC).</li>
      <li><strong>Directores y Gerentes:</strong> Para supervisar el estado del embudo de negociación (*Pipeline*), revisar el Puntaje de Interés (*Lead Score*) y evaluar métricas en tiempo real.</li>
      <li><strong>Equipos de Campo / Eventos:</strong> Para escanear tarjetas de presentación e ingresar notas de voz al CRM directamente desde WhatsApp.</li>
    </ul>

    <h2>2. Estructura de la Pantalla Principal e Identidad Visual</h2>
    <p>La interfaz gráfica del CRM se organiza mediante una barra lateral izquierda de navegación constante y un área de trabajo dinámica centrada. La barra lateral incluye la firma institucional <strong>Powered by: i2</strong> y los accesos rápidos a los 5 módulos operativos del sistema:</p>

    <figure class="img-figure">
      <img src="${img7}" alt="Barra Lateral e Identidad Institucional">
      <figcaption>Figura 1: Captura real de la barra lateral de navegación con firma Powered by i2 y accesos a los módulos del CRM.</figcaption>
    </figure>

    <div class="page-break"></div>

    <h2>3. Módulo 1: Directorio de Inversionistas & Expediente 360°</h2>
    <p>En el directorio principal se listan todos los contactos con sus medidores de interés (*Lead Score*), tipo de inversionista (*Family Office, Institutional PM/Analyst, HNW investor, Retail investor, Corporate strategic*) y etiquetas personalizadas:</p>

    <figure class="img-figure">
      <img src="${img1}" alt="Directorio General de Inversionistas">
      <figcaption>Figura 2: Captura real del directorio general de inversionistas con buscador en tiempo real y tarjetas de perfil.</figcaption>
    </figure>

    <h3>3.1 El Expediente 360° del Inversionista</h3>
    <p>Al hacer clic sobre la tarjeta de cualquier inversionista o presionar el botón <strong>View 360° Profile</strong>, se abre el expediente digital consolidado con 5 pestañas de trabajo especializadas:</p>

    <figure class="img-figure">
      <img src="${img2}" alt="Expediente 360° del Inversionista">
      <figcaption>Figura 3: Captura real del Expediente 360° mostrando las pestañas de Resumen, Historial, Relaciones, Búsqueda IA e Ensayes Mineros.</figcaption>
    </figure>

    <table>
      <thead>
        <tr>
          <th>Pestaña</th>
          <th>Función Operativa</th>
          <th>Caso de Uso Real en IR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Summary (Resumen)</strong></td>
          <td>Perfil general, biografía, correo, teléfono y Lead Score (0 a 100).</td>
          <td>Verificar el nivel de prioridad de un inversionista de Sprott Mining.</td>
        </tr>
        <tr>
          <td><strong>History (Historial)</strong></td>
          <td>Cronograma de todas las reuniones, llamadas y correos registrados.</td>
          <td>Revisar acuerdos alcanzados en la reunión previa en PDAC.</td>
        </tr>
        <tr>
          <td><strong>Relationships (Relaciones)</strong></td>
          <td>Conexiones directas con otros contactos del CRM.</td>
          <td>Identificar si el inversionista fue introducido por un Broker específico.</td>
        </tr>
        <tr>
          <td><strong>AI Search (Búsqueda IA)</strong></td>
          <td>Búsqueda semántica en lenguaje natural dentro del expediente.</td>
          <td>Buscar si el contacto solicitó información sobre leyes superiores a 1,500 g/t AgEq.</td>
        </tr>
        <tr>
          <td><strong>Assays (Ensayes Mineros)</strong></td>
          <td>Gestión y almacenamiento de reportes técnicos de perforación.</td>
          <td>Adjuntar el reporte PDF con resultados del programa de perforación Santa Ana Q3.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h2>4. Módulo 2: Embudo de Seguimiento y Tareas (Kanban)</h2>
    <p>El tablero Kanban permite visualizar y desplazar a los inversionistas a través de las 5 fases estratégicas del proceso de captación de capital:</p>
    <p style="text-align: center; font-weight: 700; color: var(--primary); margin: 16px 0;">
      First Contact ➔ Meeting Scheduled ➔ Due Diligence ➔ Term Sheet ➔ Closed Investor
    </p>

    <figure class="img-figure">
      <img src="${img3}" alt="Tablero Kanban de Seguimiento">
      <figcaption>Figura 4: Captura real del tablero Kanban con soporte Drag & Drop y widget superior de Tareas y Alertas Programadas.</figcaption>
    </figure>

    <h3>4.1 Programar Tareas y Alertas IR</h3>
    <p>Desde el botón <strong>+ Create IR Task & Alert</strong> puedes agendar compromisos con recordatorios automáticos:</p>
    <ul>
      <li><strong>Canales de Alerta:</strong> Selecciona entre 💬 <em>WhatsApp Immediate Alert</em>, 📲 <em>CRM On-Screen Banner Alert</em> o 📧 <em>Scheduled Email Alert</em>.</li>
      <li><strong>Asignación:</strong> Asigna la responsabilidad a Carlos Carvajal (IR Lead), Guillermo Gutiérrez (Director) o al Equipo Outcrop IR.</li>
      <li><strong>Prioridad:</strong> Define la urgencia entre 🔴 <em>HIGH</em>, 🟡 <em>MEDIUM</em> o 🟢 <em>LOW</em>.</li>
    </ul>

    <div class="page-break"></div>

    <h2>5. Módulo 3: Grafo Interactivo de Relaciones (Red de Contactos)</h2>
    <p>Este módulo representa la red de contactos mediante una malla física viva con motor de gravedad simulado. Permite identificar la red de influencias y mapear cómo se conectan los brokers y co-inversionistas:</p>

    <figure class="img-figure">
      <img src="${img4}" alt="Grafo Interactivo de Conexiones">
      <figcaption>Figura 5: Captura real de la malla física interactiva de conexiones y panel lateral de inspección de nodos.</figcaption>
    </figure>

    <ul>
      <li><strong>Mover Nodos:</strong> Haz clic sostenido en cualquier círculo y arrástralo en pantalla.</li>
      <li><strong>Navegación:</strong> Usa <code>Zoom In</code>, <code>Zoom Out</code> y <code>Center Graph</code> para encuadrar la red.</li>
      <li><strong>Vincular Relación:</strong> Presiona el botón <strong>Link Relationship</strong> para conectar dos contactos definiendo el tipo de vínculo (<em>Referred by, Broker for, Co-Investor with, Technical Advisor to, Strategic Partner with</em>).</li>
    </ul>

    <div class="page-break"></div>

    <h2>6. Módulo 4: Calendario de Redes & IA Social Studio</h2>
    <p>Módulo diseñado para programar comunicados oficiales de perforación y publicar noticias corporativas en las redes sociales de Outcrop Silver Corp (LinkedIn, Twitter/X, Instagram, Facebook):</p>

    <figure class="img-figure">
      <img src="${img5}" alt="Calendario Editorial y Estudio de IA">
      <figcaption>Figura 6: Captura real del programador mensual de noticias corporativas y creador de contenidos con Inteligencia Artificial.</figcaption>
    </figure>

    <h3>6.1 Generación de Contenidos impulsada por IA</h3>
    <ol>
      <li>Haz clic en <strong>New Social Post</strong> o <strong>Generate with AI</strong>.</li>
      <li>Ingresa el tema o hallazgo clave (ej: <em>Descubrimiento de nueva veta de alta ley de plata en Santa Ana</em>).</li>
      <li>Selecciona el tono deseado:
        <ul>
          <li><strong>Professional:</strong> Tono institucional optimizado para LinkedIn e inversionistas corporativos.</li>
          <li><strong>Casual:</strong> Tono cercano para audiencias de redes generales.</li>
          <li><strong>Inspirational:</strong> Tono entusiasta resaltando el potencial geológico del proyecto.</li>
        </ul>
      </li>
      <li>Presiona <strong>Generate with AI</strong> para obtener el texto redactado con etiquetas (*hashtags*) oficiales.</li>
    </ol>

    <div class="page-break"></div>

    <h2>7. Módulo 5: Centro de WhatsApp & Asistente Virtual Ejecuto (Operación Móvil 24/7)</h2>
    <p>El bot de WhatsApp integrado permite a los ejecutivos autorizados gestionar el CRM desde su teléfono móvil en cualquier lugar del mundo:</p>

    <figure class="img-figure">
      <img src="${img6}" alt="Centro de WhatsApp y Simulación">
      <figcaption>Figura 7: Captura real del Centro de Administración de WhatsApp, consola de comandos en vivo y lista de números autorizados (Whitelist).</figcaption>
    </figure>

    <div class="callout-tip">
      <h4>🛡️ Requisito Previo: Permisos de Administrador (Whitelist)</h4>
      <p>Por motivos de ciberseguridad corporativa, el bot solo responderá a números autorizados en el <strong>Centro WhatsApp</strong> de la versión web. Si un usuario no registrado escribe al bot, este responderá con un dato positivo sobre el proyecto Santa Ana y derivará al sitio web oficial.</p>
    </div>

    <h3>7.1 Tabla de Comandos de WhatsApp</h3>
    <table>
      <thead>
        <tr>
          <th>Comando</th>
          <th>¿Qué realiza el Bot?</th>
          <th>Ejemplo Real de Texto a Enviar</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="cmd-code">/scan</span></td>
          <td>Inicia el escáner inteligente (Solicita Foto Frente ➔ Foto Reverso ➔ Nota de Voz).</td>
          <td>Enviar <span class="cmd-code">/scan</span> por WhatsApp.</td>
        </tr>
        <tr>
          <td><span class="cmd-code">/crear</span> (1 línea)</td>
          <td>Crea de inmediato el contacto separando los datos por comas.</td>
          <td><span class="cmd-code">/crear Ricardo, Gómez, ricardogomez@gmail.com, Family Office</span></td>
        </tr>
        <tr>
          <td><span class="cmd-code">/crear</span> (Paso a paso)</td>
          <td>Activa el asistente conversacional de 5 preguntas.</td>
          <td>Enviar <span class="cmd-code">/crear</span> solo.</td>
        </tr>
        <tr>
          <td><span class="cmd-code">/tipify [Nombre]</span></td>
          <td>Despliega la lista numerada de etapas para actualizar la fase de un contacto.</td>
          <td><span class="cmd-code">/tipify David</span> (luego responder con el número ej: <span class="cmd-code">3</span>).</td>
        </tr>
        <tr>
          <td><span class="cmd-code">/tipify</span></td>
          <td>Muestra la lista de contactos recientes para seleccionar a quién actualizar.</td>
          <td>Enviar <span class="cmd-code">/tipify</span> solo.</td>
        </tr>
        <tr>
          <td><span class="cmd-code">/search [Texto]</span></td>
          <td>Busca contactos en el CRM por nombre o empresa.</td>
          <td><span class="cmd-code">/search Sprott</span></td>
        </tr>
        <tr>
          <td><span class="cmd-code">/stats</span></td>
          <td>Muestra el resumen de métricas del CRM en tiempo real.</td>
          <td>Enviar <span class="cmd-code">/stats</span>.</td>
        </tr>
        <tr>
          <td><span class="cmd-code">/cancel</span></td>
          <td>Cancela el asistente activo y retorna al menú principal.</td>
          <td>Enviar <span class="cmd-code">/cancel</span>.</td>
        </tr>
      </tbody>
    </table>

    <h3>7.2 Ejemplo de Diálogo Real por WhatsApp</h3>
    <div class="chat-box inbound">
      <strong>📱 Mensaje enviado por el Ejecutivo:</strong><br>
      <code>/crear Carlos Mendoza, Mendoza Capital, cmendoza@mendozacapital.com, Family Office</code>
    </div>
    <div class="chat-box outbound">
      <strong>🤖 Respuesta Inmediata del Bot de WhatsApp:</strong><br>
      🎉 <strong>Contact Created Successfully (1-Line Command)</strong><br><br>
      • 👤 <strong>Name</strong>: Carlos Mendoza<br>
      • 🏢 <strong>Company</strong>: Mendoza Capital<br>
      • 📧 <strong>Email</strong>: cmendoza@mendozacapital.com<br>
      • 💼 <strong>Investor Type</strong>: Family Office<br>
      • 📊 <strong>Pipeline Stage</strong>: Lead Prospect<br><br>
      💡 <em>Next Step: To change stage, type <code>/tipify Carlos Mendoza</code></em>
    </div>

    <h2>8. Preguntas Frecuentes & Resolución de Problemas</h2>
    <p><strong>1. ¿Qué hago si mi celular no recibe respuesta del bot de WhatsApp?</strong><br>
    Verifica que tu número telefónico esté registrado en la lista de administradores (*Whitelist*) en la pestaña <strong>Centro WhatsApp</strong> de la versión web.</p>

    <p><strong>2. ¿Dónde se guardan las notas de voz enviadas por WhatsApp durante el comando /scan?</strong><br>
    Todas las notas de voz se guardan automáticamente en el servidor y quedan enlazadas de forma permanente dentro del Expediente 360° del contacto.</p>

    <p><strong>3. ¿Cómo imprimo o guardo este manual en PDF?</strong><br>
    Presiona <kbd>Ctrl + P</kbd> en Windows o <kbd>Cmd + P</kbd> en Mac dentro de tu navegador y selecciona <em>Guardar como PDF</em>.</p>

    <div class="footer">
      Outcrop Silver CRM v2.1 — Proyecto Santa Ana (TSX: OCG) | Powered by i2
    </div>
  </div>

</body>
</html>
`;

const htmlPath = path.join(baseDir, 'public', 'Manual_de_Uso_CRM_Outcrop_Silver.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
console.log(`HTML with embedded Base64 images written to: ${htmlPath}`);

const pdfPathRoot = path.join(baseDir, 'MANUAL_DE_USUARIO_OUTCROP_SILVER_CRM_V2.pdf');
const pdfPathPublic = path.join(baseDir, 'public', 'MANUAL_DE_USUARIO_OUTCROP_SILVER_CRM_V2.pdf');
const pdfPathArtifacts = path.join(baseDir, '..', '.gemini', 'antigravity', 'brain', 'b4cbba24-5ff2-4936-9305-f00526404fb3', 'MANUAL_DE_USUARIO_OUTCROP_SILVER_CRM_V2.pdf');

console.log('Compiling high-definition PDF with Chrome Headless...');
const chromePath = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';
const printCmd = `${chromePath} --headless --disable-gpu --user-data-dir="/tmp/chrome_pdf_final" --print-to-pdf="${pdfPathPublic}" "${htmlPath}"`;

try {
  execSync(printCmd);
  console.log(`PDF compiled cleanly to ${pdfPathPublic}`);

  fs.copyFileSync(pdfPathPublic, pdfPathRoot);
  console.log(`Copied PDF to ${pdfPathRoot}`);

  if (fs.existsSync(path.dirname(pdfPathArtifacts))) {
    fs.copyFileSync(pdfPathPublic, pdfPathArtifacts);
    console.log(`Copied PDF to ${pdfPathArtifacts}`);
  }

  console.log('All PDF files compiled and updated with embedded Base64 images!');
} catch (e) {
  console.error('Error generating PDF:', e.message);
}
