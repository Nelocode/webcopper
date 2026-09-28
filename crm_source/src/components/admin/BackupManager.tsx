'use client';

import React, { useState, useEffect } from 'react';
import { Database, Download, RotateCcw, Trash2, Plus, ShieldCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface BackupFile {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backups');
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (e) {
      console.error('Error fetching backups:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', label: 'manual' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: '✅ Copia de seguridad creada exitosamente.', type: 'success' });
        fetchBackups();
      } else {
        setToast({ message: data.error || 'Error al crear la copia de seguridad', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (
      !confirm(
        `⚠️ ¿Estás seguro de que deseas restaurar la base de datos desde "${filename}"?\n\nSe creará una copia de seguridad de estado actual antes de proceder.`
      )
    )
      return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', filename }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: `🎉 ${data.message}`, type: 'success' });
        fetchBackups();
      } else {
        setToast({ message: data.error || 'Error al restaurar', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`¿Eliminar definitivamente la copia de seguridad "${filename}"?`)) return;

    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', filename }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadBackup = (filename: string) => {
    window.open(`/api/admin/backups?action=DOWNLOAD&filename=${encodeURIComponent(filename)}`, '_blank');
  };

  return (
    <div className="space-y-6 font-['Urbanist'] animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400">
            <Database className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Módulo de Respaldos de Base de Datos</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Copias de Seguridad Diarias Automáticas
          </h2>
          <p className="text-xs text-slate-400">
            Protección continua de datos, retención de 30 días y descarga de archivos de respaldo `.db`.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{submitting ? 'Guardando...' : 'Crear Copia Manual Ahora'}</span>
        </button>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Auto Backup System Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado del Demonio</span>
            <span className="text-xs font-black text-emerald-400">🟢 Respaldos Automáticos Activos</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Frecuencia & Retención</span>
            <span className="text-xs font-black text-white">Cada 24 horas (Últimos 30 días)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Respaldos</span>
            <span className="text-xs font-black text-purple-300">{backups.length} Archivos Almacenados</span>
          </div>
        </div>
      </div>

      {/* Backups List Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
          Cargando archivos de respaldo...
        </div>
      ) : backups.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="py-16 text-center rounded-3xl border border-white/5 space-y-3">
          <Database className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No hay copias de seguridad generadas</p>
          <button
            onClick={handleCreateBackup}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs"
          >
            Crear Primera Copia de Seguridad
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="rounded-3xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Historial de Respaldos de Base de Datos</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Motor SQLite Encapsulado</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Nombre de Archivo</th>
                  <th className="p-4">Fecha de Creación</th>
                  <th className="p-4">Tamaño</th>
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white font-medium">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6 font-mono text-cyan-300 font-bold">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-500" />
                        <span>{b.filename}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {new Date(b.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {b.sizeFormatted}
                    </td>
                    <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadBackup(b.filename)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-white/10 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Descargar archivo de base de datos"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>

                      <button
                        onClick={() => handleRestoreBackup(b.filename)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Restaurar base de datos desde esta copia"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteBackup(b.filename)}
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                        title="Eliminar este respaldo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
