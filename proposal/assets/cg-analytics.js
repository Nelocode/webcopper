/**
 * Copper Giant Resources Corp. - Comprehensive Private Analytics & Telemetry Engine (v186.0)
 * Captures deep visitor metadata, hardware telemetry, network signals, engagement time, and micro-interactions.
 */
(function () {
    'use strict';

    const MASTER_ANALYTICS_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a04ccf2d01a04d7b7f41046f';
    const SESSION_KEY = 'cg_analytics_sid';
    const STORAGE_KEY = 'cg_analytics_events_queue';

    // 1. Session ID & Unique Identifier Generation
    function getSessionId() {
        let sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = 'CG-SESS-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
            sessionStorage.setItem(SESSION_KEY, sid);
        }
        return sid;
    }

    // 2. Hardware & Device Telemetry (CPU, Memory, Touch, Screen, Connection)
    function getHardwareTelemetry() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        return {
            category: getDeviceCategory(),
            os: getOS(),
            browser: getBrowser(),
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            colorDepth: window.screen.colorDepth || 24,
            pixelRatio: window.devicePixelRatio || 1,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A', // CPU Cores
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A', // RAM
            maxTouchPoints: navigator.maxTouchPoints || 0,
            effectiveType: conn.effectiveType || 'N/A', // 4G, 3G, WiFi
            downlink: conn.downlink ? `${conn.downlink} Mbps` : 'N/A',
            rtt: conn.rtt ? `${conn.rtt} ms` : 'N/A'
        };
    }

    function getDeviceCategory() {
        const ua = navigator.userAgent || '';
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
        if (/mobile|iphone|ipod|android|blackberry|mini|windows phone/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    function getOS() {
        const ua = navigator.userAgent || '';
        if (ua.includes('Mac OS X')) return 'macOS';
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        if (ua.includes('Linux')) return 'Linux';
        return 'Unknown OS';
    }

    function getBrowser() {
        const ua = navigator.userAgent || '';
        if (ua.includes('Edg/')) return 'Edge';
        if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
        if (ua.includes('Firefox/')) return 'Firefox';
        return 'Browser';
    }

    // 3. Temporal, Timezone & Regional Metadata
    function getTemporalMetadata() {
        const now = new Date();
        let timeZone = 'UTC';
        try {
            timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {}

        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return {
            timestampIso: now.toISOString(),
            dateString: now.toISOString().split('T')[0],
            timeString: now.toLocaleTimeString('en-US', { hour12: false }),
            timezone: timeZone,
            tzOffsetMinutes: now.getTimezoneOffset(),
            dayOfWeek: days[now.getDay()],
            hourOfDay: now.getHours()
        };
    }

    // 4. Page, Referral & Attribution Metadata
    function getPageMetadata() {
        const params = new URLSearchParams(window.location.search);
        return {
            url: window.location.href,
            path: window.location.pathname + window.location.hash,
            title: document.title,
            referrer: document.referrer || 'Direct Entry',
            lang: document.documentElement.lang || 'en',
            utmSource: params.get('utm_source') || params.get('ref') || 'direct',
            utmMedium: params.get('utm_medium') || (document.referrer ? 'referral' : 'none'),
            utmCampaign: params.get('utm_campaign') || 'organic',
            utmContent: params.get('utm_content') || '',
            utmTerm: params.get('utm_term') || ''
        };
    }

    // 5. Cloud Queue & Event Dispatcher
    function getStoredEvents() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveStoredEvents(events) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500)));
        } catch (e) {}
    }

    let isSyncing = false;

    async function dispatchEvent(eventData) {
        const queue = getStoredEvents();
        queue.unshift(eventData);
        saveStoredEvents(queue);

        if (isSyncing) return;
        isSyncing = true;

        const scheduleDispatch = window.requestIdleCallback || function (cb) { setTimeout(cb, 100); };

        scheduleDispatch(async () => {
            try {
                const getRes = await fetch(MASTER_ANALYTICS_ENDPOINT + '?t=' + Date.now());
                let serverList = [];
                let payloadMeta = { name: "CopperGiant Master Database 2026", data: {} };

                if (getRes.ok) {
                    const json = await getRes.json();
                    if (json && json.data) {
                        payloadMeta = json;
                        if (Array.isArray(json.data.analytics)) {
                            serverList = json.data.analytics;
                        }
                    }
                }

                const exists = serverList.some(item => item.id === eventData.id);
                if (!exists) {
                    serverList.unshift(eventData);
                }

                if (serverList.length > 3000) {
                    serverList = serverList.slice(0, 3000);
                }

                const updatedPayload = {
                    name: payloadMeta.name || "CopperGiant Master Database 2026",
                    data: {
                        ...(payloadMeta.data || {}),
                        analytics: serverList
                    }
                };

                await fetch(MASTER_ANALYTICS_ENDPOINT, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedPayload)
                });
            } catch (err) {
                // Failover silently to client buffer
            } finally {
                isSyncing = false;
            }
        });
    }

    // 6. Primary Event Tracker
    function trackEvent(eventType, eventDetails = {}) {
        const eventRecord = {
            id: 'EV-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            type: eventType,
            sessionId: getSessionId(),
            temporal: getTemporalMetadata(),
            page: getPageMetadata(),
            hardware: getHardwareTelemetry(),
            details: eventDetails
        };

        dispatchEvent(eventRecord);
    }

    // Expose global tracker object
    window.CGAnalytics = {
        track: trackEvent
    };

    // 7. Automatic Event & Micro-Interaction Listeners
    document.addEventListener('DOMContentLoaded', () => {
        let pageStartTime = Date.now();

        // Track Initial Pageview
        trackEvent('pageview', {
            entryTime: new Date().toLocaleTimeString('en-US', { hour12: false })
        });

        // Track Presentation Deck Views & Duration
        let presentationOpenTime = null;

        document.addEventListener('click', (e) => {
            const presBtn = e.target.closest('a.nav-btn-solid[href*="presentation"], a[href*="investors.html#presentation"], a[href*="corporate-presentation.pdf"], a[href="#presentation"], button[onclick*="Presentation"]');
            if (presBtn) {
                presentationOpenTime = Date.now();
                trackEvent('presentation_view', {
                    sourceButton: presBtn.innerText.trim() || 'View Presentation',
                    pdf: 'assets/corporate-presentation.pdf'
                });
            }

            // Document PDF Downloads
            const pdfLink = e.target.closest('a[href$=".pdf"], a[download]');
            if (pdfLink && !presBtn) {
                trackEvent('pdf_download', {
                    file: pdfLink.getAttribute('href'),
                    title: pdfLink.innerText.trim() || pdfLink.getAttribute('download') || 'PDF Document'
                });
            }

            // Language Switcher
            const langBtn = e.target.closest('#langToggleBtn, .lang-option');
            if (langBtn) {
                trackEvent('language_change', {
                    newLang: document.documentElement.lang === 'es' ? 'en' : 'es'
                });
            }
        });

        // Track Presentation Close & Duration
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('#btn-close-presentation, .modal-overlay');
            if (closeBtn && presentationOpenTime) {
                const durationSec = Math.round((Date.now() - presentationOpenTime) / 1000);
                trackEvent('presentation_view_duration', { durationSeconds: durationSec });
                presentationOpenTime = null;
            }
        });

        // Track Scroll Depth Milestones
        let trackedMilestones = {};
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            [25, 50, 75, 100].forEach(m => {
                if (scrollPercent >= m && !trackedMilestones[m]) {
                    trackedMilestones[m] = true;
                    trackEvent('scroll_depth', { depthPercent: m });
                }
            });
        }, { passive: true });

        // Track Text Copy Events (If investor copies technical or financial figures)
        document.addEventListener('copy', () => {
            const selectedText = window.getSelection().toString().substring(0, 100);
            if (selectedText) {
                trackEvent('text_copy', { copiedSnippet: selectedText });
            }
        });

        // Track Page Focus / Blur (Tab switching)
        document.addEventListener('visibilitychange', () => {
            trackEvent('visibility_change', {
                state: document.hidden ? 'hidden' : 'visible',
                timeOnPageSec: Math.round((Date.now() - pageStartTime) / 1000)
            });
        });
    });

})();
