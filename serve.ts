// Serve app/ locally for testing: `node serve.ts` then open
// http://localhost:8080 (or --port <n>). Static files only, no network.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.argv[process.argv.indexOf("--port") + 1] || 8080);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const server = createServer(async (req, res) => {
  try {
    const path = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
    const file = await readFile(join(here, "app", path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found\n");
  }
});

server.listen(port, () => console.log(`serving app/ at http://localhost:${port}`));
