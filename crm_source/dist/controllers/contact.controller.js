"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContactChangeLog = exports.deleteContact = exports.updateContact = exports.createContact = exports.getContactById = exports.getContacts = void 0;
const index_1 = require("../index");
const integration_controller_1 = require("./integration.controller");
// ─── Helpers ─────────────────────────────────────────────────────────────────
const contactInclude = {
    organization: true,
    tags: { include: { tag: true } },
    notes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] },
    interactions: { orderBy: { date: 'desc' }, take: 10 },
    meetings: { include: { meeting: true } }
};
const formatContact = (c) => ({
    ...c,
    hobbies: c.hobbies ? c.hobbies.split(',').map((h) => h.trim()).filter(Boolean) : [],
    aiKeyInterests: c.aiKeyInterests ? c.aiKeyInterests.split(',').map((i) => i.trim()).filter(Boolean) : [],
    tags: c.tags?.map((ct) => ct.tag) ?? [],
    // Legacy-compatible shape for the frontend
    company: c.organization?.name ?? null,
    website: c.organization?.website ?? null,
    interactions: c.interactions ?? [],
    family: c.spouseName || c.childrenCount != null
        ? { spouse: c.spouseName, children: c.childrenCount ?? 0 }
        : null,
    intelligence: {
        icebreaker: c.aiIcebreaker,
        strategicContext: c.aiStrategicContext,
        sentiment: c.aiSentiment,
        keyInterests: c.aiKeyInterests ? c.aiKeyInterests.split(',').map((i) => i.trim()) : []
    },
    captureMetadata: c.capturedAt ? {
        capturedAt: c.capturedAt,
        meetingLocation: c.captureLocation,
        latitude: c.captureLat,
        longitude: c.captureLng,
        source: c.captureSource
    } : null
});
// ─── Change Logging ──────────────────────────────────────────────────────────
//
// Each time a contact field changes during upsert/merge/update, we record
// what changed so the history is preserved and visible in the UI.
// The contact itself always shows the *current* value; the change log shows *what was*.
const CHANGELOG_FIELDS = [
    'role', 'email', 'phone', 'location', 'linkedin', 'twitter',
    'department', 'seniority', 'spouseName', 'childrenCount', 'hobbies',
    'personalNotes', 'aiIcebreaker', 'aiStrategicContext', 'aiSentiment',
    'aiKeyInterests', 'avatar', 'birthday', 'engagementLevel',
    'communicationStyle', 'preferredChannel', 'relationshipScore'
];
/** Resolve org name for changelog display */
async function resolveOrgName(orgId) {
    if (!orgId)
        return null;
    try {
        const org = await index_1.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
        return org?.name ?? null;
    }
    catch {
        return null;
    }
}
/**
 * Compare old and new values for tracked fields and log each change.
 * Returns a summary string for logging.
 */
