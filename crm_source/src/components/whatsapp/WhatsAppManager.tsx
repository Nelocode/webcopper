'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  MessageSquare,
  QrCode,
  Smartphone,
  ShieldCheck,
  Zap,
  RefreshCw,
  Send,
  Plus,
  Trash2,
  Lock,
  UserCheck,
  CheckCircle2,
  Radio,
  Check,
  X,
  Edit3,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react';

export interface WhitelistItem {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: string;
  isActive: boolean;
}

export interface PendingRequest {
  fromNumber: string;
  senderName: string;
  lastMessage: string;
  createdAt: string;
}

export interface WhatsAppManagerProps {
  tenantId?: string;
  tenantName?: string;
}

export const WhatsAppManager: React.FC<WhatsAppManagerProps> = ({ tenantId, tenantName }) => {
  const [session, setSession] = useState<{
    status: string;
    phoneNumber: string | null;
    qrCode: string | null;
  }>({ status: 'DISCONNECTED', phoneNumber: null, qrCode: null });

  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  // Editable Names for Pending Requests: { [fromNumber]: name }
  const [editingNames, setEditingNames] = useState<{ [key: string]: string }>({});

  // Whitelist Manual Form State
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sandbox Command Test State
  const [testPhone, setTestPhone] = useState('+57 300 123 4567');
  const [testMessage, setTestMessage] = useState('Hola');
  const [loading, setLoading] = useState(false);
  const [lastBotResponse, setLastBotResponse] = useState<string | null>(null);

  useEffect(() => {
    let intervalMs = 2000;
    let timeoutId: ReturnType<typeof setTimeout>;
    let consecutiveErrors = 0;

    const poll = async () => {
      try {
        await fetchSession();
        consecutiveErrors = 0;
        intervalMs = 2000; // Reset on success
      } catch {
        consecutiveErrors++;
        intervalMs = Math.min(30000, 2000 * Math.pow(2, consecutiveErrors)); // Max 30s
      }
      timeoutId = setTimeout(poll, intervalMs);
    };

    poll();
    return () => clearTimeout(timeoutId);
  }, []);

  const getQrSrc = (qr: string | null): string | null => {
    if (!qr) return null;
    if (qr.startsWith('data:image/') || qr.startsWith('http://') || qr.startsWith('https://')) return qr;
    if (qr.startsWith('iVBORw0KGgo') || qr.length > 500) {
      const clean = qr.replace(/^data:image\/[a-z]+;base64,/, '');
      return `data:image/png;base64,${clean}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qr)}`;
  };

  useEffect(() => {
    if (session.qrCode) {
      const src = getQrSrc(session.qrCode);
      setQrImageUrl(src);
    } else {
      setQrImageUrl(null);
    }
  }, [session.qrCode]);

  const fetchSession = async () => {
    try {
      const query = tenantId ? `?tenantId=${tenantId}` : '';
      const res = await fetch(`/api/whatsapp${query}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setWhitelist(data.whitelist || []);
        setPendingRequests(data.pendingRequests || []);
        setMessages(data.messages || []);

        // Initialize default editable names if not already set
        if (data.pendingRequests && Array.isArray(data.pendingRequests)) {
          setEditingNames(prev => {
            const updated = { ...prev };
            data.pendingRequests.forEach((req: PendingRequest) => {
              if (!updated[req.fromNumber]) {
                updated[req.fromNumber] = req.senderName && req.senderName !== 'Usuario WhatsApp' ? req.senderName : 'Administrador Autorizado';
              }
            });
            return updated;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [pairingPhone, setPairingPhone] = useState('+573124031892');
  const [generatedPairingCode, setGeneratedPairingCode] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; isBot: boolean; time: string }>>([
    {
      sender: 'Outcrop Silver Bot',
      text: '👋 ¡Hola! Soy el Bot Ejecutivo de Outcrop Silver CRM. Escribe "Hola", "Resumen del CRM", "/scan" o "Agrega a un contacto" para probar mis respuestas en tiempo real.',
      isBot: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');

    const newMsg = {
      sender: pairingPhone || 'Nelson Carvajal',
      text: userText,
      isBot: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_MESSAGE', phoneNumber: pairingPhone || '+573124031892', message: userText }),
      });
      const data = await res.json();
      if (data.success && data.botResponse) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'Outcrop Silver Bot',
            text: data.botResponse,
            isBot: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDirectPair = async () => {
    if (!pairingPhone) return alert('Por favor ingresa tu número de WhatsApp con código de país');
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DIRECT_PAIR', phoneNumber: pairingPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setWhitelist(data.whitelist || []);
        if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        setToastMessage(`⚡ Dispositivo ${pairingPhone} vinculado instantáneamente.`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONNECT', tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        fetchSession();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePairing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SIMULATE_PAIRING', phoneNumber: testPhone, tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // APPROVE PENDING ACCESS REQUEST WITH EDITABLE NAME
  const handleApproveRequest = async (fromNumber: string) => {
    const nameToUse = editingNames[fromNumber]?.trim() || 'Administrador Autorizado';
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_REQUEST',
          fromNumber,
          name: nameToUse,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.whitelist) setWhitelist(data.whitelist);
        if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        setToastMessage(`✅ ¡Acceso aprobado para ${nameToUse}! Ya puede interactuar con el bot.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(`Error al aprobar: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error de red: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // REJECT PENDING ACCESS REQUEST
  const handleRejectRequest = async (fromNumber: string) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_REQUEST',
          fromNumber,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.whitelist) setWhitelist(data.whitelist);
        if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        setToastMessage('❌ Solicitud rechazada.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWhitelist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAdminPhone.trim()) {
      alert('Por favor ingresa un número de teléfono de WhatsApp.');
      return;
    }

    const phoneToAdd = newAdminPhone.trim();
    const nameToAdd = newAdminName.trim() || 'Administrador ' + (tenantName || 'Autorizado');

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_WHITELIST',
          phoneNumber: phoneToAdd,
          name: nameToAdd,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAdminPhone('');
        setNewAdminName('');
        if (data.whitelist) setWhitelist(data.whitelist);
        if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        setToastMessage(`✅ Administrador ${nameToAdd} (${phoneToAdd}) autorizado exitosamente.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(`Error al guardar: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error de red: ${e.message}`);
    }
  };

  const handleRemoveWhitelist = async (id: string, phone: string) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE_WHITELIST', id, phoneNumber: phone, tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.whitelist) setWhitelist(data.whitelist);
        if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        setToastMessage('🗑️ Administrador eliminado de la Whitelist.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          phoneNumber: testPhone,
          message: testMessage,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastBotResponse(data.botResponse);
        fetchSession();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-['Urbanist'] max-w-6xl mx-auto animate-fadeIn">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-3 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <MessageSquare style={{ color: 'var(--primary-color)' }} className="w-8 h-8" />
              <span>WhatsApp Baileys & Executive NLP</span>
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
              ANTI-BAN SHIELD & NLP ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Bot de WhatsApp con Escudo Anti-Baneo, Lenguaje Natural (ES/EN), vCard nativa (.vcf), Escáner guiado por fotos y Transcripción IA.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
              v9.2 — 1-CLIC INSTANT PAIRING
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Anti-Ban Engine Active</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-slate-300 border border-white/10 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>NLP ES / EN Active</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-slate-300 border border-white/10 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-400" />
              <span>vCard (.vcf) Auto-Attach</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSession}
            style={{ backgroundColor: 'var(--bg-card-inner)' }}
            className="p-2.5 rounded-full text-slate-300 hover:text-white transition-transform hover:scale-105"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 1: CONNECTION STATUS & QR CODE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-6 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Socket Status</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-white uppercase font-mono">{session.status}</div>
            <p className="text-xs text-slate-400 font-medium">
              {session.status === 'CONNECTED'
                ? `Paired Device: ${session.phoneNumber}`
                : 'Waiting for on-screen QR code scan...'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full hs-pill-btn hs-btn-lime py-2.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <QrCode className="w-4 h-4" />
              <span>{loading ? 'Generating New QR...' : '⚡ Generate / Re-generate QR Code'}</span>
            </button>

            <button
              onClick={handleSimulatePairing}
              disabled={loading}
              style={{ backgroundColor: 'var(--bg-card-inner)' }}
              className="w-full py-2 rounded-full text-xs font-black text-slate-300 hover:text-white transition-colors"
            >
              Simulate Direct Pairing (Sandbox)
            </button>
          </div>
        </div>

        {/* Real Scannable 2D Barcode Display Card */}
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-6 rounded-[28px] border border-white/5 space-y-3 shadow-xl flex flex-col items-center justify-center text-center">
          {session.qrCode ? (
            <div className="p-4 bg-white rounded-2xl shadow-2xl space-y-2 border border-slate-200 animate-fadeIn">
              <img
                src={qrImageUrl || getQrSrc(session.qrCode) || ''}
                alt="WhatsApp Baileys QR Code"
                className="w-52 h-52 object-contain mx-auto rounded-lg shadow-md bg-white"
              />
              <p className="text-[11px] text-slate-900 font-extrabold uppercase tracking-wide">
                Escanea este código QR con WhatsApp en tu celular
              </p>
            </div>
          ) : session.status === 'CONNECTING' ? (
            <div className="py-8 space-y-3">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-cyan-400 font-bold tracking-wide">
                Conectando con servidores centrales de WhatsApp...
              </p>
              <p className="text-[11px] text-slate-400">
                El código QR oficial se generará automáticamente en unos segundos.
              </p>
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {session.status === 'CONNECTED'
                  ? `WhatsApp Conectado (${session.phoneNumber}). Para vincular otro número, haz clic en "⚡ Generar / Re-generar Código QR".`
                  : 'Haz clic en "⚡ Generar / Re-generar Código QR" para solicitar un nuevo código.'}
              </p>
            </div>
          )}
        </div>

        {/* Instant 1-Click Direct Pairing Card */}
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-6 rounded-[28px] border border-cyan-500/20 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <Zap className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase text-white">Vinculación Directa Instantánea (1-Clic)</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Ingresa tu número de teléfono de WhatsApp con código de país para conectar y autorizar tu dispositivo de forma inmediata sin errores de red:
          </p>

          <div className="space-y-2.5">
            <input
              type="text"
              value={pairingPhone}
              onChange={(e) => setPairingPhone(e.target.value)}
              placeholder="+573124031892"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 font-mono font-bold"
            />
            <button
              type="button"
              onClick={handleDirectPair}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'Vinculando...' : '⚡ Activar y Vincular WhatsApp Ahora (1-Clic)'}</span>
            </button>
          </div>

          <p className="text-[10px] text-emerald-400/80 font-mono text-center pt-1">
            ✓ Autoriza tu número inmediatamente en el CRM para interactuar con el Bot por WhatsApp.
          </p>
        </div>
      </div>

      {/* SECTION 1.5: LIVE INTERACTIVE BOT CHAT TESTER */}
      <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-6 lg:p-8 rounded-[28px] border border-white/10 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>💬 Chat Interactivo del Bot Ejecutivo (Prueba en Vivo)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  LIVE RESPONSE ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Escribe cualquier mensaje como usuario autorizado ({pairingPhone}) y mira la respuesta oficial del Bot con comandos NLP en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Test Prompt Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Pruebas Rápidas:</span>
          {['Hola', 'Dame un resumen del CRM', '/scan', 'Agrega a Carlos Ruiz de Bancolombia director carlos@bancolombia.com'].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => {
                setChatInput(promptText);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="h-64 overflow-y-auto p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3 font-sans">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                <span className="font-bold text-slate-300">{msg.sender}</span>
                <span>•</span>
                <span>{msg.time}</span>
              </div>
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.isBot
                    ? 'bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none shadow-md font-mono'
                    : 'bg-emerald-600 text-white rounded-tr-none font-medium shadow-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendChatMessage} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Escribe tu mensaje o comando para el Bot (ej: Hola, Resumen, Agrega a...)"
            className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span>Enviar</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* SECTION 2: PENDING APPROVAL REQUESTS (LIVE DEMO FEATURE WITH CONTACT NAMES) */}
      {pendingRequests.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--primary-color)' }} className="p-6 lg:p-8 rounded-[28px] border-2 space-y-6 shadow-2xl animate-pulseOnce">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Pending Access Requests</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                    {pendingRequests.length} PENDING
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Contacts that messaged the bot. Displaying real WhatsApp profile name. Click "Approve" for instant access.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.fromNumber}
                style={{ backgroundColor: 'var(--bg-card-inner)' }}
                className="p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Incoming WhatsApp Request
                    </span>

                    {/* PROMINENT CONTACT PROFILE NAME DISPLAY */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">
                          {req.senderName || 'WhatsApp User'}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400">
                          {req.fromNumber.startsWith('+') ? req.fromNumber : `Phone / JID: ${req.fromNumber}`}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 italic mt-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      "{req.lastMessage}"
                    </p>
                  </div>
                </div>

                {/* Name Edit Input & Action Buttons */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-300 uppercase mb-1 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-cyan-400" />
                      <span>Authorized Admin Name in Whitelist:</span>
                    </label>
                    <input
                      type="text"
                      value={editingNames[req.fromNumber] || req.senderName || ''}
                      onChange={(e) => setEditingNames({ ...editingNames, [req.fromNumber]: e.target.value })}
                      placeholder="Administrator Name (e.g. Sara / Nelson)"
                      className="w-full hs-input-hero text-xs py-2 font-bold text-white bg-black/60 border-cyan-500/30 focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveRequest(req.fromNumber)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>✅ Approve Access ({editingNames[req.fromNumber] || req.senderName || 'Admin'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectRequest(req.fromNumber)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-black flex items-center justify-center transition-colors cursor-pointer"
                      title="Reject Request"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: ADMIN WHITELIST MANAGER */}
      <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-6 lg:p-8 rounded-[28px] border border-white/5 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <UserCheck style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Authorized Administrators Whitelist ({whitelist.length})
            </h3>
          </div>

          <span className="text-xs text-slate-400 font-medium">Only authorized phone numbers can execute bot commands</span>
        </div>

        {/* Whitelist Add Form */}
        <form onSubmit={handleAddWhitelist} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="WhatsApp Number with country code (e.g. +1 212 555 0198)"
            value={newAdminPhone}
            onChange={(e) => setNewAdminPhone(e.target.value)}
            className="hs-input-hero text-xs py-2 font-mono"
          />

          <input
            type="text"
            placeholder="Administrator Name (e.g. Nelson Carvajal)"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            className="hs-input-hero text-xs py-2"
          />

          <button
            type="button"
            onClick={handleAddWhitelist}
            className="hs-pill-btn hs-btn-lime py-2 px-5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Authorize Administrator</span>
          </button>
        </form>

        {/* Whitelist Table List */}
        <div className="space-y-2">
          {whitelist.map((item) => (
            <div
              key={item.id}
              style={{ backgroundColor: 'var(--bg-card-inner)' }}
              className="p-3.5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{item.name || 'Authorized Administrator'}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{item.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  AUTHORIZED
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveWhitelist(item.id, item.phoneNumber)}
                  className="p-1.5 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove from Whitelist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: INTERACTIVE ADMIN COMMAND TESTING SANDBOX */}
      <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-6 lg:p-8 rounded-[28px] border border-white/5 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Zap style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              IR Command Testing Console (Admin Sandbox)
            </h3>
          </div>
        </div>

        <form onSubmit={handleSendCommand} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1 uppercase">
                Sender Phone Number:
              </label>
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full hs-input-hero text-xs py-2 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-300 mb-1 uppercase">
                WhatsApp Command / Message:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hello or /create Patricia Gomez, Pan American, pgomez@panamerican.com, HNW investor"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full hs-input-hero text-xs py-2 font-mono"
              />
            </div>
          </div>

          {/* Preset Command Quick Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Commands:</span>
            <button
              type="button"
              onClick={() => setTestMessage('Hello')}
              className="px-3 py-1 rounded-full bg-black/40 text-slate-200 text-[10px] font-mono hover:bg-black"
            >
              Hello (Greeting + Menu)
            </button>
            <button
              type="button"
              onClick={() => setTestMessage('/search Pedro')}
              className="px-3 py-1 rounded-full bg-black/40 text-slate-200 text-[10px] font-mono hover:bg-black"
            >
              /search Pedro
            </button>
            <button
              type="button"
              onClick={() => setTestMessage('/create John Perez, Mining PE, john@investor.com, Institutional')}
              className="px-3 py-1 rounded-full bg-black/40 text-slate-200 text-[10px] font-mono hover:bg-black"
            >
              /create John Perez...
            </button>
            <button
              type="button"
              onClick={() => setTestMessage('/stats')}
              className="px-3 py-1 rounded-full bg-black/40 text-slate-200 text-[10px] font-mono hover:bg-black"
            >
              /stats
            </button>
            <button
              type="button"
              onClick={() => setTestMessage('/whitelist list')}
              className="px-3 py-1 rounded-full bg-black/40 text-slate-200 text-[10px] font-mono hover:bg-black"
            >
              /whitelist list
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full hs-pill-btn hs-btn-lime py-3 text-xs font-black flex items-center justify-center gap-2 shadow-xl"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Executing Command...' : 'Send Command to WhatsApp Bot'}</span>
          </button>
        </form>

        {/* Bot Response Box */}
        {lastBotResponse && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-black text-slate-400 border-b border-white/10 pb-2">
              <span>CRM AUTOMATED BOT RESPONSE (BAILEYS)</span>
              <span className="text-emerald-400 font-mono">200 OK</span>
            </div>
            <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
              {lastBotResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
