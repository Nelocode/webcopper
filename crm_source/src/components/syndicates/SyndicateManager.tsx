'use client';

import React, { useState } from 'react';
import { Users, Plus, Shield, Sparkles, Award, ArrowRight, UserCheck, Trash2 } from 'lucide-react';

interface Syndicate {
  id: string;
  name: string;
  description: string;
  targetFocus: string;
  members: any[];
  createdAt: string;
}

interface SyndicateManagerProps {
  contacts: any[];
  onOpen360: (contact: any) => void;
}

export const SyndicateManager: React.FC<SyndicateManagerProps> = ({ contacts, onOpen360 }) => {
  const [syndicates, setSyndicates] = useState<Syndicate[]>([
    {
      id: 'syn-1',
      name: 'Consorcio Exploración Santa Ana Q3',
      description: 'Pool de Family Offices e Inversionistas Co-Líderes para la fase de perforación profunda.',
      targetFocus: 'Plata de Alta Ley (Ag)',
      members: contacts.slice(0, 3),
      createdAt: '2026-07-10',
    },
    {
      id: 'syn-2',
      name: 'Pool Family Offices & Capital Privado LatAm',
      description: 'Sindicato regional de inversionistas acreditados y firmas de corretaje institucional.',
      targetFocus: 'Desarrollo Minero & Exploración',
      members: contacts.slice(3, 6),
      createdAt: '2026-08-01',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetFocus, setTargetFocus] = useState('Plata de Alta Ley (Ag)');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const handleCreateSyndicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const chosenMembers = contacts.filter((c) => selectedMemberIds.includes(c.id));

    const newSyn: Syndicate = {
      id: `syn-${Date.now()}`,
      name,
      description,
      targetFocus,
      members: chosenMembers,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSyndicates([...syndicates, newSyn]);
    setShowCreateModal(false);
    setName('');
    setDescription('');
    setSelectedMemberIds([]);
  };

  const handleDeleteSyndicate = (id: string) => {
    if (!confirm('¿Deseas eliminar este sindicato / grupo de coinversión?')) return;
    setSyndicates(syndicates.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6 font-['Urbanist'] w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Users style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
              <span>Sindicatos & Grupos de Coinversión (Fund Pools)</span>
            </h2>
            <span
              style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
              className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase shadow-md"
            >
              SYNDICATES & POOLS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Agrupa Family Offices, fondos y brokers en consorcios de coinversión para visualizar su score e impacto consolidado en Santa Ana.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
          className="px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 hover:scale-105 cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Sindicato</span>
        </button>
      </div>

      {/* Grid of Syndicates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {syndicates.map((syn) => {
          const totalScore = syn.members.reduce((acc, m) => acc + (m.leadScore || 70), 0);
          const avgScore = syn.members.length > 0 ? Math.round(totalScore / syn.members.length) : 0;

          return (
            <div
              key={syn.id}
              style={{ backgroundColor: 'var(--bg-card)' }}
              className="rounded-3xl p-6 border border-white/10 space-y-5 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white">{syn.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      Objetivo: {syn.targetFocus}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSyndicate(syn.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    title="Eliminar sindicato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                  {syn.description}
                </p>

                {/* Score & Pool Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center gap-3">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Score Promedio Pool</div>
                      <div className="text-sm font-black text-amber-400">{avgScore} pts</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center gap-3">
                    <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Miembros Activos</div>
                      <div className="text-sm font-black text-white">{syn.members.length} Inversionistas</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Miembros Integrantes del Sindicato</span>
                  <span className="text-cyan-400 font-mono">Consorcio Activo</span>
                </div>

                <div className="space-y-2">
                  {syn.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <span className="text-xs font-black text-white">{m.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-medium">({m.company || 'Inversor'})</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpen360(m)}
                        className="text-[10px] text-cyan-400 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ficha 360°</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Syndicate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0e17] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 font-['Urbanist']">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Crear Sindicato / Pool de Inversionistas</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSyndicate} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                  Nombre del Sindicato / Pool
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Consorcio Plata Santa Ana Q3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                  Enfoque / Objetivo del Consorcio
                </label>
                <input
                  type="text"
                  placeholder="Ej: Perforación de pozos profundos y ley de plata"
                  value={targetFocus}
                  onChange={(e) => setTargetFocus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de los objetivos de coinversión..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-2 uppercase tracking-wider">
                  Seleccionar Inversionistas Miembros
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {contacts.map((c) => {
                    const isSelected = selectedMemberIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMemberIds(selectedMemberIds.filter((id) => id !== c.id));
                          } else {
                            setSelectedMemberIds([...selectedMemberIds, c.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white'
                            : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-bold">{c.name} ({c.company || 'Inversor'})</span>
                        <span className="font-mono text-[10px]">{isSelected ? '✓ Seleccionado' : '+ Agregar'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#00dfdf] text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg"
                >
                  Crear Consorcio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
