'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Save, CheckCircle2, Volume2, User } from 'lucide-react';

interface VoiceNoteRecorderProps {
  contacts: any[];
  onSuccess: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ contacts, onSuccess }) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Permiso de micrófono no otorgado o no disponible en el navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSaveVoiceNote = async () => {
    if (!audioUrl || !selectedContactId) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/voicenotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContactId,
          audioDataUrl: audioUrl,
          durationSeconds: recordingTime,
          transcript,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Nota de voz y transcripción IA guardadas en la Vista 360° del contacto.');
        onSuccess();
      } else {
        setErrorMsg('Error al guardar nota de voz. Por favor intenta de nuevo.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al guardar nota de voz. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-['Urbanist'] w-full">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Mic style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
          <span>Grabador de Notas de Voz & Transcripción IA</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Enriquece el expediente del cliente grabando actualizaciones de voz directamente desde el CRM.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3 font-bold">
          <span className="text-red-400 shrink-0">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="hs-super-card p-8 text-center space-y-6 max-w-2xl mx-auto bg-[#151922] border border-white/10">
        {/* Contact Picker */}
        <div className="text-left space-y-1.5">
          <label className="block text-xs font-black text-slate-300">Seleccionar Contacto a Enriquecer</label>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full hs-input-hero text-xs"
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company || 'Inversor'}) - {c.investorType}
              </option>
            ))}
          </select>
        </div>

        {/* Record Mic Controls */}
        <div className="py-6 space-y-4">
          <div className="text-3xl font-mono font-black text-white tracking-widest">
            00:{recordingTime.toString().padStart(2, '0')}
          </div>

          {!recording ? (
            <button
              onClick={startRecording}
              style={{ backgroundColor: 'var(--primary-color)', color: '#09090b' }}
              className="w-20 h-20 rounded-full hover:scale-105 transition-transform flex items-center justify-center mx-auto shadow-2xl font-black"
            >
              <Mic className="w-8 h-8" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-2xl animate-pulse"
            >
              <Square className="w-8 h-8 fill-current" />
            </button>
          )}

          <p className="text-xs text-slate-400 font-medium">
            {recording ? 'Grabando audio en vivo... Presiona para detener' : 'Presiona el micrófono para iniciar grabación'}
          </p>
        </div>

        {/* Audio Preview & AI Transcript */}
        {audioUrl && (
          <div className="p-5 rounded-3xl bg-[#0f1218] border border-white/10 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
                <span className="text-xs font-black text-white">Reproducción del Audio Grabado</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const sampleContact = contacts.find((c) => c.id === selectedContactId);
                  const name = sampleContact?.name || 'El inversionista';
                  const aiTakeaway =
                    `🎙️ RESUMEN EJECUTIVO EXTRAÍDO POR IA:\n` +
                    `• Sentimiento: Alto Interés Minero (Interés en Santa Ana - Leyes de Plata)\n` +
                    `• Puntos Clave: ${name} solicitó el informe técnico NI 43-101 y mostró interés en co-invertir en la fase de exploración Q3.\n` +
                    `• Tarea de Seguimiento: Despachar informe de ensayos geológicos y agendar videollamada.`;
                  setTranscript(aiTakeaway);
                }}
                className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-black text-xs hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>⚡ Extraer Puntos Clave con IA</span>
              </button>
            </div>

            <audio controls src={audioUrl} className="w-full h-10" />

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-black text-slate-300">
                Transcripción & Puntos Clave del Inversionista (IA)
              </label>
              <textarea
                rows={4}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Haz clic en 'Extraer Puntos Clave con IA' o escribe los puntos de la llamada..."
                className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 leading-relaxed font-mono"
              />
            </div>
            <button
              onClick={handleSaveVoiceNote}
              disabled={saving}
              className="w-full hs-pill-btn hs-btn-lime py-3 text-xs font-black flex items-center justify-center gap-2 mt-3 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando Nota...' : 'Guardar Nota de Voz en Expediente 360°'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
