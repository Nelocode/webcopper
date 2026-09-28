import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import ocrRoutes from './routes/ocr.routes';
import transcribeRoutes from './routes/transcribe.routes';
import contactRoutes from './routes/contact.routes';
import organizationRoutes from './routes/organization.routes';
import interactionRoutes from './routes/interaction.routes';
import tagRoutes from './routes/tag.routes';
import noteRoutes from './routes/note.routes';
import calendarRoutes from './routes/calendar.routes';
import meetingRoutes from './routes/meeting.routes';
import integrationRoutes from './routes/integration.routes';
import briefingRoutes from './routes/briefing.routes';
import relationshipRoutes from './routes/relationship.routes';
import { investigateContact, batchInvestigate } from './controllers/investigate.controller';
import { getDashboard } from './controllers/dashboard.controller';
import { runDailyBriefingCronCheck } from './controllers/briefing.controller';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '80', 10);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Routes
app.use('/api/ocr', ocrRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/briefings', briefingRoutes);
app.use('/api/relationships', relationshipRoutes);
app.post('/api/investigate', investigateContact);
app.post('/api/investigate/batch', batchInvestigate);
app.get('/api/dashboard', getDashboard);
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
  res.sendFile(path.join(__dirname, '..', 'public', 'relaciones.html'));
});

// Serve the changelog viewer
app.get('/changelog', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'changelog.html'));
});

// Serve the CRM React frontend — SPA mode
app.use('/app', express.static(path.join(__dirname, '..', 'public')));
app.get('/app*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', engine: 'The Core Engine v1.5', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', engine: 'The Core Engine v1.5', db: 'disconnected' });
  }
});

let cronInterval: NodeJS.Timeout;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 The Core Engine running on port ${PORT}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL}`);
  
  // Start checking every 60s for daily push briefing
  cronInterval = setInterval(runDailyBriefingCronCheck, 60000);
});

// Graceful shutdown — prevents SIGTERM crash loops in Docker
const shutdown = async (signal: string) => {
  console.log(`\n[Core Engine] ${signal} received. Shutting down gracefully...`);
  if (cronInterval) clearInterval(cronInterval);
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

export { prisma };
