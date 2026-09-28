'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface SocialCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

const PRESET_COLORS = [
  '#d4af37', // Gold/Copper Primary
  '#06b6d4', // Cyan
  '#ec4899', // Pink/Magenta
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#ef4444', // Red
];

export const SocialCategoriesModal: React.FC<SocialCategoriesModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#d4af37');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#d4af37');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/social/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/social/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) {
        setNewName('');
        fetchCategories();
        onCategoriesUpdated();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch('/api/social/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim(), color: editColor }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchCategories();
        onCategoriesUpdated();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/social/categories?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCategories();
        onCategoriesUpdated();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Urbanist']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0d0f17] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[var(--primary-color)]" />
            <h2 className="text-lg font-bold text-white tracking-tight">Manage Categories</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Create Form */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">New Category</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. Exploration, ESG...)"
              className="w-full bg-[#161822] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[var(--primary-color)] outline-none transition-all"
            />
            {/* Color Palette */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    newColor === c ? 'border-white scale-110 shadow-lg shadow-black/50' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Existing Categories</h3>
            {isLoading && categories.length === 0 ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500 italic">No categories added yet</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl p-3 hover:bg-white/[0.06] transition-all"
                >
                  {editingId === cat.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#161822] border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[var(--primary-color)]"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-4 h-4 rounded-full border ${editColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(cat.id)}
                          className="flex-1 bg-emerald-500/20 text-emerald-400 py-1 rounded text-xs font-bold hover:bg-emerald-500/30"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-white/10 text-slate-400 py-1 rounded text-xs hover:bg-white/20"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-bold text-white">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                            setEditColor(cat.color);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
