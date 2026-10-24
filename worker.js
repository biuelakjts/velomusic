const YOUTUBE_ENDPOINTS = new Set([
  "search",
  "browse",
  "next",
  "player",
  "account/accounts_list",
]);

const ALLOWED_MEDIA_HOSTS = [
  /(^|\.)googlevideo\.com$/i,
  /^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/i,
];

const CORS_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "if-range",
  "range",
  "x-goog-visitor-id",
  "x-liner-user-agent",
  "x-origin",
  "x-youtube-client-name",
  "x-youtube-client-version",
];

function isAllowedMediaHost(hostname) {
  return ALLOWED_MEDIA_HOSTS.some((pattern) => pattern.test(hostname));
}

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  if (!origin) return new Headers();

  return new Headers({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, POST, OPTIONS",
    "access-control-allow-headers": CORS_REQUEST_HEADERS.join(", "),
    "access-control-expose-headers":
      "accept-ranges, content-length, content-range, content-type",
    vary: "Origin",
  });
}

function responseWithCors(response, request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of corsHeaders(request)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function textResponse(text, status, request) {
  return responseWithCors(
    new Response(text, {
      status,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    }),
    request,
  );
}

async function proxyYoutubeRequest(request, url, fetchImpl) {
  const endpoint = url.pathname.slice("/youtube/".length);
  if (!YOUTUBE_ENDPOINTS.has(endpoint)) {
    return textResponse("Not found", 404, request);
  }
  if (request.method === "OPTIONS") {
    return responseWithCors(new Response(null, { status: 204 }), request);
  }
  if (request.method !== "POST") {
    return textResponse("Method not allowed", 405, request);
  }

  const headers = new Headers();
  for (const name of [
    "accept",
    "authorization",
    "content-type",
    "x-goog-visitor-id",
    "x-youtube-client-name",
    "x-youtube-client-version",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const userAgent =
    request.headers.get("x-liner-user-agent") || request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);
  headers.set("origin", "https://music.youtube.com");
  headers.set("referer", "https://music.youtube.com/");

  const upstream = await fetchImpl(
    `https://music.youtube.com/youtubei/v1/${endpoint}${url.search}`,
    {
      method: "POST",
      headers,
      body: request.body,
    },
  );
  return responseWithCors(
    new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    }),
    request,
  );
}

async function proxyVisitorData(request, fetchImpl) {
  if (request.method === "OPTIONS") {
    return responseWithCors(new Response(null, { status: 204 }), request);
  }
  if (request.method !== "GET") {
    return textResponse("Method not allowed", 405, request);
  }

  const upstream = await fetchImpl("https://www.youtube.com/sw.js_data", {
    headers: {
      accept: request.headers.get("accept") || "*/*",
      "user-agent": request.headers.get("user-agent") || "Mozilla/5.0",
      referer: "https://www.youtube.com/",
    },
  });
  return responseWithCors(
    new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "text/plain",
        "cache-control": "no-store",
      },
    }),
    request,
  );
}

async function proxyMediaRequest(request, url, fetchImpl) {
  if (request.method === "OPTIONS") {
    return responseWithCors(new Response(null, { status: 204 }), request);
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return textResponse("Method not allowed", 405, request);
  }

  let mediaUrl;
  try {
    mediaUrl = new URL(url.searchParams.get("url") || "");
  } catch {
    return textResponse("Invalid media URL", 400, request);
  }
  if (
    mediaUrl.protocol !== "https:" ||
    !isAllowedMediaHost(mediaUrl.hostname) ||
    mediaUrl.port ||
    mediaUrl.username ||
    mediaUrl.password
  ) {
    return textResponse("Media host is not allowed", 403, request);
  }

  const headers = new Headers();
  for (const name of ["accept", "range", "if-range"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const upstream = await fetchImpl(mediaUrl, {
    method: request.method,
    headers,
  });

  let upstreamUrl;
  try {
    upstreamUrl = new URL(upstream.url || mediaUrl);
  } catch {
    await upstream.body?.cancel().catch(() => undefined);
    return textResponse("Invalid media response", 502, request);
  }
  if (upstreamUrl.protocol !== "https:" || !isAllowedMediaHost(upstreamUrl.hostname)) {
    await upstream.body?.cancel().catch(() => undefined);
    return textResponse("Media redirect host is not allowed", 502, request);
  }

  const responseHeaders = new Headers({
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-expose-headers":
      "accept-ranges, content-length, content-range, content-type",
  });
  for (const name of [
    "accept-ranges",
    "content-length",
    "content-range",
    "content-type",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return responseWithCors(
    new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    }),
    request,
  );
}

export async function handleRequest(request, fetchImpl = fetch) {
  const url = new URL(request.url);
  try {
    if (url.pathname.startsWith("/youtube/")) {
      return await proxyYoutubeRequest(request, url, fetchImpl);
    }
    if (url.pathname === "/youtube-visitor-data") {
      return await proxyVisitorData(request, fetchImpl);
    }
    if (url.pathname === "/media-proxy") {
      return await proxyMediaRequest(request, url, fetchImpl);
    }
    return textResponse("Not found", 404, request);
  } catch (error) {
    console.error("VeloMusic Worker request failed:", error);
    return textResponse("Upstream request failed", 502, request);
  }
}

export default {
  fetch(request) {
    return handleRequest(request);
  },
};