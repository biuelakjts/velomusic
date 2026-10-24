const ALLOWED_MEDIA_HOSTS = [
  /(^|\.)googlevideo\.com$/i,
  /^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/i,
];

function isAllowedMediaHost(hostname) {
  return ALLOWED_MEDIA_HOSTS.some((pattern) => pattern.test(hostname));
}

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  let mediaUrl;
  try {
    mediaUrl = new URL(new URL(request.url).searchParams.get("url") || "");
  } catch {
    return new Response("Invalid media URL", { status: 400 });
  }
  if (
    mediaUrl.protocol !== "https:" ||
    !isAllowedMediaHost(mediaUrl.hostname) ||
    mediaUrl.port ||
    mediaUrl.username ||
    mediaUrl.password
  ) {
    return new Response("Media host is not allowed", { status: 403 });
  }

  const headers = new Headers();
  for (const name of ["accept", "range", "if-range"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const upstream = await fetch(mediaUrl, {
    method: request.method,
    headers,
  });
  let upstreamUrl;
  try {
    upstreamUrl = new URL(upstream.url || mediaUrl);
  } catch {
    await upstream.body?.cancel().catch(() => undefined);
    return new Response("Invalid media response", { status: 502 });
  }
  if (
    upstreamUrl.protocol !== "https:" ||
    !isAllowedMediaHost(upstreamUrl.hostname)
  ) {
    await upstream.body?.cancel().catch(() => undefined);
    return new Response("Media redirect host is not allowed", { status: 502 });
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
  return new Response(
    request.method === "HEAD" ? null : upstream.body,
    { status: upstream.status, headers: responseHeaders },
  );
}
