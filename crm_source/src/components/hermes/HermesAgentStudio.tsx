'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Paperclip,
  Mic,
  Square,
  Sparkles,
  Settings2,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Copy,
  Check,
  Globe,
  Database,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface HermesMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  attachments?: string | null;
  audioUrl?: string | null;
  workerName?: string | null;
  workerStatus?: string | null;
  workerData?: string | null;
  createdAt: string;
}

interface HermesSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

interface HermesAgentStudioProps {
  tenantId?: string;
  tenantName?: string;
}

export const HermesAgentStudio: React.FC<HermesAgentStudioProps> = ({
  tenantId,
  tenantName = 'Outcrop Silver Corp',
}) => {
  // Sessions & Messages State
  const [sessions, setSessions] = useState<HermesSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HermesMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Input States
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; url: string; size: number; type: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeWorker, setActiveWorker] = useState<string>('GENERAL');
  const [sessionSearch, setSessionSearch] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gateway Connection State
  const [endpointUrl, setEndpointUrl] = useState('http://localhost:8000');
  const [apiKey, setApiKey] = useState('hermes_outcrop_secret_2026');
  const [telegramBotToken, setTelegramBotToken] = useState('8925340221:AAHU0nrxvP2XqPewfZMK1GzmjjyFGPIUX8o');
  const [telegramChatId, setTelegramChatId] = useState('-5370719843');
  const [gatewayMode, setGatewayMode] = useState<'TELEGRAM' | 'HTTP_TUNNEL'>('TELEGRAM');
  const [botInfo, setBotInfo] = useState<any>(null);
  const [statusOnline, setStatusOnline] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─────────────────────────────────────────────────────────
  // INITIAL DATA & HEALTH CHECK
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSessions();
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Live polling for new messages when session is active
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    fetchSessionMessages(currentSessionId);
    const pollInterval = setInterval(() => {
      fetchSessionMessages(currentSessionId, true);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkHealth = async () => {
    try {
      const res = await fetch(`/api/hermes/status?tenantId=${tenantId || ''}`);
      const data = await res.json();
      if (data.success) {
        setStatusOnline(data.isReachable);
        setLatencyMs(data.latencyMs);
        setBotInfo(data.botInfo || null);
        if (data.config) {
          setEndpointUrl(data.config.endpointUrl || 'http://localhost:8000');
          setApiKey(data.config.apiKey || 'hermes_outcrop_secret_2026');
          setTelegramBotToken(data.config.telegramBotToken || '');
          setTelegramChatId(data.config.telegramChatId || '8724044473');
          setGatewayMode(data.config.gatewayMode || 'TELEGRAM');
        }
      }
    } catch (e) {
      setStatusOnline(false);
    }
  };

  const handleSaveConfig = async () => {
    setTestingPing(true);
    try {
      const res = await fetch('/api/hermes/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          endpointUrl,
          apiKey,
          telegramBotToken,
          telegramChatId,
          gatewayMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await checkHealth();
        setShowConfigModal(false);
      }
    } finally {
      setTestingPing(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/hermes/sessions?tenantId=${tenantId || ''}`);
      const data = await res.json();
      if (data.success && data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(data.sessions[0].id);
        }
      }
    } catch (e) {}
  };

  const fetchSessionMessages = async (sid: string, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/hermes/sessions/${sid}`);
      const data = await res.json();
      if (data.success && data.session) {
        setMessages(data.session.messages || []);
      }
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await fetch('/api/hermes/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          title: 'Nueva conversación',
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSessions([data.session, ...sessions]);
        setCurrentSessionId(data.session.id);
        setMessages([]);
      }
    } catch (e) {}
  };

  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación de Hermes?')) return;
    try {
      await fetch(`/api/hermes/sessions/${sid}`, { method: 'DELETE' });
      setSessions(sessions.filter((s) => s.id !== sid));
      if (currentSessionId === sid) {
        const remaining = sessions.filter((s) => s.id !== sid);
        setCurrentSessionId(remaining[0]?.id || null);
      }
    } catch (e) {}
  };

  // ─────────────────────────────────────────────────────────
  // FILE UPLOAD HANDLER
  // ─────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/hermes/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.file) {
          setAttachedFiles((prev) => [...prev, data.file]);
        }
      }
    } catch (err) {
      alert('Error al subir el archivo');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─────────────────────────────────────────────────────────
  // AUDIO RECORDING HANDLER
  // ─────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const formData = new FormData();
        formData.append('file', audioBlob, `voice_${Date.now()}.ogg`);

        try {
          const res = await fetch('/api/hermes/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.success && data.file) {
            handleSendMessage('', data.file.url);
          }
        } catch (e) {
          alert('Error al procesar la nota de voz');
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // ─────────────────────────────────────────────────────────
  // SEND MESSAGE HANDLER
  // ─────────────────────────────────────────────────────────

  const handleSendMessage = async (textOverride?: string, audioOverride?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : inputPrompt.trim();
    if (!textToSend && attachedFiles.length === 0 && !audioOverride) return;

    setSending(true);
    const tempInput = inputPrompt;
    const tempFiles = [...attachedFiles];
    setInputPrompt('');
    setAttachedFiles([]);

    try {
      const res = await fetch('/api/hermes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          tenantId,
          user: 'Nelson',
          message: textToSend,
          audioUrl: audioOverride || null,
          files: tempFiles,
          worker: activeWorker,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!currentSessionId && data.sessionId) {
          setCurrentSessionId(data.sessionId);
          await fetchSessions();
        }
        if (data.sessionId) {
          await fetchSessionMessages(data.sessionId);
        }
      } else {
        alert(data.error || 'Error al enviar mensaje a Hermes');
      }
    } catch (e) {
      alert('Error de conexión con el servidor');
    } finally {
      setSending(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full bg-[#131313] rounded-2xl border border-white/10 overflow-hidden text-[#E5E2E1]">
      {/* ── TOP HEADER ───────────────────────────────────────── */}
      <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between bg-[#1C1B1B] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">CopperMind AI Studio</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-neutral-400">
                Mac Mini Gateway
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Workers de Scraping, Extracción y Análisis Multimodal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
              statusOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                statusOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>{statusOnline ? `En Línea ${latencyMs ? `(${latencyMs}ms)` : ''}` : 'Mac Mini Offline (Co-pilot)'}</span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Configurar conexión con Mac Mini"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE (SIDEBAR + CHAT THREAD) ───────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT SESSION LIST */}
        <div className="w-64 border-r border-white/10 bg-[#161616] flex flex-col justify-between shrink-0 select-none">
          <div className="p-3 border-b border-white/10 space-y-2">
            <button
              onClick={handleCreateNewSession}
              className="w-full py-2 px-3 rounded-lg bg-[var(--accent-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Consulta</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar chats..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#202020] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">No hay conversaciones</div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = s.id === currentSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setCurrentSessionId(s.id)}
                    className={`group w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-primary)]/15 text-white border border-[var(--accent-primary)]/30 font-semibold'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="truncate text-white font-medium">{s.title || 'Nueva sesión'}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-2">
                        <span>{new Date(s.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
                        {s._count?.messages ? <span>• {s._count.messages} msgs</span> : null}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-white/10 text-[11px] text-neutral-500 text-center font-mono">
            {sessions.length} conversaciones registradas
          </div>
        </div>

        {/* CENTER CHAT THREAD */}
        <div className="flex-1 flex flex-col justify-between bg-[#131313] min-w-0">
          {/* MESSAGES SCROLLER */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-20 text-neutral-500 text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                <span>Cargando mensajes...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-[var(--accent-primary)]" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-white">¿En qué podemos colaborar con CopperMind?</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Escribe tu requerimiento, adjunta archivos PDF/CSV o envía una nota de voz para activar los workers de scraping e investigación en tu Mac Mini.
                  </p>
                </div>

                {/* Suggested Action Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full pt-4">
                  {[
                    {
                      label: '🕷️ Scrapear directorio minero',
                      desc: 'Extraer directores y correos de una empresa',
                      worker: 'SCRAPER',
                    },
                    {
                      label: '📄 Analizar documento técnico',
                      desc: 'Extraer leyes minerales y coordenadas',
                      worker: 'DOC_ANALYSIS',
                    },
                    {
                      label: '🔍 Buscar fondos en Vancouver',
                      desc: 'Identificar fondos mineros activos',
                      worker: 'RESEARCH',
                    },
                    {
                      label: '📊 Estructurar datos a CSV',
                      desc: 'Convertir reporte no estructurado en tabla',
                      worker: 'SCRAPER',
                    },
                  ].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveWorker(sug.worker);
                        setInputPrompt(`Por favor ejecuta la siguiente tarea: ${sug.label}`);
                      }}
                      className="p-3 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] border border-white/10 hover:border-white/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="font-bold text-xs text-white group-hover:text-[var(--accent-primary)] transition-colors">
                        {sug.label}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{sug.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                let parsedAttachments: any[] = [];
                if (m.attachments) {
                  try {
                    parsedAttachments = JSON.parse(m.attachments);
                  } catch (e) {}
                }

                return (
                  <div
                    key={m.id}
                    className={`flex gap-3.5 max-w-4xl mx-auto ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center font-bold shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
                      </div>
                    )}

                    <div
                      className={`space-y-2.5 max-w-[85%] ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Worker Execution Badge */}
                      {m.workerName && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#1C1B1B] border border-white/10 text-neutral-300">
                          <Zap className="w-3 h-3 text-[var(--accent-primary)]" />
                          <span>Worker: {m.workerName}</span>
                          {m.workerStatus === 'completed' && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${
                          isUser
                            ? 'bg-[var(--accent-primary)] text-white font-medium rounded-tr-sm'
                            : 'bg-[#1C1B1B] text-[#E5E2E1] border border-white/10 rounded-tl-sm font-normal'
                        }`}
                      >
                        {/* Audio Player if voice note */}
                        {m.audioUrl && (
                          <div className="mb-3 p-2.5 rounded-lg bg-black/30 border border-white/10">
                            <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              <Mic className="w-3 h-3 text-[var(--accent-primary)]" />
                              <span>Nota de voz procesada</span>
                            </div>
                            <audio controls src={m.audioUrl} className="w-full h-8" />
                          </div>
                        )}

                        {/* File Attachments */}
                        {parsedAttachments.length > 0 && (
                          <div className="mb-3 space-y-1.5">
                            {parsedAttachments.map((f: any, idx: number) => (
                              <a
                                key={idx}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/40 border border-white/10 text-xs transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                <span className="truncate font-medium flex-1">{f.name}</span>
                                <Download className="w-3 h-3 text-neutral-400" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Markdown / Text Content */}
                        <div className="whitespace-pre-wrap font-sans space-y-2">
                          {m.content}
                        </div>

                        {/* Message Actions */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[10px] opacity-70">
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            onClick={() => handleCopyText(m.id, m.content)}
                            className="hover:opacity-100 transition-opacity p-0.5"
                            title="Copiar texto"
                          >
                            {copiedMsgId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-white/10 text-white border border-white/20 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                        N
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* REAL-TIME THINKING & PROCESSING FEEDBACK INDICATOR */}
            {(sending || (messages.length > 0 && messages[messages.length - 1].role === 'user')) && (
              <div className="flex gap-3.5 max-w-4xl mx-auto items-start justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold shrink-0 mt-1 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="space-y-2 max-w-[85%]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                    <span>CopperMind Agent Activo</span>
                    <span className="text-[10px] text-cyan-500">• Mac Mini</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1C1B1B] to-[#151515] border border-cyan-500/20 shadow-xl space-y-3 relative overflow-hidden">
                    {/* Glowing animated line on top border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-200">
                        CopperMind está pensando y ejecutando la solicitud en tu Mac...
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                      <span className="text-cyan-400">⚡</span>
                      <span>Consultando herramientas locales, memoria y CRM...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── BOTTOM INPUT DOCK ───────────────────────────────── */}
          <div className="p-4 border-t border-white/10 bg-[#181717] space-y-3 shrink-0">
            {/* WORKER SELECTOR PILLS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-4xl mx-auto">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Worker:</span>
              {[
                { id: 'GENERAL', label: '🧠 CopperMind General' },
                { id: 'SCRAPER', label: '🕷️ Web Scraping Worker' },
                { id: 'DOC_ANALYSIS', label: '📄 Analizador de Documentos' },
                { id: 'RESEARCH', label: '🔍 Deep Market Research' },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWorker(w.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    activeWorker === w.id
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'bg-[#252424] text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* ATTACHED FILES PREVIEW */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap max-w-4xl mx-auto">
                {attachedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#252424] border border-white/10 text-xs text-white"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span className="max-w-[150px] truncate font-medium">{f.name}</span>
                    <button
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                      className="text-neutral-400 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* INPUT CONTROLS BAR */}
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#201F1F] p-2 rounded-2xl border border-white/10 focus-within:border-[var(--accent-primary)]/50 transition-all">
              {/* File Attachment Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.csv,.xlsx,.xls,.txt,.doc,.docx,.png,.jpg,.jpeg"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Adjuntar archivo (PDF, CSV, Excel, Imagen)"
              >
                <Paperclip className={`w-4 h-4 ${uploadingFile ? 'animate-bounce' : ''}`} />
              </button>

              {/* Audio Recording Button or Controls */}
              {isRecording ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-mono font-bold">{recordingSeconds}s</span>
                  <button
                    onClick={stopRecording}
                    className="p-1 rounded bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] ml-2"
                  >
                    Enviar Audio
                  </button>
                  <button onClick={cancelRecording} className="text-xs text-neutral-400 hover:text-white ml-1">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Grabar nota de voz"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              {/* Text Input */}
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={isRecording ? 'Grabando audio...' : 'Escribe tu solicitud para CopperMind o adjunta archivos...'}
                className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none resize-none py-2 px-2 max-h-32"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || (!inputPrompt.trim() && attachedFiles.length === 0)}
                className="p-2.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-30 text-white font-bold transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONFIGURATION & GATEWAY MODAL ───────────────────── */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B1B] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-bold text-sm text-white">Configuración del Gateway CopperMind (Mac Mini)</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Gateway Mode Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#131313] border border-white/10">
              <button
                type="button"
                onClick={() => setGatewayMode('TELEGRAM')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  gatewayMode === 'TELEGRAM'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ✈️ Telegram Gateway
              </button>
              <button
                type="button"
                onClick={() => setGatewayMode('HTTP_TUNNEL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  gatewayMode === 'HTTP_TUNNEL'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                🌐 HTTP / Túnel Directo
              </button>
            </div>

            <div className="space-y-4">
              {gatewayMode === 'TELEGRAM' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Token del Bot de Telegram (@BotFather)
                    </label>
                    <input
                      type="password"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#131313] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">
                      El token que te entregó @BotFather para el bot con el que escucha CopperMind.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Chat ID / Grupo de Telegram
                    </label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="-5370719843"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#131313] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">
                      ID del grupo o chat donde CopperMind recibe tareas (Grupo actual: -5370719843).
                    </p>
                  </div>

                  {botInfo && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                      <span>🤖 Bot Conectado: <strong>@{botInfo.username}</strong></span>
                      <span className="font-mono text-[11px]">ID: {botInfo.id}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      URL del Endpoint / Túnel de CopperMind
                    </label>
                    <input
                      type="text"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://tu-tunel.trycloudflare.com o http://localhost:8000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#131313] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      API Key / Token de Seguridad
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="hermes_outcrop_secret_2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#131313] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                    />
                  </div>
                </>
              )}

              <div className="p-3.5 rounded-xl bg-[#131313] border border-white/10">
                <div className="text-xs font-bold text-white">Webhook del CRM (Inbound Callbacks):</div>
                <div className="text-[11px] font-mono text-[var(--accent-primary)] break-all mt-0.5">
                  https://homunculus-host-outcrop-silver-crm.wu48i0.easypanel.host/api/hermes/webhook
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={testingPing}
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {testingPing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Guardar y Probar Conexión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
