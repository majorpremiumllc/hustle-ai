/* ─────────────────────────────────────────────
   HustleAI — Service Worker
   Cache-first for static assets, network-first for API
   ───────────────────────────────────────────── */

const CACHE_VERSION = "hustleai-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

/* Assets to pre-cache on install */
const PRE_CACHE = [
    "/offline.html",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

/* Paths that should NEVER be cached */
const NO_CACHE_PATHS = [
    "/api/",
    "/api/auth/",
    "/api/stripe/",
    "/api/twilio/",
];

/* ── Install ─────────────────────────────────── */
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(PRE_CACHE);
        })
    );
    self.skipWaiting();
});

/* ── Activate ────────────────────────────────── */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

/* ── Fetch ───────────────────────────────────── */
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    /* Skip non-GET requests */
    if (request.method !== "GET") return;

    /* Skip cross-origin requests */
    if (url.origin !== location.origin) return;

    /* Skip API routes — always go to network */
    if (NO_CACHE_PATHS.some((path) => url.pathname.startsWith(path))) return;

    /* Static assets: cache-first */
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    /* Pages: network-first with offline fallback */
    event.respondWith(networkFirst(request));
});

/* ── Strategies ──────────────────────────────── */

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response("Offline", { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        /* Fallback to offline page for navigation requests */
        if (request.mode === "navigate") {
            return caches.match("/offline.html");
        }

        return new Response("Offline", { status: 503 });
    }
}

/* ── Helpers ─────────────────────────────────── */

function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|eot)$/i.test(pathname);
}
