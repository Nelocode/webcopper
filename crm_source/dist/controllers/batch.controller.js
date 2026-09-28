"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchCreateContacts = void 0;
const index_1 = require("../index");
const integration_controller_1 = require("./integration.controller");
const batchCreateContacts = async (req, res) => {
    try {
        const { contacts } = req.body;
        if (!Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Payload must contain a contacts array' });
        }
        console.log(`[Batch Import] Starting import of ${contacts.length} contacts...`);
        let importedCount = 0;
        let failedCount = 0;
        const failures = [];
        // Cache of organization IDs by name to speed up inserts
        const orgCache = new Map();
        for (const data of contacts) {
            try {
                if (!data.name?.trim()) {
                    failures.push({ name: 'Unknown', error: 'Name is required' });
                    failedCount++;
                    continue;
                }
                // Handle organization caching/creation
                let organizationId = null;
                const companyName = data.company?.trim();
                if (companyName) {
                    if (orgCache.has(companyName)) {
                        organizationId = orgCache.get(companyName);
                        // Update org website if this contact has a different one
                        const currentWebsite = data.website?.trim() || null;
                        if (currentWebsite) {
                            index_1.prisma.organization.update({
                                where: { id: organizationId },
                                data: { website: currentWebsite }
                            }).catch(() => { }); // fire-and-forget
                        }
                    }
                    else {
                        let org = await index_1.prisma.organization.findFirst({
                            where: { name: companyName }
                        });
                        if (!org) {
                            org = await index_1.prisma.organization.create({
                                data: {
                                    name: companyName,
                                    website: data.website?.trim() || null
                                }
                            });
                        }
                        organizationId = org.id;
                        orgCache.set(companyName, org.id);
                    }
                }
                // === DEDUP LOGIC (batch) ===
                // Build contact data object
                const contactData = {
                    name: data.name.trim(),
                    email: data.email?.trim() || null,
                    phone: data.phone?.trim() || null,
                    role: data.role?.trim() || null,
                    department: data.department?.trim() || null,
                    seniority: data.seniority?.trim() || null,
                    location: data.location?.trim() || null,
                    linkedin: data.linkedin?.trim() || null,
                    twitter: data.twitter?.trim() || null,
                    avatar: data.avatar ?? null,
                    birthday: data.birthday ?? null,
                    relationshipScore: data.relationshipScore != null && !isNaN(Number(data.relationshipScore))
                        ? Number(data.relationshipScore) : 50,
                    engagementLevel: data.engagementLevel?.trim() || null,
                    communicationStyle: data.communicationStyle?.trim() || null,
                    preferredChannel: data.preferredChannel?.trim() || null,
                    spouseName: data.family?.spouse ?? null,
                    childrenCount: data.family?.children != null
                        ? (Array.isArray(data.family.children) ? data.family.children.length : Number(data.family.children))
                        : null,
                    hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies || null),
                    personalNotes: data.personalNotes || data.notes || null,
                    aiIcebreaker: data.intelligence?.icebreaker ?? null,
                    aiStrategicContext: data.intelligence?.strategicContext ?? null,
                    aiSentiment: data.intelligence?.sentiment ?? null,
                    aiKeyInterests: Array.isArray(data.intelligence?.keyInterests)
                        ? data.intelligence.keyInterests.join(', ')
                        : null,
                    captureSource: data.captureSource || 'import',
                    capturedAt: new Date(),
                    organizationId
                };
                let contact;
                if (contactData.email) {
                    const existing = await index_1.prisma.contact.findUnique({
                        where: { email: contactData.email }
                    });
                    if (existing) {
                        // Merge fields
                        const updateData = {};
                        for (const f of ['name', 'phone', 'role', 'department', 'seniority', 'location', 'linkedin',
                            'twitter', 'avatar', 'birthday', 'spouseName', 'childrenCount', 'hobbies',
                            'personalNotes', 'aiIcebreaker', 'aiStrategicContext', 'aiSentiment', 'aiKeyInterests']) {
                            if (contactData[f] != null)
                                updateData[f] = contactData[f];
                        }
                        if (data.relationshipScore != null)
                            updateData.relationshipScore = Number(data.relationshipScore);
                        if (organizationId)
                            updateData.organizationId = organizationId;
                        if (contactData.engagementLevel)
                            updateData.engagementLevel = contactData.engagementLevel;
                        contact = await index_1.prisma.contact.update({
                            where: { id: existing.id },
                            data: updateData
                        });
                        importedCount++;
                        continue; // Skip create, don't trigger integration again
                    }
                }
                contact = await index_1.prisma.contact.create({ data: contactData });
                importedCount++;
                // Trigger integrations in the background (asynchronous)
                // Pass standard formatted shape
                const formattedContact = {
                    id: contact.id,
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    company: companyName || null,
                    role: contact.role,
                    location: contact.location,
                    relationshipScore: contact.relationshipScore,
                    engagementLevel: contact.engagementLevel
                };
                (0, integration_controller_1.triggerIntegrations)('create', formattedContact).catch(err => {
                    console.error(`[Batch Import] Failed to trigger integration for ${contact.name}:`, err);
                });
            }
            catch (err) {
                console.error(`[Batch Import] Error inserting contact "${data.name}":`, err.message);
                failures.push({ name: data.name || 'Unknown', error: err.message || 'Database error' });
                failedCount++;
            }
        }
        res.json({
            success: true,
            importedCount,
            failedCount,
            failures
        });
    }
    catch (error) {
        console.error('Batch import controller error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.batchCreateContacts = batchCreateContacts;
