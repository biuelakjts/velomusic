(() => {
  const configuredUrl = "https://YOUR-WORKER-NAME.YOUR-ACCOUNT.workers.dev";
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
    let request;
    try {
      const requestInput =
        input instanceof Request
          ? input
          : new URL(input, window.location.href).href;
      request =
        input instanceof Request
          ? input
          : new Request(requestInput, init);
    } catch {
      return originalFetch(input, init);
    }

    const requestUrl = new URL(request.url);
    if (
      requestUrl.origin !== window.location.origin ||
      !(
        requestUrl.pathname.startsWith("/youtube/") ||
        requestUrl.pathname === "/youtube-visitor-data" ||
        requestUrl.pathname === "/media-proxy"
      )
    ) {
      return originalFetch(input, init);
    }

    const workerUrl = new URL(
      `${requestUrl.pathname}${requestUrl.search}`,
      workerOrigin,
    );
    return originalFetch(new Request(workerUrl, request));
  };
})();