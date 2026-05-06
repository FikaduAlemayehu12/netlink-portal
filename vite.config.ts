import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";

export default defineConfig({
  vite: {
    server: { host: "::", port: 8080, strictPort: true },
    resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://bydtyfwisrjyggvsqxdw.supabase.co"),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZHR5Zndpc3JqeWdndnNxeGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDIyNjMsImV4cCI6MjA5MjgxODI2M30.F6zs5a06B6I9o7gPQhMJqKEQKUPYbgN7m2U6fbY3WBQ"),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(process.env.VITE_SUPABASE_PROJECT_ID ?? "bydtyfwisrjyggvsqxdw"),
    },
  },
});
