import { Request, Response } from 'express';
import { prisma } from '../index';

export const getNotes = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const notes = await prisma.note.findMany({
      where: { contactId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const { content, isPinned, isPrivate } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Note content is required' });

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const note = await prisma.note.create({
      data: {
        contactId,
        content: content.trim(),
        isPinned: isPinned ?? false,
        isPrivate: isPrivate ?? false
      }
    });
    res.status(201).json(note);
  } catch (error: any) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isPinned, isPrivate } = req.body;

    const note = await prisma.note.update({
      where: { id },
      data: {
        content: content?.trim(),
        isPinned: isPinned ?? undefined,
        isPrivate: isPrivate ?? undefined
      }
    });
    res.json(note);
  } catch (error: any) {
    console.error('Error updating note:', error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Note not found' });
    res.status(500).json({ error: 'Failed to update note' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting note:', error);
    if (error?.code === 'P2025') return res.status(204).send();
    res.status(500).json({ error: 'Failed to delete note' });
  }
};
