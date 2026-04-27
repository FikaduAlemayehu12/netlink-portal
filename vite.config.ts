import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import fs from "node:fs/promises";
import path from "node:path";

const htmlFallback = () => ({
  name: "html-fallback",
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
  },
});

export default defineConfig({
  server: { host: "::", port: 8080, strictPort: true },
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  plugins: [
    tanstackRouter({ target: "react" }),
    react(),
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    htmlFallback(),
  ] as any,
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ""),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(process.env.VITE_SUPABASE_PROJECT_ID ?? "bydtyfwisrjyggvsqxdw"),
  },
});
