'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Crown,
  Briefcase,
  UserCheck,
  Plus,
  Search,
  Smartphone,
  Mail,
  Building2,
  Trash2,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface UserRoleManagerProps {
  currentTenantId?: string | null;
  tenantName?: string;
}

export default function UserRoleManager({ currentTenantId, tenantName }: UserRoleManagerProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('AGENT');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentTenantId, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (currentTenantId && currentTenantId !== 'global') {
        query.append('tenantId', currentTenantId);
      }
      if (selectedRole !== 'ALL') {
        query.append('role', selectedRole);
      }

      const res = await fetch(`/api/users?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) {
      alert('Por favor ingresa al menos un correo electrónico o un número de celular.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          tenantId: currentTenantId && currentTenantId !== 'global' ? currentTenantId : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`✅ User "${name || phone}" saved! WhatsApp OTP invite sent.`);
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        fetchUsers();
      } else {
        alert(data.error || 'Failed to save user');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the workspace?')) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', userId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return { label: 'SUPER ADMIN', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: ShieldCheck };
      case 'TENANT_ADMIN':
        return { label: 'TENANT ADMIN', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Crown };
      case 'MANAGER':
        return { label: 'MANAGER / IR LEAD', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Briefcase };
      default:
        return { label: 'AGENT / ANALYST', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: UserCheck };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <Users className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">User & Role Management Module</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Team Permissions & WhatsApp OTP Access
          </h1>
          <p className="text-xs text-slate-400">
            Manage team members, WhatsApp numbers, role permissions, and company CRM access.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Team User
        </button>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: 'var(--bg-card)' }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'AGENT'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                selectedRole === r
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* User Directory Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
          Loading user directory...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="py-16 text-center rounded-3xl border border-white/5 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No users found</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="rounded-3xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="p-4 pl-6">User / Name</th>
                  <th className="p-4">WhatsApp Phone (OTP)</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">CRM Replica / Tenant</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white font-medium">
                {filteredUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  const Icon = badge.icon;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-black text-sm flex items-center justify-center border border-white/10">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-extrabold text-white">{u.name || 'CRM Member'}</div>
                          <div className="text-[11px] text-slate-400">{u.email || 'No email registered'}</div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-emerald-400 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300">
                        {u.tenant ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>{u.tenant.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">Global Platform</span>
                        )}
                      </td>

                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            style={{ backgroundColor: 'var(--bg-card)' }}
            className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-black text-white">Add Team User & Assign Role</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sofia Martinez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Correo Electrónico Corporativo</label>
                <input
                  type="email"
                  placeholder={tenantName ? `usuario@${tenantName.toLowerCase().replace(/\s+/g, '')}.com` : "usuario@empresa.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Número Celular WhatsApp (opcional)</label>
                <input
                  type="text"
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Role & Permission Level</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="AGENT">AGENT / ANALYST (Standard CRM Access)</option>
                  <option value="MANAGER">MANAGER / IR LEAD (Full Pipeline & Team Scope)</option>
                  <option value="TENANT_ADMIN">TENANT ADMIN (Company CRM Admin)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Global SaaS Master Access)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
                >
                  {submitting ? 'Saving...' : 'Authorize User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
