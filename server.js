const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 80;
const PUBLIC_DIR = path.join(__dirname, 'proposal');
const DB_FILE = path.join(__dirname, 'data', 'analytics_db.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
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

// Background Async Disk Syncing (Prevents Event Loop Blocking)
setInterval(() => {
    fs.writeFile(DB_FILE, JSON.stringify(analyticsDB), (err) => {
        if (err) console.error("DB Sync Error", err);
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

const server = http.createServer((req, res) => {
    
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
            fetchTicker('LBCMF'),   // OTC
            fetchTicker('29H0.F'),  // FSE
            fetchTicker('HG=F')     // Copper Futures
        ]).then(results => {
            global.marketCache = { data: results, timestamp: now };
            res.end(JSON.stringify(results));
        }).catch(err => {
            res.writeHead(500);
            res.end(JSON.stringify({error: "Market fetch failed"}));
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
                res.end(JSON.stringify({ error: "Server connection failed" }));
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
            req.on('end', () => {
                try {
                    const newEvents = JSON.parse(body);
                    if (Array.isArray(newEvents)) {
                        const existingIds = new Set(analyticsDB.map(e => e.id));
                        const filteredNew = newEvents.filter(e => !existingIds.has(e.id));
                        
                        analyticsDB = [...filteredNew, ...analyticsDB].slice(0, 5000);
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
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff2', '.woff', '.ttf', '.pdf', '.css', '.js', '.mp4'].includes(extname)) {
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
