import { Request, Response } from 'express';
import { prisma } from '../index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function recalculateScore(contactId: string) {
  try {
    const recentCount = await prisma.interaction.count({
      where: {
        contactId,
        date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }
    });
    const newScore = Math.min(100, Math.max(10, 30 + recentCount * 10));
    await prisma.contact.update({
      where: { id: contactId },
      data: { relationshipScore: newScore }
    });
  } catch (err) {
    console.error(`Error recalculating score for ${contactId}:`, err);
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// Get all interactions for a contact
export const getInteractions = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const interactions = await prisma.interaction.findMany({
      where: { contactId },
      include: { meeting: { select: { id: true, title: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
};

// Get all interactions across all contacts
export const getAllInteractions = async (req: Request, res: Response) => {
  try {
    const interactions = await prisma.interaction.findMany({
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            organization: { select: { name: true } }
          }
        },
        meeting: { select: { id: true, title: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching all interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
};

// Get all pending follow-ups across all contacts
export const getPendingFollowUps = async (req: Request, res: Response) => {
  try {
    const followUps = await prisma.interaction.findMany({
      where: {
        followUpDone: false,
        followUpDue: { not: null }
      },
      include: {
        contact: { select: { id: true, name: true, avatar: true, role: true } }
      },
      orderBy: { followUpDue: 'asc' }
    });
    res.json(followUps);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
};

export const createInteraction = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const data = req.body;

    if (!data.summary?.trim()) return res.status(400).json({ error: 'Summary is required' });
    if (!data.type) return res.status(400).json({ error: 'Type is required (meeting, call, email, event, note)' });
    if (!data.date) return res.status(400).json({ error: 'Date is required' });

    // Verify contact exists
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const interaction = await prisma.interaction.create({
      data: {
        contactId,
        type: data.type,
        date: new Date(data.date),
        summary: data.summary.trim(),
        sentiment: data.sentiment ?? null,
        duration: data.duration != null && !isNaN(Number(data.duration)) ? Number(data.duration) : null,
        location: data.location ?? null,
        isRemote: data.isRemote ?? false,
        followUpDue: data.followUpDue ? new Date(data.followUpDue) : null,
        followUpDone: data.followUpDone ?? false,
        outcome: data.outcome ?? null,
        meetingId: data.meetingId ?? null
      }
    });

    // Recalculate relationship score based on interaction frequency
    recalculateScore(contactId).catch(err => console.error('Error recalculating score on create:', err));

    res.status(201).json(interaction);
  } catch (error: any) {
    console.error('Error creating interaction:', error);
    res.status(500).json({ error: 'Failed to create interaction' });
  }
};

export const updateInteraction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const interaction = await prisma.interaction.update({
      where: { id },
      data: {
        type: data.type,
        date: data.date ? new Date(data.date) : undefined,
        summary: data.summary?.trim(),
        sentiment: data.sentiment ?? null,
        duration: data.duration != null && !isNaN(Number(data.duration)) ? Number(data.duration) : null,
        location: data.location ?? null,
        isRemote: data.isRemote,
        followUpDue: data.followUpDue ? new Date(data.followUpDue) : null,
        followUpDone: data.followUpDone,
        outcome: data.outcome ?? null
      }
    });
    const prevInteraction = await prisma.interaction.findUnique({ where: { id }, select: { contactId: true } });
    const contactId = prevInteraction?.contactId;
    res.json(interaction);
    // Recalculate relationship score after update
    if (contactId) {
      recalculateScore(contactId).catch(err => console.error('Error recalculating score on update:', err));
    }
  } catch (error: any) {
    console.error('Error updating interaction:', error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Interaction not found' });
    res.status(500).json({ error: 'Failed to update interaction' });
  }
};

export const deleteInteraction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prev = await prisma.interaction.findUnique({ where: { id }, select: { contactId: true } });
    await prisma.interaction.delete({ where: { id } });
    // Recalculate relationship score after delete
    if (prev?.contactId) {
      recalculateScore(prev.contactId).catch(err => console.error('Error recalculating score on delete:', err));
    }
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting interaction:', error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Interaction not found' });
    res.status(500).json({ error: 'Failed to delete interaction' });
  }
};
