import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const SITE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST_DIR = path.join(SITE_ROOT, "dist");
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
const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function sendText(response, status, text) {
  response.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(text);
}

function isAllowedMediaHost(hostname) {
  return ALLOWED_MEDIA_HOSTS.some((pattern) => pattern.test(hostname));
}

async function proxyYoutubeRequest(request, response, url, fetchImpl) {
  const endpoint = url.pathname.slice("/youtube/".length);
  if (request.method !== "POST") {
    sendText(response, 405, "Method not allowed");
    return;
  }
  if (!YOUTUBE_ENDPOINTS.has(endpoint)) {
    sendText(response, 404, "Not found");
    return;
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
    const value = request.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }
  const userAgent = request.headers["x-liner-user-agent"] || request.headers["user-agent"];
  if (typeof userAgent === "string") headers.set("user-agent", userAgent);
  headers.set("origin", "https://music.youtube.com");
  headers.set("referer", "https://music.youtube.com/");

  const upstream = await fetchImpl(
    `https://music.youtube.com/youtubei/v1/${endpoint}${url.search}`,
    {
      method: "POST",
      headers,
      body: request,
      duplex: "half",
    },
  );
  response.writeHead(upstream.status, {
    "content-type": upstream.headers.get("content-type") || "application/json",
    "cache-control": "no-store",
  });
  if (upstream.body) {
    Readable.fromWeb(upstream.body).pipe(response);
  } else {
    response.end();
  }
}

async function proxyVisitorData(request, response, fetchImpl) {
  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
    return;
  }
  const upstream = await fetchImpl("https://www.youtube.com/sw.js_data", {
    headers: {
      accept: request.headers.accept || "*/*",
      "user-agent": request.headers["user-agent"] || "Mozilla/5.0",
      referer: "https://www.youtube.com/",
    },
  });
  response.writeHead(upstream.status, {
    "content-type": upstream.headers.get("content-type") || "text/plain",
    "cache-control": "no-store",
  });
  if (upstream.body) {
    Readable.fromWeb(upstream.body).pipe(response);
  } else {
    response.end();
  }
}

async function proxyMediaRequest(request, response, url, fetchImpl) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  let mediaUrl;
  try {
    mediaUrl = new URL(url.searchParams.get("url") || "");
  } catch {
    sendText(response, 400, "Invalid media URL");
    return;
  }
  if (
    mediaUrl.protocol !== "https:" ||
    !isAllowedMediaHost(mediaUrl.hostname) ||
    mediaUrl.port ||
    mediaUrl.username ||
    mediaUrl.password
  ) {
    sendText(response, 403, "Media host is not allowed");
    return;
  }

  const headers = new Headers();
  for (const name of ["accept", "range", "if-range"]) {
    const value = request.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }
  const upstream = await fetchImpl(mediaUrl, {
    method: request.method,
    headers,
  });

  let upstreamUrl;
  try {
    upstreamUrl = new URL(upstream.url || mediaUrl);
  } catch {
    sendText(response, 502, "Invalid media response");
    return;
  }
  if (upstreamUrl.protocol !== "https:" || !isAllowedMediaHost(upstreamUrl.hostname)) {
    await upstream.body?.cancel().catch(() => undefined);
    sendText(response, 502, "Media redirect host is not allowed");
    return;
  }

  const responseHeaders = {
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-expose-headers":
      "accept-ranges, content-length, content-range, content-type",
  };
  for (const name of [
    "accept-ranges",
    "content-length",
    "content-range",
    "content-type",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders[name] = value;
  }
  response.writeHead(upstream.status, responseHeaders);
  if (request.method === "HEAD" || !upstream.body) {
    response.end();
  } else {
    Readable.fromWeb(upstream.body).pipe(response);
  }
}

async function serveStatic(request, response, url, distDir) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    sendText(response, 400, "Invalid path");
    return;
  }

  const root = path.resolve(distDir);
  let filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    sendText(response, 404, "Not found");
    return;
  }

  try {
    if (!(await stat(filePath)).isFile()) throw new Error("Not a file");
  } catch {
    if (path.extname(pathname)) {
      sendText(response, 404, "Not found");
      return;
    }
    filePath = path.join(root, "index.html");
  }

  try {
    await access(filePath);
  } catch {
    sendText(response, 503, "Site build is missing");
    return;
  }

  response.writeHead(200, {
    "content-type": MIME_TYPES.get(path.extname(filePath)) || "application/octet-stream",
    "cache-control": path.basename(filePath) === "index.html" ? "no-cache" : "public, max-age=3600",
  });
  if (request.method === "HEAD") {
    response.end();
  } else {
    createReadStream(filePath).pipe(response);
  }
}

export function createSiteflareServer({
  distDir = DEFAULT_DIST_DIR,
  serviceWorkerPath = path.join(DEFAULT_DIST_DIR, "cover-sw.js"),
  fetchImpl = fetch,
} = {}) {
  return createServer((request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const handle = url.pathname.startsWith("/youtube/")
      ? proxyYoutubeRequest(request, response, url, fetchImpl)
      : url.pathname === "/youtube-visitor-data"
        ? proxyVisitorData(request, response, fetchImpl)
        : url.pathname === "/media-proxy"
          ? proxyMediaRequest(request, response, url, fetchImpl)
          : url.pathname === "/cover-sw.js"
            ? serveServiceWorker(request, response, serviceWorkerPath)
        : request.method === "GET" || request.method === "HEAD"
          ? serveStatic(request, response, url, distDir)
          : Promise.resolve(sendText(response, 405, "Method not allowed"));

    void handle.catch((error) => {
      console.error("Siteflare request failed:", error);
      if (!response.headersSent) {
        sendText(response, 502, "Upstream request failed");
      } else {
        response.destroy(error);
      }
    });
  });
}

async function serveServiceWorker(request, response, serviceWorkerPath) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method not allowed");
    return;
  }
  try {
    await access(serviceWorkerPath);
  } catch {
    sendText(response, 404, "Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": "text/javascript; charset=utf-8",
    "cache-control": "no-cache",
    "service-worker-allowed": "/",
  });
  if (request.method === "HEAD") {
    response.end();
  } else {
    createReadStream(serviceWorkerPath).pipe(response);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 10000);
  createSiteflareServer().listen(port, "0.0.0.0", () => {
    console.log(`Siteflare listening on port ${port}`);
  });
}
