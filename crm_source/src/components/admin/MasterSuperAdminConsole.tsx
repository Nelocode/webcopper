'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Building2,
  Users,
  Plus,
  Power,
  ExternalLink,
  Smartphone,
  Search,
  Activity,
  Server,
  Database,
  BarChart3,
  Sliders,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import UserRoleManager from '@/components/users/UserRoleManager';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  primaryColor?: string;
  status: string;
  createdAt: string;
  _count?: {
    users: number;
    contacts: number;
    deals: number;
  };
  users?: Array<{
    id: string;
    name: string;
    phone: string;
    role: string;
  }>;
}

interface MasterSuperAdminConsoleProps {
  onLaunchReplica: (tenant: TenantItem) => void;
  onLogout: () => void;
}

export default function MasterSuperAdminConsole({
  onLaunchReplica,
  onLogout,
}: MasterSuperAdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<'replicas' | 'users' | 'metrics' | 'settings'>('replicas');
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Replica Form State
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminName, setAdminName] = useState('');
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
    if (!companyName || !adminPhone) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          slug: slug || companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          adminPhone,
          adminName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`✅ Empresa "${companyName}" aprovisionada correctamente.`);
        setShowCreateModal(false);
        setCompanyName('');
        setSlug('');
        setAdminPhone('');
        setAdminName('');
        fetchTenants();
      } else {
        alert(data.error || 'Error al aprovisionar réplica');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenantId: string) => {
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, action: 'TOGGLE_STATUS' }),
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

  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const totalContacts = tenants.reduce((acc, t) => acc + (t._count?.contacts || 0), 0);
  const totalDeals = tenants.reduce((acc, t) => acc + (t._count?.deals || 0), 0);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-['Urbanist'] flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Master Super Admin Header */}
      <header className="h-20 bg-[#11131b] border-b border-white/10 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white uppercase tracking-wider">
                Consola Maestra Super Admin
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SaaS Control Center
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Gestión centralizada de réplicas CRM, infraestructura y usuarios de la plataforma
            </p>
          </div>
        </div>

        {/* Master Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('replicas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'replicas'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresas & Instancias</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios Globales</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'metrics'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Infraestructura & Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ajustes SaaS</span>
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-white">Super Admin Principal</div>
          </div>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-red-400 transition-colors"
            title="Cerrar sesión Super Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Console Body */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* TAB 1: EMPRESAS & INSTANCIAS */}
        {activeTab === 'replicas' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="p-5 rounded-3xl bg-[#121522] border border-white/10 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Empresas Activas</span>
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-white">{activeTenantsCount} / {tenants.length}</div>
                <p className="text-[11px] text-slate-400">Empresas Aprovisionadas</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#121522] border border-white/10 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Inversionistas Registrados</span>
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white">{totalContacts}</div>
                <p className="text-[11px] text-slate-400">En todas las empresas</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#121522] border border-white/10 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Negocios Activos</span>
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">{totalDeals}</div>
                <p className="text-[11px] text-slate-400">Volumen en pipelines</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#121522] border border-white/10 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Servidor WhatsApp OTP</span>
                  <Smartphone className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-black text-white">Online</div>
                <p className="text-[11px] text-emerald-400 font-medium">Daemon Baileys Listo</p>
              </div>
            </div>

            {/* Action Bar & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar empresa por nombre o slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#121522] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Aprovisionar Nueva Empresa CRM
              </button>
            </div>

            {/* Company Replicas Grid */}
            {loading ? (
              <div className="py-16 text-center text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                Cargando réplicas de CRM...
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#121522] border border-white/10 space-y-3">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No hay réplicas registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map((t) => {
                  const adminUser = t.users?.[0];

                  return (
                    <div
                      key={t.id}
                      className="p-6 rounded-3xl bg-[#121522] border border-white/10 hover:border-amber-500/40 transition-all space-y-5 relative shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Company Title */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-950 text-sm shadow-md"
                              style={{ backgroundColor: t.primaryColor || '#38bdf8' }}
                            >
                              {t.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white">{t.name}</h3>
                              <p className="text-[11px] text-slate-400 font-mono">slug: {t.slug}</p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                          <div>
                            <div className="text-xs text-slate-400 font-medium">Usuarios</div>
                            <div className="text-base font-black text-white">{t._count?.users || 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 font-medium">Contactos</div>
                            <div className="text-base font-black text-amber-400">{t._count?.contacts || 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 font-medium">Negocios</div>
                            <div className="text-base font-black text-blue-400">{t._count?.deals || 0}</div>
                          </div>
                        </div>

                        {/* Tenant Admin info */}
                        {adminUser && (
                          <div className="text-xs space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                            <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Administrador de Réplica</div>
                            <div className="text-white font-bold">{adminUser.name}</div>
                            <div className="text-amber-400 font-mono text-[11px]">{adminUser.phone}</div>
                          </div>
                        )}
                      </div>

                      {/* Launch Replica Button */}
                      <div className="pt-3 flex items-center justify-between border-t border-white/10 gap-2">
                        <button
                          onClick={() => onLaunchReplica(t)}
                          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Lanzar Réplica CRM</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(t.id)}
                          className={`p-3 rounded-2xl border transition-colors ${
                            t.status === 'ACTIVE'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={t.status === 'ACTIVE' ? 'Suspender Réplica' : 'Activar Réplica'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USUARIOS GLOBALES */}
        {activeTab === 'users' && (
          <UserRoleManager currentTenantId="global" />
        )}

        {/* TAB 3: INFRAESTRUCTURA & LOGS */}
        {activeTab === 'metrics' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-[#121522] border border-white/10 space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-400" />
                <span>Estado de Infraestructura y Base de Datos</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">Motor de BD</div>
                  <div className="text-sm font-mono font-black text-emerald-400">Prisma v6.4.0 (SQLite dev.db)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">Servidor WebRTC</div>
                  <div className="text-sm font-mono font-black text-blue-400">Jitsi Meet WebRTC Core</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">Daemon WhatsApp</div>
                  <div className="text-sm font-mono font-black text-purple-400">node scripts/whatsapp-daemon.mjs</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AJUSTES SAAS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Platform Config Card */}
            <div className="p-6 rounded-3xl bg-[#121522] border border-white/10 space-y-5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>Configuración Maestra de la Plataforma</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Nombre de la Plataforma</label>
                  <input
                    type="text"
                    defaultValue="THE CORE"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="Nombre de tu SaaS"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Correo de Soporte</label>
                  <input
                    type="email"
                    defaultValue="soporte@thecore.app"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="soporte@tudominio.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Plan por Defecto</label>
                  <select className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400">
                    <option>Starter</option>
                    <option>Professional</option>
                    <option selected>Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Máx. Réplicas Simultáneas</label>
                  <input
                    type="number"
                    defaultValue={50}
                    min={1}
                    max={500}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:brightness-110 transition-all">
                Guardar Configuración
              </button>
            </div>

            {/* Feature Flags Card */}
            <div className="p-6 rounded-3xl bg-[#121522] border border-white/10 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Feature Flags Globales</span>
              </h3>
              <p className="text-xs text-slate-400">Activa o desactiva módulos para todas las réplicas de la plataforma.</p>

              {[
                { label: 'Bot de WhatsApp', desc: 'Captura de contactos y autenticación OTP via WhatsApp Business', defaultOn: true },
                { label: 'Enriquecimiento IA', desc: 'Deep search de contactos con inteligencia artificial', defaultOn: true },
                { label: 'Escáner OCR de Tarjetas', desc: 'Reconocimiento óptico de tarjetas de presentación', defaultOn: false },
                { label: 'Módulo de Video Llamadas', desc: 'Salas WebRTC para reuniones con inversionistas', defaultOn: true },
                { label: 'Calendario & Social', desc: 'Gestión de agenda y publicaciones en redes sociales', defaultOn: true },
              ].map((flag, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                  <div>
                    <p className="text-xs font-black text-white">{flag.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{flag.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={flag.defaultOn} className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-amber-400 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Provision New Replica Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#121522] border border-white/10 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-white">Aprovisionar Nueva Réplica CRM</h2>
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
                <label className="text-xs font-bold text-slate-300">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Minera Andes Corp"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Identificador / Slug</label>
                <input
                  type="text"
                  placeholder="minera-andes"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nombre del Administrador Inicial</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Teléfono WhatsApp del Admin * (Para Clave OTP)</label>
                <input
                  type="text"
                  required
                  placeholder="+573001112233"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md"
                >
                  {submitting ? 'Aprovisionando...' : 'Crear Réplica CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
