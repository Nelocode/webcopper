#!/usr/bin/env node

/**
 * CopperMind Mac Agent Bridge Daemon (v19.0)
 * Multi-Turn Conversation Memory Context & Real CRM Habitability Tools
 */

import { spawn } from 'child_process';

const CRM_URL = process.env.CRM_URL || 'https://homunculus-host-outcrop-silver-crm.wu48i0.easypanel.host';
const HERMES_BIN = process.env.HERMES_BIN || '/Users/i2carvajal/.local/bin/hermes';
const POLL_INTERVAL_MS = 2500;
const processedTaskIds = new Set();

const SYSTEM_PATH = `/Users/i2carvajal/.local/bin:/Users/i2carvajal/.hermes/hermes-agent/venv/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}`;

console.log('🧠 [CopperMind Daemon v19.0] Iniciando puente con habitabilidad del CRM y memoria en Mac...');
console.log(`📡 Conectado a CRM: ${CRM_URL}`);
console.log(`⚙️ Binario Hermes: ${HERMES_BIN}`);

async function pollTasks() {
  try {
    const res = await fetch(`${CRM_URL}/api/hermes/tasks?limit=5`);
    if (!res.ok) return;

    const data = await res.json();
    const tasks = data.tasks || [];

    for (const task of tasks) {
      if (processedTaskIds.has(task.taskId)) continue;

      // Mark as being processed
      processedTaskIds.add(task.taskId);
      console.log(`\n📥 [Nueva Tarea Recibida] Sesión: ${task.sessionId}`);
      console.log(`💬 Prompt: "${task.prompt}"`);

      executeHermesTask(task);
    }
  } catch (err) {
    // Silent catch on network hiccups
  }
}

function executeHermesTask(task) {
  const startTime = Date.now();

  const crmContextInstructions = `[ROL Y HÁBITAT EN EL CRM DE OUTCROP SILVER]:
Eres Hermes / CopperMind, el Agente Autónomo residente de Outcrop Silver CRM (CRMV2.0) en este Mac.
Tienes acceso total a consultar, crear, modificar y analizar la base de datos real del CRM usando la herramienta de terminal:
- Listar contactos: node /Users/i2carvajal/Documents/Proyectos/CRMV2.0/scripts/crm-cli.mjs list-contacts
- Buscar contactos: node /Users/i2carvajal/Documents/Proyectos/CRMV2.0/scripts/crm-cli.mjs search-contacts "<nombre o empresa>"
- Ver contacto: node /Users/i2carvajal/Documents/Proyectos/CRMV2.0/scripts/crm-cli.mjs get-contact "<nombre o id>"
- Crear contacto: node /Users/i2carvajal/Documents/Proyectos/CRMV2.0/scripts/crm-cli.mjs create-contact '{"name":"...","company":"...","email":"...","stage":"..."}'
- Actualizar contacto / etapa: node /Users/i2carvajal/Documents/Proyectos/CRMV2.0/scripts/crm-cli.mjs update-contact "<nombre o id>" '{"stage":"Deal Committed"}'
- Métricas del CRM: node /Users/i2carvajal/Documents/Proyectos/CRMV2.0/scripts/crm-cli.mjs stats

Si Nelson te pide revisar contactos, buscar información, cambiar etapas o crear inversionistas, ejecuta el comando de CLI arriba para que la acción se refleje en la base de datos del CRM.`;

  let historyBlock = '';
  if (task.history && task.history.length > 0) {
    historyBlock = `\n\n[HISTORIAL DE ESTA CONVERSACIÓN]:\n` +
      task.history.map((m) => `[${m.role === 'user' ? 'Nelson' : 'Hermes'}]: ${m.content}`).join('\n\n');
  }

  const finalPrompt = `${crmContextInstructions}${historyBlock}\n\n[SOLICITUD ACTUAL DE NELSON]:\n${task.prompt}`;

  console.log(`⚡ Ejecutando Hermes con habitabilidad de CRM (${task.history?.length || 0} turnos previos)...`);

  const child = spawn(
    HERMES_BIN,
    ['-z', finalPrompt, '--yolo'],
    {
      env: {
        ...process.env,
        PATH: SYSTEM_PATH,
        HERMES_ACCEPT_HOOKS: '1',
      },
    }
  );

  let stdoutData = '';
  let stderrData = '';

  child.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  const timer = setTimeout(() => {
    child.kill('SIGKILL');
  }, 300000); // 5 minutes timeout

  child.on('close', async (code) => {
    clearTimeout(timer);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    const output = (stdoutData || stderrData || '').trim();

    if (code === 0 || output.length > 20) {
      console.log(`✅ [Completado en ${duration}s] Enviando respuesta al CRM...`);

      // Post real result to CRM Webhook
      try {
        const webhookRes = await fetch(`${CRM_URL}/api/hermes/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer hermes_outcrop_secret_2026',
          },
          body: JSON.stringify({
            sessionId: task.sessionId,
            role: 'assistant',
            content: output || 'Tarea completada exitosamente.',
            worker: {
              name: task.workerName !== 'GENERAL' ? task.workerName : 'CopperMind Local Agent',
              status: 'completed',
              summary: `Ejecutado localmente en Mac en ${duration}s`,
            },
          }),
        });

        const whData = await webhookRes.json().catch(() => ({}));
        console.log(`🚀 [Sincronizado con CRM]:`, whData);
      } catch (postErr) {
        console.error('Error posting to webhook:', postErr.message);
      }
    } else {
      console.error(`❌ [Error código ${code}]:`, stderrData || stdoutData);

      await fetch(`${CRM_URL}/api/hermes/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer hermes_outcrop_secret_2026',
        },
        body: JSON.stringify({
          sessionId: task.sessionId,
          role: 'assistant',
          content: `⚠️ Hubo un detalle al ejecutar la tarea en el Mac:\n\`\`\`\n${stderrData || stdoutData || `Código de salida: ${code}`}\n\`\`\``,
          worker: {
            name: 'CopperMind Local Agent',
            status: 'error',
          },
        }),
      }).catch(() => {});
    }
  });

  child.on('error', async (err) => {
    clearTimeout(timer);
    console.error('Child process spawn error:', err.message);
    await fetch(`${CRM_URL}/api/hermes/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer hermes_outcrop_secret_2026',
      },
      body: JSON.stringify({
        sessionId: task.sessionId,
        role: 'assistant',
        content: `⚠️ Error al iniciar el proceso en el Mac: ${err.message}`,
        worker: {
          name: 'CopperMind Local Agent',
          status: 'error',
        },
      }),
    }).catch(() => {});
  });
}

// Start polling loop
setInterval(pollTasks, POLL_INTERVAL_MS);
pollTasks();
