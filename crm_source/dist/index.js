"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const ocr_routes_1 = __importDefault(require("./routes/ocr.routes"));
const transcribe_routes_1 = __importDefault(require("./routes/transcribe.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const organization_routes_1 = __importDefault(require("./routes/organization.routes"));
const interaction_routes_1 = __importDefault(require("./routes/interaction.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const note_routes_1 = __importDefault(require("./routes/note.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
const meeting_routes_1 = __importDefault(require("./routes/meeting.routes"));
const integration_routes_1 = __importDefault(require("./routes/integration.routes"));
const briefing_routes_1 = __importDefault(require("./routes/briefing.routes"));
const relationship_routes_1 = __importDefault(require("./routes/relationship.routes"));
const investigate_controller_1 = require("./controllers/investigate.controller");
const dashboard_controller_1 = require("./controllers/dashboard.controller");
const briefing_controller_1 = require("./controllers/briefing.controller");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const PORT = parseInt(process.env.PORT || '80', 10);
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.static('public'));
// Routes
app.use('/api/ocr', ocr_routes_1.default);
app.use('/api/transcribe', transcribe_routes_1.default);
app.use('/api/contacts', contact_routes_1.default);
app.use('/api/organizations', organization_routes_1.default);
app.use('/api/interactions', interaction_routes_1.default);
app.use('/api/tags', tag_routes_1.default);
app.use('/api/notes', note_routes_1.default);
app.use('/api/calendar', calendar_routes_1.default);
app.use('/api/meetings', meeting_routes_1.default);
app.use('/api/integrations', integration_routes_1.default);
app.use('/api/briefings', briefing_routes_1.default);
app.use('/api/relationships', relationship_routes_1.default);
app.post('/api/investigate', investigate_controller_1.investigateContact);
app.post('/api/investigate/batch', investigate_controller_1.batchInvestigate);
app.get('/api/dashboard', dashboard_controller_1.getDashboard);
app.get('/api/config', (req, res) => {
    const openaiKey = process.env.OPENAI_API_KEY || '';
    const tavilyKey = process.env.TAVILY_API_KEY || '';
    res.json({
        openai_configured: !!(openaiKey && !openaiKey.includes('your-api-key-here')),
        tavily_configured: !!(tavilyKey && !tavilyKey.includes('your-api-key-here'))
    });
});
app.get('/', (req, res) => {
    res.json({ status: 'ok', engine: 'The Core Engine v1.5' });
});
// Serve the relationship visualizer
app.get('/relaciones', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'relaciones.html'));
});
// Serve the changelog viewer
app.get('/changelog', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'changelog.html'));
});
// Serve the CRM React frontend — SPA mode
app.use('/app', express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
app.get('/app*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', engine: 'The Core Engine v1.5', db: 'connected', timestamp: new Date().toISOString() });
    }
    catch (e) {
        res.status(503).json({ status: 'error', engine: 'The Core Engine v1.5', db: 'disconnected' });
    }
});
let cronInterval;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 The Core Engine running on port ${PORT}`);
    console.log(`📦 Database: ${process.env.DATABASE_URL}`);
    // Start checking every 60s for daily push briefing
    cronInterval = setInterval(briefing_controller_1.runDailyBriefingCronCheck, 60000);
});
// Graceful shutdown — prevents SIGTERM crash loops in Docker
const shutdown = async (signal) => {
    console.log(`\n[Core Engine] ${signal} received. Shutting down gracefully...`);
    if (cronInterval)
        clearInterval(cronInterval);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('[Core Engine] Shutdown complete.');
        process.exit(0);
    });
    // Force exit after 10s if graceful shutdown fails
    setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
