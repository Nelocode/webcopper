// telemetry-worker.js
// Recolecta data del navegador y prepara payloads sin bloquear el Main Thread.

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'COLLECT_PAYLOAD') {
        const payload = {
            session_id: data.sessionId,
            fecha_inicio: Date.now(),
            zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dispositivo: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) ? "movil" : "escritorio",
            tipo_conexion: navigator.connection ? navigator.connection.effectiveType : "desconocida",
            idioma: navigator.language || navigator.userLanguage || "desconocido",
            historial_eventos: data.historialEventos || []
        };
        self.postMessage({ type: 'PAYLOAD_READY', payload });
    }
};
