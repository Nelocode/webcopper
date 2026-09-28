'use client';

import React, { useState } from 'react';
import { CreditCard, Upload, Scan, CheckCircle2, UserCheck, ArrowRight, Camera } from 'lucide-react';

interface BusinessCardScannerProps {
  onSuccess: () => void;
  contacts: any[];
}

export const BusinessCardScanner: React.FC<BusinessCardScannerProps> = ({ onSuccess, contacts }) => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFrontImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setBackImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Preset demo cards for instant testing
  const handleLoadDemoCard = () => {
    setFrontImage('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80');
    setBackImage('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80');
  };

  const handleProcessScan = async () => {
    if (!frontImage) return;

    setScanning(true);
    setSuccessMsg(null);

    // Simulate OCR text processing & pattern extraction
    setTimeout(async () => {
      const parsed = {
        name: 'Dr. Alejandro Morales',
        title: 'VP Exploration & Resource Geology',
        company: 'Sierra Nevada Silver Resources',
        email: 'amorales@sierranevadasilver.com',
        phone: '+1 604 892 0112',
        location: 'Vancouver, BC Canada',
        investorType: 'Mining insider',
        stage: 'Interested - early',
        source: 'Conference',
      };

      setExtractedData(parsed);

      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frontImageUrl: frontImage,
            backImageUrl: backImage,
            contactId: selectedContactId || undefined,
            extractedFrontText: `Dr. Alejandro Morales VP Exploration Sierra Nevada Silver amorales@sierranevadasilver.com +1 604 892 0112`,
            extractedBackText: `Latin America High-Grade Silver Specialist Vancouver BC Canada`,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSuccessMsg('Tarjeta de presentación procesada y datos OCR asociados al CRM correctamente.');
          onSuccess();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setScanning(false);
      }
    }, 1500);
  };

  const handleCreateContactFromOCR = async () => {
    if (!extractedData) return;

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`¡Nuevo contacto "${extractedData.name}" creado automáticamente desde la tarjeta de presentación!`);
        setExtractedData(null);
        setFrontImage(null);
        setBackImage(null);
        onSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span>Escáner de Tarjetas de Presentación (2 Caras)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Escanea el frente y reverso de la tarjeta con IA/OCR para extraer datos de contacto y clasificarlos.
          </p>
        </div>

        <button
          onClick={handleLoadDemoCard}
          className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-all"
        >
          Cargar Tarjeta de Ejemplo
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Card Dual Uploader */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front Side */}
        <div className="neo-card p-6 border-dashed border-2 border-white/10 hover:border-blue-500/50 transition-all text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">Cara Frontal (Frente)</span>
          {frontImage ? (
            <div className="relative group">
              <img src={frontImage} alt="Front Card" className="w-full h-48 object-cover rounded-2xl border border-white/10" />
              <button
                onClick={() => setFrontImage(null)}
                className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-rose-400 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block py-8 space-y-2">
              <Upload className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-300 font-semibold">Subir o tomar foto del frente</div>
              <div className="text-[11px] text-slate-500">PNG, JPG hasta 10MB</div>
              <input type="file" accept="image/*" onChange={handleFrontUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Back Side */}
        <div className="neo-card p-6 border-dashed border-2 border-white/10 hover:border-purple-500/50 transition-all text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">Cara Trasera (Reverso)</span>
          {backImage ? (
            <div className="relative group">
              <img src={backImage} alt="Back Card" className="w-full h-48 object-cover rounded-2xl border border-white/10" />
              <button
                onClick={() => setBackImage(null)}
                className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-rose-400 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block py-8 space-y-2">
              <Camera className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-300 font-semibold">Subir o tomar foto del reverso</div>
              <div className="text-[11px] text-slate-500">Opcional para notas adicionales</div>
              <input type="file" accept="image/*" onChange={handleBackUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Target Contact Selector or Create New */}
      <div className="p-6 rounded-2xl bg-[#191a2e] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vincular a Contacto Existente (Opcional)</label>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#141523] border border-white/10 rounded-xl text-xs text-white focus:border-blue-500"
          >
            <option value="">Crear nuevo contacto con datos escaneados</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company || 'Sin empresa'})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleProcessScan}
          disabled={!frontImage || scanning}
          className="w-full md:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          <Scan className="w-4 h-4" />
          <span>{scanning ? 'Procesando OCR 2 Caras...' : 'Ejecutar Escaneo Inteligente'}</span>
        </button>
      </div>

      {/* OCR Results Review Box */}
      {extractedData && (
        <div className="p-6 rounded-3xl bg-[#1f2138] border border-purple-500/30 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Datos Extramados por OCR (Confirmar o Crear Contacto)</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#141523]">
              <span className="text-[10px] text-slate-400 block">Nombre Detected</span>
              <span className="font-bold text-white">{extractedData.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141523]">
              <span className="text-[10px] text-slate-400 block">Empresa</span>
              <span className="font-bold text-white">{extractedData.company}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141523]">
              <span className="text-[10px] text-slate-400 block">Email</span>
              <span className="font-bold text-white">{extractedData.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141523]">
              <span className="text-[10px] text-slate-400 block">Teléfono</span>
              <span className="font-bold text-white">{extractedData.phone}</span>
            </div>
          </div>

          <button
            onClick={handleCreateContactFromOCR}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <span>Confirmar y Crear Contacto en Outcrop CRM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
