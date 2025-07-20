/**
 * TSOAM Church Management System - Service Worker
 *
 * Provides offline functionality through intelligent caching strategies.
 * Enables the application to work seamlessly when offline.
 *
 * Features:
 * - App shell caching for core functionality
 * - API response caching with expiration
 * - Background sync for failed requests
 * - Push notifications support
 * - Cache management and cleanup
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

const CACHE_NAME = "tsoam-v2.0.0";
const API_CACHE_NAME = "tsoam-api-v2.0.0";
const OFFLINE_PAGE = "/offline.html";

// Assets to cache for offline functionality
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  OFFLINE_PAGE,
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  "/api/members",
  "/api/hr/employees",
  "/api/finance/transactions",
  "/api/welfare",
  "/api/inventory",
  "/api/events",
  "/api/appointments",
  "/api/dashboard",
];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    Promise.all([
      // Cache core application assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Service Worker: Caching core assets");
        return cache.addAll(CORE_ASSETS);
      }),
      // Initialize API cache
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log("Service Worker: Initialized API cache");
        return cache;
      }),
    ])
      .then(() => {
        console.log("Service Worker: Installation complete");
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Installation failed", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName.startsWith("tsoam-")
            ) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Take control of all pages
      self.clients.claim(),
    ])
      .then(() => {
        console.log("Service Worker: Activation complete");
      })
      .catch((error) => {
        console.error("Service Worker: Activation failed", error);
      }),
  );
});

// Fetch event - handle all network requests
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== "GET") {
    // For POST/PUT/DELETE requests, try network first, queue if offline
    event.respondWith(handleMutatingRequest(request));
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith("/api/")) {
    // API requests - cache strategy
    event.respondWith(handleApiRequest(request));
  } else if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  ) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // HTML pages - network first with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

/**
 * Handle API requests with cache-first strategy for GET requests
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Check if this API should be cached
    const shouldCache = CACHEABLE_APIS.some((api) => pathname.startsWith(api));

    if (!shouldCache) {
      // For non-cacheable APIs, try network only
      return await fetch(request);
    }

    // Try network first for fresh data
    try {
      const networkResponse = await fetch(request.clone());

      if (networkResponse.ok) {
        // Cache successful responses
        const cache = await caches.open(API_CACHE_NAME);
        await cache.put(request.clone(), networkResponse.clone());

        // Add timestamp to track freshness
        const responseWithTimestamp = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: {
            ...networkResponse.headers,
            "sw-cached-at": Date.now().toString(),
          },
        });

        return responseWithTimestamp;
      }

      return networkResponse;
    } catch (networkError) {
      console.log("Service Worker: Network failed, trying cache", pathname);

      // Network failed, try cache
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        // Check if cached data is stale (older than 5 minutes)
        const cachedAt = cachedResponse.headers.get("sw-cached-at");
        const isStale =
          cachedAt && Date.now() - parseInt(cachedAt) > 5 * 60 * 1000;

        if (isStale) {
          // Return stale data but with a header indicating it's stale
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: {
              ...cachedResponse.headers,
              "sw-from-cache": "true",
              "sw-stale-data": "true",
            },
          });
        }

        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...cachedResponse.headers,
            "sw-from-cache": "true",
          },
        });
      }

      // No cache available, return error response
      return new Response(
        JSON.stringify({
          error: "Network unavailable and no cached data",
          offline: true,
          timestamp: Date.now(),
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "application/json",
            "sw-offline": "true",
          },
        },
      );
    }
  } catch (error) {
    console.error("Service Worker: API request handling failed", error);
    return new Response(
      JSON.stringify({
        error: "Service worker error",
        offline: true,
        timestamp: Date.now(),
      }),
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache, try network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Service Worker: Static asset request failed", error);
    // Return a fallback response for failed static assets
    return new Response("", { status: 404, statusText: "Not Found" });
  }
}

/**
 * Handle page requests with network-first strategy
 */
