'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '@/types/crm';
import { OUTCROP_TAGS } from '@/lib/constants';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { MagicLogin } from '@/components/auth/MagicLogin';
import { Contact360View } from '@/components/contacts/Contact360View';
import { ContactModal } from '@/components/contacts/ContactModal';
import { VoiceNoteRecorder } from '@/components/contacts/VoiceNoteRecorder';
import { ContactGraphView } from '@/components/graph/ContactGraphView';
import { KanbanPipeline } from '@/components/pipeline/KanbanPipeline';
import { WorkflowsManager } from '@/components/workflows/WorkflowsManager';
import { WhatsAppManager } from '@/components/whatsapp/WhatsAppManager';
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';
import { ConcaveCard } from '@/components/ui/ConcaveCard';
import { DailyScheduleWidget } from '@/components/ui/DailyScheduleWidget';
import { IRMetricsDashboard } from '@/components/analytics/IRMetricsDashboard';
import { SyndicateManager } from '@/components/syndicates/SyndicateManager';
import { RoadshowManager } from '@/components/roadshows/RoadshowManager';
import { SocialCalendarManager } from '@/components/social/SocialCalendarManager';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import WhatsAppOtpLogin from '@/components/auth/WhatsAppOtpLogin';
import TenantSetupWizard from '@/components/onboarding/TenantSetupWizard';
import RealWebRtcRoom from '@/components/video/RealWebRtcRoom';
import UserRoleManager from '@/components/users/UserRoleManager';
import BackupManager from '@/components/admin/BackupManager';
import MasterSuperAdminConsole from '@/components/admin/MasterSuperAdminConsole';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ImportCSVModal } from '@/components/contacts/ImportCSVModal';
import { FinancialTickerWidget } from '@/components/analytics/FinancialTickerWidget';
import { MediaDriveManager } from '@/components/drive/MediaDriveManager';
import { HermesAgentStudio } from '@/components/hermes/HermesAgentStudio';
import { initTheme } from '@/lib/themeEngine';

