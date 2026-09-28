import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { testTelegramBot, setTelegramWebhook } from '@/lib/telegram-gateway';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    let config = await prisma.hermesConfig.findFirst({
      where: tenantId ? { tenantId } : {},
    });

    if (!config) {
      config = await prisma.hermesConfig.create({
        data: {
          tenantId: tenantId || null,
          endpointUrl: 'http://localhost:8000',
          apiKey: 'hermes_outcrop_secret_2026',
          telegramBotToken: '8925340221:AAHU0nrxvP2XqPewfZMK1GzmjjyFGPIUX8o',
          telegramChatId: '-5370719843',
          gatewayMode: 'TELEGRAM',
          isActive: true,
        },
      });
    }

    let isReachable = false;
    let endpointStatus = 'OFFLINE';
    let latencyMs: number | null = null;
    let botInfo: any = null;

    // 1. Check Telegram Gateway status if configured
    if (config.telegramBotToken) {
      const start = Date.now();
      const botTest = await testTelegramBot(config.telegramBotToken);
      latencyMs = Date.now() - start;

      if (botTest.ok) {
        isReachable = true;
        endpointStatus = 'ONLINE';
        botInfo = botTest.bot;
      }
    } else {
      // 2. Fallback check HTTP tunnel endpoint
      try {
        const start = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const cleanUrl = (config.endpointUrl || '').replace(/\/+$/, '');

        const testRes = await fetch(`${cleanUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
        }).catch(async () => {
          return await fetch(`${cleanUrl}/`, {
            method: 'GET',
            signal: controller.signal,
            headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
          });
        });

        clearTimeout(timeoutId);
        latencyMs = Date.now() - start;

        if (testRes && (testRes.ok || testRes.status === 404 || testRes.status === 401 || testRes.status === 405)) {
          isReachable = true;
          endpointStatus = 'ONLINE';
        }
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      config,
      status: endpointStatus,
      isReachable,
      latencyMs: isReachable ? latencyMs : null,
      botInfo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantId,
      endpointUrl,
      apiKey,
      telegramBotToken,
      telegramChatId,
      gatewayMode,
      isActive,
    } = body;

    const existing = await prisma.hermesConfig.findFirst({
      where: tenantId ? { tenantId } : {},
    });

    let config;
    if (existing) {
      config = await prisma.hermesConfig.update({
        where: { id: existing.id },
        data: {
          endpointUrl: endpointUrl !== undefined ? endpointUrl : existing.endpointUrl,
          apiKey: apiKey !== undefined ? apiKey : existing.apiKey,
          telegramBotToken: telegramBotToken !== undefined ? telegramBotToken : existing.telegramBotToken,
          telegramChatId: telegramChatId !== undefined ? telegramChatId : existing.telegramChatId,
          gatewayMode: gatewayMode !== undefined ? gatewayMode : existing.gatewayMode,
          isActive: isActive !== undefined ? isActive : existing.isActive,
        },
      });
    } else {
      config = await prisma.hermesConfig.create({
        data: {
          tenantId: tenantId || null,
          endpointUrl: endpointUrl || 'http://localhost:8000',
          apiKey: apiKey || 'hermes_outcrop_secret_2026',
          telegramBotToken: telegramBotToken || null,
          telegramChatId: telegramChatId || '8724044473',
          gatewayMode: gatewayMode || 'TELEGRAM',
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    // If a new bot token is saved, auto-register Telegram webhook for updates
    if (config.telegramBotToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://homunculus-host-outcrop-silver-crm.wu48i0.easypanel.host';
      const webhookUrl = `${appUrl}/api/hermes/telegram-webhook`;
      await setTelegramWebhook(config.telegramBotToken, webhookUrl).catch(() => {});
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
