'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download, FileCheck, Users } from 'lucide-react';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantName?: string;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenantName = 'The Core CRM',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultStats, setResultStats] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadSampleCSV = () => {
    const sampleCsv =
      `\uFEFFNombre,Empresa,Cargo,Email,Telefono,WhatsApp,Ubicacion,Etapa,Tipo,Fuente\n` +
      `Carlos Mendoza,Minera del Norte,Director IR,carlos.mendoza@mineradelnorte.com,+573001234567,+573001234567,Medellín Colombia,Lead Prospect,Venture Capital,Networking\n` +
      `Laura Restrepo,Andes Mining Corp,VP Inversiones,l.restrepo@andesmining.co,+573109876543,+573109876543,Bogotá Colombia,Qualified,Family Office,Form\n` +
      `Michael Sterling,Global Resource Fund,Senior Partner,msterling@resourcefund.com,+14165550199,+14165550199,Toronto Canada,Due Diligence,PE,Import`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + sampleCsv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plantilla_importacion_contactos.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) {
      setErrorMsg('El archivo CSV está vacío o no contiene filas de datos.');
      return;
    }

    // Auto-detect delimiter (comma, semicolon, tab)
    const headerLine = lines[0];
    let delimiter = ',';
    if (headerLine.includes(';')) delimiter = ';';
    else if (headerLine.includes('\t')) delimiter = '\t';

    const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));

    const items: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === 0 || !values[0]) continue;

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      items.push(obj);
    }

    if (items.length === 0) {
      setErrorMsg('No se pudieron extraer contactos válidos del archivo CSV.');
      return;
    }

    setParsedContacts(items);
    setErrorMsg(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.type.includes('csv') && !selectedFile.type.includes('text')) {
      setErrorMsg('Por favor selecciona un archivo en formato CSV (.csv).');
      return;
    }

    setFile(selectedFile);
    setResultStats(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCSVText(content);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleSubmitImport = async () => {
    if (parsedContacts.length === 0) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: parsedContacts }),
      });

      const data = await res.json();
      if (data.success) {
        setResultStats(data.stats);
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Error al procesar la importación');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-['Urbanist']">
      <div className="w-full max-w-2xl bg-[#0b0d14] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Importar Contactos (CSV)</h2>
              <p className="text-xs text-slate-400">Carga masiva a la empresa CRM: <strong className="text-cyan-400">{tenantName}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 overflow-y-auto flex-1 pr-1">
          {/* Sample Download Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">¿No tienes el formato correcto?</p>
                <p className="text-[11px] text-slate-400">Descarga la plantilla CSV con los encabezados reconocidos por el sistema.</p>
              </div>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-black flex items-center gap-1.5 transition-all shrink-0 border border-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla CSV</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          {!resultStats && (
            <div className="relative border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-3xl p-8 text-center bg-slate-900/40 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">
                    {file ? file.name : 'Haz clic o arrastra un archivo .CSV aquí'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Soporta codificación UTF-8 y delimitadores estándar (coma, punto y coma)</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedContacts.length > 0 && !resultStats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Vista Previa ({parsedContacts.length} contactos detectados)
                </span>
              </div>

              <div className="max-h-48 overflow-auto border border-white/10 rounded-2xl bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Email / Teléfono</th>
                      <th className="p-3">Etapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {parsedContacts.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-white">{row.Nombre || row.name || 'Sin Nombre'}</td>
                        <td className="p-3">{row.Empresa || row.company || '-'}</td>
                        <td className="p-3 font-mono">{row.Email || row.email || row.Telefono || row.phone || '-'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                            {row.Etapa || row.stage || 'Lead Prospect'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedContacts.length > 5 && (
                <p className="text-[11px] text-slate-500 text-center font-mono">
                  ... y {parsedContacts.length - 5} contactos más listos para procesar.
                </p>
              )}
            </div>
          )}

          {/* Success Stats Results */}
          {resultStats && (
            <div className="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 text-cyan-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¡Importación Exitosa!</h3>
                <p className="text-xs text-slate-300 mt-1">Los contactos han sido integrados a la réplica CRM.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Creados</span>
                  <span className="text-xl font-black text-cyan-400 font-mono">{resultStats.countCreated}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Actualizados</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{resultStats.countUpdated}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Omitidos</span>
                  <span className="text-xl font-black text-slate-400 font-mono">{resultStats.countSkipped}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            {resultStats ? 'Cerrar' : 'Cancelar'}
          </button>

          {!resultStats && parsedContacts.length > 0 && (
            <button
              onClick={handleSubmitImport}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Importar {parsedContacts.length} Contactos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