import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Clock,
  Calendar,
  Video,
  Flame,
  Mail,
  CheckCircle2,
  Search,
  ChevronDown,
  Download,
  Upload,
  LayoutGrid,
  List,
  Table,
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  // State Initialization with LocalStorage Persistence for seamless page reloads
  const [activeTabState, setActiveTabState] = useState<ActiveTab>('contacts');
  const [viewMode, setViewMode] = useState<'SUPER_ADMIN_CONSOLE' | 'TENANT_CRM'>('TENANT_CRM');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [contactViewMode, setContactViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  // ActiveTab Setter with Persistence
  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('crm_active_tab', tab);
    } catch (e) {}
  };

  const activeTab = activeTabState;

  useEffect(() => {
    // Initialize & sync full custom theme Engine (Colors, Fonts, Container Geometry)
    initTheme();

    // Restore persisted tab on mount
    try {
      const savedTab = localStorage.getItem('crm_active_tab') as ActiveTab;
      if (savedTab) setActiveTabState(savedTab);
      const savedTenant = localStorage.getItem('crm_selected_tenant');
      if (savedTenant) setSelectedTenant(JSON.parse(savedTenant));
      const savedViewMode = localStorage.getItem('crm_view_mode') as any;
      if (savedViewMode) setViewMode(savedViewMode);
    } catch (e) {}

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.role === 'SUPER_ADMIN') {
            const savedViewMode = localStorage.getItem('crm_view_mode');
            if (savedViewMode === 'SUPER_ADMIN_CONSOLE') {
              setViewMode('SUPER_ADMIN_CONSOLE');
            } else {
              setViewMode('TENANT_CRM');
            }
          } else {
            setViewMode('TENANT_CRM');
            if (data.user.tenant) {
              setSelectedTenant(data.user.tenant);
              setBrandName(data.user.tenant.name);
            }
          }
        }
      })
      .catch(() => setUser(null));
  }, []);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');

  const [tenants, setTenants] = useState<any[]>([]);
  const [showOtpLoginModal, setShowOtpLoginModal] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Modals
  const [selectedContact360, setSelectedContact360] = useState<Contact | null>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [icalUrl, setIcalUrl] = useState('');

  // Branding Customization state with Official Outcrop Web Palette default (#00dfdf True Cyan & #a9aeb2 Metallic Silver)
  const [brandName, setBrandName] = useState('The Core');
  const [brandLogo, setBrandLogo] = useState('/logo.png');
  const [primaryColor, setPrimaryColor] = useState('#00dfdf');
  const [accentPurple, setAccentPurple] = useState('#a9aeb2');

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      setBrandName(selectedTenant.name || 'The Core');
      if (selectedTenant.logoUrl) setBrandLogo(selectedTenant.logoUrl);
      if (selectedTenant.primaryColor) {
        setPrimaryColor(selectedTenant.primaryColor);
        document.documentElement.style.setProperty('--primary-color', selectedTenant.primaryColor);
      }
    }
  }, [selectedTenant]);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedTenant?.id) return;
    fetch('/api/calendar/events?tenantId=' + selectedTenant.id)
      .then(r => r.json())
      .then(data => { if (data.success) setUpcomingEvents((data.events || []).slice(0, 3)); })
      .catch(() => {});
  }, [selectedTenant]);

  useEffect(() => {
    fetchContacts();
    // Real-Time Background Synchronization (2.5s interval) for zero-refresh UI updates!
    const syncInterval = setInterval(() => {
      fetchContacts(true);
    }, 2500);
    return () => clearInterval(syncInterval);
  }, [searchTerm, selectedType, selectedStage, selectedSource, selectedTenant]);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      if (data.success && data.tenants) {
        setTenants(data.tenants);
        if (!selectedTenant && data.tenants.length > 0) {
          // Strictly default to Outcrop Silver Corp — never leak or pick arbitrary tenants
          const outcrop = data.tenants.find((t: any) => t.slug === 'outcrop-silver') || data.tenants[0];
          setSelectedTenant(outcrop);
          setBrandName(outcrop.name);
          try {
            localStorage.setItem('crm_selected_tenant', JSON.stringify(outcrop));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('Error fetching tenants:', e);
    }
  };

  const fetchContacts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      const activeTenantId = selectedTenant?.id || '1757cddf-5974-4184-9bb1-d5f4f7e931be';
      query.append('tenantId', activeTenantId);
      
      if (selectedType && selectedType !== 'ALL') {
        if (selectedType === 'Hot Client' || selectedType === 'Great Interest') {
          query.append('interestLevel', 'High');
        } else if (selectedType === 'Medium Interest') {
          query.append('interestLevel', 'Medium');
        } else if (selectedType === 'Low Interest') {
          query.append('interestLevel', 'Low');
        } else {
          query.append('investorType', selectedType);
        }
      }
      
      if (selectedStage !== 'ALL') query.append('stage', selectedStage);
      if (selectedSource !== 'ALL') query.append('source', selectedSource);

      const res = await fetch(`/api/contacts?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      alert('No hay contactos en la lista para exportar.');
      return;
    }
    const headers = ['ID', 'Nombre', 'Empresa', 'Cargo', 'Email', 'Telefono', 'WhatsApp', 'Ubicacion', 'Etapa', 'Nivel Interes', 'Fuente', 'Lead Score', 'Fecha Creado'];
    const rows = contacts.map(c => [
      `"${c.id}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${(c.stage || '').replace(/"/g, '""')}"`,
      `"${(c.interestLevel || '').replace(/"/g, '""')}"`,
      `"${(c.source || '').replace(/"/g, '""')}"`,
      c.leadScore || 0,
      `"${new Date(c.createdAt).toLocaleDateString('es-CO')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos_${selectedTenant?.slug || 'the-core'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <MagicLogin
        onLoginSuccess={(usr) => {
          setUser(usr);
          if (usr.role === 'SUPER_ADMIN') {
            setViewMode('SUPER_ADMIN_CONSOLE');
          } else {
            setViewMode('TENANT_CRM');
            if (usr.tenant) {
              setSelectedTenant(usr.tenant);
              setBrandName(usr.tenant.name);
            }
          }
        }}
        brandName={brandName}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT' }),
      });
    } catch (e) {}
    setUser(null);
    try {
      localStorage.removeItem('crm_view_mode');
      localStorage.removeItem('crm_selected_tenant');
    } catch (e) {}
    window.location.href = '/';
  };

  // 1. STANDALONE MASTER SUPER ADMIN CONSOLE — only for SUPER_ADMIN role
  if (viewMode === 'SUPER_ADMIN_CONSOLE' && user?.role === 'SUPER_ADMIN') {
    return (
      <MasterSuperAdminConsole
        onLaunchReplica={(t) => {
          setSelectedTenant(t);
          setBrandName(t.name);
          setViewMode('TENANT_CRM');
          try {
            localStorage.setItem('crm_view_mode', 'TENANT_CRM');
            localStorage.setItem('crm_selected_tenant', JSON.stringify(t));
          } catch (e) {}
        }}
        onLogout={handleLogout}
      />
    );
  }

  // Safety: if somehow a non-SUPER_ADMIN ends up in SUPER_ADMIN_CONSOLE mode, redirect to CRM
  if (viewMode === 'SUPER_ADMIN_CONSOLE' && user?.role !== 'SUPER_ADMIN') {
    setViewMode('TENANT_CRM');
  }

  // 2. ISOLATED TENANT CRM WORKSPACE
  return (
    <div
      style={{ backgroundColor: 'var(--bg-main)' }}
      className="min-h-screen text-slate-100 flex relative font-['Urbanist'] tracking-tight selection:bg-[#38bdf8] selection:text-zinc-950 transition-colors duration-200"
    >
      {/* Fixed Left Sidebar Menu (Always standalone, fixed at left-0) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contactCount={contacts.length}
        onLogout={handleLogout}
        brandName={brandName}
        brandLogo={brandLogo}
        selectedTenant={selectedTenant}
      />

      {/* Right Column Workspace (Inspection Banner + Navbar + Main Canvas) */}
      <div className="flex-1 ml-64 w-[calc(100%-16rem)] flex flex-col min-h-screen relative z-10">
        {/* Replica Inspection Notification Banner — Only visible when SUPER_ADMIN is inspecting a replica */}
        {user?.role === 'SUPER_ADMIN' && selectedTenant && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-950 px-6 py-2 text-xs font-black flex items-center justify-between shadow-lg sticky top-0 z-50 w-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Modo Inspección CRM Empresa: <strong>{selectedTenant?.name || brandName}</strong></span>
            </div>
            <button
              onClick={() => {
                setSelectedTenant(null);
                try {
                  localStorage.setItem('crm_view_mode', 'SUPER_ADMIN_CONSOLE');
                  localStorage.removeItem('crm_selected_tenant');
                } catch (e) {}
                setViewMode('SUPER_ADMIN_CONSOLE');
              }}
              className="px-4 py-1 rounded-full bg-slate-950 text-white font-extrabold text-[11px] hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Volver a Consola Super Admin
            </button>
          </div>
        )}

        {/* Top Header Navbar */}
        <Navbar
          user={user}
          onLogout={handleLogout}
          brandName={brandName}
          brandLogo={brandLogo}
          onOpenThemeSettings={() => setActiveTab('settings')}
          onOpenVideoCall={() => setShowVideoModal(true)}
          onOpenAgenda={() => setShowAgendaModal(true)}
          onOpenLogin={() => setShowOtpLoginModal(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          totalContacts={contacts.length}
          tenants={tenants}
          selectedTenant={selectedTenant}
          onSelectTenant={(t) => {
            setSelectedTenant(t);
            if (t) {
              setBrandName(t.name);
              setActiveTab('contacts');
            } else {
              setViewMode('SUPER_ADMIN_CONSOLE');
            }
          }}
          upcomingEvents={upcomingEvents}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full bg-[#131313] px-4 sm:px-6 lg:px-8 py-6 space-y-8 overflow-x-hidden text-[#E5E2E1]">
          {activeTab === 'contacts' && (
            <ErrorBoundary>
            <div className="space-y-6">

              {/* DORMANT KEY INVESTOR ALERTS BANNER */}
              {contacts.filter(c => (c.leadScore || 0) >= 75 || (c.investorType || '').toLowerCase().includes('family office')).length > 0 && (
                <div className="p-4 rounded-md bg-[#1C1B1B] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-none animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center font-bold shrink-0">
                      <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Alerta de Inversionistas Clave</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[#A1A1A1] font-mono text-[10px] border border-white/10">
                          HIGH-SCORE IR ALERT
                        </span>
                      </h4>
                      <p className="text-[12px] text-[#A1A1A1] font-medium mt-0.5">
                        Inversionistas prioritarios ({contacts.filter(c => (c.leadScore || 0) >= 75).slice(0, 2).map(c => c.name).join(', ')}...) listos para entrega de avances de {selectedTenant?.name || brandName}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const topContact = contacts.find(c => (c.leadScore || 0) >= 75);
                      if (topContact) setSelectedContact360(topContact);
                    }}
                    className="px-3.5 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    Agendar Seguimiento 360°
                  </button>
                </div>
              )}
              
              {/* FINANCIAL TICKER WIDGET */}
              <FinancialTickerWidget />
              
              {/* SECTION 1: WORKSPACE HEADER & DAILY SCHEDULE HERO WIDGET */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Left Workspace Title & Stats Summary (Connected to var(--bg-card)) */}
                <ConcaveCard
                  bgColor="var(--bg-card)"
                  notchWidth={370}
                  notchHeight={52}
                  className="lg:col-span-2 shadow-2xl flex flex-col justify-between"
                  actionButton={
                    <div className="flex items-center justify-end gap-2 pr-2 w-full h-full">
                      <button
                        onClick={() => setShowImportModal(true)}
                        title="Importar Contactos desde CSV"
                        className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-slate-300 text-xs font-black flex items-center gap-1.5 hover:bg-slate-800 hover:text-white transition-all shadow-md cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Importar CSV</span>
                      </button>
                      <button
                        onClick={handleExportCSV}
                        title="Exportar Contactos a CSV"
                        className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-slate-300 text-xs font-black flex items-center gap-1.5 hover:bg-slate-800 hover:text-white transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                      </button>
                      <button
                        onClick={() => setShowAddContactModal(true)}
                        className="hs-pill-btn hs-btn-lime shadow-xl py-1.5 px-4 text-xs font-black flex items-center gap-1 hover:scale-105 transition-transform"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Contact</span>
                      </button>
                    </div>
                  }
                >
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-4 pr-4 md:pr-[380px]">
                      <div>
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Espacio de Trabajo CRM</h1>
                          <span
                            style={{ backgroundColor: 'var(--primary-color)', color: '#FFFFFF' }}
                            className="px-3 py-0.5 rounded-full font-bold text-xs shadow-md font-mono"
                          >
                            {contacts.length} Leads
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 font-medium leading-relaxed">
                          {selectedTenant?.name ? 'Panel corporativo activo: ' + selectedTenant.name : 'Selecciona una empresa desde la Consola Maestra para comenzar.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Counters Grid (Responsive Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-5 mt-5 border-t border-white/5">
                    <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl border border-white/5 bento-card-spotlight">
                      <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">Inversionistas Activos</span>
                      <span className="text-2xl font-bold text-white font-mono">{contacts.filter(c => c.stage.includes('Interested')).length}</span>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl border border-white/5 bento-card-spotlight">
                      <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">Conexiones del Grafo</span>
                      <span style={{ color: 'var(--primary-color)' }} className="text-2xl font-bold font-mono">{contacts.reduce((acc, c) => acc + (c.sourceRelationships?.length || 0) + (c.targetRelationships?.length || 0), 0)} Conexiones</span>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl border border-white/5 bento-card-spotlight">
                      <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">Puntuación Promedio</span>
                      <span style={{ color: 'var(--secondary-color)' }} className="text-2xl font-bold font-mono">{contacts.length > 0 ? Math.round(contacts.reduce((acc, c) => acc + (c.leadScore || 0), 0) / contacts.length) : 0} pts</span>
                    </div>
                  </div>
                </ConcaveCard>

                {/* Right: Daily Schedule Hero Widget */}
                <DailyScheduleWidget onOpenAgenda={() => setShowAgendaModal(true)} />
              </div>

              {/* SECTION 2: NEW LEADS */}
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">Directorio de Contactos</h2>
                    <span
                      style={{ backgroundColor: 'var(--bg-card)' }}
                      className="px-2.5 py-0.5 rounded-full text-slate-400 font-mono text-xs font-bold"
                    >
                      {contacts.length} Leads
                    </span>

                    {/* View Mode Switcher Toolbar */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1C1B1B] border border-white/10 ml-2">
                      <button
                        onClick={() => setContactViewMode('grid')}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          contactViewMode === 'grid' ? 'bg-[#2A2A2A] text-[var(--accent-primary)] border border-white/10' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Vista en Tarjetas Bento"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setContactViewMode('list')}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          contactViewMode === 'list' ? 'bg-[#2A2A2A] text-[var(--accent-primary)] border border-white/10' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Vista Lista Compacta Ejecutiva"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setContactViewMode('table')}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          contactViewMode === 'table' ? 'bg-[#2A2A2A] text-[var(--accent-primary)] border border-white/10' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Vista Tabla de Datos (Alta Densidad)"
                      >
                        <Table className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Controls: Stage, Source & Interest Pills */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-1 flex-wrap">
                    {/* Stage Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400">Etapa:</span>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-slate-900 text-white">Todas las Etapas</option>
                        <option value="Lead Prospect" className="bg-slate-900 text-white">Lead Prospect</option>
                        <option value="Interested - early" className="bg-slate-900 text-white">Interested / Contacted</option>
                        <option value="Qualified" className="bg-slate-900 text-white">Qualified</option>
                        <option value="Due Diligence" className="bg-slate-900 text-white">Due Diligence</option>
                        <option value="Term Sheet" className="bg-slate-900 text-white">Term Sheet</option>
                        <option value="Closed Investor" className="bg-slate-900 text-white">Closed Investor</option>
                      </select>
                    </div>

                    {/* Source Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400">Fuente:</span>
                      <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-slate-900 text-white">Todas las Fuentes</option>
                        <option value="Networking" className="bg-slate-900 text-white">Networking</option>
                        <option value="Card Scan" className="bg-slate-900 text-white">Escáner Tarjeta</option>
                        <option value="Form" className="bg-slate-900 text-white">Formulario</option>
                        <option value="Import" className="bg-slate-900 text-white">Importación</option>
                        <option value="WhatsApp" className="bg-slate-900 text-white">WhatsApp</option>
                      </select>
                    </div>

                    {/* Interest Level Pills */}
                    {['ALL', 'Hot Client', 'Great Interest', 'Medium Interest', 'Low Interest'].map((filterItem) => {
                      const isSelected = selectedType === filterItem || (filterItem === 'ALL' && selectedType === 'ALL');

                      return (
                        <button
                          key={filterItem}
                          onClick={() => setSelectedType(filterItem)}
                          style={
                            isSelected
                              ? { backgroundColor: 'var(--primary-color)', color: '#000000' }
                              : { backgroundColor: 'var(--bg-card)' }
                          }
                          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                            isSelected
                              ? 'shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {filterItem}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contacts Multi-View Display (Grid / List / Table) */}
                {loading ? (
                  <div className="text-center py-20 text-slate-500 font-mono text-xs">
                    Cargando contactos del espacio de trabajo...
                  </div>
                ) : contacts.length > 0 ? (
                  <>
                    {/* MODE 1: BENTO CARDS GRID */}
                    {contactViewMode === 'grid' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                        {contacts.map((contact) => (
                          <ConcaveCard
                            key={contact.id}
                            bgColor="var(--bg-card)"
                            notchWidth={50}
                            notchHeight={50}
                            className="flex flex-col justify-between group transition-all shadow-2xl"
                            actionButton={
                              <button
                                onClick={() => setSelectedContact360(contact)}
                                style={{ backgroundColor: 'var(--bg-card-inner)' }}
                                className="w-9 h-9 rounded-full text-slate-200 flex items-center justify-center transition-transform hover:scale-110 shadow-md"
                                title="Ver Perfil 360°"
                              >
                                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            }
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-4 pr-12">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                  <div
                                    style={{ borderColor: 'var(--primary-color)', backgroundColor: 'var(--bg-card-inner)' }}
                                    className="w-12 h-12 rounded-full border-2 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0"
                                  >
                                    {contact.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-extrabold text-sm text-white group-hover:text-[var(--accent-primary)] transition-colors truncate">
                                      {contact.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium truncate">
                                      {contact.title || 'Investor'} {contact.company ? `at ${contact.company}` : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl mb-4 space-y-2">
                                <div className="flex items-center justify-between text-xs gap-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Fuente</span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span style={{ backgroundColor: 'var(--bg-card)' }} className="px-2.5 py-0.5 rounded-full text-slate-200 text-[10px] font-bold">
                                      {contact.source || 'LinkedIn'}
                                    </span>
                                    <span style={{ backgroundColor: 'var(--bg-card)' }} className="px-2.5 py-0.5 rounded-full text-slate-400 text-[10px] font-bold">
                                      Email
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Rating</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }} />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap mb-4">
                                <span
                                  style={{
                                    backgroundColor: 'var(--primary-color-alpha)',
                                    color: 'var(--primary-color)',
                                  }}
                                  className="inline-flex whitespace-nowrap text-[10px] font-black px-3 py-1 rounded-full"
                                >
                                  {contact.stage}
                                </span>
                                <span style={{ backgroundColor: 'var(--bg-card-inner)' }} className="inline-flex whitespace-nowrap text-[10px] font-black px-3 py-1 rounded-full text-slate-300">
                                  {contact.investorType}
                                </span>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                              <span style={{ color: 'var(--primary-color)' }} className="text-[11px] font-mono font-bold shrink-0">
                                Score: {contact.leadScore} pts
                              </span>
                              <button
                                onClick={() => setSelectedContact360(contact)}
                                className="hs-pill-btn hs-btn-lime py-1.5 px-4 text-xs font-black shrink-0"
                              >
                                <span>Perfil 360°</span>
                              </button>
                            </div>
                          </ConcaveCard>
                        ))}
                      </div>
                    )}

                    {/* MODE 2: COMPACT EXECUTIVE LIST */}
                    {contactViewMode === 'list' && (
                      <div className="space-y-2.5 w-full">
                        {contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="p-3.5 rounded-lg bg-[#1C1B1B] border border-white/10 hover:bg-[#222121] hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-bold text-sm flex items-center justify-center shrink-0">
                                {contact.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-sm text-white group-hover:text-[var(--accent-primary)] transition-colors truncate">
                                    {contact.name}
                                  </h3>
                                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#A1A1A1] border border-white/10 font-mono text-[10px] shrink-0">
                                    {contact.stage}
                                  </span>
                                </div>
                                <p className="text-xs text-[#A1A1A1] font-medium truncate mt-0.5">
                                  {contact.title || 'Investor'} {contact.company ? `at ${contact.company}` : ''} • Origen: {contact.source || 'Direct'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right hidden md:block font-mono">
                                <span className="text-xs font-semibold text-[var(--accent-primary)] block">
                                  {contact.leadScore} pts
                                </span>
                                <span className="text-[10px] text-[#757575] uppercase block">
                                  {contact.investorType || 'General'}
                                </span>
                              </div>

                              <button
                                onClick={() => setSelectedContact360(contact)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-[var(--accent-primary)] hover:text-white hover:border-transparent text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 text-white"
                              >
                                <span>Perfil 360°</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* MODE 3: HIGH DENSITY DATA TABLE */}
                    {contactViewMode === 'table' && (
                      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#1C1B1B]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 bg-[#2A2A2A] text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                              <th className="py-3 px-4 font-semibold">Inversionista / Contacto</th>
                              <th className="py-3 px-4 font-semibold">Empresa & Cargo</th>
                              <th className="py-3 px-4 font-semibold">Etapa Pipeline</th>
                              <th className="py-3 px-4 font-semibold">Fuente / Perfil</th>
                              <th className="py-3 px-4 font-semibold text-right">Lead Score</th>
                              <th className="py-3 px-4 font-semibold text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-neutral-200">
                            {contacts.map((contact) => (
                              <tr key={contact.id} className="hover:bg-white/[0.04] transition-colors group">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-bold text-xs flex items-center justify-center shrink-0">
                                      {contact.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                                      {contact.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-neutral-400">
                                  {contact.company || 'N/A'} {contact.title ? `(${contact.title})` : ''}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#A1A1A1] border border-white/10 font-mono text-[10px]">
                                    {contact.stage}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                                  {contact.source || 'Direct'} / {contact.investorType || 'General'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[var(--accent-primary)]">
                                  {contact.leadScore} pts
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => setSelectedContact360(contact)}
                                    className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] hover:bg-[var(--accent-primary)] hover:text-white hover:border-transparent text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <span>Ver 360°</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ backgroundColor: 'var(--bg-card)' }} className="text-center py-20 p-8 rounded-[28px] text-slate-400 text-xs">
                    No se encontraron contactos que coincidan con los filtros.
                  </div>
                )}
              </div>

              {/* SECTION 3: YOUR DAYS TASKS */}
              <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-white">Your Days Tasks</h2>
                    <span style={{ backgroundColor: 'var(--bg-card)' }} className="px-2.5 py-0.5 rounded-full text-slate-400 font-mono text-xs font-bold">
                      16 Tasks
                    </span>
                  </div>

                  {/* Task Status Filters */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['All', 'Hot', 'Due Today', 'Overdue', 'Completed'].map((taskFilter, i) => (
                      <button
                        key={taskFilter}
                        style={{
                          backgroundColor: i === 0 ? 'var(--bg-card-inner)' : 'var(--bg-card)',
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                          i === 0 ? 'text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {taskFilter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {upcomingEvents.length === 0 ? (
                    <div className="col-span-3 text-center py-10 text-slate-400 text-sm">
                      No hay reuniones próximas programadas.
                    </div>
                  ) : (
                    upcomingEvents.map((evt, idx) => (
                      <ConcaveCard
                        key={evt.id || idx}
                        bgColor="var(--bg-card)"
                        notchWidth={50}
                        notchHeight={50}
                        actionButton={
                          <button style={{ backgroundColor: 'var(--bg-card-inner)' }} className="w-8 h-8 rounded-full text-slate-200 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        }
                        className="flex flex-col justify-between space-y-4 shadow-xl"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3 pr-12">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white">
                                {evt.contactName ? evt.contactName.charAt(0) : 'U'}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white">{evt.contactName || 'Unassigned Contact'}</h4>
                                <p className="text-[10px] font-bold text-slate-400">Scheduled Event</p>
                              </div>
                            </div>
                          </div>

                          <div className="my-3 space-y-1">
                            <h3 className="text-xl font-black text-white tracking-tight">{evt.title || 'Meeting'}</h3>
                            <p className="text-xs font-mono font-bold text-slate-400">
                              {evt.startTime ? new Date(evt.startTime).toLocaleString() : 'TBD'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <button
                            onClick={() => evt.meetingUrl ? window.open(evt.meetingUrl, '_blank') : setShowVideoModal(true)}
                            style={{ backgroundColor: 'var(--bg-card-inner)' }}
                            className="px-3 py-1.5 rounded-full text-slate-300 text-xs font-bold hover:text-white"
                          >
                            Unirse
                          </button>
                          <button onClick={() => setShowVideoModal(true)} style={{ backgroundColor: 'var(--bg-card-inner)' }} className="w-8 h-8 rounded-full text-white flex items-center justify-center">
                            <Video className="w-4 h-4" />
                          </button>
                        </div>
                      </ConcaveCard>
                    ))
                  )}
                </div>
              </div>

            </div>
            </ErrorBoundary>
          )}

          {activeTab === 'graph' && (
            <ContactGraphView
              contacts={contacts}
              onOpen360={(c) => setSelectedContact360(c)}
              onRefresh={fetchContacts}
            />
          )}

          {activeTab === 'followup' && (
            <ErrorBoundary>
              <KanbanPipeline
                contacts={contacts}
                onOpen360={(c) => setSelectedContact360(c)}
                onRefresh={fetchContacts}
                tenantName={brandName}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'syndicates' && (
            <SyndicateManager contacts={contacts} onOpen360={(c) => setSelectedContact360(c)} />
          )}

          {activeTab === 'roadshows' && (
            <RoadshowManager contacts={contacts} onOpen360={(c) => setSelectedContact360(c)} />
          )}

          {activeTab === 'voice-notes' && (
            <VoiceNoteRecorder contacts={contacts} onSuccess={fetchContacts} />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppManager tenantId={selectedTenant?.id} tenantName={brandName} />
          )}

          {activeTab === 'workflows' && (
            <WorkflowsManager tenantId={selectedTenant?.id} />
          )}

          {activeTab === 'hermes-agent' && (
            <ErrorBoundary>
              <HermesAgentStudio tenantId={selectedTenant?.id} tenantName={brandName} />
            </ErrorBoundary>
          )}

          {activeTab === 'media-drive' && (
            <MediaDriveManager tenantId={selectedTenant?.id} tenantName={brandName} />
          )}

          {activeTab === 'social-calendar' && (
            <SocialCalendarManager tenantId={selectedTenant?.id} />
          )}

          {activeTab === 'settings' && (
            <ThemeCustomizer
              brandName={brandName}
              setBrandName={setBrandName}
              brandLogo={brandLogo}
              setBrandLogo={setBrandLogo}
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              accentPurple={accentPurple}
              setAccentPurple={setAccentPurple}
            />
          )}

          {activeTab === 'analytics' && (
            <ErrorBoundary>
              <IRMetricsDashboard contacts={contacts} onOpenContact360={(c) => setSelectedContact360(c)} tenantName={brandName} />
            </ErrorBoundary>
          )}

          {activeTab === 'users' && (
            <UserRoleManager currentTenantId={selectedTenant?.id} tenantName={brandName} />
          )}

          {activeTab === 'backups' && (
            <ErrorBoundary>
              <BackupManager />
            </ErrorBoundary>
          )}

          {activeTab === 'super-admin' && (
            <SuperAdminDashboard
              currentTenantId={selectedTenant?.id}
              onSelectTenant={(t) => {
                setSelectedTenant(t);
                if (t && t.status === 'PENDING_SETUP') {
                  setShowSetupWizard(true);
                }
              }}
            />
          )}
        </main>
      </div>

      {showOtpLoginModal && (
        <WhatsAppOtpLogin
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowOtpLoginModal(false);
            if (loggedUser.tenant) {
              setSelectedTenant(loggedUser.tenant);
              setBrandName(loggedUser.tenant.name);
            }
          }}
          onCancel={() => setShowOtpLoginModal(false)}
        />
      )}

      {showSetupWizard && selectedTenant && (
        <TenantSetupWizard
          tenant={selectedTenant}
          onComplete={() => {
            setShowSetupWizard(false);
            setSelectedTenant({ ...selectedTenant, status: 'ACTIVE' });
          }}
        />
      )}

      {/* Interactive Floating 360° Dossier */}
      {selectedContact360 && (
        <ErrorBoundary>
          <Contact360View
            contact={selectedContact360}
            onClose={() => setSelectedContact360(null)}
            onRefresh={fetchContacts}
            onOpenCardScanner={() => {
              setSelectedContact360(null);
              setShowAddContactModal(true);
            }}
            onOpenVoiceRecorder={() => {
              setSelectedContact360(null);
              setActiveTab('voice-notes');
            }}
          />
        </ErrorBoundary>
      )}

      {showAddContactModal && (
        <ContactModal
          tenantId={selectedTenant?.id}
          onClose={() => setShowAddContactModal(false)}
          onSuccess={fetchContacts}
        />
      )}

      {/* Live WebRTC Video Call Room */}
      {showVideoModal && (
        <RealWebRtcRoom onClose={() => setShowVideoModal(false)} />
      )}

      {/* Real Agenda & Calendar Sync Modal */}
      {showAgendaModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="w-full max-w-xl p-6 rounded-[28px] shadow-2xl space-y-5 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
                <span>Real Calendar & iCal Feed Sync</span>
              </h3>
              <button onClick={() => setShowAgendaModal(false)} className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center bg-slate-800">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* iCal Feed Import Section */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Sync External Calendar (Google / Outlook / Apple)</div>
                <p className="text-[11px] text-slate-400">
                  Paste your shared <strong>iCal (.ics) feed URL</strong> to automatically sync your meetings to this CRM.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-mono placeholder-slate-600"
                  />
                  <button
                    onClick={async () => {
                      const url = icalUrl;
                      if (!url) return;
                      try {
                        const res = await fetch('/api/calendar/sync', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ icalUrl: url, tenantId: selectedTenant?.id }),
                        });
                        const data = await res.json();
                        alert(data.message || data.error);
                        setShowAgendaModal(false);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
                  >
                    Sync iCal
                  </button>
                </div>
              </div>

              {/* 1-Click Meeting Scheduling */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                <div className="text-xs font-black text-blue-400 uppercase tracking-wider">1-Click Instant Calendar Invite Generator</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    id="evt-title-input"
                    placeholder="Meeting Title (e.g. Santa Ana Investor Review)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const titleInput = document.getElementById('evt-title-input') as HTMLInputElement;
                        const title = titleInput?.value || 'Investor IR Meeting';
                        const res = await fetch('/api/calendar/events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title,
                            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                            tenantId: selectedTenant?.id,
                          }),
                        });
                        const data = await res.json();
                        if (data.success && data.syncLinks) {
                          window.open(data.syncLinks.googleUrl, '_blank');
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 hover:bg-blue-500/30"
                    >
                      Sync to Google Calendar
                    </button>
                    <button
                      onClick={async () => {
                        const titleInput = document.getElementById('evt-title-input') as HTMLInputElement;
                        const title = titleInput?.value || 'Investor IR Meeting';
                        const res = await fetch('/api/calendar/events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title,
                            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                            tenantId: selectedTenant?.id,
                          }),
                        });
                        const data = await res.json();
                        if (data.success && data.syncLinks) {
                          window.open(data.syncLinks.outlookUrl, '_blank');
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30 hover:bg-sky-500/30"
                    >
                      Sync to Outlook Web
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchContacts();
        }}
        tenantName={selectedTenant?.name || brandName}
      />
    </div>
  );
}
