/**
 * Copper Giant Resources Corp. - Comprehensive Private Analytics & Telemetry Engine (v190.0)
 * Captures deep visitor metadata, hardware telemetry, network signals, engagement time, and micro-interactions.
 */
(function () {
    'use strict';

    const MASTER_ANALYTICS_ENDPOINT = '/api/analytics';
    const SESSION_KEY = 'cg_analytics_sid';
    const VISITOR_KEY = 'cg_analytics_vid';
    const STORAGE_KEY = 'cg_analytics_events_queue';

    // 1. Session & Visitor ID Generation (Returning vs New)
    function getVisitorId() {
        let vid = localStorage.getItem(VISITOR_KEY);
        if (!vid) {
            vid = 'CG-VIS-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
            localStorage.setItem(VISITOR_KEY, vid);
            return { id: vid, isNew: true };
        }
        return { id: vid, isNew: false };
    }
    const visitorInfo = getVisitorId();

    function getSessionId() {
        let sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = 'CG-SESS-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
            sessionStorage.setItem(SESSION_KEY, sid);
            
            // Track previous page in session (Sankey basis)
            sessionStorage.setItem('cg_analytics_prev', document.referrer || 'Direct');
        }
        return sid;
    }

    // 2. Geo-IP Fetching (Client-side to distribute API load)
    let geoData = { country: 'Unknown', city: 'Unknown', ip: 'Unknown' };
    async function fetchGeoIP() {
        if (sessionStorage.getItem('cg_geo_data')) {
            geoData = JSON.parse(sessionStorage.getItem('cg_geo_data'));
            return;
        }
        try {
            const res = await fetch('https://ipapi.co/json/');
            const json = await res.json();
            geoData = { country: json.country_name, city: json.city, ip: json.ip };
            sessionStorage.setItem('cg_geo_data', JSON.stringify(geoData));
        } catch (e) {
            // Silently fallback if adblocker blocks it
        }
    }
    fetchGeoIP(); // Run non-blocking

    // 3. Hardware & Device Telemetry
    function getHardwareTelemetry() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        return {
            category: getDeviceCategory(),
            os: getOS(),
            browser: getBrowser(),
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A', // CPU Cores
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A', // RAM
            effectiveType: conn.effectiveType || 'N/A', // 4G, 3G, WiFi
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
        return 'Unknown Browser';
    }

    // 4. Temporal Metadata
    function getTemporalMetadata() {
        const now = new Date();
        return {
            timestampIso: now.toISOString(),
            dateString: now.toISOString().split('T')[0],
            timeString: now.toLocaleTimeString('en-US', { hour12: false })
        };
    }

    // 5. Page, Referral & Attribution Metadata
    function getPageMetadata() {
        const prevPage = sessionStorage.getItem('cg_analytics_prev') || 'Direct';
        sessionStorage.setItem('cg_analytics_prev', window.location.pathname); // Update for next page

        return {
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer || 'Direct Entry',
            previousPage: prevPage,
            isNewVisitor: visitorInfo.isNew
        };
    }

    // 6. Cloud Queue & Event Dispatcher
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
        // Inject Geo Data lazily
        eventData.geo = geoData;

        const queue = getStoredEvents();
        queue.unshift(eventData);
        saveStoredEvents(queue);

        if (isSyncing) return;
        isSyncing = true;

        const scheduleDispatch = window.requestIdleCallback || function (cb) { setTimeout(cb, 100); };

        scheduleDispatch(async () => {
            try {
                const pendingEvents = getStoredEvents();
                if (pendingEvents.length === 0) {
                    isSyncing = false;
                    return;
                }

                const res = await fetch(MASTER_ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingEvents)
                });
                
                if (res.ok) {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (err) {
                // Failover silently to client buffer
            } finally {
                isSyncing = false;
            }
        });
    }

    function trackEvent(eventType, eventDetails = {}) {
        const eventRecord = {
            id: 'EV-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            type: eventType,
            sessionId: getSessionId(),
            visitorId: visitorInfo.id,
            temporal: getTemporalMetadata(),
            page: getPageMetadata(),
            hardware: getHardwareTelemetry(),
            details: eventDetails
        };
        dispatchEvent(eventRecord);
    }

    window.CGAnalytics = { track: trackEvent };

    // 7. Advanced Event Listeners (Dwell, Bounce, Heatmap, Copy)
    document.addEventListener('DOMContentLoaded', () => {
        let pageLoadTime = Date.now();
        let activeDwellMs = 0;
        let lastVisibleTime = Date.now();
        let maxScrollPercent = 0;

        trackEvent('pageview', { entryTime: new Date().toLocaleTimeString() });

        // Dwell Time & Visibility tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                activeDwellMs += (Date.now() - lastVisibleTime);
            } else {
                lastVisibleTime = Date.now();
            }
        });

        // Bounce Tracking (Leaves < 5s without scroll)
        window.addEventListener('beforeunload', () => {
            if (!document.hidden) activeDwellMs += (Date.now() - lastVisibleTime);
            
            const totalSeconds = Math.round((Date.now() - pageLoadTime) / 1000);
            const activeSeconds = Math.round(activeDwellMs / 1000);
            const isBounce = (totalSeconds < 5 && maxScrollPercent < 10);
            
            if (isBounce) {
                trackEvent('bounce', { timeOnPage: totalSeconds });
            }
            trackEvent('page_exit', { totalSeconds, activeSeconds, maxScrollPercent });
        });

        // Click Heatmap Tracking (Throttle to 5 clicks max per page)
        let clickCount = 0;
        document.addEventListener('click', (e) => {
            if (clickCount < 5) {
                const isLinkOrBtn = e.target.closest('a, button');
                trackEvent('click_heatmap', {
                    x: e.clientX,
                    y: e.clientY,
                    w: window.innerWidth,
                    element: isLinkOrBtn ? (isLinkOrBtn.innerText || 'Button/Link').trim() : e.target.tagName
                });
                clickCount++;
            }
        });

        // Real PDF Downloads & Presentation
        let presentationOpenTime = null;
        document.addEventListener('click', (e) => {
            const presBtn = e.target.closest('a.nav-btn-solid[href*="presentation"], a[href*="investors.html#presentation"], a[href*="corporate-presentation.pdf"]');
            if (presBtn && !e.target.closest('a[download]')) {
                presentationOpenTime = Date.now();
                trackEvent('presentation_view', { sourceButton: presBtn.innerText.trim() });
            }

            const pdfLink = e.target.closest('a[href$=".pdf"][download]');
            if (pdfLink) {
                trackEvent('pdf_download', { file: pdfLink.getAttribute('href'), title: pdfLink.innerText.trim() });
            }
        });

        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('#btn-close-presentation, .modal-overlay');
            if (closeBtn && presentationOpenTime) {
                trackEvent('presentation_view_duration', { durationSeconds: Math.round((Date.now() - presentationOpenTime) / 1000) });
                presentationOpenTime = null;
            }
        });

        // Scroll Tracking
        let trackedMilestones = {};
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            maxScrollPercent = Math.max(maxScrollPercent, scrollPercent);
            
            [25, 50, 75, 100].forEach(m => {
                if (scrollPercent >= m && !trackedMilestones[m]) {
                    trackedMilestones[m] = true;
                    trackEvent('scroll_depth', { depthPercent: m });
                }
            });
        }, { passive: true });

        // Copy Text Espionage
        document.addEventListener('copy', () => {
            const selectedText = window.getSelection().toString().substring(0, 150);
            if (selectedText) {
                trackEvent('text_copy', { copiedSnippet: selectedText });
            }
        });
    });

})();


