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

  const proxyUrl = new URL("/media-proxy", self.location.origin);
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
