import { Request, Response } from 'express';
import { prisma } from '../index';

export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: { contacts: { select: { id: true, name: true, role: true, avatar: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(orgs);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: { contacts: true }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name?.trim()) return res.status(400).json({ error: 'Organization name is required' });

    const org = await prisma.organization.create({
      data: {
        name: data.name.trim(),
        domain: data.domain ?? null,
        industry: data.industry ?? null,
        size: data.size ?? null,
        website: data.website ?? null,
        location: data.location ?? null,
        description: data.description ?? null,
        logoUrl: data.logoUrl ?? null
      }
    });
    res.status(201).json(org);
  } catch (error: any) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const org = await prisma.organization.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        domain: data.domain ?? null,
        industry: data.industry ?? null,
        size: data.size ?? null,
        website: data.website ?? null,
        location: data.location ?? null,
        description: data.description ?? null,
        logoUrl: data.logoUrl ?? null
      }
    });
    res.json(org);
  } catch (error: any) {
    console.error('Error updating organization:', error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Organization not found' });
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Unlink contacts before deleting (onDelete: SetNull handles this automatically)
    await prisma.organization.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    if (error?.code === 'P2025') return res.status(204).send();
    res.status(500).json({ error: 'Failed to delete organization' });
  }
};
