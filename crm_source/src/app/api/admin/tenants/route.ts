import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    // Allow SUPER_ADMIN and TENANT_ADMIN to view the tenant replica list
    if (session && !requireRole(session, 'SUPER_ADMIN', 'TENANT_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            deals: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, tenants });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tenantId, name, slug, primaryColor, adminPhone, adminName, adminEmail } = body;

    // Toggle Tenant Status (Activate / Suspend)
    if (action === 'TOGGLE_STATUS' && tenantId) {
      const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
      }
      const newStatus = existing.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: newStatus },
      });
      return NextResponse.json({ success: true, tenant: updated });
    }

    // Create New Company Tenant
    if (!name || !adminPhone) {
      return NextResponse.json({ success: false, error: 'Company Name and Admin Phone are required' }, { status: 400 });
    }

    const generatedSlug = slug
      ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
      : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug: generatedSlug,
        primaryColor: primaryColor || '#3b82f6',
        status: 'ACTIVE',
        configJson: JSON.stringify({
          industry: 'General Enterprise / Mining',
          stages: ['Lead Prospect', 'Interested - considering', 'Meeting Scheduled', 'Due Diligence', 'Term Sheet', 'Closed Investor'],
        }),
      },
    });

    // Create or associate Tenant Admin User
    const cleanPhone = adminPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    const tenantAdmin = await prisma.user.upsert({
      where: { phone: formattedPhone },
      update: {
        name: adminName || `Admin ${name}`,
        role: 'SUPER_ADMIN',
        tenantId: newTenant.id,
      },
      create: {
        phone: formattedPhone,
        name: adminName || `Admin ${name}`,
        email: adminEmail || `${generatedSlug}@investor.com`,
        role: 'SUPER_ADMIN',
        tenantId: newTenant.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Tenant "${name}" successfully created! Admin user ${tenantAdmin.phone} authorized.`,
      tenant: newTenant,
      admin: tenantAdmin,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
