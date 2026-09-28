import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/session';

async function sendResendOtpEmail(email: string, otpCode: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[MagicLogin] RESEND_API_KEY no configurado en .env — omitiendo envío de correo.');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'The Core CRM <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `🔑 Código de Acceso Seguro: ${otpCode} — Outcrop Silver CRM`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Acceso - Outcrop Silver CRM</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #07080c; font-family: 'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07080c; padding: 40px 10px;">
              <tr>
                <td align="center">
                  <!-- Main Email Container Card -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background: #0c0e17; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 28px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);">
                    
                    <!-- Top Brand Banner Header -->
                    <tr>
                      <td style="padding: 36px 36px 20px 36px; text-align: center; background: linear-gradient(180deg, rgba(0, 223, 223, 0.08) 0%, rgba(12, 14, 23, 0) 100%);">
                        <div style="display: inline-block; padding: 8px 16px; background-color: rgba(0, 223, 223, 0.1); border: 1px solid rgba(0, 223, 223, 0.3); border-radius: 100px; margin-bottom: 16px;">
                          <span style="color: #00dfdf; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">OUTCROP SILVER CORP</span>
                        </div>
                        <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">THE CORE CRM</h1>
                        <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Plataforma de Gestión de Inversionistas</p>
                      </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                      <td style="padding: 0 36px 36px 36px;">
                        <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6; margin-top: 0;">Hola,</p>
                        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">Has solicitado un PIN de verificación para iniciar sesión en el portal de <strong>Outcrop Silver Corp</strong>. Utiliza la siguiente clave única:</p>
                        
                        <!-- Glow PIN Display Box -->
                        <div style="text-align: center; margin: 28px 0; padding: 28px 20px; background: linear-gradient(135deg, #101422 0%, #161b2e 100%); border-radius: 20px; border: 1px solid rgba(0, 223, 223, 0.4); box-shadow: 0 0 30px rgba(0, 223, 223, 0.15);">
                          <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #00dfdf; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 10px rgba(0, 223, 223, 0.5);">${otpCode}</span>
                        </div>
                        
                        <!-- Instructions & Security Notice -->
                        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 16px; margin-bottom: 24px; text-align: center;">
                          <p style="font-size: 12px; color: #cbd5e1; margin: 0; line-height: 1.5;">
                            ⏱️ Este código expira automáticamente en <strong>10 minutos</strong>.<br>
                            🔒 Validez de sesión: <strong>30 días continuos</strong> tras autenticarse.
                          </p>
                        </div>

                        <p style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: center; margin: 0;">Si no intentaste iniciar sesión en el CRM, puedes ignorar este mensaje de forma segura.</p>
                      </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                      <td style="padding: 20px 36px; background-color: #07080c; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
                        <p style="font-size: 11px; font-weight: 700; color: #475569; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Outcrop Silver Corp — Proyecto Santa Ana</p>
                        <p style="font-size: 10px; color: #334155; margin: 4px 0 0 0;">© ${new Date().getFullYear()} The Core CRM Engine. Todos los derechos reservados.</p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`[MagicLogin] Email de verificación enviado a ${email} vía Resend (ID: ${data.id})`);
      return true;
    } else {
      console.error('[MagicLogin] Error al enviar email vía Resend:', data);
      return false;
    }
  } catch (error) {
    console.error('[MagicLogin] Excepción en envío Resend:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    if (action === 'REQUEST_CODE') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }

      // 1. Pre-registration check or auto-create Outcrop user for ANY email
      const normalizedEmail = email.trim().toLowerCase();
      let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const outcropTenant = await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } });
        const uniquePhone = `+579${Math.floor(100000000 + Math.random() * 900000000)}`;
        const isAdminEmail =
          normalizedEmail.includes('admin') ||
          normalizedEmail.includes('carvajal') ||
          normalizedEmail.endsWith('@i2services.co') ||
          normalizedEmail.endsWith('@outcropsilver.com');

        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            phone: uniquePhone,
            name: normalizedEmail.split('@')[0].toUpperCase(),
            role: isAdminEmail ? 'SUPER_ADMIN' : 'AGENT',
            tenantId: outcropTenant?.id || null,
          },
        });
      }

      // 2. Generate 6-digit OTP pin (10 min expiry)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt: expiresAt },
      });

      // 3. Attempt email send safely
      let emailSent = false;
      try {
        emailSent = await sendResendOtpEmail(normalizedEmail, otpCode);
      } catch (e) {
        console.log('[MagicLogin] Non-critical email send error:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Código de acceso generado correctamente. Haz clic en Auto-completar PIN para ingresar.',
        emailSent,
        previewCode: otpCode,
        email: normalizedEmail,
      });
    }

    if (action === 'VERIFY_CODE') {
      if (!email || !code) {
        return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      if (user.otpCode !== code) {
        return NextResponse.json({ success: false, error: 'Código de verificación incorrecto' }, { status: 400 });
      }

      if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
        return NextResponse.json({ success: false, error: 'Código expirado. Por favor solicita uno nuevo.' }, { status: 400 });
      }

      // Clear OTP
      await prisma.user.update({
        where: { email },
        data: { otpCode: null, otpExpiresAt: null },
      });

      const sessionPayload = {
        userId: user.id,
        name: user.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };
      const sessionToken = await signSession(sessionPayload);
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      });
      response.cookies.set({
        name: 'crm_session',
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days (1 month)
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
