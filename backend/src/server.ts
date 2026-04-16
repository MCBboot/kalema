import { createServer, request as httpRequest } from "node:http";
import { Server } from "socket.io";
import { FRONTEND_URL } from "./config/env.js";

const frontendTarget = new URL(FRONTEND_URL);

export const httpServer = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }

  const proxyReq = httpRequest(
    {
      protocol: frontendTarget.protocol,
      hostname: frontendTarget.hostname,
      port: frontendTarget.port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: frontendTarget.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (err) => {
    console.error("[Frontend Proxy] Error:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end("Frontend unavailable");
  });

  req.pipe(proxyReq);
});

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
