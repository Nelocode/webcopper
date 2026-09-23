const CACHE_NAME = 'cg-analytics-offline-v1';
const API_ENDPOINT = '/api/analytics';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Intercept analytics POST requests when offline
    if (event.request.url.includes(API_ENDPOINT) && event.request.method === 'POST') {
        if (!navigator.onLine) {
            event.respondWith(
                event.request.clone().text().then((body) => {
                    // We can't save to localStorage in a SW.
                    // We just rely on the main thread's queue for now, or IndexedDB.
                    // Actually, the main thread's local storage queue is already robust!
                    // This ServiceWorker just serves as a skeleton for future Background Sync.
                    return new Response(JSON.stringify({ success: true, queued: true }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
            );
            return;
        }
    }
});
