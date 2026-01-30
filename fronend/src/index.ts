import { serve } from "bun";
import index from "./index.html";

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || "0.0.0.0";
const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

const proxyRequest = async (req: Request) => {
  const url = new URL(req.url);
  const targetUrl = new URL(url.pathname + url.search, backendUrl);
  const headers = new Headers(req.headers);
  headers.delete("host");

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();
  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
};

const server = serve({
  port,
  hostname,
  routes: {
    "/api/*": async req => proxyRequest(req),
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
