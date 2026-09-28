'use client';

import React from 'react';
import { Search, Shield, Sliders, LogOut } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  brandName: string;
  brandLogo: string;
  onOpenThemeSettings: () => void;
  onOpenVideoCall?: () => void;
  onOpenAgenda?: () => void;
  onOpenLogin?: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  totalContacts: number;
  tenants?: any[];
  selectedTenant?: any;
  onSelectTenant?: (tenant: any) => void;
  upcomingEvents?: Array<{ title: string; startTime: string; attendees?: any[] }>;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  brandName,
  brandLogo,
  onOpenThemeSettings,
  onOpenVideoCall,
  onOpenAgenda,
  onOpenLogin,
  searchTerm,
  setSearchTerm,
  totalContacts,
  tenants = [],
  selectedTenant,
  onSelectTenant,
  upcomingEvents,
  activeTab,
  setActiveTab,
}) => {
  const currentLogo = brandLogo || '/logo.png';

  return (
    <header className="h-16 bg-[#1C1B1B] px-6 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 w-full select-none">
      {/* Left: Master Console & Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Master Console Button */}
        {user?.role === 'SUPER_ADMIN' && onSelectTenant && (
          <button
            onClick={() => onSelectTenant(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.97] text-neutral-300 text-xs font-mono font-medium transition-all duration-150 cursor-pointer shrink-0"
            title="Volver a la Consola Maestra Super Admin"
          >
            <Shield className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Master Console</span>
          </button>
        )}

        {/* Search Input Bar */}
        <div className="relative w-full border border-white/10 rounded-lg focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/5 transition-all duration-200 bg-[#2A2A2A]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar contactos por nombre, empresa, email..."
            className="w-full pl-9 pr-4 py-1.5 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* Right: Live Status Badge, Personalize Button & User Capsule */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Minimalist Translucent LIVE Badge bound 100% to Tenant Primary Accent */}
        <div className="hidden lg:flex items-center gap-2 bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-mono text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] pulse-ring" />
          <span>LIVE</span>
        </div>

        {/* Personalize Button */}
        <button
          onClick={onOpenThemeSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.97] text-neutral-200 text-xs font-medium transition-all duration-150 cursor-pointer"
          title="Personalizar branding y colores"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="hidden sm:inline">Personalizar</span>
        </button>

        {/* User Capsule & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-white font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.1)]">
              {(user?.name || 'N').charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-bold text-white block leading-none">
                {user?.name || 'Nelson Carvajal'}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block leading-none mt-1 uppercase tracking-wider">
                {user?.role || 'ADMIN'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 active:scale-[0.97] text-neutral-400 hover:text-red-400 transition-all duration-150 cursor-pointer"
            title="Cerrar Sesión Segura"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
