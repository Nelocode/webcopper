// Ockham Telemetry - Sistema Nervioso (Recolector y Conector)

class OckhamTelemetry {
    constructor(engine) {
        this.engine = engine;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseUrl = isLocal ? 'http://localhost:3000' : '';
        
        this.webhookUrlInit = `${baseUrl}/api/ockham-init`;
        this.webhookUrlEvent = `${baseUrl}/api/ockham-event`;
        this.timeoutMs = 2000;
        
        // [#20] Rotación de Sesión 24h
        this.sessionId = this.getSessionId();
        
        this.deepReads = 0;
        this.historialEventos = [];

        // [#10] Pre-warm del servidor (Fire and Forget)
        fetch(`${baseUrl}/api/ping`).catch(() => {});

        // [#7] Inicializar Web Worker
        if (window.Worker) {
            this.worker = new Worker('assets/telemetry-worker.js');
        }
    }

    generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getSessionId() {
        let sid = sessionStorage.getItem('ockham_session_id');
        let timestamp = sessionStorage.getItem('ockham_session_time');
        
        const now = Date.now();
        // Expirar a las 24h
        if (!sid || !timestamp || (now - parseInt(timestamp) > 24 * 60 * 60 * 1000)) {
            sid = this.generateUUID();
            sessionStorage.setItem('ockham_session_id', sid);
            sessionStorage.setItem('ockham_session_time', now.toString());
            // Invalidamos la caché de layout
            sessionStorage.removeItem('ockham_layout_cache');
        }
        return sid;
    }

