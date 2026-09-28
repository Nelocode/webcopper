import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let categories = await prisma.socialCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Seed default categories if none exist
    if (categories.length === 0) {
      await prisma.socialCategory.createMany({
        data: [
          { name: 'Promocional', color: '#d4af37' },
          { name: 'Educativo / Mining Facts', color: '#06b6d4' },
          { name: 'Corporativo / IR', color: '#3b82f6' },
          { name: 'Sostenibilidad (ESG)', color: '#10b981' },
          { name: 'Novedades / Hitos', color: '#ec4899' },
        ],
      });
      categories = await prisma.socialCategory.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const category = await prisma.socialCategory.create({
      data: {
        name: name.trim(),
        color: color || '#d4af37',
      },
    });

    await prisma.socialAuditLog.create({
      data: {
        action: 'create_category',
        username: 'Admin Outcrop',
        entityType: 'category',
        entityId: category.id,
        details: `Categoría creada: "${category.name}" (${category.color})`,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'ID y nombre son obligatorios' }, { status: 400 });
    }

    const category = await prisma.socialCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color || '#d4af37',
      },
    });

    await prisma.socialAuditLog.create({
      data: {
        action: 'update_category',
        username: 'Admin Outcrop',
        entityType: 'category',
        entityId: category.id,
        details: `Categoría actualizada: "${category.name}"`,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de categoría es requerido' }, { status: 400 });
    }

    const deleted = await prisma.socialCategory.delete({
      where: { id },
    });

    await prisma.socialAuditLog.create({
      data: {
        action: 'delete_category',
        username: 'Admin Outcrop',
        entityType: 'category',
        entityId: id,
        details: `Categoría eliminada: "${deleted.name}"`,
      },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
