import { Request, Response } from 'express';
import { prisma } from '../index';

export const getTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Tag name is required' });

    const tag = await prisma.tag.upsert({
      where: { name: name.trim() },
      update: { color: color ?? null },
      create: { name: name.trim(), color: color ?? null }
    });
    res.status(201).json(tag);
  } catch (error: any) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.tag.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    if (error?.code === 'P2025') return res.status(204).send();
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

// Assign a tag to a contact
export const assignTag = async (req: Request, res: Response) => {
  try {
    const { contactId, tagId } = req.params;
    const pivot = await prisma.contactTag.create({
      data: { contactId, tagId },
      include: { tag: true }
    });
    res.status(201).json(pivot.tag);
  } catch (error: any) {
    console.error('Error assigning tag:', error);
    if (error?.code === 'P2002') return res.status(200).json({ message: 'Tag already assigned' });
    res.status(500).json({ error: 'Failed to assign tag' });
  }
};

// Remove a tag from a contact
export const removeTag = async (req: Request, res: Response) => {
  try {
    const { contactId, tagId } = req.params;
    await prisma.contactTag.delete({
      where: { contactId_tagId: { contactId, tagId } }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing tag:', error);
    if (error?.code === 'P2025') return res.status(204).send();
    res.status(500).json({ error: 'Failed to remove tag' });
  }
};
