const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;
const PUBLIC_DIR = path.join(__dirname, 'proposal');
const DB_FILE = path.join(__dirname, 'analytics_db.json');

// Initialize DB file if missing
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
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
            try {
                const data = fs.readFileSync(DB_FILE, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(data);
            } catch (err) {
                res.writeHead(500);
                return res.end(JSON.stringify({ error: 'DB Read Error' }));
            }
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const newEvents = JSON.parse(body); // Array of events
                    let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
                    
                    // Prepend new events, ensuring no duplicate IDs
                    const existingIds = new Set(db.map(e => e.id));
                    const filteredNew = Array.isArray(newEvents) ? newEvents.filter(e => !existingIds.has(e.id)) : [];
                    
                    db = [...filteredNew, ...db].slice(0, 5000); // Keep last 5000 events
                    
                    fs.writeFileSync(DB_FILE, JSON.stringify(db));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, count: db.length }));
                } catch (err) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                }
            });
            return;
        }
    }

    // Static File Server
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    let extname = String(path.extname(filePath)).toLowerCase();
    
    // Default to .html if no extension provided (e.g. /corporate -> /corporate.html)
    if (!extname && !req.url.endsWith('/')) {
        filePath += '.html';
        extname = '.html';
    }

    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, fallback) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(fallback, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