    getUTMData() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source') || null,
            utm_medium: urlParams.get('utm_medium') || null,
            utm_campaign: urlParams.get('utm_campaign') || null,
            user_email: urlParams.get('email') || null // Brevo can append ?email=...
        };
    }

    async getPayloadFromWorker() {
        return new Promise((resolve) => {
            if (this.worker) {
                this.worker.onmessage = (e) => {
                    if (e.data.type === 'PAYLOAD_READY') {
                        resolve(e.data.payload);
                    }
                };
                this.worker.postMessage({ 
                    type: 'COLLECT_PAYLOAD', 
                    data: { sessionId: this.sessionId, historialEventos: this.historialEventos, utm_data: this.getUTMData() }
                });
            } else {
                // Fallback sin worker
                const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
                resolve({
                    session_id: this.sessionId,
                    fecha_inicio: Date.now(),
                    zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    dispositivo: isMobile ? "movil" : "escritorio",
                    tipo_conexion: navigator.connection ? navigator.connection.effectiveType : "desconocida",
                    idioma: navigator.language || navigator.userLanguage || "desconocido",
                    historial_eventos: this.historialEventos,
                    utm_data: this.getUTMData()
                });
            }
        });
    }

    async init(forceRefresh = false) {
        this.setupIntentTracking();
        this.setupIntersectionObserver(); // [#2]
        this.checkBatteryAndConnection();
        this.flushOfflineQueue();
        this.setupErrorSensors(); // [FASE 10]

        const cachedLayout = sessionStorage.getItem('ockham_layout_cache');
        if (cachedLayout && this.engine && !forceRefresh) {
            console.log("[Ockham Telemetry] ⚡ Restaurando layout instantáneamente desde caché.");
            this.engine.execute(JSON.parse(cachedLayout));
            return;
        }

        const payload = await this.getPayloadFromWorker();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            console.log("[Ockham Telemetry] Enviando snapshot al orquestador...", payload);
            const response = await fetch(this.webhookUrlInit, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const jsonResponse = await response.json();
            sessionStorage.setItem('ockham_layout_cache', JSON.stringify(jsonResponse));
            
            if (this.engine) this.engine.execute(jsonResponse);

        } catch (error) {
            clearTimeout(timeoutId);
            console.warn("[Ockham Telemetry] Error/Timeout. Usando perfil Fallback Ockham.");
            const fallbackJSON = {
                perfil_visitante: "fallback_local",
                acciones_dom: [],
                mutaciones_contenido: []
            };
            if (this.engine) {
                this.engine.execute(fallbackJSON);
            }
        }
    }

    checkBatteryAndConnection() {
        const isSlow = navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType.includes('2g'));
        const handleBattery = (battery) => {
            if (isSlow || battery.level < 0.20 || battery.savePower) {
                const video = document.getElementById('hero_video_principal');
                if (video) video.pause();
            }
        };

        if (navigator.getBattery) {
            navigator.getBattery().then(handleBattery).catch(() => {});
        } else if (isSlow) {
            handleBattery({ level: 1 });
        }
    }

    // [FASE 10] Ockham Auditor: Sensores de dolor
    setupErrorSensors() {
        // 1. JS Errors
        window.addEventListener('error', (event) => {
            // Ignorar errores de extensiones (como Chrome DevTools)
            if (event.filename && event.filename.includes('extension://')) return;
            this.historialEventos.push(`error_js:${event.message}`);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.historialEventos.push(`error_promesa:${event.reason}`);
        });

        // 2. Resource 404s (Imágenes, videos rotos)
        window.addEventListener('error', (event) => {
            const target = event.target || event.srcElement;
            const isElement = target instanceof HTMLElement;
            if (isElement && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'IFRAME')) {
                this.historialEventos.push(`recurso_roto:${target.src || target.href}`);
            }
        }, true); // useCapture para recursos

        // 3. Monitor de Rendimiento
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navEntry = performance.getEntriesByType("navigation")[0];
                if (navEntry && (navEntry.loadEventEnd - navEntry.startTime > 3000)) {
                    this.historialEventos.push('rendimiento_lento');
                }
            }, 0);
        });
    }

    // [#2] Telemetría de Mirada (Granular)
    setupIntersectionObserver() {
        const options = { root: null, threshold: 0.5 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target._readTimer = setTimeout(() => {
                        this.registerDeepRead(entry.target);
                    }, 3000); // 3 segundos
                } else {
                    if (entry.target._readTimer) {
                        clearTimeout(entry.target._readTimer);
                    }
                }
            });
        }, options);

        // Seleccionamos los contenedores principales y los marcamos
        document.querySelectorAll('section[data-ockham-id], .split-card, .mocoa-360-container').forEach(el => {
            observer.observe(el);
        });
    }

    registerDeepRead(element) {
        // Evitamos contar múltiple veces el mismo elemento
        if (element.hasAttribute('data-read-logged')) return;
        element.setAttribute('data-read-logged', 'true');
        
        // Extraemos un identificador útil para que Gemini sepa qué está leyendo
        const id = element.getAttribute('data-ockham-id') || element.id || element.className.split(' ')[0] || 'seccion_desconocida';
        const evento = `lectura_profunda_${id}`;

        console.log(`[Ockham Telemetry] 🧠 Interés detectado en: ${id}`);
        this.sendIntent(evento);
        this.historialEventos.push(evento);
        this.deepReads++;

        // [#3] Mid-Session AI Re-orquestación
        if (this.deepReads >= 3) {
            console.log("🧠 [Ockham Telemetry] Re-orquestando layout en vivo basado en nuevos intereses...");
            this.init(true); // Forzamos bypass de caché
            this.deepReads = 0; // Reset
        }
    }

    setupIntentTracking() {
        let debounceTimer;
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-ockham-intent]');
            if (!target) return;
            
            // [#14] Debounce
            if (debounceTimer) return;
            debounceTimer = setTimeout(() => { debounceTimer = null; }, 500);

            // [#11] Háptica
            if (navigator.vibrate) navigator.vibrate(50);

            const intent = target.getAttribute('data-ockham-intent');
            this.sendIntent(intent);
        });

        document.addEventListener('mouseenter', (event) => {
            const target = event.target;
            if (target && target.hasAttribute && target.hasAttribute('data-ockham-intent')) {
                const href = target.getAttribute('href');
                if (href && !href.startsWith('#') && !target.hasAttribute('data-prefetched')) {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = href;
                    document.head.appendChild(link);
                    target.setAttribute('data-prefetched', 'true');
                }
            }
        }, true);
    }

    sendIntent(intentValue) {
        const payload = {
            evento_id: this.generateUUID(),
            session_id: this.sessionId,
            timestamp: Date.now(),
            intencion_ockham: intentValue,
            url_path: window.location.pathname
        };

        if (!navigator.onLine) {
            this.saveToOfflineQueue(payload);
            return;
        }

        this.transmitEvent(payload);
    }

    transmitEvent(payloadObj) {
        const blob = new Blob([JSON.stringify(payloadObj)], { type: 'application/json' });
        if (navigator.sendBeacon && navigator.sendBeacon(this.webhookUrlEvent, blob)) {
            // Success
        } else {
            fetch(this.webhookUrlEvent, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadObj),
                keepalive: true
            }).catch(() => this.saveToOfflineQueue(payloadObj));
        }
    }

    saveToOfflineQueue(payload) {
        const queue = JSON.parse(localStorage.getItem('ockham_offline_events') || '[]');
        queue.push(payload);
        localStorage.setItem('ockham_offline_events', JSON.stringify(queue));
    }

    flushOfflineQueue() {
        if (!navigator.onLine) return;
        const queue = JSON.parse(localStorage.getItem('ockham_offline_events') || '[]');
        if (queue.length === 0) return;

        console.log(`[Ockham Telemetry] Vaciando cola offline (${queue.length} eventos)...`);
        queue.forEach(evt => this.transmitEvent(evt));
        localStorage.removeItem('ockham_offline_events');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.ockhamEngine) {
        const telemetry = new OckhamTelemetry(window.ockhamEngine);
        telemetry.init();
        
        window.addEventListener('online', () => telemetry.flushOfflineQueue());
    }
});
