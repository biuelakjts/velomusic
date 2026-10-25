import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { after, before, test } from "node:test";
import { createSiteflareServer } from "./server.mjs";
import { handleRequest as handleWorkerRequest } from "./worker.js";

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

test("proxies YouTube device sign-in requests through the app server", async () => {
  const tvResponse = await fetch(`${baseUrl}/youtube-auth/tv`);
  assert.equal(tvResponse.status, 200);
  assert.equal(await tvResponse.text(), "upstream response");
  assert.equal(String(upstreamCalls.at(-1).url), "https://www.youtube.com/tv");
  assert.equal(upstreamCalls.at(-1).options.method, "GET");

  const codeResponse = await fetch(`${baseUrl}/youtube-auth/device/code`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: "test-client" }),
  });
  assert.equal(codeResponse.status, 200);
  assert.equal(
    String(upstreamCalls.at(-1).url),
    "https://www.youtube.com/o/oauth2/device/code",
  );
  assert.equal(upstreamCalls.at(-1).options.method, "POST");
  assert.equal(
    upstreamCalls.at(-1).body,
    JSON.stringify({ client_id: "test-client" }),
  );
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

test("Worker CORS allows the frontend x-origin header", async () => {
  const response = await handleWorkerRequest(
    new Request("https://worker.example/youtube/search", {
      method: "OPTIONS",
      headers: {
        origin: "https://music.example",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-origin",
      },
    }),
  );

  assert.equal(response.status, 204);
  assert.match(response.headers.get("access-control-allow-headers"), /x-origin/i);
});

test("Worker proxies YouTube device authorization through the CORS-enabled auth route", async () => {
  let upstreamRequest;
  const response = await handleWorkerRequest(
    new Request("https://worker.example/youtube-auth/device/code", {
      method: "POST",
      headers: {
        origin: "https://music.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ client_id: "public-client-id" }),
    }),
    async (url, options) => {
      upstreamRequest = { url: String(url), options };
      return new Response(JSON.stringify({ device_code: "code", user_code: "ABCD" }), {
        headers: { "content-type": "application/json" },
      });
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.deepEqual(await response.json(), { device_code: "code", user_code: "ABCD" });
  assert.equal(
    upstreamRequest.url,
    "https://www.youtube.com/o/oauth2/device/code",
  );
  assert.equal(upstreamRequest.options.method, "POST");
});

test("Worker serves the YouTube TV page and its OAuth client script through CORS", async () => {
  const requests = [];
  const tvPage = await handleWorkerRequest(
    new Request("https://worker.example/youtube-auth/tv", {
      headers: { origin: "https://music.example" },
    }),
    async (url, options) => {
      requests.push({ url: String(url), options });
      return new Response("tv page", { headers: { "content-type": "text/html" } });
    },
  );
  assert.equal(tvPage.status, 200);
  assert.equal(tvPage.headers.get("access-control-allow-origin"), "*");
  assert.equal(await tvPage.text(), "tv page");
  assert.equal(requests[0].url, "https://www.youtube.com/tv");

  const playerScript = await handleWorkerRequest(
    new Request(
      "https://worker.example/youtube-auth/player-script?path=%2Fs%2Fplayer%2Fexample%2Fbase.js",
      { headers: { origin: "https://music.example" } },
    ),
    async (url) => {
      requests.push({ url: String(url) });
      return new Response("oauth client script", {
        headers: { "content-type": "application/javascript" },
      });
    },
  );
  assert.equal(playerScript.status, 200);
  assert.equal(await playerScript.text(), "oauth client script");
  assert.equal(
    requests[1].url,
    "https://www.youtube.com/s/player/example/base.js",
  );
});

test("Worker preflights YouTube auth requests and rejects arbitrary player scripts", async () => {
  const preflight = await handleWorkerRequest(
    new Request("https://worker.example/youtube-auth/token", {
      method: "OPTIONS",
      headers: {
        origin: "https://music.example",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    }),
  );
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("access-control-allow-headers"), /content-type/i);

  let upstreamCalled = false;
  const invalidScript = await handleWorkerRequest(
    new Request(
      "https://worker.example/youtube-auth/player-script?path=%2Frobots.txt",
    ),
    async () => {
      upstreamCalled = true;
      return new Response("unexpected");
    },
  );
  assert.equal(invalidScript.status, 400);
  assert.equal(upstreamCalled, false);
});

test("browser bridge sends YouTube OAuth calls to the app server", async () => {
  const script = await readFile(new URL("./workeradd.js", import.meta.url), "utf8");
  const deployment = await readFile(new URL("./render.yaml", import.meta.url), "utf8");
  let forwarded;
  const window = {
    location: {
      href: "https://music.example/",
      origin: "https://music.example",
    },
    fetch(input, options) {
      forwarded = { input: String(input), options };
      return Promise.resolve(new Response("ok"));
    },
  };
  runInNewContext(script, {
    window,
    self: {},
    URL,
    Request,
    console,
  });

  await window.fetch("https://www.youtube.com/o/oauth2/device/code", {
    method: "POST",
    body: "{}",
  });
  assert.equal(
    forwarded.input,
    "https://music.example/youtube-auth/device/code",
  );
  assert.equal(forwarded.options.method, "POST");
  assert.equal(forwarded.options.body, "{}");
  assert.match(deployment, /runtime: node/);
  assert.match(deployment, /startCommand: node server\.mjs/);
});
