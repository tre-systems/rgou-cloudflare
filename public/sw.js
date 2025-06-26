const CACHE_NAME = "royal-game-of-ur-v1";
const OFFLINE_URL = "/offline";

// Files to cache immediately
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      })
  );

  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, use it
      if (cachedResponse) {
        console.log("[SW] Serving from cache:", event.request.url);
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response before caching
          const responseToCache = response.clone();

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache same-origin requests
            if (event.request.url.startsWith(self.location.origin)) {
              console.log("[SW] Caching new resource:", event.request.url);
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch((error) => {
          console.log("[SW] Fetch failed, serving offline page:", error);

          // If it's a navigation request, serve the offline page
          if (event.request.destination === "document") {
            return caches.match(OFFLINE_URL);
          }

          // For other requests, let them fail
          throw error;
        });
    })
  );
});

// Background sync for when connectivity is restored
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement any background sync logic here
  console.log("[SW] Performing background sync");
}

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push message received");

  const options = {
    body: event.data ? event.data.text() : "Royal Game of Ur notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Play Game",
        icon: "/icons/icon-72x72.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Royal Game of Ur", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click received");

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});
