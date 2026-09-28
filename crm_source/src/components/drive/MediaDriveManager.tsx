'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FolderKanban,
  FolderPlus,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  File,
  Search,
  Sparkles,
  Bot,
  Share2,
  Trash2,
  Download,
  CheckCircle2,
  RefreshCw,
  Folder,
  Layers,
  Grid,
  List,
  Eye,
  Zap,
  ExternalLink,
  Lock,
  Copy,
  Plus,
} from 'lucide-react';

export interface DriveFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface DriveFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  version?: number;
  previousVersionsJson?: string;
  accessLevel?: string;
  tags?: string;
  aiCategory?: string;
  aiSummary?: string;
  aiSummaryEn?: string;
  aiKeywords?: string;
  shareToken?: string;
  folderId?: string;
  createdAt: string;
}

export interface MediaDriveManagerProps {
  tenantId?: string;
  tenantName?: string;
}

export const MediaDriveManager: React.FC<MediaDriveManagerProps> = ({ tenantId, tenantName }) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#00E5FF');
  const [selectedFileForModal, setSelectedFileForModal] = useState<DriveFile | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showCloudImportModal, setShowCloudImportModal] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState('');
  const [summaryLang, setSummaryLang] = useState<'es' | 'en'>('es');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDriveData();
  }, [selectedFolderId, selectedCategory]);

  const fetchDriveData = async () => {
    setLoading(true);
    try {
      let query = `?folderId=${selectedFolderId}&category=${selectedCategory}`;
      if (tenantId) query += `&tenantId=${tenantId}`;
      if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(`/api/media-drive/files${query}`);
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error('Error fetching drive data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUploadFiles(Array.from(e.target.files));
    }
  };

  const handleUploadFiles = async (fileList: File[]) => {
    setUploading(true);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        if (selectedFolderId !== 'ALL' && selectedFolderId !== 'root') {
          formData.append('folderId', selectedFolderId);
        }
        if (tenantId) formData.append('tenantId', tenantId);

        const res = await fetch('/api/media-drive/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!data.success) {
          alert(`Error cargando archivo ${file.name}: ${data.error}`);
        }
      }
      setToastMessage(`✅ ${fileList.length} archivo(s) cargado(s) exitosamente en el Drive.`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchDriveData();
    } catch (e: any) {
      alert(`Error en la carga: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/media-drive/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_FOLDER',
          name: newFolderName.trim(),
          color: newFolderColor,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`📁 Carpeta "${newFolderName}" creada correctamente.`);
        setTimeout(() => setToastMessage(null), 4000);
        setShowFolderModal(false);
        setNewFolderName('');
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // AI Action 1: Auto Organize with Gemini AI
  const handleAiAutoOrganize = async () => {
    setAiProcessing(true);
    try {
      const res = await fetch('/api/media-drive/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ORGANIZE_AUTO',
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(null), 5000);
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAiProcessing(false);
    }
  };

  // AI Action 2: Summarize File with Gemini
  const handleAiSummarize = async (file: DriveFile) => {
    setSelectedFileForModal(file);
    setShowSummaryModal(true);
    setAiProcessing(true);
    try {
      const res = await fetch('/api/media-drive/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUMMARIZE',
          fileId: file.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.file) {
        setSelectedFileForModal(data.file);
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAiProcessing(false);
    }
  };

  // AI Action 3: Convert & Compress Format
  const handleAiConvertOptimize = async (fileId: string) => {
    setAiProcessing(true);
    try {
      const res = await fetch('/api/media-drive/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONVERT_OPTIMIZE',
          fileId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(null), 4000);
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAiProcessing(false);
    }
  };

  // AI Action 4: Translate Summary ES ⇄ EN
  const handleAiTranslate = async (file: DriveFile) => {
    setAiProcessing(true);
    try {
      const res = await fetch('/api/media-drive/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSLATE',
          fileId: file.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.file) {
        setSelectedFileForModal(data.file);
        setSummaryLang('en');
        setToastMessage('🌐 Resumen traducido al Inglés exitosamente por Humunculus IA.');
        setTimeout(() => setToastMessage(null), 4000);
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAiProcessing(false);
    }
  };

  // Cloud Import Handler
  const handleCloudImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudUrlInput.trim()) return;

    setUploading(true);
    try {
      const res = await fetch('/api/media-drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importUrl: cloudUrlInput.trim(),
          folderId: selectedFolderId !== 'ALL' ? selectedFolderId : null,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('☁️ Archivo importado desde la Nube exitosamente.');
        setTimeout(() => setToastMessage(null), 4000);
        setShowCloudImportModal(false);
        setCloudUrlInput('');
        fetchDriveData();
      } else {
        alert(`Error al importar: ${data.error}`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete File
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo del repositorio?')) return;
    try {
      const res = await fetch(`/api/media-drive/files?fileId=${fileId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setToastMessage('🗑️ Archivo eliminado del Drive.');
        setTimeout(() => setToastMessage(null), 3000);
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Delete Folder
  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string, folderName: string) => {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de eliminar la carpeta "${folderName}"? Los archivos que contiene no se borrarán y volverán a "Todos los Archivos".`)) return;

    try {
      const res = await fetch(`/api/media-drive/files?folderId=${folderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ Carpeta "${folderName}" eliminada.`);
        setTimeout(() => setToastMessage(null), 3000);
        if (selectedFolderId === folderId) setSelectedFolderId('ALL');
        fetchDriveData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Helper File Icon Mapper
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-pink-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mimeType.includes('json') || mimeType.includes('code') || mimeType.includes('javascript'))
      return <FileCode className="w-5 h-5 text-amber-400" />;
    return <File className="w-5 h-5 text-cyan-400" />;
  };

  const categoriesList = [
    'ALL',
    'Presentaciones IR & Pitch Decks',
    'Reportes Técnicos Santa Ana',
    'Documentos Legales & Contratos',
    'Imágenes & Medios de Prensa',
    'General',
  ];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] w-full animate-fadeIn pb-12">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-extrabold text-xs shadow-2xl flex items-center gap-3 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Drive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
                <span>Repositorio & Drive de Medios IA</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] border border-cyan-500/30">
                  HUMUNCULUS AI ENRICHED
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Almacenamiento corporativo inteligente con organización automática, síntesis documental y compartición segura.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleAiAutoOrganize}
            disabled={aiProcessing}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Bot className={`w-4 h-4 ${aiProcessing ? 'animate-spin' : ''}`} />
            <span>{aiProcessing ? 'Organizando...' : 'Organizar con Humunculus IA'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCloudImportModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer border border-cyan-500/30"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Importar Nube / Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFolderModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>Nueva Carpeta</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-white font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Archivo</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
        </div>
      </div>

      {/* Drag & Drop Main Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-6 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
          isDragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-subtle)]/20 scale-[1.01]'
            : 'border-white/10 bg-[#1F1E1E] hover:border-white/20'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 shadow-inner">
          <Upload className={`w-6 h-6 ${uploading ? 'animate-bounce' : ''}`} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            {uploading ? 'Cargando archivos en el Repositorio...' : 'Arrastra y suelta tus archivos aquí'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Soporta PDFs, Presentaciones IR, Reportes Excel/CSV, Fotos de muestras y Documentos Legales.
          </p>
        </div>
      </div>

      {/* Filter & Toolbar Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o concepto IA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDriveData()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#2A2A2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'ALL' ? 'Todas las Categorías' : cat}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Cuadrícula"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Folders Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Folder className="w-4 h-4 text-cyan-400" />
          <span>Carpetas del Proyecto ({folders.length})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedFolderId('ALL')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              selectedFolderId === 'ALL'
                ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-lg'
                : 'bg-[#2A2A2A] border-white/5 text-slate-300 hover:border-white/20'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
              ALL
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs block truncate">Todos los Archivos</span>
              <span className="text-[10px] text-slate-400 block truncate">{files.length} elementos</span>
            </div>
          </button>

          {folders.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative ${
                selectedFolderId === f.id
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-lg'
                  : 'bg-[#2A2A2A] border-white/5 text-slate-300 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{ backgroundColor: `${f.color || '#00E5FF'}20`, color: f.color || '#00E5FF' }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Folder className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs block truncate">{f.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">Carpeta Inteligente</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteFolder(e, f.id, f.name)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer shrink-0"
                title="Eliminar Carpeta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Files Display Section */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Archivos Registrados ({files.length})</span>
          </h2>
          {loading && <span className="text-xs text-cyan-400 font-mono animate-pulse">Sincronizando...</span>}
        </div>

        {files.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{ backgroundColor: 'var(--bg-card)' }}
                  className="p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group relative shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-white/5 shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px] border border-cyan-500/20 truncate max-w-[120px]">
                      {file.aiCategory || 'General'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-white block truncate title={file.name}">
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* AI Summary Preview Badge */}
                  {file.aiSummary && (
                    <div className="p-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-slate-300 line-clamp-2 italic">
                      "{file.aiSummary.replace(/[*#]/g, '')}"
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAiSummarize(file)}
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors cursor-pointer"
                        title="Síntesis Ejecutiva Humunculus IA"
                      >
                        <Bot className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleAiConvertOptimize(file.id)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                        title="Optimizar Formato & Compresión"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFileForModal(file);
                          setShowShareModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                        title="Compartir Enlace Seguro"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedFileForModal(file);
                          setShowPreviewModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors cursor-pointer"
                        title="Previsualización Integrada sin Descargar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFileForModal(file);
                          setShowVersionModal(true);
                        }}
                        className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold transition-colors cursor-pointer border border-emerald-500/20"
                        title="Historial de Versiones (Click para ver)"
                      >
                        v{file.version || 1}
                      </button>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                        title="Descargar Original"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{ backgroundColor: 'var(--bg-card)' }}
                  className="p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/5 shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs text-white block truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {(file.size / 1024).toFixed(1)} KB • Categoría IA: {file.aiCategory}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAiSummarize(file)}
                      className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center gap-1 hover:bg-cyan-500/20 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Resumen IA</span>
                    </button>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="p-8 rounded-3xl bg-[#2A2A2A] border border-white/10 text-center space-y-3">
            <FolderKanban className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              No hay archivos cargados en esta carpeta o categoría del Repositorio.
            </p>
          </div>
        )}
      </div>

      {/* CREATE FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <span>Crear Nueva Carpeta</span>
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre de la Carpeta</label>
                <input
                  type="text"
                  placeholder="Ej: Muestras de Perforación 2025"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#2A2A2A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Color Distintivo</label>
                <div className="flex items-center gap-3">
                  {['#00E5FF', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        newFolderColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs uppercase cursor-pointer"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && selectedFileForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Compartir Archivo Seguro</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                Enlace seguro generado para <strong>{selectedFileForModal.name}</strong>:
              </p>

              <div className="p-3 rounded-xl bg-[#2A2A2A] border border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-cyan-400 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}${selectedFileForModal.url}` : selectedFileForModal.url}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${selectedFileForModal.url}`);
                    setToastMessage('📋 Enlace copiado al portapapeles.');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="p-2 rounded-lg bg-cyan-500 text-black font-bold text-xs shrink-0 cursor-pointer"
                  title="Copiar Enlace"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY MODAL WITH AI TRANSLATION ES/EN */}
      {showSummaryModal && selectedFileForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Síntesis Ejecutiva Humunculus IA</span>
              </h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase">{selectedFileForModal.name}</h4>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setSummaryLang('es')}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      summaryLang === 'es' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                    }`}
                  >
                    Español
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedFileForModal.aiSummaryEn) {
                        handleAiTranslate(selectedFileForModal);
                      } else {
                        setSummaryLang('en');
                      }
                    }}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      summaryLang === 'en' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                    }`}
                  >
                    English (Humunculus)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#2A2A2A] border border-cyan-500/20 text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                {summaryLang === 'en'
                  ? selectedFileForModal.aiSummaryEn || 'Translating summary into English with Humunculus AI...'
                  : selectedFileForModal.aiSummary || 'Generando síntesis con IA Humunculus...'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL (PDF / IMAGES / DOCS) */}
      {showPreviewModal && selectedFileForModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 w-full max-w-4xl h-[85vh] flex flex-col justify-between gap-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white uppercase truncate max-w-md">
                  Previsualización: {selectedFileForModal.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="flex-1 w-full bg-black/50 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
              {selectedFileForModal.mimeType.startsWith('image/') ? (
                <img
                  src={selectedFileForModal.url}
                  alt={selectedFileForModal.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : selectedFileForModal.mimeType.includes('pdf') ? (
                <iframe
                  src={selectedFileForModal.url}
                  className="w-full h-full border-none"
                  title={selectedFileForModal.name}
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-cyan-400 mx-auto" />
                  <p className="text-xs text-slate-300">
                    Vista previa de documento disponible. Haz clic abajo para abrir o descargar el archivo completo.
                  </p>
                  <a
                    href={selectedFileForModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs"
                  >
                    <span>Abrir en Nueva Pestaña</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                {(selectedFileForModal.size / 1024).toFixed(1)} KB • Versión: v{selectedFileForModal.version || 1}
              </span>
              <a
                href={selectedFileForModal.url}
                download
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Original</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {showVersionModal && selectedFileForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Historial de Versiones (v{selectedFileForModal.version || 1})</span>
              </h3>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-cyan-400 block">v{selectedFileForModal.version || 1} (Versión Actual)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(selectedFileForModal.size / 1024).toFixed(1)} KB</span>
                </div>
                <a href={selectedFileForModal.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold">
                  Ver
                </a>
              </div>

              {selectedFileForModal.previousVersionsJson &&
                JSON.parse(selectedFileForModal.previousVersionsJson).map((prev: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#2A2A2A] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-white block">v{prev.version} (Archivo Histórico)</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(prev.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <a href={prev.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-white/10 text-white text-xs font-bold">
                      Descargar
                    </a>
                  </div>
                ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOUD IMPORT MODAL */}
      {showCloudImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Importar desde Google Drive / Nube</span>
              </h3>
              <button
                onClick={() => setShowCloudImportModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloudImport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">URL Pública del Archivo o Google Drive</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/uc?export=download&id=..."
                  value={cloudUrlInput}
                  onChange={(e) => setCloudUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#2A2A2A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloudImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs uppercase cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Importando...' : 'Importar Archivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

