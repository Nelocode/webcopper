'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Plus,
  Users,
  Database,
  Briefcase,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Power,
  Search,
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  status: string;
  createdAt: string;
  _count: {
    users: number;
    contacts: number;
    deals: number;
  };
  users: Array<{
    id: string;
    name: string;
    phone: string;
    role: string;
  }>;
}

interface SuperAdminDashboardProps {
  onSelectTenant: (tenant: TenantItem | null) => void;
  currentTenantId?: string | null;
}

export default function SuperAdminDashboard({
  onSelectTenant,
  currentTenantId,
}: SuperAdminDashboardProps) {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
      }
    } catch (e) {
      console.error('Error fetching tenants:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminPhone) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          primaryColor,
          adminName,
          adminPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`✅ CRM Replica for "${name}" successfully provisioned!`);
        setShowCreateModal(false);
        setName('');
        setSlug('');
        setAdminName('');
        setAdminPhone('');
        fetchTenants();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error creating tenant: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenantId: string) => {
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS', tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContacts = tenants.reduce((acc, t) => acc + (t._count?.contacts || 0), 0);
  const totalDeals = tenants.reduce((acc, t) => acc + (t._count?.deals || 0), 0);
  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">Super Admin Management Control</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            SaaS Multi-Tenant CRM Replicas
          </h1>
          <p className="text-xs text-slate-400">
            Provision, manage, and monitor isolated CRM instances for enterprise clients and companies.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Provision New CRM Replica
        </button>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-5 rounded-2xl border border-white/5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Replicas</span>
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{activeTenantsCount} / {tenants.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Provisioned SaaS Companies</p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-5 rounded-2xl border border-white/5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Investors</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalContacts}</div>
          <p className="text-[11px] text-slate-500 font-medium">Across all company databases</p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-5 rounded-2xl border border-white/5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Deals</span>
            <Briefcase className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalDeals}</div>
          <p className="text-[11px] text-slate-500 font-medium">Platform-wide pipeline volume</p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-5 rounded-2xl border border-white/5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Auth Status</span>
            <Smartphone className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">Active</div>
          <p className="text-[11px] text-emerald-400 font-medium">Passwordless OTP Ready</p>
        </div>
      </div>

      {/* Tenant Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search CRM Replicas by company name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: 'var(--bg-card)' }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {currentTenantId && (
          <button
            onClick={() => onSelectTenant(null)}
            className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors"
          >
            Reset View to Global Super Admin
          </button>
        )}
      </div>

      {/* Tenants Grid List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
          Loading SaaS CRM Replicas...
        </div>
      ) : filteredTenants.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="py-16 text-center rounded-3xl border border-white/5 space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No CRM Replicas found</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Provision New CRM Replica" above to create an isolated CRM instance for a new company.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((t) => {
            const adminUser = t.users.find((u) => u.role === 'TENANT_ADMIN') || t.users[0];
            const isCurrent = currentTenantId === t.id;

            return (
              <div
                key={t.id}
                style={{ backgroundColor: 'var(--bg-card)' }}
                className={`p-6 rounded-3xl border transition-all space-y-5 relative overflow-hidden ${
                  isCurrent
                    ? 'border-amber-400 shadow-xl shadow-amber-500/10'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Top Badge & Color Accent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-950 text-sm shadow-md"
                      style={{ backgroundColor: t.primaryColor || '#3b82f6' }}
                    >
                      {t.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{t.name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">slug: {t.slug}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : t.status === 'PENDING_SETUP'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-black/20 border border-white/5 text-center">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Users</div>
                    <div className="text-base font-black text-white">{t._count?.users || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Contacts</div>
                    <div className="text-base font-black text-amber-400">{t._count?.contacts || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Deals</div>
                    <div className="text-base font-black text-blue-400">{t._count?.deals || 0}</div>
                  </div>
                </div>

                {/* Admin Contact Info */}
                {adminUser && (
                  <div className="text-xs space-y-1 text-slate-400">
                    <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Tenant Administrator</div>
                    <div className="text-white font-bold">{adminUser.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{adminUser.phone}</div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-white/5 gap-2">
                  <button
                    onClick={() => onSelectTenant(t)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Inspect CRM Replica
                  </button>

                  <button
                    onClick={() => handleToggleStatus(t.id)}
                    title={t.status === 'ACTIVE' ? 'Suspend Replica' : 'Activate Replica'}
                    className={`p-2 rounded-xl border transition-colors ${
                      t.status === 'ACTIVE'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provision New Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            style={{ backgroundColor: 'var(--bg-card)' }}
            className="w-full max-w-lg p-6 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-white">Provision New SaaS CRM Replica</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minera Andes Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Subdomain / Slug</label>
                  <input
                    type="text"
                    placeholder="andes-corp"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Theme Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="text-xs font-black uppercase text-amber-400 tracking-wider">Tenant Administrator Details</div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Administrator Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Carlos Mendoza (CEO)"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">WhatsApp Phone Number * (for OTP login)</label>
                  <input
                    type="text"
                    required
                    placeholder="+573001234567"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    The admin will receive their 6-digit login verification code directly via WhatsApp to this number.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
                >
                  {submitting ? 'Provisioning...' : 'Deploy CRM Replica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
