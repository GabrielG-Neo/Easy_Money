const FILES_TO_CACHE = [
    "/",
    "/db.js",
    "/index.html",
    "/index.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";


// install
self.addEventListener("install", function(event) {

  console.log("install");

  const cacheResources = async () => {
    const resourceCache = await caches.open(CACHE_NAME);
    return resourceCache.addAll(FILES_TO_CACHE);
  }


  self.skipWaiting();
    event.waitUntil(cacheResources());
    console.log("Your files were pre-cached successfully!");
});

// activate
self.addEventListener("activate", function(event) {

  console.log("activate");

  const removeOldCache = async () => {
    const cacheKeyArray = await caches.keys();
  
    const cacheResultPromiseArray = cacheKeyArray.map(key => {
      if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
        console.log("Removing old cache data", key);
        return caches.delete(key);
      }
    });
  
    return Promise.all(cacheResultPromiseArray);
  }

  event.waitUntil(removeOldCache());
  self.clients.claim();
});

// fetch
// self.addEventListener("fetch", function(event) {
//   console.log("fetch", event.request.url);
//   const handleAPIDataRequest = async (event) => {
//     console.log("Event log: ", event)
//     try {
//       const response = await fetch(event);
//       console.log("response ", response)
//       if (response.status === 200) {
//         console.log(`Adding API request to cache now: ${event}`);

//         const apiCache = await caches.open(DATA_CACHE_NAME);
//         await apiCache.put(event.request.url, response.clone());
//         return response;
//       }
//     } catch(error) {
//       console.log(`Network error occurred with API request. Now retrieving it from the cache: ${event}`)
//       return await caches.match(event.request);
//     }
//   }
  
//   const handleResourceRequest = async (event) => {
//     const matchedCache = await caches.match(event.request);
//     return matchedCache ||  await fetch(event.request);
//   }
  
//   // cache successful requests to the API
//   if (event.request.url.includes("/api/")) {
//     event.respondWith(handleAPIDataRequest(event));
//   } else {
//     event.respondWith(handleResourceRequest(event));
//   }

// });

self.addEventListener("fetch", function(event) {
  // cache all get requests to /api routes
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(event.request);
          });
      }).catch(err => console.log(err))
    );
    return;
  }
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request).then(function(response) {
        if (response) {
          return response;
        } else if (event.request.headers.get("accept").includes("text/html")) {
          // return the cached home page for all requests for html pages
          return caches.match("/");
        }
      });
    })
  );
});