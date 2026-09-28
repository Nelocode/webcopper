'use client';

import React, { useState, useRef } from 'react';
import { OUTCROP_TAGS } from '@/lib/constants';
import { X, CreditCard, User, Mail, Phone, Building, Tag, UserCheck, Upload, Mic, Square, Trash2, Camera, ArrowRight, Check, MapPin, Globe } from 'lucide-react';

interface ContactModalProps {
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose, onSuccess, tenantId }) => {
  // Default mode is 'wizard' (Asistente de Tarjeta + Voz + Categoría)
  const [creationMode, setCreationMode] = useState<'wizard' | 'manual'>('wizard');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core Rich Contact Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  
  // Tag Taxonomy
  const [investorType, setInvestorType] = useState('Retail investor');
  const [stage, setStage] = useState('Interested - early');
  const [source, setSource] = useState('MailChimp/website');
  const [selectedCategory, setSelectedCategory] = useState<string>('PRIVATE INVESTOR');

  // Dynamic Custom Typifications
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [customStages, setCustomStages] = useState<string[]>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_custom_typifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.investorTypes && Array.isArray(parsed.investorTypes)) setCustomTypes(parsed.investorTypes);
        if (parsed.pipelineStages && Array.isArray(parsed.pipelineStages)) setCustomStages(parsed.pipelineStages);
      }
    } catch (e) {}
  }, []);

  // 2-Caras Card Scanner State
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceNoteTranscript, setVoiceNoteTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Category Options mapping to actual investorType values
  const CATEGORY_OPTIONS = [
    { section: 'RETAIL', label: 'PRIVATE INVESTOR', investorType: 'Retail investor' },
    { section: 'RETAIL', label: 'HNW', investorType: 'High Net Worth (HNW)' },
    { section: 'RETAIL', label: 'VIP', investorType: 'Ultra HNW (UHNW)' },
    { section: 'INSTITUCIONES', label: 'BROKER (BUY)', investorType: 'Broker / Intermediary' },
    { section: 'INSTITUCIONES', label: 'BROKER (SELL)', investorType: 'Sell-Side Analyst' },
    { section: 'FUNDS', label: 'FAMILY OFFICE', investorType: 'Family Office' },
    { section: 'FUNDS', label: 'HEDGE FUND', investorType: 'Hedge Fund' },
    { section: 'FUNDS', label: 'LONG TERM FUND', investorType: 'Institutional Investor' },
  ];

  // Mic Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      alert('Por favor permite acceso al micrófono para grabar la nota de voz.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFrontImage(reader.result as string);
        processOcr(reader.result as string);
      };
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

  const processOcr = async (imageData: string) => {
    setOcrProcessing(true);
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await res.json();
      if (data.success && data.fields) {
        if (data.fields.name) setName(data.fields.name);
        if (data.fields.email) setEmail(data.fields.email);
        if (data.fields.phone) setPhone(data.fields.phone);
        if (data.fields.company) setCompany(data.fields.company);
        if (data.fields.title) setTitle(data.fields.title);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOcrProcessing(false);
    }
  };

  const synthesizeAiBriefing = (transcriptText: string, contactName: string, companyName: string) => {
    let icebreaker = '';
    let context = '';

    if (transcriptText.trim()) {
      icebreaker = `En conversación reciente: "${transcriptText.trim().slice(0, 110)}..."`;
      context = `Inteligencia extraída de nota de voz: ${transcriptText.trim()}. Perfil de relacionamiento en ${companyName || 'sector de inversión'}.`;
    } else if (companyName.trim()) {
      icebreaker = `Revisando el perfil de ${contactName} en ${companyName.trim()}, enfocado en oportunidades de capital para el proyecto Santa Ana.`;
      context = `Inversionista de ${companyName.trim()}. Relevante para rondas de financiamiento y actualizaciones de prospección minera.`;
    } else {
      icebreaker = `Contacto calificado en la red de Outcrop Silver para dar seguimiento en proyectos de metales preciosos.`;
      context = `Inversionista registrado. Pendiente definir tesis de inversión y volumen de ticket.`;
    }

    return { icebreaker, context };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() && !frontImage) {
      alert('Por favor ingresa un nombre para el contacto.');
      return;
    }

    const finalName = name.trim() || 'Nuevo Inversionista';
    const activeCategory = CATEGORY_OPTIONS.find((c) => c.label === selectedCategory);
    const finalType = creationMode === 'wizard' ? (activeCategory?.investorType || investorType) : investorType;
    const { icebreaker, context } = synthesizeAiBriefing(voiceNoteTranscript, finalName, company);

    setLoading(true);
    try {
      const payload: any = {
        name: finalName,
        email,
        phone,
        whatsapp: whatsapp || phone,
        company,
        title,
        location,
        investorType: finalType,
        stage,
        source,
        bio: bio || voiceNoteTranscript || '',
        dynamicIcebreaker: icebreaker,
        strategicContext: context,
        tenantId,
      };

      if (frontImage || backImage) {
        payload.businessCard = {
          frontImageUrl: frontImage || '',
          backImageUrl: backImage,
        };
      }

      if (audioUrl) {
        payload.voiceNotes = [
          {
            title: `Nota de Voz - ${finalName}`,
            duration: recordingTime || 10,
            audioUrl: audioUrl,
            transcript: voiceNoteTranscript || 'Audio grabado durante el registro del contacto.',
          },
        ];
      }

      setError(null);
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError('Error al crear el contacto. Por favor verifica los datos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al crear el contacto. Por favor verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 lg:p-6 animate-fadeIn font-['Urbanist']">
      <div className="hs-super-card w-full max-w-2xl bg-[#151922] border border-white/10 flex flex-col overflow-hidden shadow-2xl relative max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#0f1218] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: 'var(--primary-color)', color: '#09090b' }}
              className="w-10 h-10 rounded-full flex items-center justify-center font-black shadow-md shrink-0"
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">New Investor Contact</h2>
              <p className="text-xs text-slate-400 font-medium">Outcrop Silver Taxonomy & Smart Card Scanner</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1e2430] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector (Wizard default first, Manual second) */}
        <div className="flex border-b border-white/10 bg-[#151922] px-6 pt-3 gap-2">
          <button
            onClick={() => setCreationMode('wizard')}
            style={creationMode === 'wizard' ? { color: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
            className={`pb-3 px-4 text-xs font-black transition-all flex items-center gap-2 ${
              creationMode === 'wizard' ? 'border-b-2 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Wizard (Card + Voice + Category)</span>
          </button>

          <button
            onClick={() => setCreationMode('manual')}
            style={creationMode === 'manual' ? { color: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
            className={`pb-3 px-4 text-xs font-black transition-all ${
              creationMode === 'manual' ? 'border-b-2 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Manual Entry
          </button>
        </div>

        {/* MODE 1: ASISTENTE WIZARD (DEFAULT INITIAL MODE) */}
        {creationMode === 'wizard' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Step Bar */}
            <div className="px-8 pt-4 pb-3 border-b border-white/10 flex items-center gap-4 text-xs font-black tracking-widest uppercase bg-[#0f1218]">
              <span style={step === 1 ? { color: 'var(--primary-color)' } : {}} className={step === 1 ? 'font-extrabold' : 'text-slate-500'}>
                01 CARD
              </span>
              <span className="text-slate-700">———</span>
              <span style={step === 2 ? { color: 'var(--primary-color)' } : {}} className={step === 2 ? 'font-extrabold' : 'text-slate-500'}>
                02 NOTES
              </span>
              <span className="text-slate-700">———</span>
              <span style={step === 3 ? { color: 'var(--primary-color)' } : {}} className={step === 3 ? 'font-extrabold' : 'text-slate-500'}>
                03 CATEGORY
              </span>
            </div>

            {/* STEP 1: TARJETA */}
            {step === 1 && (
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight uppercase">CAPTURE CARD</h1>
                  <p style={{ color: 'var(--primary-color)' }} className="text-xs font-black tracking-wider uppercase mt-1">
                    NAME EXTRACTED AUTOMATICALLY FROM SCAN
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
                  <label
                    style={{ borderColor: 'var(--primary-color)' }}
                    className="border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-all bg-[#0f1218] text-center min-h-[180px]"
                  >
                    {frontImage ? (
                      <img src={frontImage} alt="Front" className="w-full h-36 object-cover rounded-2xl" />
                    ) : (
                      <>
                        <Camera style={{ color: 'var(--primary-color)' }} className="w-8 h-8" />
                        <span className="text-xs font-black text-slate-200 tracking-widest uppercase">FRONT</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFrontUpload} className="hidden" />
                  </label>

                  <label className="border-2 border-dashed border-white/15 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-white/30 transition-all bg-[#0f1218] text-center min-h-[180px]">
                    {backImage ? (
                      <img src={backImage} alt="Back" className="w-full h-36 object-cover rounded-2xl" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-slate-500" />
                        <span className="text-xs font-black text-slate-400 tracking-widest uppercase">BACK (OPTIONAL)</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleBackUpload} className="hidden" />
                  </label>
                </div>

                {ocrProcessing && (
                  <div className="text-center text-xs font-black text-amber-400 animate-pulse">
                    Processing OCR business card data...
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full hs-pill-btn hs-btn-lime py-4 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: NOTAS */}
            {step === 2 && (
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight uppercase">NOTES</h1>
                  <p style={{ color: 'var(--primary-color)' }} className="text-xs font-black tracking-wider uppercase mt-1">
                    CONFIRM NAME AND ADD CONTEXT
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Type full name if not scanned"
                      className="w-full hs-input-hero text-sm"
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    {isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="w-20 h-20 rounded-full bg-rose-500 text-white flex flex-col items-center justify-center gap-1 shadow-2xl animate-pulse"
                      >
                        <Square className="w-6 h-6 fill-current" />
                        <span className="text-[10px] font-black">{recordingTime}s</span>
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        style={{ borderColor: 'var(--primary-color)' }}
                        className="w-20 h-20 rounded-full bg-[#0f1218] border-2 text-white flex flex-col items-center justify-center gap-1 shadow-xl hover:scale-105 transition-all group"
                      >
                        <Mic style={{ color: 'var(--primary-color)' }} className="w-7 h-7 group-hover:scale-110 transition-transform" />
                      </button>
                    )}

                    <span className="text-xs font-black text-slate-300 tracking-widest uppercase">
                      {isRecording ? 'RECORDING... TAP TO STOP' : 'TAP TO RECORD VOICE NOTE'}
                    </span>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      value={voiceNoteTranscript}
                      onChange={(e) => setVoiceNoteTranscript(e.target.value)}
                      placeholder="Transcribed voice notes will appear here..."
                      className="w-full p-4 bg-[#0f1218] border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-600 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="hs-pill-btn hs-btn-dark py-4 text-xs font-black tracking-widest uppercase"
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="hs-pill-btn hs-btn-lime py-4 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CATEGORÍA */}
            {step === 3 && (
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight uppercase">CATEGORY</h1>
                  <p style={{ color: 'var(--primary-color)' }} className="text-xs font-black tracking-wider uppercase mt-1">
                    EXECUTIVE SEGMENTATION
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  {CATEGORY_OPTIONS.map((item) => {
                    const isSelected = selectedCategory === item.label;

                    return (
                      <div
                        key={item.label}
                        onClick={() => setSelectedCategory(item.label)}
                        style={
                          isSelected
                            ? { backgroundColor: '#0f1218', borderColor: 'var(--primary-color)' }
                            : {}
                        }
                        className={`p-5 rounded-3xl cursor-pointer transition-all border flex flex-col justify-between ${
                          isSelected
                            ? 'font-black ring-2 shadow-lg'
                            : 'bg-[#0f1218] border-white/10 hover:border-white/20 text-white'
                        }`}
                      >
                        <span style={{ color: 'var(--primary-color)' }} className="text-[10px] font-black uppercase tracking-widest mb-1">
                          {item.section}
                        </span>
                        <h4 className="text-sm font-black text-white tracking-wide">{item.label}</h4>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="hs-pill-btn hs-btn-dark py-4 text-xs font-black tracking-widest uppercase"
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="hs-pill-btn hs-btn-lime py-4 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'CREATING...' : 'CREATE CONTACT'}</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: INGRESO MANUAL COMPLETO */}
        {creationMode === 'manual' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Patricia Gómez"
                  className="w-full hs-input-hero text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@investor.com"
                  className="w-full hs-input-hero text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">Direct Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 604 555 8890"
                  className="w-full hs-input-hero text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+1 604 555 8890"
                  className="w-full hs-input-hero text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">Company / Fund</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Pan American Silver"
                  className="w-full hs-input-hero text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">Executive Title / Position</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Managing Director"
                  className="w-full hs-input-hero text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-300 block mb-1">Location / City & Country</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Vancouver, Canada / Bogota, Colombia"
                className="w-full hs-input-hero text-xs"
              />
            </div>

            {/* Quick Mic Audio Attachment */}
            <div className="p-4 rounded-2xl bg-[#0f1218] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black flex items-center gap-2" style={{ color: 'var(--primary-color)' }}>
                  <Mic className="w-4 h-4" />
                  <span>Quick Voice Note for Details</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1-Click Record</span>
              </div>

              {isRecording ? (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-black text-rose-400">Recording... {recordingTime}s</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-4 py-2 rounded-full bg-rose-500 text-white font-black text-xs"
                  >
                    Stop
                  </button>
                </div>
              ) : audioUrl ? (
                <div className="p-3.5 rounded-2xl bg-[#151922] border border-white/10 space-y-2">
                  <span className="text-xs font-black text-emerald-400 block">Audio Ready</span>
                  <audio src={audioUrl} controls className="w-full h-8" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full py-3 px-4 rounded-2xl bg-[#151922] border border-white/10 hover:border-white/30 text-slate-200 text-xs font-black flex items-center justify-center gap-2"
                >
                  <Mic style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
                  <span>Click to Record Quick Voice Note</span>
                </button>
              )}
            </div>

            {/* Outcrop Tag Taxonomy Section */}
            <div className="p-4 rounded-2xl bg-[#0f1218] border border-white/5 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider block" style={{ color: 'var(--primary-color)' }}>
                Outcrop Silver Strict Taxonomy
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Investor Type</label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full p-2 bg-[#151922] border border-white/10 rounded-xl text-xs text-white font-bold"
                  >
                    {Array.from(new Set([...OUTCROP_TAGS.INVESTOR_TYPES, ...customTypes])).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full p-2 bg-[#151922] border border-white/10 rounded-xl text-xs text-white font-bold"
                  >
                    {Array.from(new Set([...OUTCROP_TAGS.STAGES, ...customStages])).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2 bg-[#151922] border border-white/10 rounded-xl text-xs text-white font-bold"
                  >
                    {OUTCROP_TAGS.SOURCES.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="hs-pill-btn hs-btn-dark py-2 px-5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="hs-pill-btn hs-btn-lime py-2.5 px-6 text-xs font-extrabold"
              >
                {loading ? 'Saving...' : 'Create Contact'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