async function logChanges(contactId, oldData, newData, source) {
    const changes = [];
    for (const field of CHANGELOG_FIELDS) {
        const oldVal = oldData[field] ?? null;
        const newVal = newData[field] ?? null;
        // Convert numbers to strings for consistent comparison
        const oldStr = oldVal != null ? String(oldVal) : null;
        const newStr = newVal != null ? String(newVal) : null;
        if (oldStr !== newStr) {
            await index_1.prisma.$executeRawUnsafe(`INSERT INTO "ContactChangeLog" ("id", "contactId", "field", "oldValue", "newValue", "source", "createdAt")
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`, crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, contactId, field, oldStr, newStr, source);
            changes.push(`${field}: "${oldStr ?? '—'}" → "${newStr ?? '—'}"`);
        }
    }
    // Special case: organization change (need to resolve names)
    const oldOrgId = oldData.organizationId ?? null;
    const newOrgId = newData.organizationId ?? null;
    if (oldOrgId !== newOrgId) {
        const [oldOrgName, newOrgName] = await Promise.all([
            resolveOrgName(oldOrgId),
            resolveOrgName(newOrgId),
        ]);
        await index_1.prisma.$executeRawUnsafe(`INSERT INTO "ContactChangeLog" ("id", "contactId", "field", "oldValue", "newValue", "source", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`, crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, contactId, 'organization', oldOrgName, newOrgName, source);
        changes.push(`organization: "${oldOrgName ?? '—'}" → "${newOrgName ?? '—'}"`);
    }
    return changes;
}
// ─── Handlers ────────────────────────────────────────────────────────────────
const getContacts = async (req, res) => {
    try {
        const { search, limit } = req.query;
        const take = Math.min(parseInt(limit) || 50, 200);
        let contacts;
        if (search && typeof search === 'string' && search.trim()) {
            const q = `%${search.trim()}%`;
            contacts = await index_1.prisma.$queryRawUnsafe(`SELECT * FROM "Contact"
         WHERE "name" LIKE ? OR "email" LIKE ?
         ORDER BY
           CASE WHEN "email" IS NOT NULL AND "email" != '' THEN 0 ELSE 1 END,
           "name" ASC
         LIMIT ?`, q, q, take);
            // Attach relations manually for formatContact
            contacts = await Promise.all(contacts.map(async (c) => {
                const full = await index_1.prisma.contact.findUnique({
                    where: { id: c.id },
                    include: contactInclude
                });
                return full ? formatContact(full) : c;
            }));
        }
        else {
            contacts = await index_1.prisma.contact.findMany({
                include: contactInclude,
                orderBy: { createdAt: 'desc' },
                take
            });
            contacts = contacts.map(formatContact);
        }
        res.json(contacts);
    }
    catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
};
exports.getContacts = getContacts;
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await index_1.prisma.contact.findUnique({
            where: { id },
            include: {
                ...contactInclude,
                interactions: { orderBy: { date: 'desc' } }, // All interactions for detail view
                notes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }
            }
        });
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        res.json(formatContact(contact));
    }
    catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
};
exports.getContactById = getContactById;
const createContact = async (req, res) => {
    try {
        const data = req.body;
        if (!data.name?.trim())
            return res.status(400).json({ error: 'Name is required' });
        // Handle organization: resolve by ID or create by name
        let organizationId = data.organizationId ?? null;
        if (!organizationId && data.company?.trim()) {
            let org = await index_1.prisma.organization.findFirst({
                where: { name: data.company.trim() }
            });
            if (!org) {
                org = await index_1.prisma.organization.create({
                    data: { name: data.company.trim(), website: data.website }
                });
            }
            organizationId = org.id;
        }
        // Build contact data object
        const contactData = {
            name: data.name.trim(),
            email: data.email ?? null,
            phone: data.phone ?? null,
            avatar: data.avatar ?? null,
            birthday: data.birthday ?? null,
            location: data.location ?? null,
            linkedin: data.linkedin ?? null,
            twitter: data.twitter ?? null,
            role: data.role ?? null,
            department: data.department ?? null,
            seniority: data.seniority ?? null,
            relationshipScore: data.relationshipScore ?? 50,
            engagementLevel: data.engagementLevel ?? null,
            communicationStyle: data.communicationStyle ?? null,
            preferredChannel: data.preferredChannel ?? null,
            spouseName: data.family?.spouse ?? null,
            childrenCount: data.family?.children != null
                ? (Array.isArray(data.family.children) ? data.family.children.length : Number(data.family.children))
                : null,
            hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies ?? null),
            personalNotes: data.notes ?? null,
            aiIcebreaker: data.intelligence?.icebreaker ?? null,
            aiStrategicContext: data.intelligence?.strategicContext ?? null,
            aiSentiment: data.intelligence?.sentiment ?? null,
            aiKeyInterests: Array.isArray(data.intelligence?.keyInterests)
                ? data.intelligence.keyInterests.join(', ')
                : null,
            capturedAt: data.captureMetadata?.capturedAt ? new Date(data.captureMetadata.capturedAt) : null,
            captureSource: data.captureMetadata?.source ?? data.captureSource ?? null,
            captureLocation: data.captureMetadata?.meetingLocation ?? null,
            captureLat: data.captureMetadata?.latitude ?? null,
            captureLng: data.captureMetadata?.longitude ?? null,
            organizationId
        };
        // === DEDUP LOGIC ===
        // If email is provided, try to find existing contact and update it
        let contact;
        if (data.email?.trim()) {
            const existing = await index_1.prisma.contact.findUnique({
                where: { email: data.email.trim() },
                include: contactInclude
            });
            if (existing) {
                // Merge: only update fields that are non-null in the incoming data
                const updateData = {};
                const fields = [
                    'name', 'phone', 'avatar', 'birthday', 'location', 'linkedin', 'twitter',
                    'role', 'department', 'seniority', 'spouseName', 'childrenCount', 'hobbies',
                    'personalNotes', 'aiIcebreaker', 'aiStrategicContext', 'aiSentiment', 'aiKeyInterests',
                    'capturedAt', 'captureSource', 'captureLocation', 'captureLat', 'captureLng'
                ];
                for (const f of fields) {
                    if (contactData[f] != null)
                        updateData[f] = contactData[f];
                }
                // Relationship fields only if explicitly sent
                if (data.relationshipScore !== undefined)
                    updateData.relationshipScore = data.relationshipScore;
                if (data.engagementLevel !== undefined)
                    updateData.engagementLevel = data.engagementLevel;
                if (data.communicationStyle !== undefined)
                    updateData.communicationStyle = data.communicationStyle;
                if (data.preferredChannel !== undefined)
                    updateData.preferredChannel = data.preferredChannel;
                // Organization: prefer new one if sent
                if (organizationId)
                    updateData.organizationId = organizationId;
                // Build a full "new contact" snapshot for changelog comparison
                const mergedData = { ...existing };
                for (const key of Object.keys(updateData)) {
                    mergedData[key] = updateData[key];
                }
                contact = await index_1.prisma.contact.update({
                    where: { id: existing.id },
                    data: updateData,
                    include: contactInclude
                });
                // Log only the fields that actually changed value
                const changes = await logChanges(existing.id, existing, mergedData, 'upsert');
                if (changes.length > 0) {
                    console.log(`[Dedup][${existing.name}] ${changes.length} change(s): ${changes.join(' | ')}`);
                }
                else {
                    console.log(`[Dedup] Contact "${existing.name}" (${existing.email}) already up to date — no changes`);
                }
            }
        }
        if (!contact) {
            // Create new contact (with explicit id or let Prisma auto-generate)
            contact = await index_1.prisma.contact.create({
                data: data.id ? { id: data.id, ...contactData } : contactData,
                include: contactInclude
            });
        }
        const formatted = formatContact(contact);
        (0, integration_controller_1.triggerIntegrations)('create', formatted).catch(err => {
            console.error('[Integration] Error triggering integration on create:', err);
        });
        res.status(201).json(formatted);
    }
    catch (error) {
        console.error('Error creating contact:', error);
        if (error?.code === 'P2002')
            return res.status(409).json({ error: 'Contact with this email already exists' });
        res.status(500).json({ error: 'Failed to create contact' });
    }
};
exports.createContact = createContact;
const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        // Fetch existing before updating, for changelog comparison
        const existingBeforeUpdate = await index_1.prisma.contact.findUnique({
            where: { id }
        });
        if (!existingBeforeUpdate)
            return res.status(404).json({ error: 'Contact not found' });
        // If name not sent, preserve existing one from DB
        if (!data.name?.trim()) {
            data.name = existingBeforeUpdate.name;
        }
        let organizationId = data.organizationId;
        if (!organizationId && data.company?.trim()) {
            let org = await index_1.prisma.organization.findFirst({
                where: { name: data.company.trim() }
            });
            if (!org) {
                org = await index_1.prisma.organization.create({
                    data: { name: data.company.trim(), website: data.website }
                });
            }
            organizationId = org.id;
        }
        const updateData = {
            name: data.name.trim(),
            email: data.email ?? null,
            phone: data.phone ?? null,
            avatar: data.avatar ?? null,
            birthday: data.birthday ?? null,
            location: data.location ?? null,
            linkedin: data.linkedin ?? null,
            twitter: data.twitter ?? null,
            role: data.role ?? null,
            department: data.department ?? null,
            seniority: data.seniority ?? null,
            spouseName: data.family?.spouse ?? null,
            childrenCount: data.family?.children != null
                ? (Array.isArray(data.family.children) ? data.family.children.length : Number(data.family.children))
                : null,
            hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies ?? null),
            personalNotes: data.notes ?? null,
            aiIcebreaker: data.intelligence?.icebreaker ?? null,
            aiStrategicContext: data.intelligence?.strategicContext ?? null,
            aiSentiment: data.intelligence?.sentiment ?? null,
            aiKeyInterests: Array.isArray(data.intelligence?.keyInterests)
                ? data.intelligence.keyInterests.join(', ')
                : null,
            capturedAt: data.captureMetadata?.capturedAt ? new Date(data.captureMetadata.capturedAt) : null,
            captureSource: data.captureMetadata?.source ?? null,
            captureLocation: data.captureMetadata?.meetingLocation ?? null,
            captureLat: data.captureMetadata?.latitude ?? null,
            captureLng: data.captureMetadata?.longitude ?? null,
            organizationId: organizationId ?? null
        };
        // Only include relationship fields if explicitly sent (don't overwrite with defaults)
        if (data.relationshipScore !== undefined)
            updateData.relationshipScore = data.relationshipScore;
        if (data.engagementLevel !== undefined)
            updateData.engagementLevel = data.engagementLevel;
        if (data.communicationStyle !== undefined)
            updateData.communicationStyle = data.communicationStyle;
        if (data.preferredChannel !== undefined)
            updateData.preferredChannel = data.preferredChannel;
        const contact = await index_1.prisma.contact.update({
            where: { id },
            data: updateData,
            include: contactInclude
        });
        // Log changes on manual update
        await logChanges(id, existingBeforeUpdate || {}, updateData, 'manual').then(changes => {
            if (changes.length > 0)
                console.log(`[Update][${contact.name}] ${changes.length} change(s): ${changes.join(' | ')}`);
        });
        const formatted = formatContact(contact);
        (0, integration_controller_1.triggerIntegrations)('update', formatted).catch(err => {
            console.error('[Integration] Error triggering integration on update:', err);
        });
        res.json(formatted);
    }
    catch (error) {
        console.error('Error updating contact:', error);
        if (error?.code === 'P2025')
            return res.status(404).json({ error: 'Contact not found' });
        res.status(500).json({ error: 'Failed to update contact' });
    }
};
exports.updateContact = updateContact;
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.contact.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting contact:', error);
        if (error?.code === 'P2025')
            return res.status(404).json({ error: 'Contact not found' });
        res.status(500).json({ error: 'Failed to delete contact' });
    }
};
exports.deleteContact = deleteContact;
// ─── Change Log Endpoint ─────────────────────────────────────────────────────
const getContactChangeLog = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await index_1.prisma.$queryRawUnsafe(`SELECT id, field, oldValue, newValue, source, createdAt
       FROM "ContactChangeLog"
       WHERE "contactId" = ?
       ORDER BY "createdAt" DESC
       LIMIT 200`, id);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching changelog:', error);
        res.status(500).json({ error: 'Failed to fetch changelog' });
    }
};
exports.getContactChangeLog = getContactChangeLog;
