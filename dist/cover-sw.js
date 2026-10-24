const CACHE_NAME = "liner-covers-v2";
const MAX_ENTRIES = 600;

const COVER_HOSTS = [
  "yt3.googleusercontent.com",
  "lh3.googleusercontent.com",
  "covers.tryliner.fun",
  "i1.sndcdn.com",
  "i2.sndcdn.com",
  "i3.sndcdn.com",
  "i4.sndcdn.com",
  "img.sndcdn.com",
  "a1.sndcdn.com",
  "i.pinimg.com",
  "images.genius.com",
  "yandex-images.clstorage.net",
];

const inFlight = new Map();

function isCoverRequest(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname || parsed.pathname === "/" || parsed.pathname === "/health") {
      return false;
    }
    return COVER_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function enforceQuota(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > MAX_ENTRIES) {
      const toDelete = keys.slice(0, keys.length - MAX_ENTRIES);
      await Promise.all(toDelete.map((req) => cache.delete(req)));
    }
  } catch {
  }
}

async function fetchAndCache(request, cache, cacheKey) {
  let pending = inFlight.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const response = await fetch(request);
      if (response.ok && response.type !== "opaque") {
        await cache.put(cacheKey, response.clone());
        void enforceQuota(cache);
      }
      return response;
    })().finally(() => inFlight.delete(cacheKey));
    inFlight.set(cacheKey, pending);
  }
  return (await pending).clone();
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !isCoverRequest(event.request.url)) {
    return;
  }

  const cacheKey = event.request.url;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(cacheKey, { ignoreVary: true });
      if (cached) return cached;

      try {
        return await fetchAndCache(event.request, cache, cacheKey);
      } catch (err) {
        const stale = await cache.match(cacheKey, { ignoreVary: true });
        if (stale) return stale;
        throw err;
      }
    }),
  );
});

self.importScripts("/workeradd.js");

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    requestUrl.protocol !== "https:" ||
    !(
      /(^|\.)googlevideo\.com$/i.test(requestUrl.hostname) ||
      /^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/i.test(
        requestUrl.hostname,
      )
    ) ||
    (event.request.method !== "GET" && event.request.method !== "HEAD")
  ) {
    return;
  }

  const proxyUrl = new URL(
    "/media-proxy",
    self.VYLA_WORKER_URL || self.location.origin,
  );
  proxyUrl.searchParams.set("url", requestUrl.toString());
  const headers = new Headers();
  for (const name of ["accept", "range", "if-range"]) {
    const value = event.request.headers.get(name);
    if (value) headers.set(name, value);
  }
  event.respondWith(
    fetch(proxyUrl, {
      method: event.request.method,
      headers,
      cache: "no-store",
      signal: event.request.signal,
    }),
  );
});
