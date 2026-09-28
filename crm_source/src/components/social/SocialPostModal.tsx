'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Save,
  Trash2,
  Upload,
  Copy,
  Download,
  MessageSquare,
  Send,
  Calendar,
  Repeat,
  Heart,
  Share2,
  Check,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

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
}

interface SocialComment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
}

interface SocialPost {
  id?: string;
  title: string;
  content: string;
  platforms: string;
  status: string;
  categoryId?: string | null;
  scheduledDate: string | Date;
  isRecurring?: boolean;
  recurringFrequency?: string | null;
  recurringDay?: string | null;
  hashtags?: string | null;
  category?: Category | null;
  media?: SocialMedia[];
  comments?: SocialComment[];
}

interface SocialPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  post?: SocialPost | null;
  defaultDate?: Date | null;
  categories: Category[];
}

export const SocialPostModal: React.FC<SocialPostModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  onDeleted,
  post,
  defaultDate,
  categories,
}) => {
  const isEditing = !!post?.id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState('instagram,x,linkedin');
  const [status, setStatus] = useState('scheduled');
  const [categoryId, setCategoryId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('weekly');
  const [recurringDay, setRecurringDay] = useState('');
  const [hashtags, setHashtags] = useState('');

  // AI Assistant State
  const [aiTone, setAiTone] = useState('profesional');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Media & Uploads
  const [existingMedia, setExistingMedia] = useState<SocialMedia[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Feedback states
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (post) {
        setTitle(post.title || '');
        setContent(post.content || '');
        setPlatforms(post.platforms || 'instagram,x,linkedin');
        setStatus(post.status || 'scheduled');
        setCategoryId(post.categoryId || '');
        const dateObj = new Date(post.scheduledDate);
        setScheduledDate(dateObj.toISOString().slice(0, 16));
        setIsRecurring(!!post.isRecurring);
        setRecurringFrequency(post.recurringFrequency || 'weekly');
        setRecurringDay(post.recurringDay || '');
        setHashtags(post.hashtags || '');
        setExistingMedia(post.media || []);
        setComments(post.comments || []);
      } else {
        setTitle('');
        setContent('');
        setPlatforms('instagram,x,linkedin');
        setStatus('scheduled');
        setCategoryId(categories[0]?.id || '');
        const dateObj = defaultDate || new Date();
        setScheduledDate(dateObj.toISOString().slice(0, 16));
        setIsRecurring(false);
        setRecurringFrequency('weekly');
        setRecurringDay('');
        setHashtags('#OutcropSilver #Plata #TSX #Mining');
        setExistingMedia([]);
        setComments([]);
      }
      setNewFiles([]);
      setNewPreviews([]);
      setUploadedMediaIds([]);
    }
  }, [isOpen, post, defaultDate, categories]);

  // Clean previews on unmount
  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  // AI Copy Generation Trigger
  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/social/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, tone: aiTone }),
      });
      const data = await res.json();
      if (data.copy) {
        setContent(data.copy);
      }
    } catch (e) {
      console.error('Error generating AI copy:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Platform Toggle Helper
  const togglePlatform = (p: string) => {
    let list = platforms.split(',').filter(Boolean);
    if (list.includes(p)) {
      list = list.filter((item) => item !== p);
    } else {
      list.push(p);
    }
    setPlatforms(list.join(','));
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArr = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...filesArr]);

    const previewsArr = filesArr.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previewsArr]);

    // Immediately upload to backend
    filesArr.forEach(async (file) => {
      setIsUploadingMedia(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (post?.id) formData.append('postId', post.id);

        const res = await fetch('/api/social/media', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.id) {
          setUploadedMediaIds((prev) => [...prev, data.id]);
          if (post?.id) {
            setExistingMedia((prev) => [...prev, data]);
          }
        }
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setIsUploadingMedia(false);
      }
    });
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingMedia = async (mediaId: string) => {
    try {
      await fetch(`/api/social/media?id=${mediaId}`, { method: 'DELETE' });
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e) {
      console.error('Error deleting media:', e);
    }
  };

  // Save Post
  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('El título es obligatorio');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title.trim(),
        content,
        platforms,
        status,
        categoryId: categoryId || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
        isRecurring,
        recurringFrequency,
        recurringDay: isRecurring ? recurringDay : null,
        hashtags,
        mediaIds: uploadedMediaIds,
      };

      const url = isEditing ? `/api/social/posts/${post!.id}` : '/api/social/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar publicación');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Post
  const handleDelete = async () => {
    if (!post?.id || !confirm('¿Estás seguro de eliminar esta publicación?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDeleted) onDeleted();
        onClose();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Comment
  const handleAddComment = async () => {
    if (!post?.id || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), username: 'Admin Outcrop' }),
      });
      if (res.ok) {
        const commentData = await res.json();
        setComments((prev) => [...prev, commentData]);
        setNewComment('');
      }
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Copy Live Text
  const handleCopyText = () => {
    const textToCopy = `${title}\n\n${content}\n\n${hashtags}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download Media
  const handleDownloadMedia = () => {
    const activeMedia = existingMedia[0] || null;
    if (activeMedia) {
      setIsDownloaded(true);
      const link = document.createElement('a');
      link.href = activeMedia.filePath;
      link.download = activeMedia.fileName || 'social_media';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => setIsDownloaded(false), 2000);
    }
  };

  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-['Urbanist']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-[#0d0f17] border border-white/15 rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {isEditing ? '✏️ Edit Social Post' : '✨ New Social Post'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Left Column: Post Form */}
            <div className="p-6 space-y-5">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-2.5 font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                  Post Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 High-Grade Silver Exploration Update"
                  className="w-full bg-[#161822] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[var(--primary-color)] outline-none transition-all"
                />
              </div>

              {/* Copy / Caption + AI Assistant */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                    Copy / Caption
                  </label>
                  <button
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    style={{ backgroundColor: 'var(--primary-color-alpha)', color: 'var(--primary-color)' }}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-lg transition-all hover:brightness-125 disabled:opacity-50"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {isGeneratingAi ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>

                {/* Tone Selector */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-slate-400">AI Tone:</span>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="bg-[#161822] border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-[var(--primary-color)]"
                  >
                    <option value="professional">Professional / IR</option>
                    <option value="casual">Casual / Dynamic</option>
                    <option value="inspirational">Inspirational / ESG</option>
                  </select>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Enter the main post content here..."
                  className="w-full bg-[#161822] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[var(--primary-color)] outline-none transition-all resize-none"
                />
              </div>

              {/* Platform Selector Buttons */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Target Social Networks
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'instagram', label: 'Instagram' },
                    { id: 'x', label: 'X (Twitter)' },
                    { id: 'linkedin', label: 'LinkedIn' },
                  ].map((plat) => {
                    const isSel = platforms.split(',').includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlatform(plat.id)}
                        style={isSel ? { backgroundColor: 'var(--primary-color)', color: '#000000' } : {}}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                          isSel
                            ? 'border-transparent shadow-lg shadow-black/40'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {plat.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPlatforms('instagram,x,linkedin')}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      platforms.split(',').length === 3
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    All Platforms
                  </button>
                </div>
              </div>

              {/* Status & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--primary-color)] outline-none"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--primary-color)] outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[var(--primary-color)] outline-none"
                />
              </div>

              {/* Recurring Post Settings */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="accent-[var(--primary-color)] w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                    Publicación Recurrente
                  </span>
                </label>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Frecuencia</label>
                      <select
                        value={recurringFrequency}
                        onChange={(e) => setRecurringFrequency(e.target.value)}
                        className="w-full bg-[#161822] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Día Preferido</label>
                      <select
                        value={recurringDay}
                        onChange={(e) => setRecurringDay(e.target.value)}
                        className="w-full bg-[#161822] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="">Cualquier día</option>
                        <option value="monday">Lunes</option>
                        <option value="tuesday">Martes</option>
                        <option value="wednesday">Miércoles</option>
                        <option value="thursday">Jueves</option>
                        <option value="friday">Viernes</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#OutcropSilver #Plata #Mining #TSX"
                  className="w-full bg-[#161822] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[var(--primary-color)] outline-none"
                />
              </div>

              {/* Multimedia Upload */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                  Archivos Multimedia (Imágenes / Video)
                </label>
                <div className="flex flex-wrap gap-2.5 mb-2">
                  {existingMedia.map((m) => (
                    <div key={m.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 group">
                      {m.fileType === 'video' ? (
                        <video src={m.filePath} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.filePath} alt={m.fileName} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => handleRemoveExistingMedia(m.id)}
                        className="absolute top-1 right-1 bg-black/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}

                  {newPreviews.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 group">
                      <img src={url} alt="Nuevo archivo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveNewFile(idx)}
                        className="absolute top-1 right-1 bg-black/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-white/20 rounded-xl hover:border-white/40 transition-colors text-slate-400 hover:text-white"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Subir</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Comments Section (If Editing) */}
              {isEditing && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--primary-color)]" />
                    Comentarios del Equipo ({comments.length})
                  </h3>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No hay comentarios aún.</p>
                    ) : (
                      comments.map((c, i) => (
                        <div key={c.id || i} className="bg-white/5 rounded-xl px-3 py-2 text-xs">
                          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                            <span className="font-bold text-white">{c.username || 'Admin'}</span>
                            <span>{c.createdAt ? new Date(c.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                          <p className="text-slate-200">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribir comentario interno..."
                      className="flex-1 bg-[#161822] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                      style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Social Media Preview Card */}
            <div className="p-6 bg-black/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Vista Previa en Vivo
                  </span>

                  {/* Actions Header (Copy & Download) */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? '¡Copiado!' : 'Copiar Texto'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadMedia}
                      disabled={existingMedia.length === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        existingMedia.length > 0
                          ? isDownloaded
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--primary-color)] text-black hover:brightness-110'
                          : 'bg-white/5 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                      {isDownloaded ? 'Descargado' : 'Descargar Media'}
                    </button>
                  </div>
                </div>

                {/* Social Card Container */}
                <div className="bg-[#161822] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Card Profile Header */}
                  <div className="p-3.5 flex items-center gap-3 border-b border-white/10">
                    <div
                      style={{
                        background: 'linear-gradient(135deg, var(--primary-color), #06b6d4)',
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-sm shadow-md"
                    >
                      {title ? title.charAt(0).toUpperCase() : 'O'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-none">
                        {title || 'Publicación Social'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                        {platforms
                          ? platforms
                              .split(',')
                              .map((p) => (p === 'x' ? 'X (Twitter)' : p))
                              .join(', ')
                          : 'Plataformas'}
                      </div>
                    </div>
                  </div>

                  {/* Card Media Preview Area */}
                  <div className="aspect-square bg-black/80 flex items-center justify-center overflow-hidden relative">
                    {existingMedia.length > 0 ? (
                      existingMedia[0].fileType === 'video' ? (
                        <video src={existingMedia[0].filePath} className="w-full h-full object-contain" controls />
                      ) : (
                        <img src={existingMedia[0].filePath} alt="Preview" className="w-full h-full object-contain" />
                      )
                    ) : newPreviews.length > 0 ? (
                      <img src={newPreviews[0]} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-600">
                        <ImageIcon className="w-10 h-10 stroke-1" />
                        <span className="text-xs uppercase tracking-widest font-bold">Sin multimedia</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Icons */}
                  <div className="p-3.5 flex gap-4 text-slate-400 border-t border-white/5">
                    <Heart className="w-4 h-4 hover:text-red-400 cursor-pointer" />
                    <MessageSquare className="w-4 h-4 hover:text-white cursor-pointer" />
                    <Share2 className="w-4 h-4 hover:text-white cursor-pointer" />
                  </div>

                  {/* Card Caption Area */}
                  <div className="px-3.5 pb-4 space-y-1.5">
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      <span className="font-bold text-white mr-1.5">Outcrop Silver:</span>
                      {content || 'Contenido del post...'}
                    </p>
                    {hashtags && (
                      <div style={{ color: 'var(--primary-color)' }} className="text-xs font-bold">
                        {hashtags}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02] shrink-0">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Eliminando...' : 'Eliminar Post'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
              className="flex items-center gap-2 px-6 py-2 text-xs font-black rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-black/50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Publicación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