async function handlePageRequest(request) {
  try {
    // Try network first for pages
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful HTML responses
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Service Worker: Page network failed, trying cache");

    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available, return offline page
    const offlineResponse = await caches.match(OFFLINE_PAGE);
    if (offlineResponse) {
      return offlineResponse;
    }

    // Last resort - basic offline message
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TSOAM - Offline</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #800020, #600015);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
          }
          h1 { color: #fff; margin-bottom: 20px; }
          p { font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
          .retry-btn {
            background: #fff;
            color: #800020;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
          }
          .retry-btn:hover {
            background: #f0f0f0;
            transform: translateY(-2px);
          }
          .status {
            margin-top: 20px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏛️ TSOAM Church Management</h1>
          <p>You're currently offline, but don't worry! The TSOAM system is designed to work seamlessly without an internet connection.</p>
          <p>Your data is safely stored locally and will sync automatically when you're back online.</p>
          <button class="retry-btn" onclick="window.location.reload()">
            🔄 Try Again
          </button>
          <div class="status">
            <strong>Status:</strong> <span id="connection-status">Checking connection...</span>
          </div>
        </div>
        
        <script>
          function updateConnectionStatus() {
            const status = document.getElementById('connection-status');
            if (navigator.onLine) {
              status.textContent = 'Connected - Refreshing page...';
              status.style.color = '#90EE90';
              setTimeout(() => window.location.reload(), 1000);
            } else {
              status.textContent = 'Offline';
              status.style.color = '#FFB6C1';
            }
          }
          
          // Check connection status immediately
          updateConnectionStatus();
          
          // Listen for connection changes
          window.addEventListener('online', updateConnectionStatus);
          window.addEventListener('offline', updateConnectionStatus);
          
          // Check connection every 5 seconds
          setInterval(updateConnectionStatus, 5000);
        </script>
      </body>
      </html>
      `,
      {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "text/html",
        },
      },
    );
  }
}

/**
 * Handle mutating requests (POST, PUT, DELETE)
 */
async function handleMutatingRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    return networkResponse;
  } catch (error) {
    console.log("Service Worker: Mutating request failed, will queue for sync");

    // Store request in IndexedDB for background sync
    try {
      await storeFailedRequest(request.clone());
    } catch (storeError) {
      console.error(
        "Service Worker: Failed to store request for sync",
        storeError,
      );
    }

    // Return a response indicating the request was queued
    return new Response(
      JSON.stringify({
        success: false,
        queued: true,
        message: "Request queued for sync when online",
        timestamp: Date.now(),
      }),
      {
        status: 202,
        statusText: "Accepted",
        headers: {
          "Content-Type": "application/json",
          "sw-queued": "true",
        },
      },
    );
  }
}

/**
 * Store failed request for background sync
 */
async function storeFailedRequest(request) {
  const db = await openDB();
  const transaction = db.transaction(["sync_requests"], "readwrite");
  const store = transaction.objectStore("sync_requests");

  const requestData = {
    id: Date.now() + Math.random(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  await store.add(requestData);
}

/**
 * Open IndexedDB for sync queue
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("tsoam_sync_db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sync_requests")) {
        const store = db.createObjectStore("sync_requests", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      processQueuedRequests()
        .then(() => {
          console.log("Service Worker: Background sync completed");
        })
        .catch((error) => {
          console.error("Service Worker: Background sync failed", error);
        }),
    );
  }
});

/**
 * Process queued requests during background sync
 */
async function processQueuedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(["sync_requests"], "readwrite");
    const store = transaction.objectStore("sync_requests");
    const requests = await store.getAll();

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });

        if (response.ok) {
          // Request successful, remove from queue
          await store.delete(requestData.id);
          console.log("Service Worker: Synced request", requestData.url);
        }
      } catch (error) {
        console.error(
          "Service Worker: Failed to sync request",
          requestData.url,
          error,
        );
        // Keep request in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error("Service Worker: Error processing sync queue", error);
  }
}

// Message event - handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      }),
    );
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith("tsoam-")) {
              return caches.delete(cacheName);
            }
          }),
        );
      }),
    );
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: data.tag || "default",
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "TSOAM Notification",
        options,
      ),
    );
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action button clicks
    console.log("Notification action clicked:", event.action);
  } else {
    // Handle notification click
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});

console.log("Service Worker: Loaded and ready");
