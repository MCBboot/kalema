import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import httpProxy from "http-proxy";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "26032", 10);
const backendUrl = process.env.BACKEND_URL || "http://localhost:26033";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
  target: backendUrl,
  ws: true,
});

proxy.on("error", (err, _req, res) => {
  console.error("[Proxy] Error:", err.message);
  if (res && "writeHead" in res) {
    (res as import("node:http").ServerResponse).writeHead(502, { "Content-Type": "text/plain" });
    (res as import("node:http").ServerResponse).end("Backend unavailable");
  }
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    const pathname = parsedUrl.pathname || "";

    // Proxy /socket.io requests to the backend
    if (pathname.startsWith("/socket.io")) {
      proxy.web(req, res);
      return;
    }

    // Proxy /health to backend
    if (pathname === "/health") {
      proxy.web(req, res);
      return;
    }

    // Everything else → Next.js
    handle(req, res, parsedUrl);
  });

  // Handle WebSocket upgrade for Socket.IO
  server.on("upgrade", (req, socket, head) => {
    const pathname = req.url || "";
    if (pathname.startsWith("/socket.io")) {
      proxy.ws(req, socket, head);
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Kalema frontend ready on http://${hostname}:${port}`);
    console.log(`> Proxying /socket.io → ${backendUrl}`);
  });
});
