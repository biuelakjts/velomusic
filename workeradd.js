(() => {
  const configuredUrl = "https://velo.envyrants.workers.dev/";
  let workerOrigin;

  try {
    const parsedUrl = new URL(configuredUrl);
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname.includes("YOUR-WORKER") ||
      parsedUrl.hostname.includes("YOUR-ACCOUNT")
    ) {
      throw new Error("Replace the placeholder with your HTTPS Cloudflare Worker URL.");
    }
    workerOrigin = parsedUrl.origin;
  } catch (error) {
    console.error("VeloMusic Worker URL is not configured:", error);
    return;
  }

  self.VYLA_WORKER_URL = workerOrigin;
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    let requestUrl;
    try {
      requestUrl = new URL(
        input instanceof Request ? input.url : input,
        window.location.href,
      );
    } catch {
      return originalFetch(input, init);
    }

    let proxiedPath = null;
    if (requestUrl.hostname === "www.youtube.com") {
      const authPaths = new Map([
        ["/tv", "/youtube-auth/tv"],
        ["/o/oauth2/device/code", "/youtube-auth/device/code"],
        ["/o/oauth2/token", "/youtube-auth/token"],
        ["/o/oauth2/revoke", "/youtube-auth/revoke"],
      ]);
      proxiedPath = authPaths.get(requestUrl.pathname) || null;
      if (/^\/s\/player\/[a-zA-Z0-9_./-]+\.js$/.test(requestUrl.pathname) && !requestUrl.pathname.split("/").includes("..")) {
        proxiedPath = `/youtube-auth/player-script?path=${encodeURIComponent(requestUrl.pathname)}`;
      }
    }

    if (
      !proxiedPath &&
      (requestUrl.origin !== window.location.origin ||
        !(
          requestUrl.pathname.startsWith("/youtube/") ||
          requestUrl.pathname === "/youtube-visitor-data" ||
          requestUrl.pathname === "/media-proxy"
        ))
    ) {
      return originalFetch(input, init);
    }

    const workerUrl = new URL(
      proxiedPath
        ? `${proxiedPath}${proxiedPath.includes("?") ? "" : requestUrl.search}`
        : `${requestUrl.pathname}${requestUrl.search}`,
      proxiedPath ? window.location.origin : workerOrigin,
    );
    return input instanceof Request
      ? originalFetch(new Request(workerUrl, input))
      : originalFetch(workerUrl.href, init);
  };
})();