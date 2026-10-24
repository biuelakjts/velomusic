import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createSiteflareServer } from "./server.mjs";

let distDir;
let server;
let baseUrl;
const upstreamCalls = [];

before(async () => {
  distDir = await mkdtemp(path.join(os.tmpdir(), "siteflare-test-"));
  await writeFile(path.join(distDir, "index.html"), "<main>Siteflare app</main>");
  const serviceWorkerPath = path.join(distDir, "cover-sw.js");
  await writeFile(serviceWorkerPath, "self.addEventListener('fetch', () => {});");
  server = createSiteflareServer({
    distDir,
    serviceWorkerPath,
    fetchImpl: async (url, options = {}) => {
      if (
        new URL(url).hostname.endsWith(".googlevideo.com") ||
        new URL(url).hostname.endsWith(".r2.cloudflarestorage.com")
      ) {
        upstreamCalls.push({ url: String(url), options });
        return new Response("audio bytes", {
          status: 206,
          headers: {
            "accept-ranges": "bytes",
            "content-range": "bytes 0-10/100",
            "content-type": "audio/webm",
          },
        });
      }
      let body;
      if (options.body) {
        const chunks = [];
        for await (const chunk of options.body) chunks.push(chunk);
        body = Buffer.concat(chunks).toString("utf8");
      }
      upstreamCalls.push({ url, options, body });
      return new Response("upstream response", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await rm(distDir, { recursive: true, force: true });
});

test("serves the built app for the root and SPA routes", async () => {
  for (const pathName of ["/", "/collection"]) {
    const response = await fetch(`${baseUrl}${pathName}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Siteflare app/);
  }
});

test("proxies Innertube requests and forwards the custom user agent", async () => {
  const response = await fetch(
    `${baseUrl}/youtube/search?prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-liner-user-agent": "Vyla test user agent",
        "x-youtube-client-name": "67",
      },
      body: JSON.stringify({ query: "Daft Punk" }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "upstream response");
  assert.equal(
    upstreamCalls[0].url,
    "https://music.youtube.com/youtubei/v1/search?prettyPrint=false",
  );
  assert.equal(
    upstreamCalls[0].options.headers.get("user-agent"),
    "Vyla test user agent",
  );
  assert.equal(upstreamCalls[0].body, JSON.stringify({ query: "Daft Punk" }));
});

test("rejects unsupported Innertube endpoints", async () => {
  const callCount = upstreamCalls.length;
  const response = await fetch(`${baseUrl}/youtube/not-allowed`, {
    method: "POST",
  });

  assert.equal(response.status, 404);
  assert.equal(upstreamCalls.length, callCount);
});

test("proxies visitor data requests", async () => {
  const response = await fetch(`${baseUrl}/youtube-visitor-data`);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "upstream response");
  assert.equal(upstreamCalls.at(-1).url, "https://www.youtube.com/sw.js_data");
});

test("proxies Googlevideo media with range requests", async () => {
  const mediaUrl =
    "https://rr1---sn.googlevideo.com/videoplayback?expire=123&range=0-10";
  const response = await fetch(
    `${baseUrl}/media-proxy?url=${encodeURIComponent(mediaUrl)}`,
    { headers: { range: "bytes=0-10" } },
  );

  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-type"), "audio/webm");
  assert.equal(response.headers.get("content-range"), "bytes 0-10/100");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(
    response.headers.get("access-control-expose-headers"),
    "accept-ranges, content-length, content-range, content-type",
  );
  assert.equal(await response.text(), "audio bytes");
  const call = upstreamCalls.at(-1);
  assert.equal(call.url, mediaUrl);
  assert.equal(call.options.headers.get("range"), "bytes=0-10");
});

test("proxies signed R2 track media with range requests", async () => {
  const mediaUrl =
    "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/liner-media/tracks/track?X-Amz-Signature=test";
  const response = await fetch(
    `${baseUrl}/media-proxy?url=${encodeURIComponent(mediaUrl)}`,
    { headers: { range: "bytes=0-10" } },
  );

  assert.equal(response.status, 206);
  assert.equal(await response.text(), "audio bytes");
  assert.equal(upstreamCalls.at(-1).url, mediaUrl);
  assert.equal(upstreamCalls.at(-1).options.headers.get("range"), "bytes=0-10");
});

test("rejects media proxy URLs outside Googlevideo", async () => {
  const callCount = upstreamCalls.length;
  const response = await fetch(
    `${baseUrl}/media-proxy?url=${encodeURIComponent("https://example.com/audio")}`,
  );

  assert.equal(response.status, 403);
  assert.equal(upstreamCalls.length, callCount);
});

test("serves the merged cover and media service worker with root scope", async () => {
  const response = await fetch(`${baseUrl}/cover-sw.js`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("service-worker-allowed"), "/");
  assert.match(await response.text(), /fetch/);
});
