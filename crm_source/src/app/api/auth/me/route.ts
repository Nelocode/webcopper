import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('crm_session');

    if (sessionCookie && sessionCookie.value) {
      try {
        const payload = await verifySession(sessionCookie.value);
        if (!payload) throw new Error('Invalid session');
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { tenant: true },
        });

        if (user) {
          return NextResponse.json({
            authenticated: true,
            user: {
              id: user.id,
              name: user.name,
              phone: user.phone,
              email: user.email,
              role: user.role,
              tenantId: user.tenantId,
              tenant: user.tenant,
            },
          });
        }
      } catch (e) {}
    }

    return NextResponse.json({ authenticated: false, user: null });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'LOGOUT') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.delete('crm_session');
      return response;
    }
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
