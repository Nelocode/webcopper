"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.createNote = exports.getNotes = void 0;
const index_1 = require("../index");
const getNotes = async (req, res) => {
    try {
        const { contactId } = req.params;
        const notes = await index_1.prisma.note.findMany({
            where: { contactId },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
        });
        res.json(notes);
    }
    catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
};
exports.getNotes = getNotes;
const createNote = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { content, isPinned, isPrivate } = req.body;
        if (!content?.trim())
            return res.status(400).json({ error: 'Note content is required' });
        const contact = await index_1.prisma.contact.findUnique({ where: { id: contactId } });
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        const note = await index_1.prisma.note.create({
            data: {
                contactId,
                content: content.trim(),
                isPinned: isPinned ?? false,
                isPrivate: isPrivate ?? false
            }
        });
        res.status(201).json(note);
    }
    catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
};
exports.createNote = createNote;
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, isPinned, isPrivate } = req.body;
        const note = await index_1.prisma.note.update({
            where: { id },
            data: {
                content: content?.trim(),
                isPinned: isPinned ?? undefined,
                isPrivate: isPrivate ?? undefined
            }
        });
        res.json(note);
    }
    catch (error) {
        console.error('Error updating note:', error);
        if (error?.code === 'P2025')
            return res.status(404).json({ error: 'Note not found' });
        res.status(500).json({ error: 'Failed to update note' });
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.note.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting note:', error);
        if (error?.code === 'P2025')
            return res.status(204).send();
        res.status(500).json({ error: 'Failed to delete note' });
    }
};
exports.deleteNote = deleteNote;
