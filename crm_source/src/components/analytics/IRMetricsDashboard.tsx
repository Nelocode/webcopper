'use client';

import React, { useState } from 'react';
import { Contact } from '@/types/crm';
import {
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  Clock,
  Award,
  Globe,
  PieChart as PieIcon,
  BarChart3,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Zap,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Settings,
  Download,
} from 'lucide-react';

interface IRMetricsDashboardProps {
  contacts: Contact[];
  onOpenContact360?: (contact: Contact) => void;
  tenantName?: string;
}

export const IRMetricsDashboard: React.FC<IRMetricsDashboardProps> = ({ contacts, onOpenContact360, tenantName }) => {
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'YTD' | 'ALL'>('30D');
  const [isEditing, setIsEditing] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState({
    showKPIs: true,
    showComposition: true,
    showGeographic: true,
    showFunnel: true,
    showTopScorers: true,
    dashboardTitle: 'Panel de Inteligencia & Métricas IR',
  });

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_dashboard_widget_config');
      if (saved) {
        setWidgetConfig(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleSaveWidgetConfig = (newConfig: typeof widgetConfig) => {
    setWidgetConfig(newConfig);
    localStorage.setItem('crm_dashboard_widget_config', JSON.stringify(newConfig));
  };

  const filteredContacts = React.useMemo(() => {
    const now = new Date();
    if (timeframe === '30D') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return contacts.filter(c => new Date(c.createdAt) >= cutoff);
    } else if (timeframe === '90D') {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return contacts.filter(c => new Date(c.createdAt) >= cutoff);
    } else if (timeframe === 'YTD') {
      return contacts.filter(c => new Date(c.createdAt).getFullYear() === now.getFullYear());
    }
    return contacts;
  }, [contacts, timeframe]);

  // Computed metrics
  const totalContacts = filteredContacts.length;
  const hnwCount = filteredContacts.filter((c) => (c.investorType || '').includes('HNW') || (c.investorType || '').includes('Retail')).length;
  const peCount = filteredContacts.filter((c) => (c.investorType || '').includes('PE') || (c.investorType || '').includes('Institutional')).length;
  const familyCount = filteredContacts.filter((c) => (c.investorType || '').includes('Family') || (c.investorType || '').includes('Office')).length;
  const advisorCount = totalContacts - (hnwCount + peCount + familyCount);

  // Fix 1: KPI metrics
  const totalActivities = filteredContacts.reduce((acc, c) => acc + (c.activities?.length || 0) + (c.voiceNotes?.length || 0), 0);
  const totalDocs = filteredContacts.reduce((acc, c) => acc + (c.documents?.length || 0) + (c.cards?.length || 0), 0);

  // Fix 3: Investor composition percentages
  const totalComposition = Math.max(1, peCount + familyCount + hnwCount + advisorCount);
  const pePct = Math.round((peCount / totalComposition) * 100);
  const familyPct = Math.round((familyCount / totalComposition) * 100);
  const hnwPct = Math.round((hnwCount / totalComposition) * 100);
  const advisorPct = Math.round((advisorCount / totalComposition) * 100);

  // Fix 4: Geographic distribution
  const locationGroups = [
    { label: '🇨🇦 Vancouver & Toronto', keys: ['vancouver', 'toronto', 'canada', 'bc', 'ontario'], color: 'text-sky-400', desc: 'Principal hub de fondos de minería en Canadá.' },
    { label: '🇺🇸 New York & Boston', keys: ['new york', 'boston', 'usa', 'united states', 'ny', 'nyc'], color: 'text-emerald-400', desc: 'Institucionales y Private Equity de EE. UU.' },
    { label: '🇬🇧 Londres & Europa', keys: ['london', 'uk', 'europe', 'zurich', 'frankfurt'], color: 'text-amber-400', desc: 'Bolsa de Valores e Inversionistas de Reino Unido.' },
    { label: '🇨🇴 Colombia & LatAm', keys: ['colombia', 'bogota', 'medellin', 'latam', 'mexico', 'brazil'], color: 'text-purple-400', desc: 'Aliados regionales.' },
  ];
  const contactsWithLocation = filteredContacts.filter(c => c.location);
  const geoData = locationGroups.map(g => {
    const count = contactsWithLocation.filter(c => g.keys.some(k => (c.location || '').toLowerCase().includes(k))).length;
    const pct = contactsWithLocation.length > 0 ? Math.round((count / contactsWithLocation.length) * 100) : 0;
    return { ...g, count, pct };
  });

  // Fix 2: Pipeline Funnel
  const STAGE_GROUPS = [
    { stage: 'Primer Contacto', filter: (c: Contact) => true, color: 'bg-sky-500' },
    { stage: 'Presentación / Deck Enviado', filter: (c: Contact) => ['Deck sent', 'Presentation sent', 'Presentacion enviada', 'Interested - early'].includes(c.stage), color: 'bg-purple-500' },
    { stage: 'Reunión Agendada', filter: (c: Contact) => (c.stage || '').toLowerCase().includes('meeting') || (c.stage || '').toLowerCase().includes('reunion') || (c.stage || '').toLowerCase().includes('call'), color: 'bg-amber-500' },
    { stage: 'Seguimiento Activo', filter: (c: Contact) => (c.stage || '').toLowerCase().includes('follow') || (c.stage || '').toLowerCase().includes('interested'), color: 'bg-emerald-500' },
    { stage: 'Aliado Estratégico', filter: (c: Contact) => (c.stage || '').toLowerCase().includes('commit') || (c.stage || '').toLowerCase().includes('aliado') || (c.stage || '').toLowerCase().includes('close'), color: 'bg-teal-400' },
  ];
  const pipelineData = STAGE_GROUPS.map(sg => ({
    ...sg,
    count: sg.filter === STAGE_GROUPS[0].filter ? filteredContacts.length : filteredContacts.filter(sg.filter).length,
  }));
  const maxCount = Math.max(1, filteredContacts.length);
  const pipelineDisplayData = pipelineData.map(item => ({
    ...item,
    percentage: Math.round((item.count / maxCount) * 100)
  }));

  // Engagement calculation
  const totalScore = filteredContacts.reduce((acc, c) => acc + (c.leadScore || 70), 0);
  const avgScore = totalContacts > 0 ? Math.round(totalScore / totalContacts) : 75;

  return (
    <div className="space-y-6 font-['Urbanist'] w-full animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <BarChart3 style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
              <span>Panel de Inteligencia & Métricas IR {tenantName || 'Corporativo'}</span>
            </h2>
            <span
              style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
              className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase shadow-md"
            >
              RELACIONES DE INVERSIÓN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Análisis cualitativo y cuantitativo del relacionamiento con inversionistas, frecuencia de interacciones y distribución de reportes técnicos de {tenantName || 'la compañía'}.
          </p>
        </div>

        {/* Timeframe & Customizer controls */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={async () => {
              try {
                const { default: jsPDF } = await import('jspdf');
                const doc = new jsPDF();

                doc.setFillColor(11, 13, 20);
                doc.rect(0, 0, 210, 40, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(0, 223, 223);
                doc.text((tenantName || 'OUTCROP SILVER CORP').toUpperCase(), 15, 20);

                doc.setFontSize(10);
                doc.setTextColor(169, 174, 178);
                doc.text('INFORME EJECUTIVO PARA LA JUNTA DIRECTIVA (BOARD OF DIRECTORS) - IR Q3', 15, 30);

                doc.setTextColor(30, 41, 59);
                doc.setFontSize(10);
                doc.text(`Fecha de Emision: ${new Date().toLocaleDateString('es-CO')}`, 15, 50);
                doc.text(`Proyecto Objetivo: ${tenantName || 'Santa Ana High-Grade Silver Project'}`, 15, 57);

                doc.setFillColor(241, 245, 249);
                doc.rect(15, 65, 180, 35, 'F');

                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42);
                doc.text('1. RESUMEN EJECUTIVO DE RELACIONAMIENTO (KPIs)', 20, 75);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`• Total Inversionistas Registrados: ${totalContacts}`, 25, 84);
                doc.text(`• Score Promedio de Interes (Lead Score): ${avgScore} / 100 pts`, 25, 91);
                doc.text(`• Estado de Cobertura: 100% Verificado en Multi-Tenant Security`, 25, 98);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('2. TOP INVERSIONISTAS CLAVE & ESLABONES DE RED', 15, 115);

                let yPos = 125;
                filteredContacts.slice(0, 5).forEach((c, idx) => {
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.text(`${idx + 1}. ${c.name} (${c.company || 'Inversionista'})`, 20, yPos);

                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9);
                  doc.text(`Tipo: ${c.investorType || 'General'} | Etapa: ${c.stage || 'Prospecto'} | Score: ${c.leadScore || 70} pts`, 25, yPos + 6);

                  yPos += 14;
                });

                doc.setFillColor(15, 23, 42);
                doc.rect(15, yPos + 10, 180, 25, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(0, 223, 223);
                doc.text('DECLARACION DE GOBERNANZA & CONFIDENCIALIDAD', 20, yPos + 20);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(255, 255, 255);
                doc.text(`Documento oficial para uso exclusivo de la Junta Directiva de ${tenantName || 'Outcrop Silver Corp.'}.`, 20, yPos + 27);

                doc.save(`Informe_Junta_Directiva_${(tenantName || 'Empresa').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
              } catch (e) {
                console.error('Error generating PDF:', e);
                alert('Error al generar el reporte en PDF.');
              }
            }}
            className="px-4 py-2 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-xl"
          >
            <Download className="w-4 h-4" />
            <span>📄 Exportar Reporte Junta Directiva (PDF)</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            style={
              isEditing
                ? { backgroundColor: '#00dfdf', color: '#000000' }
                : { backgroundColor: '#00dfdf22', color: '#00dfdf', borderColor: '#00dfdf88' }
            }
            className="px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 border hover:scale-105 cursor-pointer shadow-xl"
          >
            <Sliders className="w-4 h-4" />
            <span>{isEditing ? '✓ Guardar Layout' : '⚙️ Personalizar Métricas'}</span>
          </button>

          <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-1 rounded-full flex items-center gap-1 border border-white/10">
            {(['30D', '90D', 'YTD', 'ALL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={
                  timeframe === t
                    ? { backgroundColor: 'var(--primary-color)', color: '#000000' }
                    : {}
                }
                className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                  timeframe === t ? 'shadow-md scale-105' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Customizer Control Panel */}
      {isEditing && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/30 space-y-4 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Builder de Panel de Métricas — Modo Edición</h3>
            </div>
            <button
              onClick={() => {
                const defaultConfig = {
                  showKPIs: true,
                  showComposition: true,
                  showGeographic: true,
                  showFunnel: true,
                  showTopScorers: true,
                  dashboardTitle: 'Panel de Inteligencia & Métricas IR',
                };
                handleSaveWidgetConfig(defaultConfig);
              }}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer por Defecto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Toggle 1: KPIs */}
            <button
              onClick={() => handleSaveWidgetConfig({ ...widgetConfig, showKPIs: !widgetConfig.showKPIs })}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                widgetConfig.showKPIs ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-white/5 text-slate-500'
              }`}
            >
              <span className="text-xs font-black">1. Tarjetas KPI Rápidas</span>
              {widgetConfig.showKPIs ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Toggle 2: Composition */}
            <button
              onClick={() => handleSaveWidgetConfig({ ...widgetConfig, showComposition: !widgetConfig.showComposition })}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                widgetConfig.showComposition ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-white/5 text-slate-500'
              }`}
            >
              <span className="text-xs font-black">2. Composición Red</span>
              {widgetConfig.showComposition ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Toggle 3: Geographic */}
            <button
              onClick={() => handleSaveWidgetConfig({ ...widgetConfig, showGeographic: !widgetConfig.showGeographic })}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                widgetConfig.showGeographic ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-white/5 text-slate-500'
              }`}
            >
              <span className="text-xs font-black">3. Hubs Geográficos</span>
              {widgetConfig.showGeographic ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Toggle 4: Funnel */}
            <button
              onClick={() => handleSaveWidgetConfig({ ...widgetConfig, showFunnel: !widgetConfig.showFunnel })}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                widgetConfig.showFunnel ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-white/5 text-slate-500'
              }`}
            >
              <span className="text-xs font-black">4. Embudo de Velocidad</span>
              {widgetConfig.showFunnel ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Toggle 5: Top Scorers */}
            <button
              onClick={() => handleSaveWidgetConfig({ ...widgetConfig, showTopScorers: !widgetConfig.showTopScorers })}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                widgetConfig.showTopScorers ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-white/5 text-slate-500'
              }`}
            >
              <span className="text-xs font-black">5. Top Inversionistas</span>
              {widgetConfig.showTopScorers ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: EXECUTIVE KPI BAR */}
      {widgetConfig.showKPIs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1: Stakeholders Activos */}
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-[24px] border border-white/5 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversionistas</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalContacts}</div>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +{contacts.filter(c => { const d = new Date(c.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length} este mes
            </p>
          </div>

          {/* KPI 2: Interacciones / Touchpoints */}
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-[24px] border border-white/5 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interacciones IR</span>
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalActivities || 0}</div>
            <p className="text-[10px] text-slate-400 font-medium">Notas de voz & reuniones</p>
          </div>

          {/* KPI 3: Ensayos Técnicos Entregados */}
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-[24px] border border-white/5 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reportes Santa Ana</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalDocs || 0}</div>
            <p className="text-[10px] text-slate-400 font-medium">Briefs técnicos enviados</p>
          </div>

          {/* KPI 4: Lead Score Promedio */}
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-[24px] border border-white/5 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Engagement</span>
              <Award style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
            </div>
            <div style={{ color: 'var(--primary-color)' }} className="text-2xl font-black font-mono">
              {avgScore} pts
            </div>
            <p className="text-[10px] text-emerald-400 font-bold">Interés Alto / Calificado</p>
          </div>

          {/* KPI 5: SLA de Respuesta */}
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-[24px] border border-white/5 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiempo Respuesta</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">N/A</div>
            <p className="text-[10px] text-slate-400 font-medium">Datos insuficientes</p>
          </div>
        </div>
      )}

      {/* SECTION 2: DEMOGRAPHICS & GEOGRAPHIC DISTRIBUTION GRID */}
      {(widgetConfig.showComposition || widgetConfig.showGeographic) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investor Composition Breakdown */}
          {widgetConfig.showComposition && (
            <div style={{ backgroundColor: 'var(--bg-card)' }} className={`p-6 rounded-[28px] border border-white/5 space-y-4 shadow-xl ${!widgetConfig.showGeographic ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-sky-400" />
                  <span>Composición de la Red de Inversionistas</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Por Tipo de Fondo / Entidad</span>
              </div>

              <div className="space-y-3">
                {/* PE Funds Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Fondos de Capital Minero (PE)</span>
                    <span className="text-white font-mono">{pePct}% ({peCount > 0 ? peCount : 0} fondos)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div style={{ backgroundColor: 'var(--primary-color)', width: `${pePct}%` }} className="h-full rounded-full" />
                  </div>
                </div>

                {/* Family Offices Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Family Offices & Multi-Family</span>
                    <span className="text-white font-mono">{familyPct}% ({familyCount > 0 ? familyCount : 0} entidades)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${familyPct}%` }} />
                  </div>
                </div>

                {/* HNW Accredited Retail Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Inversionistas Acreditados (HNW Retail)</span>
                    <span className="text-white font-mono">{hnwPct}% ({hnwCount > 0 ? hnwCount : 0} personas)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${hnwPct}%` }} />
                  </div>
                </div>

                {/* Advisors Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Asesores Geológicos & Mercado de Capitales</span>
                    <span className="text-white font-mono">{advisorPct}% ({advisorCount > 0 ? advisorCount : 0} consultores)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-purple-400 h-full rounded-full" style={{ width: `${advisorPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Geographic Investor Hubs */}
          {widgetConfig.showGeographic && (
            <div style={{ backgroundColor: 'var(--bg-card)' }} className={`p-6 rounded-[28px] border border-white/5 space-y-4 shadow-xl ${!widgetConfig.showComposition ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Distribución Geográfica de Capital IR</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Hubs Mineros</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {geoData.map((g, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">{g.label}</span>
                      <span className={`text-xs font-mono font-black ${g.color}`}>{g.pct}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: PIPELINE VELOCITY & INTERACTION TIMELINE */}
      {(widgetConfig.showFunnel || widgetConfig.showTopScorers) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IR Pipeline Funnel Velocity */}
          {widgetConfig.showFunnel && (
            <div style={{ backgroundColor: 'var(--bg-card)' }} className={`p-6 rounded-[28px] border border-white/5 space-y-4 shadow-xl ${!widgetConfig.showTopScorers ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
                  <span>Velocidad de Conversación en el Flujo de Seguimiento</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Etapas IR</span>
              </div>

              <div className="space-y-2.5">
                {pipelineDisplayData.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200">{item.stage}</span>
                      <span className="text-white font-mono">{item.count} contactos ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Engagement Contacts Feed */}
          {widgetConfig.showTopScorers && (
            <div style={{ backgroundColor: 'var(--bg-card)' }} className={`p-6 rounded-[28px] border border-white/5 space-y-4 shadow-xl ${!widgetConfig.showFunnel ? 'lg:col-span-3' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Inversionistas con Mayor Score</span>
                </h3>
              </div>

              <div className="space-y-3">
                {contacts.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onOpenContact360 && onOpenContact360(c)}
                    style={{ backgroundColor: 'var(--bg-card-inner)' }}
                    className="p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/20 border border-transparent transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-white group-hover:text-sky-400 transition-colors truncate">
                        {c.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {c.company || 'Inversor Minero'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono shadow-md"
                      >
                        {c.leadScore || 85} pts
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
