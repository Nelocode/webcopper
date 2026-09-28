import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    if (cleanPhone.length < 7) {
      return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 });
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Lookup pre-registered user strictly
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: cleanPhone },
          { phone: { contains: cleanPhone.slice(-10) } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado. El número de celular no está registrado en la plataforma. Contacta al administrador para solicitar acceso.',
        },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    // Send OTP message via WhatsApp DB / Daemon Engine
    const otpMessageText =
      `🔑 *Outcrop Silver CRM Security Verification Code*\n\n` +
      `Your single-use login code is: *${otpCode}*\n\n` +
      `⏱️ *Valid for 5 minutes*. Please do not share this code with anyone.`;

    await prisma.whatsAppMessage.create({
      data: {
        fromNumber: 'CRM Bot',
        senderName: 'CRM Security Daemon',
        toNumber: user.phone,
        message: otpMessageText,
        direction: 'OUTBOUND',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Código de verificación de 6 dígitos enviado por WhatsApp a ${user.phone}`,
      devPreviewCode: otpCode,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
