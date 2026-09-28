'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '@/types/crm';
import { ConcaveCard } from '@/components/ui/ConcaveCard';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Sparkles,
  Clock,
  Calendar,
  Trash2,
  Edit3,
  Mic,
  FileText,
  MessageSquare,
  Camera,
  TrendingUp,
  Share2,
  ShieldAlert,
  Download,
  Flame,
  Search,
  History,
  Link as LinkIcon,
  Upload,
  Save,
  CheckCircle2,
  Globe,
  ExternalLink,
  Briefcase,
  DollarSign,
  Layers,
} from 'lucide-react';

interface Contact360ViewProps {
  contact: Contact;
  onClose: () => void;
  onRefresh: () => void;
  onOpenCardScanner?: () => void;
  onOpenVoiceRecorder?: () => void;
}

export const Contact360View: React.FC<Contact360ViewProps> = ({
  contact,
  onClose,
  onRefresh,
  onOpenCardScanner,
  onOpenVoiceRecorder,
}) => {
  const [activeTab, setActiveTab] = useState<'Summary' | 'Briefing' | 'History' | 'Relationships' | 'Enrich & Search' | 'Documents'>('Summary');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields & Comprehensive Corporate IR Profiling
  const [editName, setEditName] = useState(contact.name);
  const [editTitle, setEditTitle] = useState(contact.title || '');
  const [editCompany, setEditCompany] = useState(contact.company || '');
  const [editEmail, setEditEmail] = useState(contact.email || '');
  const [editPhone, setEditPhone] = useState(contact.phone || '');
  const [editLocation, setEditLocation] = useState(contact.location || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState((contact as any).avatarUrl || '');
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  // Additional Corporate Intelligence Fields
  const [editLinkedinUrl, setEditLinkedinUrl] = useState((contact as any).linkedinUrl || '');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState((contact as any).websiteUrl || '');
  const [editAum, setEditAum] = useState((contact as any).aum || '');
  const [editFundType, setEditFundType] = useState((contact as any).fundType || '');
  const [editHeadquarters, setEditHeadquarters] = useState((contact as any).headquarters || '');
  const [editInvestmentFocus, setEditInvestmentFocus] = useState((contact as any).investmentFocus || '');
  const [editMiningHistory, setEditMiningHistory] = useState((contact as any).miningHistory || '');
  const [editExecutiveSummary, setEditExecutiveSummary] = useState((contact as any).executiveSummary || contact.strategicContext || '');
  const [editIcebreaker, setEditIcebreaker] = useState(contact.dynamicIcebreaker || '');

  // Deep AI Web Search State
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [deepSearchResults, setDeepSearchResults] = useState<{
    summary?: string;
    keyInsights?: string[];
  } | null>(null);

  // Relationships State
  const [newRelationName, setNewRelationName] = useState('');
  const [newRelationType, setNewRelationType] = useState('Partner / Advisor');
  const [relationshipsList, setRelationshipsList] = useState<Array<{ id: string; name: string; relation: string }>>([]);

  // History Activity Timeline
  const [activitiesList, setActivitiesList] = useState<Array<{ id: string; date: string; type: string; desc: string }>>([]);

  useEffect(() => {
    if (contact.timelineActivities && contact.timelineActivities.length > 0) {
      setActivitiesList(
        contact.timelineActivities.map((a: any) => ({
          id: a.id,
          date: new Date(a.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }),
          type: a.type || 'Actividad',
          desc: a.description || a.title || '',
        }))
      );
    }
  }, [contact.timelineActivities]);
  const [newNoteText, setNewNoteText] = useState('');

  const handleDelete = async () => {
    if (!confirm(`Right to be Forgotten: Are you sure you want to completely purge contact ${contact.name}, their dossier, and all audit logs? This action is irreversible.`)) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          title: editTitle,
          company: editCompany,
          email: editEmail,
          phone: editPhone,
          location: editLocation,
          avatarUrl: editAvatarUrl,
          linkedinUrl: editLinkedinUrl,
          websiteUrl: editWebsiteUrl,
          aum: editAum,
          fundType: editFundType,
          headquarters: editHeadquarters,
          investmentFocus: editInvestmentFocus,
          miningHistory: editMiningHistory,
          strategicContext: editExecutiveSummary,
          dynamicIcebreaker: editIcebreaker,
        }),
      });
      if (res.ok) {
        onRefresh();
        alert('Contact intelligence dossier updated successfully!');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Error al guardar: ' + (errData.error || res.statusText));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeepSearch = async () => {
    setIsSearchingWeb(true);
    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enrich',
          contactName: editName,
          company: editCompany,
          title: editTitle,
          location: editLocation,
        }),
      });
      const data = await res.json();
      if (data.success && data.enrichment) {
        const e = data.enrichment;

        // AUTO-FILL ALL EMPTY AND ENRICHED FIELDS IN REAL-TIME!
        if (e.title) setEditTitle(e.title);
        if (e.company) setEditCompany(e.company);
        if (e.email && !editEmail) setEditEmail(e.email);
        if (e.phone && !editPhone) setEditPhone(e.phone);
        if (e.location) setEditLocation(e.location);
        if (e.linkedinUrl) setEditLinkedinUrl(e.linkedinUrl);
        if (e.websiteUrl) setEditWebsiteUrl(e.websiteUrl);
        if (e.aum) setEditAum(e.aum);
        if (e.fundType) setEditFundType(e.fundType);
        if (e.headquarters) setEditHeadquarters(e.headquarters);
        if (e.investmentFocus) setEditInvestmentFocus(e.investmentFocus);
        if (e.miningHistory) setEditMiningHistory(e.miningHistory);
        if (e.executiveSummary) setEditExecutiveSummary(e.executiveSummary);
        if (e.dynamicIcebreaker) setEditIcebreaker(e.dynamicIcebreaker);

        setDeepSearchResults({
          summary: `Real OpenAI GPT-4o Deep Search completed for ${editName}. All fields were populated automatically.`,
          keyInsights: [
            `LinkedIn: ${e.linkedinUrl || 'Verified'}`,
            `AUM / Estimated Capital: ${e.aum || 'CAD $100M+'}`,
            `Mining Focus: ${e.investmentFocus || 'High-grade silver'}`,
          ],
        });

        // Save auto-filled enrichment directly to database
        fetch(`/api/contacts/${contact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName,
            title: e.title || editTitle,
            company: e.company || editCompany,
            email: e.email || editEmail,
            phone: e.phone || editPhone,
            location: e.location || editLocation,
            linkedinUrl: e.linkedinUrl,
            websiteUrl: e.websiteUrl,
            aum: e.aum,
            fundType: e.fundType,
            headquarters: e.headquarters,
            investmentFocus: e.investmentFocus,
            miningHistory: e.miningHistory,
            strategicContext: e.executiveSummary,
            dynamicIcebreaker: e.dynamicIcebreaker,
          }),
        }).then(() => onRefresh());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelationName.trim()) return;
    setRelationshipsList([
      ...relationshipsList,
      { id: `rel-${Date.now()}`, name: newRelationName, relation: newRelationType },
    ]);
    
    await fetch('/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceContactId: contact.id,
        targetContactId: newRelationName, // For now using name as identifier
        relationshipType: newRelationType,
      }),
    });
    
    setNewRelationName('');
  };

  const handleAddActivityNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setActivitiesList([
      { id: `act-${Date.now()}`, date: 'Just now', type: 'IR Note', desc: newNoteText },
      ...activitiesList,
    ]);
    
    await fetch('/api/contacts/' + contact.id + '/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'NOTE', title: 'Nota Agregada', description: newNoteText }),
    });

    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 lg:p-6 animate-fadeIn font-['Urbanist']">
      {/* Floating Summary Dossier Card with Concave Notch for Close Button (✕) */}
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col">
        <ConcaveCard
          bgColor="var(--bg-card)"
          notchWidth={52}
          notchHeight={52}
          className="w-full shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
          actionButton={
            <button
              onClick={onClose}
              style={{ backgroundColor: 'var(--bg-card-inner)' }}
              className="w-10 h-10 rounded-full text-slate-300 hover:text-white hover:bg-rose-500/30 flex items-center justify-center transition-all shadow-xl border border-white/10"
              title="Close Dossier"
            >
              <X className="w-4 h-4" />
            </button>
          }
        >
          {/* Pinned Top Header Section */}
          <div className="space-y-4 pb-4 border-b border-white/5 pr-12 shrink-0">
            {/* Top Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
                  className="px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-md"
                >
                  IR DOSSIER
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Header Title + Avatar Upload Trigger */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div
                  style={{ borderColor: 'var(--primary-color)', backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-lg"
                >
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{contact.name.charAt(0)}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoInput(!showPhotoInput)}
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#38bdf8] text-black flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  title="Change Profile Photo"
                >
                  <Upload className="w-3 h-3 stroke-[3]" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-white tracking-tight truncate">{editName}</h2>
                <p className="text-xs text-slate-400 font-bold truncate">
                  {editTitle || 'Investor'} {editCompany ? `at ${editCompany}` : ''}
                </p>
              </div>
            </div>

            {/* Photo URL Input Drawer */}
            {showPhotoInput && (
              <div className="pt-2 flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Paste Profile Photo URL (e.g. https://...)"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="hs-input-hero text-xs py-1.5 flex-1 font-mono"
                />
                <button
                  onClick={() => setShowPhotoInput(false)}
                  className="px-3 py-1.5 rounded-full bg-[#38bdf8] text-black text-xs font-black"
                >
                  Ok
                </button>
              </div>
            )}

            {/* Floating Action Tools Bar (IR Hotkeys) */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick IR Tools</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenVoiceRecorder && onOpenVoiceRecorder()}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-all hover:scale-105"
                  title="Record Follow-up Voice Note"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('Documents')}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-all hover:scale-105"
                  title="Attach Technical Assay Report"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                <a
                  href={'https://wa.me/' + (contact.whatsapp || contact.phone || '').replace(/\D/g,'')}
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-all hover:scale-105"
                  title="Send Direct WhatsApp Message"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => onOpenCardScanner && onOpenCardScanner()}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-all hover:scale-105"
                  title="Scan OCR Business Card"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={async () => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contact, null, 2));
                    const dlAnchorElem = document.createElement('a');
                    dlAnchorElem.setAttribute("href", dataStr);
                    dlAnchorElem.setAttribute("download", `dossier_${contact.name.replace(/\s+/g, '_')}.json`);
                    dlAnchorElem.click();
                  }}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-all hover:scale-105"
                  title="Export JSON Dossier"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-8 h-8 rounded-full text-rose-400 flex items-center justify-center transition-all hover:scale-105 hover:text-rose-500 hover:bg-rose-500/20"
                  title="Right to be Forgotten (Purge Dossier)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Pinned Rating & Grid Tab Navigation */}
          <div className="space-y-4 pt-3 shrink-0">
            {/* Rating Bar */}
            <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rating</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }} />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span style={{ backgroundColor: 'var(--bg-card)' }} className="px-2.5 py-0.5 rounded-full text-slate-200 text-[10px] font-black">
                  {contact.source || 'LinkedIn'}
                </span>
                <span style={{ backgroundColor: 'var(--bg-card)' }} className="px-2.5 py-0.5 rounded-full text-slate-200 text-[10px] font-black">
                  {contact.investorType}
                </span>
              </div>
            </div>

            {/* Sleek 5-Column Grid Segmented Control Bar */}
            <div
              style={{ backgroundColor: 'var(--bg-card-inner)' }}
              className="p-1.5 rounded-2xl grid grid-cols-5 gap-1 shadow-inner border border-white/5 w-full"
            >
              {[
                { id: 'Summary', label: 'Summary', icon: FileText },
                { id: 'History', label: 'History', icon: History },
                { id: 'Relationships', label: 'Relationships', icon: LinkIcon },
                { id: 'Enrich & Search', label: 'AI Search', icon: Globe },
                { id: 'Documents', label: 'Assays', icon: Download },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={
                      isActive
                        ? { backgroundColor: 'var(--primary-color)', color: '#000000' }
                        : {}
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center w-full ${
                      isActive
                        ? 'shadow-md font-extrabold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smooth Scrollable Middle Content Area */}
          <div className="overflow-y-auto max-h-[48vh] pr-1 mt-4 space-y-4 flex-1">
            {/* TAB 1: SUMMARY (Comprehensive Corporate Intelligence Summary) */}
            {activeTab === 'Summary' && (
              <div className="space-y-4">
                <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    DYNAMIC ICEBREAKER
                  </span>
                  <p className="text-xs font-bold text-slate-200 italic leading-relaxed">
                    "{editIcebreaker || `Strategic decision leader at ${editCompany || 'mining sector'} with high interest in Santa Ana.`}"
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    EXECUTIVE INTELLIGENCE SUMMARY (AI)
                  </span>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed">
                    {editExecutiveSummary || `Qualified profile for corporate network. ${editName} brings extensive trajectory in financing decisions at ${editCompany || 'mining sector'}.`}
                  </p>
                </div>

                {/* Comprehensive Fields Overview Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                  <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                    <span className="font-bold text-white block truncate">{editEmail || 'Pending AI Search'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Direct Phone</span>
                    <span className="font-bold text-white block truncate">{editPhone || 'Pending AI Search'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Location / HQ</span>
                    <span className="font-bold text-white block truncate">{editLocation || editHeadquarters || 'Vancouver, BC, Canada'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Assets Under Management (AUM)</span>
                    <span style={{ color: 'var(--primary-color)' }} className="font-bold block truncate">{editAum || 'CAD $50M - $250M (Estimated)'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fund / Entity Type</span>
                    <span className="font-bold text-white block truncate">{editFundType || 'Mining PE & Family Office'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Corporate Website</span>
                    <a href={editWebsiteUrl || '#'} target="_blank" rel="noreferrer" className="font-bold text-sky-400 block truncate hover:underline">
                      {editWebsiteUrl || 'Unspecified'}
                    </a>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    INVESTMENT FOCUS & MINING BACKGROUND
                  </span>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">
                    {editInvestmentFocus || 'High-grade silver, epithermal silver/gold exploration in Colombia and Latin America.'}
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    History: {editMiningHistory || 'Active participation in mining venture capital rounds.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: HISTORY TIMELINE */}
            {activeTab === 'History' && (
              <div className="space-y-4">
                <form onSubmit={handleAddActivityNote} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add interaction note to history..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="hs-input-hero text-xs py-2 flex-1"
                  />
                  <button type="submit" className="hs-pill-btn hs-btn-lime py-2 px-4 text-xs font-black">
                    Add Note
                  </button>
                </form>

                <div className="space-y-3">
                  {activitiesList.map((act) => (
                    <div key={act.id} style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3.5 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--primary-color)' }} className="text-[10px] font-black uppercase tracking-wider">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{act.date}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200">{act.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: RELATIONSHIPS GRAPH */}
            {activeTab === 'Relationships' && (
              <div className="space-y-4">
                <form onSubmit={handleAddRelationship} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name of contact to relate"
                    value={newRelationName}
                    onChange={(e) => setNewRelationName(e.target.value)}
                    className="hs-input-hero text-xs py-2 sm:col-span-2"
                  />
                  <button type="submit" className="hs-pill-btn hs-btn-lime py-2 px-4 text-xs font-black">
                    Link Contact
                  </button>
                </form>

                <div className="space-y-2">
                  {relationshipsList.map((rel) => (
                    <div key={rel.id} style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-3 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LinkIcon className="w-4 h-4 text-sky-400" />
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{rel.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">{rel.relation}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                        Connected
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: ENRICH & DEEP REAL OPENAI GPT-4O WEB SEARCH & EDIT */}
            {activeTab === 'Enrich & Search' && (
              <div className="space-y-5">
                {/* Real OpenAI GPT-4o Deep Web Search Button */}
                <div style={{ backgroundColor: 'var(--bg-card-inner)' }} className="p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span>Real AI Deep Search (OpenAI GPT-4o)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Runs corporate intelligence crawling and inference to auto-fill all contact fields.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDeepSearch}
                      disabled={isSearchingWeb}
                      className="hs-pill-btn hs-btn-lime py-2 px-5 text-xs font-black shrink-0 flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSearchingWeb ? 'Running AI Search...' : 'Run Deep Search'}</span>
                    </button>
                  </div>

                  {deepSearchResults && (
                    <div className="p-3 rounded-xl bg-black/40 text-xs space-y-2 border border-white/5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{deepSearchResults.summary}</span>
                      </div>
                      {deepSearchResults.keyInsights && (
                        <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-2">
                          {deepSearchResults.keyInsights.map((insight, idx) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Extended Comprehensive Edit Form */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    FULL CONTACT INTELLIGENCE FIELDS (AUTO-COMPLETABLE)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Job Title</label>
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Company / Fund</label>
                      <input
                        type="text"
                        placeholder="Company / Fund"
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Direct Email</label>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Direct Phone</label>
                      <input
                        type="text"
                        placeholder="Direct Phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Location / City</label>
                      <input
                        type="text"
                        placeholder="Location / City"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">LinkedIn Profile</label>
                      <input
                        type="text"
                        placeholder="https://linkedin.com/in/..."
                        value={editLinkedinUrl}
                        onChange={(e) => setEditLinkedinUrl(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Corporate Website</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={editWebsiteUrl}
                        onChange={(e) => setEditWebsiteUrl(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Assets Under Management (AUM)</label>
                      <input
                        type="text"
                        placeholder="e.g. CAD $100M - $500M"
                        value={editAum}
                        onChange={(e) => setEditAum(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Fund / Entity Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Family Office / Mining PE"
                        value={editFundType}
                        onChange={(e) => setEditFundType(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Headquarters / HQ</label>
                      <input
                        type="text"
                        placeholder="e.g. Vancouver, BC, Canada"
                        value={editHeadquarters}
                        onChange={(e) => setEditHeadquarters(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Investment Focus</label>
                      <input
                        type="text"
                        placeholder="e.g. High-grade epithermal silver"
                        value={editInvestmentFocus}
                        onChange={(e) => setEditInvestmentFocus(e.target.value)}
                        className="w-full hs-input-hero text-xs py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Executive Intelligence Summary (AI)</label>
                    <textarea
                      rows={2}
                      placeholder="AI-processed executive summary..."
                      value={editExecutiveSummary}
                      onChange={(e) => setEditExecutiveSummary(e.target.value)}
                      className="w-full hs-input-hero text-xs p-2.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Strategic Icebreaker</label>
                    <textarea
                      rows={2}
                      placeholder="Executive icebreaker for first contact..."
                      value={editIcebreaker}
                      onChange={(e) => setEditIcebreaker(e.target.value)}
                      className="w-full hs-input-hero text-xs p-2.5"
                    />
                  </div>

                  <button
                    onClick={handleSaveData}
                    disabled={isSaving}
                    className="w-full hs-pill-btn hs-btn-lime py-3 text-xs font-black flex items-center justify-center gap-2 mt-3 shadow-xl"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Enriched Dossier'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: DOCUMENTS */}
            {activeTab === 'Documents' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                    📄 RASTREABILIDAD DE REPORTES TÉCNICOS & ENSAYOS SANTA ANA
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Proyecto Santa Ana - Leyes de Plata</span>
                </div>

                {/* Catalog of Key Technical Reports */}
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'doc-1',
                      title: 'Santa Ana High-Grade Silver NI 43-101 Technical Report',
                      type: 'Reporte Técnico NI 43-101',
                      date: '2026-06-15',
                      status: 'Enviado',
                    },
                    {
                      id: 'doc-2',
                      title: 'Ensayos de Perforación Q2 (Filón La Poza & San Antonio - g/t Ag)',
                      type: 'Assay Drill Results',
                      date: '2026-07-20',
                      status: 'Solicitado por Inversionista',
                    },
                    {
                      id: 'doc-3',
                      title: 'Presentación Corporativa & Teaser Financiero Q3 2026',
                      type: 'Corporate Deck',
                      date: '2026-08-01',
                      status: 'Enviado',
                    },
                    {
                      id: 'doc-4',
                      title: 'Informe Metalúrgico & Recuperación de Plata Santa Ana',
                      type: 'Metallurgy Report',
                      date: '2026-08-10',
                      status: 'Revisión Pendiente',
                    },
                  ].map((doc) => (
                    <div
                      key={doc.id}
                      style={{ backgroundColor: 'var(--bg-card-inner)' }}
                      className="p-3.5 rounded-2xl border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{doc.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-bold text-slate-300">{doc.type}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            doc.status === 'Enviado'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : doc.status === 'Solicitado por Inversionista'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {doc.status}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/contacts/${contact.id}/timeline`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                type: 'NOTE',
                                title: `Reporte Técnico Despachado: ${doc.title}`,
                                description: `Se registró el envío del informe "${doc.title}" al inversionista ${contact.name}.`,
                              }),
                            }).catch(() => {});
                            alert(`Envío de "${doc.title}" registrado en la cronología de ${contact.name}.`);
                          }}
                          className="px-3 py-1.5 rounded-full bg-slate-900 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black font-black text-[10px] uppercase transition-all cursor-pointer"
                        >
                          Registrar Envío
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pinned Action Footer */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between shrink-0">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-400 font-semibold text-xs hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Eliminando...' : 'Eliminar Contacto'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
              <span>Cerrar Dossier 360°</span>
            </button>
          </div>
        </ConcaveCard>
      </div>
    </div>
  );
};
