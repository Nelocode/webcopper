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
    // API Endpoint: Analytics
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
    let rawUrl = req.url.split('?')[0];
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
            // Fallback to index.html for 404s
            fs.stat(path.join(PUBLIC_DIR, 'index.html'), (err404, fallbackStats) => {
                if (err404) {
                    res.writeHead(404);
                    return res.end('Not Found');
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                fs.createReadStream(path.join(PUBLIC_DIR, 'index.html')).pipe(res);
            });
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
