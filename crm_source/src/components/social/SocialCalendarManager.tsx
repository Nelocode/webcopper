'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Tag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Columns,
  Image as ImageIcon,
  ShieldCheck,
  Search,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  Repeat,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { SocialPostModal } from './SocialPostModal';
import { SocialCategoriesModal } from './SocialCategoriesModal';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface SocialMedia {
  id: string;
  filePath: string;
  fileType: string;
  fileName: string;
  fileSize?: number;
  createdAt?: string;
  postId?: string;
}

interface SocialPost {
  id: string;
  title: string;
  content: string;
  platforms: string;
  status: string;
  categoryId?: string | null;
  scheduledDate: string;
  isRecurring?: boolean;
  recurringFrequency?: string | null;
  recurringDay?: string | null;
  hashtags?: string | null;
  category?: Category | null;
  media?: SocialMedia[];
  comments?: any[];
}

interface AuditLog {
  id: string;
  action: string;
  username: string;
  entityType: string;
  details: string;
  createdAt: string;
}

type MainTab = 'calendar' | 'gallery' | 'audit';
type ViewMode = 'monthly' | 'weekly' | 'list';
type DensityMode = 'compact' | 'full';

export interface SocialCalendarManagerProps {
  tenantId?: string;
}

export const SocialCalendarManager: React.FC<SocialCalendarManagerProps> = ({ tenantId }) => {
  // Main Navigation Sub-Tabs
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('calendar');

  // Calendar View Settings
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [densityMode, setDensityMode] = useState<DensityMode>('compact');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Data States
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<SocialMedia[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Loading States
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [selectedDefaultDate, setSelectedDefaultDate] = useState<Date | null>(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // Media Search
  const [mediaSearch, setMediaSearch] = useState('');
  const [previewMedia, setPreviewMedia] = useState<SocialMedia | null>(null);

  // Audit Filters
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const query = tenantId ? `?tenantId=${tenantId}` : '';
      const res = await fetch(`/api/social/categories${query}`);
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }, []);

  // Fetch Posts for Calendar
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month + 2, 0).toISOString();

      let url = `/api/social/posts?start_date=${start}&end_date=${end}`;
      if (tenantId) url += `&tenantId=${tenantId}`;
      if (platformFilter !== 'all') url += `&platform=${platformFilter}`;
      if (categoryFilter !== 'all') url += `&category_id=${categoryFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error('Error fetching posts:', e);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [currentDate, platformFilter, categoryFilter]);

  // Fetch Media Gallery
  const fetchMedia = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      let url = '/api/social/media';
      const params = new URLSearchParams();
      if (mediaSearch.trim()) params.append('search', mediaSearch.trim());
      if (tenantId) params.append('tenantId', tenantId);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.media && Array.isArray(data.media)) {
        setMediaList(data.media);
      }
    } catch (e) {
      console.error('Error fetching media:', e);
    } finally {
      setIsLoadingMedia(false);
    }
  }, [mediaSearch]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      let url = '/api/social/audit?';
      if (auditActionFilter) url += `action=${auditActionFilter}&`;
      if (auditEntityFilter) url += `entity_type=${auditEntityFilter}&`;
      if (tenantId) url += `tenantId=${tenantId}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [auditActionFilter, auditEntityFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeMainTab === 'calendar') fetchPosts();
    else if (activeMainTab === 'gallery') fetchMedia();
    else if (activeMainTab === 'audit') fetchAuditLogs();
  }, [activeMainTab, fetchPosts, fetchMedia, fetchAuditLogs]);

  // Calendar Date Switcher
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and Drop Date Rescheduling
  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData('text/plain', postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain');
    if (!postId) return;

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const currentSchDate = new Date(targetPost.scheduledDate);
    const newDate = new Date(targetDate);
    newDate.setHours(currentSchDate.getHours(), currentSchDate.getMinutes());

    try {
      const res = await fetch(`/api/social/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: newDate.toISOString(), tenantId }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error('Error shifting post date:', err);
    }
  };

  // Render Calendar Grid Days (Monthly)
  const renderMonthlyGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDayOfMonth.getDate();

    const calendarDays = [];

    // Previous month padding
    for (let i = 0; i < startDayIndex; i++) {
      const prevDate = new Date(year, month, -startDayIndex + i + 1);
      calendarDays.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      calendarDays.push({ date, isCurrentMonth: true });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = (7 - (calendarDays.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      calendarDays.push({ date: nextDate, isCurrentMonth: false });
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Days Header */}
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName) => (
          <div key={dayName} className="bg-[#121522] py-2.5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
            {dayName}
          </div>
        ))}

        {/* Calendar Cells */}
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const isToday =
            new Date().toDateString() === date.toDateString();

          const dayPosts = posts.filter((p) => {
            const pDate = new Date(p.scheduledDate);
            return pDate.toDateString() === date.toDateString();
          });

          return (
            <div
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => {
                setSelectedPost(null);
                setSelectedDefaultDate(date);
                setIsPostModalOpen(true);
              }}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                isCurrentMonth ? 'bg-[#0d0f17] hover:bg-[#161826]' : 'bg-[#090a0f]/60 opacity-50'
              }`}
            >
              {/* Top Cell Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-[var(--primary-color)] text-black shadow-md'
                      : isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {date.getDate()}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPost(null);
                    setSelectedDefaultDate(date);
                    setIsPostModalOpen(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Posts List */}
              <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto max-h-[90px]">
                {dayPosts.map((postItem) => (
                  <div
                    key={postItem.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, postItem.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(postItem);
                      setIsPostModalOpen(true);
                    }}
                    style={{
                      borderLeftColor: postItem.category?.color || 'var(--primary-color)',
                    }}
                    className="border-l-4 bg-white/5 hover:bg-white/10 p-1.5 rounded-r-lg text-left transition-all group/item shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate leading-tight flex-1">
                        {postItem.title}
                      </span>
                      {postItem.isRecurring && <Repeat className="w-3 h-3 text-[var(--primary-color)] shrink-0" />}
                    </div>

                    {densityMode === 'full' && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{postItem.content}</p>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                      <span>
                        {new Date(postItem.scheduledDate).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="uppercase font-extrabold text-[8px] px-1 py-0.2 rounded bg-white/10">
                        {postItem.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render List View
  const renderListView = () => {
    return (
      <div className="bg-[#0d0f17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-px">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-medium">
            No hay publicaciones programadas para este periodo.
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedPost(p);
                setIsPostModalOpen(true);
              }}
              className="p-4 bg-[#121522] hover:bg-[#181c2e] transition-all flex items-center justify-between gap-4 cursor-pointer border-b border-white/5"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-3.5 h-12 rounded-full shrink-0"
                  style={{ backgroundColor: p.category?.color || 'var(--primary-color)' }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{p.title}</h3>
                    {p.isRecurring && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary-color-alpha)] text-[var(--primary-color)] font-extrabold flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        Recurrente ({p.recurringFrequency})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.content}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 text-right">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {new Date(p.scheduledDate).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(p.scheduledDate).toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    p.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : p.status === 'draft'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 font-['Urbanist'] max-w-[1600px] mx-auto text-slate-100">
      {/* Top Header & Main Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0f17] border border-white/10 p-5 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div
            style={{ backgroundColor: 'var(--primary-color-alpha)', color: 'var(--primary-color)' }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Social Calendar & Content Hub
              <span
                style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
                className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
              >
                v2.1
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Planificación, IA de Copies y Registro de Auditoría de Redes Sociales (Outcrop Silver Corp.)
            </p>
          </div>
        </div>

        {/* Sub-Tab Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-[#161822] p-1.5 rounded-xl border border-white/10">
          {[
            { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
            { id: 'gallery', label: 'Galería Multimedia', icon: ImageIcon },
            { id: 'audit', label: 'Audit Log', icon: ShieldCheck },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id as MainTab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: CALENDAR VIEW */}
      {activeMainTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Toolbar Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0d0f17] border border-white/10 p-4 rounded-2xl">
            {/* Month Title & Prev/Next */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white capitalize">
                {currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
              </h2>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters & View Switchers */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-[#161822] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="x">X (Twitter)</option>
                <option value="linkedin">LinkedIn</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#161822] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'monthly' ? 'bg-[var(--primary-color)] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Monthly View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-[var(--primary-color)] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Density Mode (Compact vs Full) */}
              {viewMode === 'monthly' && (
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setDensityMode('compact')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                      densityMode === 'compact' ? 'bg-white/20 text-white' : 'text-slate-400'
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setDensityMode('full')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                      densityMode === 'full' ? 'bg-white/20 text-white' : 'text-slate-400'
                    }`}
                  >
                    Full
                  </button>
                </div>
              )}

              {/* Category Manager Button */}
              <button
                onClick={() => setIsCategoriesModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl border border-white/10 transition-all"
              >
                <Tag className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                Categories
              </button>

              {/* New Post Button */}
              <button
                onClick={() => {
                  setSelectedPost(null);
                  setSelectedDefaultDate(new Date());
                  setIsPostModalOpen(true);
                }}
                style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-xl hover:brightness-110 transition-all shadow-lg shadow-black/50"
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>
          </div>

          {/* Render Active View */}
          {isLoadingPosts ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : viewMode === 'monthly' ? (
            renderMonthlyGrid()
          ) : (
            renderListView()
          )}
        </div>
      )}

      {/* SUB-TAB 2: MEDIA GALLERY */}
      {activeMainTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0d0f17] border border-white/10 p-4 rounded-2xl">
            <h2 className="text-lg font-bold text-white">Media Gallery ({mediaList.length} files)</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Search files..."
                className="bg-[#161822] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[var(--primary-color)]"
              />
            </div>
          </div>

          {isLoadingMedia ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mediaList.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No media files uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mediaList.map((media) => (
                <div
                  key={media.id}
                  onClick={() => setPreviewMedia(media)}
                  className="group relative bg-[#121522] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/30 transition-all shadow-md"
                >
                  <div className="aspect-square relative">
                    {media.fileType === 'video' ? (
                      <video src={media.filePath} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <img src={media.filePath} alt={media.fileName} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-slate-300 font-bold truncate">{media.fileName}</p>
                    <span className="text-[9px] text-slate-500 uppercase">{media.fileType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOG */}
      {activeMainTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0f17] border border-white/10 p-4 rounded-2xl">
            <h2 className="text-lg font-bold text-white">Audit Log</h2>
            <div className="flex items-center gap-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#161822] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="">All Actions</option>
                <option value="create_post">create_post</option>
                <option value="update_post">update_post</option>
                <option value="delete_post">delete_post</option>
                <option value="upload_media">upload_media</option>
                <option value="create_category">create_category</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoadingAudit ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No audit log records yet.</div>
          ) : (
            <div className="bg-[#0d0f17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#121522] border-b border-white/10 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{log.username || 'Admin'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black uppercase text-[9px] border ${
                            log.action.includes('create')
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : log.action.includes('delete')
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : log.action.includes('update')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{log.entityType || 'system'}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-md truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SocialPostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSaved={fetchPosts}
        onDeleted={fetchPosts}
        post={selectedPost}
        defaultDate={selectedDefaultDate}
        categories={categories}
      />

      <SocialCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        onCategoriesUpdated={() => {
          fetchCategories();
          fetchPosts();
        }}
      />
    </div>
  );
};
