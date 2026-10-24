const ALLOWED = new Set(["search", "browse", "next", "player", "account/accounts_list"]);

export async function onRequest({ request }) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  const endpoint = url.pathname.slice("/youtube/".length);
  if (!ALLOWED.has(endpoint)) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  for (const name of ["accept", "authorization", "content-type", "x-goog-visitor-id", "x-youtube-client-name", "x-youtube-client-version"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const userAgent = request.headers.get("x-liner-user-agent") || request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);
  headers.set("origin", "https://music.youtube.com");
  headers.set("referer", "https://music.youtube.com/");
  const upstream = await fetch(`https://music.youtube.com/youtubei/v1/${endpoint}${url.search}`, { method: "POST", headers, body: request.body });
  return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json", "cache-control": "no-store" } });
}