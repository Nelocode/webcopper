import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const contactId = searchParams.get('contactId');
    const status = searchParams.get('status');

    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const where: any = {};

    if (effectiveTenantId) {
      where.tenantId = effectiveTenantId;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { title, description, contactId, status, priority, dueDate, assignee, tenantId: bodyTenantId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    const task = await prisma.task.create({
      data: {
        tenantId: effectiveTenantId || null,
        contactId: contactId || null,
        title: title.trim(),
        description: description || null,
        status: status || 'PENDING',
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignee: assignee || null,
      },
      include: {
        contact: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    });

    // Create activity timeline note if attached to contact
    if (contactId) {
      await prisma.timelineActivity.create({
        data: {
          contactId,
          type: 'NOTE',
          title: `Tarea Creada: ${task.title}`,
          description: `Asignado a: ${assignee || 'Sin asignar'} / Prioridad: ${priority || 'Medium'}`,
        },
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id, title, description, status, priority, dueDate, assignee } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const effectiveTenantId = getEffectiveTenantId(session);
    if (effectiveTenantId && existing.tenantId && existing.tenantId !== effectiveTenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? status : existing.status,
        priority: priority !== undefined ? priority : existing.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
        assignee: assignee !== undefined ? assignee : existing.assignee,
        updatedAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const effectiveTenantId = getEffectiveTenantId(session);
    if (effectiveTenantId && existing.tenantId && existing.tenantId !== effectiveTenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