// --- LIVE MARKET TICKER LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    const tickerContainer = document.querySelector('.ticker-stocks');
    if (!tickerContainer) return; // Only run if ticker exists on page
    
    try {
        const res = await fetch('/api/market');
        if (!res.ok) return;
        const data = await res.json();
        
        const formatPrice = (price, curr) => price ? `${curr}${price.toFixed(price < 1 ? 3 : 2)}` : 'N/A';
        const formatChange = (change) => {
            if (change === null || change === undefined) return '';
            const color = change >= 0 ? '#4cd964' : '#ff3b30';
            const sign = change > 0 ? '+' : '';
            return `<span style="color: ${color};">${sign}${change.toFixed(2)}%</span>`;
        };

        const tsxv = data.find(d => d.symbol === 'CGNT.V') || {};
        const otc = data.find(d => d.symbol === 'LBCMF') || {};
        const fse = data.find(d => d.symbol === '29H0.F') || {};
        const cu = data.find(d => d.symbol === 'HG=F') || {};

        tickerContainer.innerHTML = `
            <span><strong>TSXV</strong>: CGNT ${formatPrice(tsxv.price, 'C$')} ${formatChange(tsxv.change)}</span>
            <span><strong>OTC</strong>: LBCMF ${formatPrice(otc.price, '$')} ${formatChange(otc.change)}</span>
            <span><strong>FSE</strong>: 29H0 ${formatPrice(fse.price, '€')} ${formatChange(fse.change)}</span>
            <span><strong>Cu</strong>: ${formatPrice(cu.price, '$')}/Lb ${formatChange(cu.change)}</span>
        `;
    } catch(e) {
        console.error("Market fetch error", e);
    }
});
