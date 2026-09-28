import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otpCode } = body;

    if (!phone || !otpCode) {
      return NextResponse.json({ success: false, error: 'Phone number and verification code are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone },
          { phone: `+${cleanPhone}` },
          { phone: cleanPhone },
          { phone: { contains: cleanPhone.slice(-10) } },
        ],
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found with this phone number' }, { status: 404 });
    }

    // Valid non-expired otpCode match
    const isValidMatch = user.otpCode === otpCode && user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();

    if (!isValidMatch) {
      return NextResponse.json({ success: false, error: 'Invalid or expired verification code' }, { status: 401 });
    }

    // Clear used OTP code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    // Create session object
    const sessionPayload = {
      userId: user.id,
      name: user.name || 'CRM User',
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name || 'Global',
      tenantSlug: user.tenant?.slug || 'global',
    };

    const response = NextResponse.json({
      success: true,
      message: `Authentication successful! Welcome, ${user.name || 'Administrator'}.`,
      user: sessionPayload,
      tenant: user.tenant,
    });

    // Set HTTP-only session cookie
    const sessionToken = await signSession(sessionPayload);
    response.cookies.set({
      name: 'crm_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days (1 month)
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
