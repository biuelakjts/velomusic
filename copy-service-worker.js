import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const distCoverWorker = path.join(root, "dist", "cover-sw.js");
const [coverWorker, mediaWorker, communityScript, workerBridge] = await Promise.all([
  readFile(distCoverWorker, "utf8"),
  readFile(path.join(root, "siteflare-sw.js"), "utf8"),
  readFile(path.join(root, "community.js"), "utf8"),
  readFile(path.join(root, "workeradd.js"), "utf8"),
]);
await writeFile(distCoverWorker, `${coverWorker}\n${mediaWorker}`);
await writeFile(path.join(root, "dist", "community.js"), communityScript);
await writeFile(path.join(root, "dist", "workeradd.js"), workerBridge);
