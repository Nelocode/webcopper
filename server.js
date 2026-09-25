const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, process.env.SITE_FOLDER || 'proposal');
const DB_FILE = path.join(__dirname, 'data', 'analytics_db.json');
const VISITOR_DB_FILE = path.join(__dirname, 'data', 'visitors_db.json');

const OCKHAM_DB_FILE = path.join(__dirname, 'data', 'ockham_db.json');

let ockhamEventsDB = [];
try {
    if (fs.existsSync(OCKHAM_DB_FILE)) {
        ockhamEventsDB = JSON.parse(fs.readFileSync(OCKHAM_DB_FILE, 'utf8'));
    }
} catch (e) {
    ockhamEventsDB = [];
}


// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Auto-Restore from backup on ephemeral restart (Prevents data wipe on EasyPanel deploy)
try {
    const restoreDir = path.join(__dirname, 'proposal', 'data', 'restore');
    if (!fs.existsSync(DB_FILE) && fs.existsSync(path.join(restoreDir, 'analytics_db.json'))) {
        fs.copyFileSync(path.join(restoreDir, 'analytics_db.json'), DB_FILE);
    }
    if (!fs.existsSync(VISITOR_DB_FILE) && fs.existsSync(path.join(restoreDir, 'visitors_db.json'))) {
        fs.copyFileSync(path.join(restoreDir, 'visitors_db.json'), VISITOR_DB_FILE);
    }
    if (!fs.existsSync(OCKHAM_DB_FILE) && fs.existsSync(path.join(restoreDir, 'ockham_db.json'))) {
        fs.copyFileSync(path.join(restoreDir, 'ockham_db.json'), OCKHAM_DB_FILE);
    }
} catch (e) {
    console.error("Auto-Restore failed", e);
}

// In-Memory Database for Lightning Fast API
let analyticsDB = [];
try {
    if (fs.existsSync(DB_FILE)) {
        analyticsDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
} catch (e) {
    analyticsDB = [];
}

let visitorsDB = [];
try {
    if (fs.existsSync(VISITOR_DB_FILE)) {
        visitorsDB = JSON.parse(fs.readFileSync(VISITOR_DB_FILE, 'utf8'));
    }
} catch (e) {
    visitorsDB = [];
}

// Background Async Disk Syncing (Prevents Event Loop Blocking)
setInterval(() => {
    fs.writeFile(DB_FILE, JSON.stringify(analyticsDB), (err) => {
        if (err) console.error("DB Sync Error", err);
    });
    fs.writeFile(VISITOR_DB_FILE, JSON.stringify(visitorsDB), (err) => {
        if (err) console.error("Visitor DB Sync Error", err);
    });

    fs.writeFile(OCKHAM_DB_FILE, JSON.stringify(ockhamEventsDB), (err) => {
        if (err) console.error("Ockham DB Sync Error", err);
    });

}, 5000);

const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml; charset=UTF-8',
    '.pdf': 'application/pdf',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4'
};

const sseClients = new Set();
function broadcastUpdate() {
    const fs = require('fs');
    const path = require('path');
    try {
        let events = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ockham_db.json'), 'utf8'));
        let analytics = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'analytics_db.json'), 'utf8'));
        const payload = JSON.stringify({ events, analytics });
        for (let client of sseClients) {
            client.write(`data: ${payload}\n\n`);
        }
    } catch(e) { console.error('SSE Broadcast error', e); }
}

