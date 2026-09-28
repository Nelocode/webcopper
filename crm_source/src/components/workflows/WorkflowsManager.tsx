'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowRule } from '@/types/crm';
import { Workflow, Plus, Play, CheckCircle2, ToggleLeft, ToggleRight, Zap } from 'lucide-react';

export interface WorkflowsManagerProps {
  tenantId?: string;
}

export const WorkflowsManager: React.FC<WorkflowsManagerProps> = ({ tenantId }) => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('LEAD_SCORE_ABOVE');
  const [triggerValue, setTriggerValue] = useState('80');
  const [actionType, setActionType] = useState('NOTIFY_TEAM');
  const [actionValue, setActionValue] = useState('Notificar a IR Lead en WhatsApp');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const query = tenantId ? `?tenantId=${tenantId}` : '';
      const res = await fetch(`/api/workflows${query}`);
      const data = await res.json();
      if (data.success) setRules(data.rules);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await fetch('/api/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current, tenantId }),
      });
      fetchRules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, triggerType, triggerValue, actionType, actionValue, tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <span>Automatizaciones & Motor de Workflows</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configura reglas de automatización para asignación de tareas, cambio de estado y notificaciones automáticas por WhatsApp/Email.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Regla Automática</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="neo-card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${rule.isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                <Play className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>DISPARADOR: <strong className="text-indigo-400">{rule.triggerType} ({rule.triggerValue})</strong></span>
                  <span>➔</span>
                  <span>ACCIÓN: <strong className="text-emerald-400">{rule.actionType} ({rule.actionValue})</strong></span>
                </div>
              </div>
            </div>

            <button onClick={() => handleToggle(rule.id, rule.isActive)} className="text-2xl">
              {rule.isActive ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
            </button>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#191a2e] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Nueva Regla de Automatización</h3>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre de la Regla</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Notificar equipo si Lead Score > 80"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141523] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Disparador (Trigger)</label>
                <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} className="w-full px-3 py-2 bg-[#141523] border border-white/10 rounded-xl text-xs text-white">
                  <option value="LEAD_SCORE_ABOVE">Lead Score mayor a X</option>
                  <option value="STAGE_CHANGED">Etapa de contacto cambiada</option>
                  <option value="TAG_ADDED">Etiqueta asignada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Valor del Disparador</label>
                <input
                  type="text"
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141523] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Acción Automática</label>
                <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full px-3 py-2 bg-[#141523] border border-white/10 rounded-xl text-xs text-white">
                  <option value="NOTIFY_TEAM">Notificar al Equipo Commercial</option>
                  <option value="SEND_WHATSAPP">Enviar Mensaje de WhatsApp Automático</option>
                  <option value="ADD_SCORE">Incrementar Lead Score (+20)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar Regla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
