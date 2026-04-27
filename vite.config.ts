// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { NodeRequest, sendNodeResponse } from "srvx/node";
import fs from "node:fs/promises";
import path from "node:path";

const cloudflareStartDevMiddleware = () => ({
  name: "cloudflare-start-dev-middleware",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.method !== "GET" || !req.headers.accept?.includes("text/html")) {
        return next();
      }

      try {
        const template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
        const html = await server.transformIndexHtml(req.originalUrl ?? req.url ?? "/", template);
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      } catch (error) {
        next(error);
      }
    });

    return () => {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const serverEnv = server.environments?.ssr ?? server.environments?.server;

        if (!serverEnv || typeof serverEnv.dispatchFetch !== "function") {
          return next();
        }

        if (req.originalUrl) req.url = req.originalUrl;
        const request = new NodeRequest({ req, res });
        const response = await serverEnv.dispatchFetch(request);
        return sendNodeResponse(res, response);
      });
    };
  },
});

export default defineConfig({
  plugins: [cloudflareStartDevMiddleware()],
});
