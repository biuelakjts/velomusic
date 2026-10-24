import "./site.css";

async function startSiteflareApp() {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    try {
      const controllerReady = navigator.serviceWorker.controller
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              () => resolve(),
              { once: true },
            );
          });
      await navigator.serviceWorker.register("/cover-sw.js");
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await Promise.race([
          controllerReady,
          new Promise<void>((resolve) => setTimeout(resolve, 3000)),
        ]);
      }
    } catch (error) {
      console.error("Siteflare media proxy could not be enabled:", error);
    }
  }

  await import("../../main/src/main");
}

void startSiteflareApp();