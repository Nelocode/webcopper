'use client';

import React from 'react';
import {
  Users,
  Network,
  Clock,
  Calendar,
  Mic,
  MessageSquare,
  Workflow,
  BarChart3,
  Database,
  Sliders,
  LogOut,
  Layers,
  FolderKanban,
  Bot,
} from 'lucide-react';

export type ActiveTab =
  | 'contacts'
  | 'graph'
  | 'followup'
  | 'syndicates'
  | 'roadshows'
  | 'social-calendar'
  | 'voice-notes'
  | 'whatsapp'
  | 'workflows'
  | 'hermes-agent'
  | 'media-drive'
  | 'analytics'
  | 'users'
  | 'backups'
  | 'super-admin'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  contactCount: number;
  onLogout?: () => void;
  brandName?: string;
  brandLogo?: string;
  selectedTenant?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  contactCount,
  onLogout,
  brandName = 'Outcrop Silver Corp',
  brandLogo,
  selectedTenant,
}) => {
  const currentLogo = brandLogo || '/logo.png';
  const menuItems = [
    { id: 'contacts' as ActiveTab, label: '360° Contacts', icon: Users, badge: contactCount },
    { id: 'graph' as ActiveTab, label: 'Relationship Graph', icon: Network, highlight: true },
    { id: 'followup' as ActiveTab, label: 'Follow-up Pipeline', icon: Clock },
    { id: 'hermes-agent' as ActiveTab, label: 'CopperMind AI', icon: Bot, badge: 'Workers', highlight: true },
    { id: 'syndicates' as ActiveTab, label: 'Syndicates & Pools', icon: Users, badge: 'Pools' },
    { id: 'roadshows' as ActiveTab, label: 'Roadshows & Summits', icon: Calendar, badge: 'Events' },
    { id: 'social-calendar' as ActiveTab, label: 'Social Calendar', icon: Calendar, badge: 'IR' },
    { id: 'voice-notes' as ActiveTab, label: 'Voice Notes', icon: Mic },
    { id: 'whatsapp' as ActiveTab, label: 'WhatsApp Baileys', icon: MessageSquare, badge: 'Bot' },
    { id: 'workflows' as ActiveTab, label: 'Workflows & Rules', icon: Workflow },
    { id: 'media-drive' as ActiveTab, label: 'Repositorio & Drive IA', icon: FolderKanban, badge: 'Humunculus' },
    { id: 'users' as ActiveTab, label: 'Users & Roles', icon: Users, badge: 'RBAC' },
    { id: 'backups' as ActiveTab, label: 'Database Backups', icon: Database, badge: 'Auto' },
    { id: 'analytics' as ActiveTab, label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Branding & Theme', icon: Sliders },
  ];

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-[#1C1B1B] border-r border-white/10 flex flex-col justify-between p-4 z-40 shrink-0 select-none">
      {/* Top Header & Official Company Logo */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2 py-2 border-b border-white/10 group relative">
          <input
            type="file"
            id="sidebar-logo-file-input"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('file', file);
              try {
                const res = await fetch('/api/admin/tenants/upload-logo', {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                if (data.success && data.logoUrl) {
                  localStorage.setItem('crm_brand_logo', data.logoUrl);
                  window.location.reload();
                } else {
                  alert(data.error || 'Error al subir el logo');
                }
              } catch (err) {
                alert('Error al conectar con el servidor.');
              }
            }}
          />
          <div
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-lg hover:bg-white/[0.06] transition-all duration-150 w-full min-w-0"
            onClick={() => document.getElementById('sidebar-logo-file-input')?.click()}
            title="Haz clic para cambiar el logo corporativo"
          >
            <img
              src={currentLogo}
              alt="Brand Logo"
              className="h-8 w-auto object-contain brightness-0 invert transition-transform duration-200 hover:scale-105 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider leading-tight truncate">
                {selectedTenant?.name || brandName}
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-primary)] font-semibold uppercase tracking-widest leading-none mt-0.5">
                CORE CRM v2.1
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items List with Overlap Prevention & Dynamic Brand Accents */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ease-out cursor-pointer text-left ${
                  isActive
                    ? 'active-tab-glow font-semibold'
                    : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white hover:translate-x-1 border-l-2 border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[var(--accent-primary)]' : 'text-neutral-500 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider shrink-0 ml-auto ${
                      isActive
                        ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                        : 'bg-white/5 border border-white/10 text-neutral-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Actions Footer */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.97] text-neutral-300 text-xs font-medium transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión Segura</span>
          </button>
        )}
        <div className="text-[10px] font-mono text-neutral-500 text-center tracking-wider uppercase truncate">
          POWERED BY I2 SERVICES S.A.S.
        </div>
      </div>
    </aside>
  );
};
