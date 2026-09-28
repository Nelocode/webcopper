import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const relationships = await prisma.relationship.findMany({
      include: {
        sourceContact: true,
        targetContact: true,
      },
    });
    return NextResponse.json({ success: true, relationships });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceContactId, targetContactId, relationshipType, notes, strength } = body;

    if (!sourceContactId || !targetContactId || !relationshipType) {
      return NextResponse.json(
        { success: false, error: 'Source, target and relationship type are required' },
        { status: 400 }
      );
    }

    const rel = await prisma.relationship.create({
      data: {
        sourceContactId,
        targetContactId,
        relationshipType,
        notes: notes || null,
        strength: strength ? parseInt(strength, 10) : 3,
      },
      include: {
        sourceContact: true,
        targetContact: true,
      },
    });

    // Add activity record
    await prisma.timelineActivity.create({
      data: {
        contactId: sourceContactId,
        type: 'NOTE',
        title: `Nueva Relación Vinculada`,
        description: `Relación "${relationshipType}" con ${rel.targetContact.name}.`,
      },
    });

    return NextResponse.json({ success: true, relationship: rel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.relationship.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Relationship deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
