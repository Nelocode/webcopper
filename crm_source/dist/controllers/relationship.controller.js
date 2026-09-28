"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoDetectRelationships = exports.deleteRelationship = exports.updateRelationship = exports.createRelationship = exports.getAllRelationships = exports.getRelationships = void 0;
const index_1 = require("../index");
// GET /api/relationships?contactId=xxx — all relationships for a contact
const getRelationships = async (req, res) => {
    try {
        const { contactId } = req.query;
        if (!contactId || typeof contactId !== 'string') {
            return res.status(400).json({ error: 'contactId query param required' });
        }
        const [from, to] = await Promise.all([
            index_1.prisma.relationship.findMany({
                where: { contactAId: contactId },
                include: {
                    contactB: {
                        select: { id: true, name: true, role: true, email: true, avatar: true }
                    }
                }
            }),
            index_1.prisma.relationship.findMany({
                where: { contactBId: contactId },
                include: {
                    contactA: {
                        select: { id: true, name: true, role: true, email: true, avatar: true }
                    }
                }
            })
        ]);
        // Normalize: every relationship is { contact, type, strength, notes, source }
        const relationships = [
            ...from.map(r => ({
                id: r.id,
                contact: r.contactB,
                type: r.type,
                strength: r.strength,
                notes: r.notes,
                source: r.source,
                createdAt: r.createdAt
            })),
            ...to.map(r => ({
                id: r.id,
                contact: r.contactA,
                type: r.type,
                strength: r.strength,
                notes: r.notes,
                source: r.source,
                createdAt: r.createdAt
            }))
        ];
        res.json(relationships);
    }
    catch (error) {
        console.error('getRelationships error:', error);
        res.status(500).json({ error: 'Failed to fetch relationships' });
    }
};
exports.getRelationships = getRelationships;
// GET /api/relationships/all — all relationships for network visualization
const getAllRelationships = async (_req, res) => {
    try {
        // Use raw SQL with LEFT JOINs to tolerate missing contacts (orphaned FK refs)
        const relationships = await index_1.prisma.$queryRawUnsafe(`
      SELECT 
        r.id, r."contactAId", r."contactBId", r.type, r.strength, r.notes, r.source, r."createdAt",
        ca.id AS "ca_id", ca.name AS "ca_name", ca.role AS "ca_role", ca.email AS "ca_email", ca.avatar AS "ca_avatar",
        oa.id AS "oa_id", oa.name AS "oa_name",
        cb.id AS "cb_id", cb.name AS "cb_name", cb.role AS "cb_role", cb.email AS "cb_email", cb.avatar AS "cb_avatar",
        ob.id AS "ob_id", ob.name AS "ob_name"
      FROM "Relationship" r
      LEFT JOIN "Contact" ca ON ca.id = r."contactAId"
      LEFT JOIN "Organization" oa ON oa.id = ca."organizationId"
      LEFT JOIN "Contact" cb ON cb.id = r."contactBId"
      LEFT JOIN "Organization" ob ON ob.id = cb."organizationId"
      ORDER BY r.strength DESC
      LIMIT 2000
    `);
        // Map raw rows to structured objects
        const mapped = relationships.map((r) => ({
            id: r.id,
            contactAId: r.contactAId,
            contactBId: r.contactBId,
            type: r.type,
            strength: r.strength,
            notes: r.notes,
            source: r.source,
            createdAt: r.createdAt,
            contactA: r.ca_id ? {
                id: r.ca_id,
                name: r.ca_name,
                role: r.ca_role,
                email: r.ca_email,
                avatar: r.ca_avatar,
                organization: r.oa_id ? { id: r.oa_id, name: r.oa_name } : null
            } : null,
            contactB: r.cb_id ? {
                id: r.cb_id,
                name: r.cb_name,
                role: r.cb_role,
                email: r.cb_email,
                avatar: r.cb_avatar,
                organization: r.ob_id ? { id: r.ob_id, name: r.ob_name } : null
            } : null
        }));
        res.json(mapped);
    }
    catch (error) {
        console.error('getAllRelationships error:', error);
        res.status(500).json({ error: 'Failed to fetch all relationships' });
    }
};
exports.getAllRelationships = getAllRelationships;
// POST /api/relationships — create a relationship
const createRelationship = async (req, res) => {
    try {
        const { contactAId, contactBId, type, strength, notes } = req.body;
        if (!contactAId || !contactBId || !type) {
            return res.status(400).json({ error: 'contactAId, contactBId, and type are required' });
        }
        // Normalize: always store lower ID first to enforce uniqueness across direction
        const [lowId, highId] = [contactAId, contactBId].sort();
        const relationship = await index_1.prisma.relationship.upsert({
            where: { contactAId_contactBId: { contactAId: lowId, contactBId: highId } },
            update: { type, strength: strength ?? 50, notes, source: 'manual' },
            create: {
                contactAId: lowId,
                contactBId: highId,
                type,
                strength: strength ?? 50,
                notes,
                source: 'manual'
            }
        });
        res.status(201).json(relationship);
    }
    catch (error) {
        console.error('createRelationship error:', error);
        res.status(500).json({ error: 'Failed to create relationship' });
    }
};
exports.createRelationship = createRelationship;
// PUT /api/relationships/:id — update a relationship
const updateRelationship = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, strength, notes } = req.body;
        const relationship = await index_1.prisma.relationship.update({
            where: { id },
            data: { type, strength, notes }
        });
        res.json(relationship);
    }
    catch (error) {
        console.error('updateRelationship error:', error);
        if (error?.code === 'P2025')
            return res.status(404).json({ error: 'Relationship not found' });
        res.status(500).json({ error: 'Failed to update relationship' });
    }
};
exports.updateRelationship = updateRelationship;
// DELETE /api/relationships/:id — delete a relationship
const deleteRelationship = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.relationship.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        console.error('deleteRelationship error:', error);
        if (error?.code === 'P2025')
            return res.status(404).json({ error: 'Relationship not found' });
        res.status(500).json({ error: 'Failed to delete relationship' });
    }
};
exports.deleteRelationship = deleteRelationship;
// POST /api/relationships/auto-detect — auto-detect relationships for all contacts
const autoDetectRelationships = async (_req, res) => {
    try {
        const contacts = await index_1.prisma.contact.findMany({
            select: { id: true, name: true, email: true, organizationId: true }
        });
        // Also load organizations to get company info
        const orgs = await index_1.prisma.organization.findMany({
            select: { id: true, name: true }
        });
        const orgMap = new Map(orgs.map(o => [o.id, o.name]));
        let detected = 0;
        for (let i = 0; i < contacts.length; i++) {
            for (let j = i + 1; j < contacts.length; j++) {
                const a = contacts[i];
                const b = contacts[j];
                // Skip if already related
                const [lowId, highId] = [a.id, b.id].sort();
                const existing = await index_1.prisma.relationship.findUnique({
                    where: { contactAId_contactBId: { contactAId: lowId, contactBId: highId } }
                });
                if (existing)
                    continue;
                let reason = null;
                let strength = 30;
                // Same organization
                if (a.organizationId && a.organizationId === b.organizationId) {
                    reason = 'auto_detect_company';
                    strength = 65;
                }
                // Same email domain (non-personal)
                else if (a.email && b.email) {
                    const domainA = a.email.split('@')[1]?.toLowerCase();
                    const domainB = b.email.split('@')[1]?.toLowerCase();
                    if (domainA && domainB && domainA === domainB &&
                        !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domainA)) {
                        reason = 'auto_detect_company';
                        strength = 30;
                    }
                }
                if (reason) {
                    await index_1.prisma.relationship.create({
                        data: {
                            contactAId: lowId,
                            contactBId: highId,
                            type: 'colleague',
                            strength,
                            source: reason
                        }
                    });
                    detected++;
                }
            }
        }
        // Now detect meeting-based relationships
        const meetings = await index_1.prisma.meeting.findMany({
            include: { attendees: { select: { contactId: true } } },
            where: { attendees: { some: {} } }
        });
        for (const meeting of meetings) {
            const ids = meeting.attendees.map(a => a.contactId);
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    const [lowId, highId] = [ids[i], ids[j]].sort();
                    const existing = await index_1.prisma.relationship.findUnique({
                        where: { contactAId_contactBId: { contactAId: lowId, contactBId: highId } }
                    });
                    if (existing) {
                        // Boost strength for meeting share
                        if (existing.source !== 'manual') {
                            await index_1.prisma.relationship.update({
                                where: { contactAId_contactBId: { contactAId: lowId, contactBId: highId } },
                                data: { strength: Math.min(100, existing.strength + 10), source: 'auto_detect_meeting' }
                            });
                        }
                        continue;
                    }
                    await index_1.prisma.relationship.create({
                        data: {
                            contactAId: lowId,
                            contactBId: highId,
                            type: 'colleague',
                            strength: 40,
                            source: 'auto_detect_meeting'
                        }
                    });
                    detected++;
                }
            }
        }
        res.json({ detected, message: `Auto-detected ${detected} relationships` });
    }
    catch (error) {
        console.error('autoDetectRelationships error:', error);
        res.status(500).json({ error: 'Failed to auto-detect relationships' });
    }
};
exports.autoDetectRelationships = autoDetectRelationships;
