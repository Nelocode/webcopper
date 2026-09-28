"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTag = exports.assignTag = exports.deleteTag = exports.createTag = exports.getTags = void 0;
const index_1 = require("../index");
const getTags = async (req, res) => {
    try {
        const tags = await index_1.prisma.tag.findMany({
            include: { _count: { select: { contacts: true } } },
            orderBy: { name: 'asc' }
        });
        res.json(tags);
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
};
exports.getTags = getTags;
const createTag = async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Tag name is required' });
        const tag = await index_1.prisma.tag.upsert({
            where: { name: name.trim() },
            update: { color: color ?? null },
            create: { name: name.trim(), color: color ?? null }
        });
        res.status(201).json(tag);
    }
    catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
};
exports.createTag = createTag;
const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.tag.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting tag:', error);
        if (error?.code === 'P2025')
            return res.status(204).send();
        res.status(500).json({ error: 'Failed to delete tag' });
    }
};
exports.deleteTag = deleteTag;
// Assign a tag to a contact
const assignTag = async (req, res) => {
    try {
        const { contactId, tagId } = req.params;
        const pivot = await index_1.prisma.contactTag.create({
            data: { contactId, tagId },
            include: { tag: true }
        });
        res.status(201).json(pivot.tag);
    }
    catch (error) {
        console.error('Error assigning tag:', error);
        if (error?.code === 'P2002')
            return res.status(200).json({ message: 'Tag already assigned' });
        res.status(500).json({ error: 'Failed to assign tag' });
    }
};
exports.assignTag = assignTag;
// Remove a tag from a contact
const removeTag = async (req, res) => {
    try {
        const { contactId, tagId } = req.params;
        await index_1.prisma.contactTag.delete({
            where: { contactId_tagId: { contactId, tagId } }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error removing tag:', error);
        if (error?.code === 'P2025')
            return res.status(204).send();
        res.status(500).json({ error: 'Failed to remove tag' });
    }
};
exports.removeTag = removeTag;
