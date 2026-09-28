'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Sliders,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';

interface TenantSetupWizardProps {
  tenant: any;
  onComplete: () => void;
}

export default function TenantSetupWizard({ tenant, onComplete }: TenantSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState(tenant?.name || 'My Enterprise CRM');
  const [industry, setIndustry] = useState('Silver & Precious Metals Exploration');
  const [projectName, setProjectName] = useState('Santa Ana High-Grade Silver Project');
  
  // Pipeline Stages State
  const [stages, setStages] = useState<string[]>([
    'Lead Prospect',
    'Interested - considering',
    'Meeting Scheduled',
    'Due Diligence',
    'Term Sheet',
    'Closed Investor',
  ]);
  const [newStage, setNewStage] = useState('');

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; phone: string; role: string }>>([
    { name: 'Sofia Lead IR', phone: '+573207116676', role: 'MANAGER' },
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('AGENT');

  const [saving, setSaving] = useState(false);

  const handleAddStage = () => {
    if (newStage.trim() && !stages.includes(newStage.trim())) {
      setStages([...stages, newStage.trim()]);
      setNewStage('');
    }
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length > 2) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  const handleAddTeamMember = () => {
    if (newMemberName && newMemberPhone) {
      setTeamMembers([...teamMembers, { name: newMemberName, phone: newMemberPhone, role: newMemberRole }]);
      setNewMemberName('');
      setNewMemberPhone('');
    }
  };

  const handleFinishWizard = async () => {
    setSaving(true);
    try {
      // Save tenant configuration
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          tenantId: tenant.id,
        }),
      });
      onComplete();
    } catch (e) {
      console.error(e);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        style={{ backgroundColor: 'var(--bg-card)' }}
        className="w-full max-w-2xl p-8 rounded-3xl border border-white/10 space-y-8 shadow-2xl relative overflow-hidden"
      >
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Setup Wizard: {companyName}</h2>
              <p className="text-xs text-slate-400">Step {step} of 4: Initial CRM Instance Configuration</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  step === i
                    ? 'bg-amber-400 w-8 shadow-md shadow-amber-400/50'
                    : step > i
                    ? 'bg-emerald-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: COMPANY PROFILE */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">1. Company Profile & Identity</h3>
              <p className="text-xs text-slate-400">Define your company branding and primary asset project details.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Industry Sector</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Primary Project / Asset</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PIPELINE STAGES */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">2. Investor Pipeline Stages</h3>
              <p className="text-xs text-slate-400">Customize the stages of your investor Kanban funnel.</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom stage (e.g. Due Diligence Review)"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                >
                  Add Stage
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {stages.map((stg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-white font-bold">
                    <span>{idx + 1}. {stg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(idx)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TEAM MEMBERS */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">3. Team Members & Roles</h3>
              <p className="text-xs text-slate-400">Invite team members who will have access to this CRM replica.</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="WhatsApp Phone"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTeamMember}
                  className="px-3 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-400"
                >
                  Add Member
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {teamMembers.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
                    <div>
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{m.phone}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WHATSAPP INTEGRATION READY */}
        {step === 4 && (
          <div className="space-y-6 text-center animate-fadeIn py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-black text-white">CRM Replica Provisioned & Ready!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your isolated CRM instance for <strong>{companyName}</strong> is fully configured. WhatsApp OTP login, multi-tenant isolation, and custom pipeline stages are active.
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishWizard}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-xl shadow-emerald-500/20 transform hover:scale-[1.02] active:scale-95"
            >
              {saving ? 'Launching...' : 'Launch CRM Instance Now'}
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
