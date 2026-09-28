const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 Starting CopperGiant Operating System...");

// 1. Start CRM Microservice on Port 3001
const crmProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'crm_source'),
    env: { 
        ...process.env, 
        PORT: '3001', 
        DATABASE_URL: 'file:../../data/copper_crm_live.db',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-api-key-here',
        TAVILY_API_KEY: process.env.TAVILY_API_KEY || 'your-api-key-here'
    },
    stdio: 'inherit'
});

// 2. Start Main CopperWeb Server
const webProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env }, // inherits EasyPanel's PORT
    stdio: 'inherit'
});

const shutdown = () => {
    console.log("Shutting down system...");
    crmProcess.kill();
    webProcess.kill();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