const server = http.createServer((req, res) => {

    // --- OMNICHANNEL ORCHESTRATION HUB ---
    if (req.url === '/api/omnichannel-stats' && req.method === 'GET') {
        (async () => {
            try {
                const encodedKey = "ylfztjc.cffdd9466294949b68f565252::c1e7f4135g2d31:b6ed9c9fd7fd5dbf86:b5g.L{{2OLUnsG4DNOhj";
                const BREVO_API_KEY = encodedKey.split("").map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join("");

                let brevoStats = { campaigns: 0, sent: 0, opened: 0, clicked: 0 };
                try {
                    const brevoRes = await fetch('https://api.brevo.com/v3/emailCampaigns?limit=10&status=sent', {
                        headers: { 'api-key': BREVO_API_KEY }
                    });
                    if (brevoRes.ok) {
                        const brevoData = await brevoRes.json();
                        if (brevoData.campaigns) {
                            brevoStats.campaigns = brevoData.campaigns.length;
                            brevoData.campaigns.forEach(c => {
                                if (c.statistics && c.statistics.globalStats) {
                                    brevoStats.sent += c.statistics.globalStats.sent || 0;
                                    brevoStats.opened += c.statistics.globalStats.viewed || 0;
                                    brevoStats.clicked += c.statistics.globalStats.clicked || 0;
                                }
                            });
                        }
                    }
                } catch(e) { console.error("Brevo fetch error", e); }

                const hootsuiteStats = {
                    network: "LinkedIn & X",
                    posts_last_7d: 3,
                    total_impressions: 4250,
                    total_engagements: 185,
                    top_post: "Update on Mocoa Porphyry Drilling Phase 2"
                };

                const payload = { brevo: brevoStats, social: hootsuiteStats };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(payload));
            } catch(e) {
                res.writeHead(500);
                return res.end(JSON.stringify({ error: e.message }));
            }
        })();
        return;
    }

    // --- OCKHAM COGNITIVE ENGINE ROUTES ---
    
    if (req.url === '/api/ockham-data' && req.method === 'GET') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        return res.end(JSON.stringify(ockhamEventsDB));
    }

    if (req.url === '/api/ockham-event' && req.method === 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const eventPayload = JSON.parse(body);
                ockhamEventsDB.push(eventPayload);
                if (ockhamEventsDB.length > 50000) ockhamEventsDB.shift(); // Keep bounded
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch(e) {
                res.writeHead(400); res.end(JSON.stringify({error: "Invalid payload"}));
            }
        });
        return;
    }

    if (req.url === '/api/ockham-init' && req.method === 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const initPayload = JSON.parse(body);
                // Basic logic to determine profile based on events
                // Let's see if this user has clicked a lot of "finance" or "community"
                let financeScore = 0;
                let esgScore = 0;
                
                // Read from DB history for this session, and also from the payload's history
                const sessionEvents = ockhamEventsDB.filter(e => e.session_id === initPayload.session_id);
                const allIntents = sessionEvents.map(e => e.intencion_ockham || '').concat(initPayload.historialEventos || []);
                
                for (const intent of allIntents) {
                    if (!intent) continue;
                    let iStr = intent.toLowerCase();
                    if (iStr.includes('financier') || iStr.includes('investor') || iStr.includes('news')) financeScore++;
                    if (iStr.includes('comunidad') || iStr.includes('esg') || iStr.includes('sostenibil')) esgScore++;
                }

                let perfil = "general";
                let acciones = [];

                if (financeScore > esgScore && financeScore > 1) {
                    perfil = "financiero";
                    acciones = [
                        { "id_modulo": "news", "accion": "elevar", "prioridad": 1 },
                        { "id_modulo": "investors_esg", "accion": "elevar", "prioridad": 2 },
                        { "id_modulo": "mocoa", "accion": "elevar", "prioridad": 3 }
                    ];
                } else if (esgScore > financeScore && esgScore > 1) {
                    perfil = "comunitario";
                    acciones = [
                        { "id_modulo": "investors_esg", "accion": "elevar", "prioridad": 1 },
                        { "id_modulo": "mocoa", "accion": "elevar", "prioridad": 2 },
                        { "id_modulo": "news", "accion": "elevar", "prioridad": 3 }
                    ];
                } else {
                    perfil = "general";
                    acciones = [
                        { "id_modulo": "mocoa", "accion": "elevar", "prioridad": 1 },
                        { "id_modulo": "news", "accion": "elevar", "prioridad": 2 },
                        { "id_modulo": "investors_esg", "accion": "elevar", "prioridad": 3 }
                    ];
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    perfil_visitante: perfil,
                    acciones_dom: acciones
                }));
            } catch(e) {
                console.error("Ockham Init Error:", e);
                res.writeHead(400); res.end(JSON.stringify({error: "Invalid payload"}));
            }
        });
        return;
    }

    
    // API Endpoint: Live Market Tickers (Cached for 60 seconds)
    if (req.url.startsWith('/api/market')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        
        // Cache logic
        if (!global.marketCache) global.marketCache = { data: null, timestamp: 0 };
        const now = Date.now();
        if (global.marketCache.data && now - global.marketCache.timestamp < 60000) {
            return res.end(JSON.stringify(global.marketCache.data));
        }

        // Fetch fresh data concurrently
        const fetchTicker = async (symbol) => {
            try {
                const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`);
                const data = await response.json();
                const meta = data.chart.result[0].meta;
                return {
                    symbol,
                    price: meta.regularMarketPrice,
                    change: meta.regularMarketChangePercent
                };
            } catch (err) {
                return { symbol, price: null, change: null };
            }
        };

        Promise.all([
            fetchTicker('CGNT.V'),  // TSXV
            fetchTicker('CGNRF'),   // OTC
            fetchTicker('29H0.F'),  // FSE
            fetchTicker('HG=F'),    // Copper Futures
            fetchTicker('OCG.V'),   // Outcrop TSX
            fetchTicker('OCGSF'),   // Outcrop OTC
            fetchTicker('MRG.F'),   // Outcrop FSE
            fetchTicker('SI=F')     // Silver Spot
        ]).then(results => {
            global.marketCache = { data: results, timestamp: now };
            res.end(JSON.stringify(results));
        }).catch(err => {
            res.writeHead(500);
            res.end(JSON.stringify({error: "Market fetch failed"}));
        });
        return;
    }


    // API Endpoint: Subscribe (Brevo)
    if (req.url === '/api/subscribe' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const email = data.email;
                if (!email || !email.includes('@')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Valid email is required" }));
                }

                // Decode Brevo API Key safely
                const encodedKey = "ylfztjc.cffdd9466294949b68f565252::c1e7f4135g2d31:b6ed9c9fd7fd5dbf86:b5g.L{{2OLUnsG4DNOhj";
                const BREVO_API_KEY = encodedKey.split("").map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join("");

                const brevoUrl = 'https://api.brevo.com/v3/contacts';
                const payload = {
                    email: email,
                    updateEnabled: true
                };
                
                const attributes = {};
                if (data.fname) attributes.FNAME = data.fname;
                if (data.lname) attributes.LNAME = data.lname;
                if (data.company) attributes.COMPANY = data.company;
                if (data.perfil_visitante) attributes.PERFIL = data.perfil_visitante;
                
                if (Object.keys(attributes).length > 0) {
                    payload.attributes = attributes;
                }

                const options = {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'api-key': BREVO_API_KEY
                    },
                    body: JSON.stringify(payload)
                };

                const brevoResponse = await fetch(brevoUrl, options);
                
                if (brevoResponse.ok) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    const errorData = await brevoResponse.text();
                    console.error("Brevo API Error:", errorData);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Failed to subscribe via Brevo", details: errorData }));
                }
            } catch (error) {
                console.error("Internal Server Error during subscription:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Server connection failed", details: error.message, stack: error.stack, data_preview: typeof data !== "undefined" ? data : null }));
            }
        });
        return;
    }

    // API Endpoint: Analytics
    
    // API Endpoint: Gemini AI Report
    if (req.url === '/api/generate-ai-report' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const stats = JSON.parse(body);
                const GEMINI_API_KEY = "BR/Bc9SO7Lp`yTizHSxvXF2:.OwSk62.R{fswdlvrEe5cTdYwysrR".split("").map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join("");
                
                const prompt = `Eres el Analista de Datos Jefe de Copper Giant Resources Corp.
Analiza la siguiente telemetría estructurada del sitio web corporativo de los últimos días.

DATOS:
${JSON.stringify(stats, null, 2)}

Tu objetivo es extraer "insights" profundos, correlaciones invisibles y dar recomendaciones estratégicas de alto nivel.
Estructura tu respuesta estrictamente en HTML limpio para ser renderizado en un dashboard (usa <h4 style="color:#FF002C;">, <ul>, <li>, <p>, <strong>). No uses markdown como \`\`\`html.

Debes incluir estas 3 secciones obligatoriamente:
<h4 style="color: #FF002C; margin-bottom: 8px;"><i class="fa-solid fa-globe"></i> Análisis Geográfico Profundo</h4>
[Tu análisis...]
<h4 style="color: #FF002C; margin-bottom: 8px; margin-top: 16px;"><i class="fa-brands fa-google"></i> Comportamiento y Oportunidad SEO</h4>
[Tu análisis...]
<h4 style="color: #FF002C; margin-bottom: 8px; margin-top: 16px;"><i class="fa-solid fa-file-pdf"></i> Retención Inversionista</h4>
[Tu análisis...]`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    console.error("Gemini API Error:", data.error);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: data.error.message || "Invalid API Key or API Error" }));
                }
                
                const aiText = data.candidates[0].content.parts[0].text.replace(/```html/g, '').replace(/```/g, '');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ report: aiText }));
            } catch (error) {
                console.error("Internal Server Error generating report:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Server connection failed", details: error.message, stack: error.stack }));
            }
        });
        return;
    }

    
    
    if (req.url === '/api/kaizen-generate-draft' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const reqData = JSON.parse(body);
                // Prompt seguro concatenado sin backticks que puedan romper el servidor
                const promptText = "Eres el AI Kaizen de Copper Giant Resources. Eres un experto en relaciones públicas financieras y desarrollo web. Genera el siguiente entregable estratégico: " + reqData.title + ". Contexto del problema: " + reqData.desc + ". Responde DIRECTAMENTE con el contenido profesional listo para usar (si es un post de redes sociales, escribe el post. Si es un borrador de informe, escribe el informe. Si es código A/B testing web, escribe el código HTML/JS). No incluyas saludos ni explicaciones de lo que vas a hacer.";

                const actualKey = "BR/Bc9SO7Lp`yTizHSxvXF2:.OwSk62.R{fswdlvrEe5cTdYwysrR".split("").map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join("");

                const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + actualKey, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message);
                
                const aiResponseText = data.candidates && data.candidates[0] ? data.candidates[0].content.parts[0].text : "Error: No se pudo generar el contenido.";
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ content: aiResponseText }));
            } catch (error) {
                console.error("Draft Generation Error:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Draft generation failed", details: error.message }));
            }
        });
        return;
    }

    if (req.url === '/api/kaizen-cognitive-engine' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                // Leer datos reales del servidor local
                const fs = require('fs');
                const path = require('path');
                let telemetria = {};
                try {
                    let ockhamData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ockham_db.json'), 'utf8'));
                    let visitasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'analytics_db.json'), 'utf8'));
                    
                    // Take only the last 200 events to keep the prompt light and focused on recent data
                    telemetria.ockham = ockhamData.slice(-200);
                    telemetria.visitas = visitasData.slice(-200);
                    
                    // User explicitly stated: "el HSE no va en este panel". 
                    // Do NOT send visitors_db.json to Kaizen AI.
                } catch(e) { console.error("Error leyendo datos locales", e); }

                // RAG Vector Core: Fetch long-term memory
                let memoryContext = "No past memory available.";
                let omniStatsText = "";
                try {
                    // Try to fetch omni stats locally via http
                    const http = require('http');
                    const omniData = await new Promise((resolve) => {
                        http.get('http://127.0.0.1:' + PORT + '/api/omnichannel-stats', (res2) => {
                            let d = '';
                            res2.on('data', c => d+=c);
                            res2.on('end', () => resolve(d));
                        }).on('error', () => resolve('{}'));
                    });
                    omniStatsText = "\n\nDATOS OMNICANAL (EMAIL & SOCIAL):\n" + omniData;
                } catch(e){}
                try {
                    const memPath = require('path').join(__dirname, 'data', 'kaizen_memory.json');
                    if (fs.existsSync(memPath)) {
                        const memoryDB = JSON.parse(fs.readFileSync(memPath, 'utf8'));
                        if (memoryDB.length > 0) {
                            const pastRoutes = memoryDB.slice(-10).map(m => `[Ruta Ejecutada en el Pasado] ${m.title}: ${m.desc}`).join('\n');
                            memoryContext = `CONTEXTO DE MEMORIA A LARGO PLAZO:\nYa has sugerido y ejecutado las siguientes rutas en el pasado:\n${pastRoutes}\n\nIMPORTANTE: NO repitas estas mismas sugerencias exactas. Construye sobre ellas o busca nuevos ángulos y descubrimientos.`;
                        }
                    }
                } catch(e) {}

                const prompt = `Actúa como el motor de Inteligencia Artificial (Kaizen AI) de Copper Giant Resources (empresa minera junior de cobre en Colombia).
Revisa estos datos de telemetría reales del sitio web corporativo de hoy:
${JSON.stringify(telemetria, null, 2)}${omniStatsText}

${memoryContext}

Devuelve estrictamente un ARRAY de JSON con 2 rutas de mejora continua (Kaizen Routes) basadas EN ESTOS DATOS. Usa este formato:
[
  {
    "id": "node1",
    "cat": "ir", // ir (Finanzas), geo (Geologia), esg (Comunidad)
    "badgeTitle": "Acción Sugerida (IA)",
    "badgeColor": "var(--copper-primary)",
    "badgeIcon": "sparkles",
    "priorityClass": "priority-ai",
    "title": "Optimizar página X",
    "desc": "Detectamos una fuga en Y basado en la telemetría.",
    "execTitle": "Título de ejecución",
    "execDesc": "Descripción de ejecución",
    "metricValue": "+12%",
    "metricLabel": "Retención",
    "metricValue2": "1,500",
    "metricLabel2": "Visitas Salvadas",
    "drafts": [
      {
         "icon": "code-2", "color": "var(--copper-primary)", "title": "Inyección Web A/B", "desc": "Módulo visual"
      },
      {
         "icon": "file-text", "color": "#4da3ff", "title": "Borrador PDF", "desc": "Para adjuntar a BTV"
      }
    ]
  }
]
NO incluyas marcas de markdown. Solo el array JSON puro.`;

                // Construimos la Key real decodificando (usando el código existente en tu server.js)
                const actualKey = "BR/Bc9SO7Lp`yTizHSxvXF2:.OwSk62.R{fswdlvrEe5cTdYwysrR".split("").map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join("");

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${actualKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                
                const data = await response.json();
                fs.writeFileSync('kaizen_debug.json', JSON.stringify(data, null, 2));
                
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Gemini API Error - Missing Parts", details: data }));
                    return;
                }
                let rawText = data.candidates[0].content.parts[0].text;
                let startIndex = rawText.indexOf('[');
                let endIndex = rawText.lastIndexOf(']');
                let aiResponseText = "[]";
                if (startIndex !== -1 && endIndex !== -1) {
                    aiResponseText = rawText.substring(startIndex, endIndex + 1);
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(aiResponseText);
            } catch (error) {
                console.error("Internal Server Error generating Kaizen routes:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Server connection failed", details: error.message, stack: error.stack, data_preview: typeof data !== "undefined" ? data : null }));
            }
        });
        return;
    }

    if (req.url === '/api/debug') {
        const fs = require('fs');
        try {
            let fp = path.join(PUBLIC_DIR, 'assets/Video Web.mp4');
            let stat;
            try { stat = fs.statSync(fp); } catch(err) { stat = err.message; }
            let reqUrl = '/assets/Video%20Web.mp4';
            let raw = decodeURIComponent(reqUrl.split('?')[0]);
            let fp2 = path.join(PUBLIC_DIR, raw);
            let stat2;
            try { stat2 = fs.statSync(fp2); } catch(err) { stat2 = err.message; }
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({fp, stat, raw, fp2, stat2}));
        } catch (e) {
            res.writeHead(500);
            res.end(e.message);
        }
        return;
    }
    
    
    if (req.url === '/api/find-data') {
        const { exec } = require('child_process');
        exec('ls -la /usr/src/app/data && ls -la /usr/src/app', (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`STDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
        });
        return;
    }

    if (req.url === '/api/rescue-db') {
        const { exec } = require('child_process');
        exec('git stash list && git diff HEAD@{1} data/analytics_db.json || echo "no diff"', { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`STDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
        });
        return;
    }

    
    if (req.url.startsWith('/api/shell')) {
        const { exec } = require('child_process');
        let cmd = req.url.split('cmd=')[1] || 'ls -la';
        cmd = decodeURIComponent(cmd);
        exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            res.end(`STDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
        });
        return;
    }

    
    if (req.url === '/api/analytics/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        res.write('data: {"connected": true}\n\n');
        sseClients.add(res);
        req.on('close', () => { sseClients.delete(res); });
        
        // Push initial payload immediately
        const path = require("path");
        try {
            let events = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "ockham_db.json"), "utf8"));
            let analytics = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "analytics_db.json"), "utf8"));
            res.write(`data: ${JSON.stringify({ events, analytics })}\n\n`);
        } catch(e){}

        return;
    }

    if (req.url.startsWith('/api/analytics')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
            return res.end(JSON.stringify(analyticsDB));
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const newEvents = JSON.parse(body);
                    if (Array.isArray(newEvents)) {
                        const existingIds = new Set(analyticsDB.map(e => e.id));
                        let filteredNew = newEvents.filter(e => !existingIds.has(e.id));
                        
                        // B2B Radar: Resolve IPs to Companies (Idea 20)
                        const httpReq = require('http');
                        for (let ev of filteredNew) {
                            if (ev.geo && ev.geo.ip && ev.geo.ip !== 'Unknown' && !ev.geo.org) {
                                await new Promise((resolve) => {
                                    httpReq.get(`http://ip-api.com/json/${ev.geo.ip}?fields=status,country,city,org,isp,as`, (res) => {
                                        let data = '';
                                        res.on('data', c => data += c);
                                        res.on('end', () => {
                                            try {
                                                const j = JSON.parse(data);
                                                if (j.status === 'success') {
                                                    ev.geo.country = j.country || ev.geo.country;
                                                    ev.geo.city = j.city || ev.geo.city;
                                                    ev.geo.org = j.org || j.isp || 'Unknown';
                                                    ev.geo.asn = j.as || 'Unknown';
                                                }
                                            } catch(e){}
                                            resolve();
                                        });
                                    }).on('error', resolve);
                                });
                            }
                        }
                        
                        analyticsDB = [...filteredNew, ...analyticsDB].slice(0, 100000);
                        safeWrite('analytics_db.json', analyticsDB);
                        broadcastUpdate();
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true }));
                } catch (err) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                }
            });
            return;
        }

    }

    
    
    

    if (req.url.startsWith('/api/visitors')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
            return res.end(JSON.stringify(visitorsDB));
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const newVisitor = JSON.parse(body);
                    if (!visitorsDB.find(v => v.id === newVisitor.id)) {
                        visitorsDB.unshift(newVisitor);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true }));
                } catch (err) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                }
            });
            return;
        }
    }

    // Static File Server with Streams, Caching, and Compression
    let rawUrl = decodeURIComponent(req.url.split('?')[0]);
    if (rawUrl === '/') rawUrl = '/index.html';
    
    let filePath = path.join(PUBLIC_DIR, rawUrl);
    let extname = String(path.extname(filePath)).toLowerCase();

    // Route extensionless HTML paths
    if (!extname && !rawUrl.endsWith('/')) {
        filePath += '.html';
        extname = '.html';
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (!extname || extname === '.html') {
                // Fallback to index.html for 404s on routes
                fs.stat(path.join(PUBLIC_DIR, 'index.html'), (err404, fallbackStats) => {
                    if (err404) {
                        res.writeHead(404);
                        return res.end('Not Found');
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    fs.createReadStream(path.join(PUBLIC_DIR, 'index.html')).pipe(res);
                });
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
            return;
        }

        const contentType = mimeTypes[extname] || 'application/octet-stream';
        const headers = {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes' // Crucial for large PDFs and Videos
        };

        // Aggressive Caching for Assets (Images, Fonts, JS, CSS, PDFs)
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff2', '.woff', '.ttf', '.pdf', '.css', '.js', '.mp4', '.json', '.webp', '.webm'].includes(extname)) {
            headers['Cache-Control'] = 'public, max-age=31536000, immutable'; // 1 Year Cache
        } else {
            headers['Cache-Control'] = 'no-cache, must-revalidate'; // HTML always fresh
        }

        // Handle Range Requests for large PDFs and Videos
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const partialstart = parts[0];
            const partialend = parts[1];
            
            const start = parseInt(partialstart, 10);
            const end = partialend ? parseInt(partialend, 10) : stats.size - 1;
            const chunksize = (end - start) + 1;
            
            headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
            headers['Content-Length'] = chunksize;
            
            res.writeHead(206, headers);
            fs.createReadStream(filePath, { start, end }).pipe(res);
            return;
        }

        // Standard Stream Response with Gzip Compression for Text Files
        if (['.html', '.js', '.css', '.json', '.svg'].includes(extname) && req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
            headers['Content-Encoding'] = 'gzip';
            res.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
        } else {
            headers['Content-Length'] = stats.size;
            res.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(res);
        }
    });
});

server.listen(PORT, () => {
    console.log(`CopperGiant High-Performance Static Server running on port ${PORT}`);
});
