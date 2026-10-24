export async function onRequestGet({ request }) {
  const upstream = await fetch("https://www.youtube.com/sw.js_data", {
    headers: {
      accept: request.headers.get("accept") || "*/*",
      "user-agent": request.headers.get("user-agent") || "Mozilla/5.0",
      referer: "https://www.youtube.com/",
    },
  });
  return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "text/plain", "cache-control": "no-store" } });
}