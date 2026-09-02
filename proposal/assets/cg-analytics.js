/**
 * Copper Giant Resources Corp. - Private Analytics & Campaign Tracking Engine (v184.0)
 * Lightweight, non-blocking, privacy-compliant client analytics script.
 */
(function () {
    'use strict';

    const MASTER_ANALYTICS_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a04ccf2d01a04d7b7f41046f';
    const SESSION_KEY = 'cg_analytics_sid';
    const STORAGE_KEY = 'cg_analytics_events_queue';

    // 1. Session & Device Metadata Extraction
    function getSessionId() {
        let sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = 'CG-SESS-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            sessionStorage.setItem(SESSION_KEY, sid);
        }
        return sid;
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

    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source') || params.get('ref') || 'direct',
            medium: params.get('utm_medium') || (document.referrer ? 'referral' : 'none'),
            campaign: params.get('utm_campaign') || 'organic',
            content: params.get('utm_content') || '',
            term: params.get('utm_term') || '',
            gclid: params.get('gclid') || '',
            fbclid: params.get('fbclid') || ''
        };
    }

    function getPageMetadata() {
        return {
            path: window.location.pathname + window.location.hash,
            title: document.title,
            referrer: document.referrer || 'Direct',
            lang: document.documentElement.lang || 'en',
            screen: `${window.screen.width}x${window.screen.height}`
        };
    }

    // 2. Queue & Cloud Database Synchronization
    function getStoredEvents() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveStoredEvents(events) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500))); // Keep last 500
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
                // Fetch current master database list
                const getRes = await fetch(MASTER_ANALYTICS_ENDPOINT + '?t=' + Date.now());
                let serverList = [];
                let payloadMeta = { name: "CopperGiant Live Visitors Master Database 2026", data: {} };

                if (getRes.ok) {
                    const json = await getRes.json();
                    if (json && json.data) {
                        payloadMeta = json;
                        if (Array.isArray(json.data.analytics)) {
                            serverList = json.data.analytics;
                        }
                    }
                }

                // Append new analytics event avoiding exact duplicate ids
                const exists = serverList.some(item => item.id === eventData.id);
                if (!exists) {
                    serverList.unshift(eventData);
                }

                // Keep master server analytics list trimmed to top 2000 events
                if (serverList.length > 2000) {
                    serverList = serverList.slice(0, 2000);
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
                // Silent failover to local storage
            } finally {
                isSyncing = false;
            }
        });
    }

    // 3. Track Core Events
    function trackEvent(eventType, eventDetails = {}) {
        const eventRecord = {
            id: 'EV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            type: eventType,
            sessionId: getSessionId(),
            page: getPageMetadata(),
            utm: getUTMParams(),
            device: {
                category: getDeviceCategory(),
                os: getOS(),
                browser: getBrowser()
            },
            details: eventDetails
        };

        dispatchEvent(eventRecord);
    }

    // Expose global tracker instance
    window.CGAnalytics = {
        track: trackEvent,
        getUTM: getUTMParams
    };

    // 4. Automatic Event Listeners
    document.addEventListener('DOMContentLoaded', () => {
        // Track Pageview
        trackEvent('pageview', {
            url: window.location.href
        });

        // Intercept Presentation View Clicks ("View Presentation")
        document.addEventListener('click', (e) => {
            const presBtn = e.target.closest('a.nav-btn-solid[href*="presentation"], a[href*="investors.html#presentation"], a[href*="corporate-presentation.pdf"], a[href="#presentation"], button[onclick*="Presentation"]');
            if (presBtn) {
                trackEvent('presentation_view', {
                    sourceButton: presBtn.innerText.trim() || 'View Presentation',
                    pdf: 'assets/corporate-presentation.pdf'
                });
            }

            // Intercept PDF Downloads
            const pdfLink = e.target.closest('a[href$=".pdf"], a[download]');
            if (pdfLink && !presBtn) {
                trackEvent('pdf_download', {
                    file: pdfLink.getAttribute('href'),
                    title: pdfLink.innerText.trim() || pdfLink.getAttribute('download') || 'PDF Document'
                });
            }

            // Intercept Language Switcher
            const langBtn = e.target.closest('#langToggleBtn, .lang-option');
            if (langBtn) {
                trackEvent('language_change', {
                    newLang: document.documentElement.lang === 'es' ? 'en' : 'es'
                });
            }
        });

        // Track Scroll Depth Milestones (25%, 50%, 75%, 100%)
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
    });

})();
