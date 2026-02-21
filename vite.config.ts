import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      // Immutable cache for hashed assets served during dev/preview
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  },
  preview: {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Inject CSS via JS instead of render-blocking <link> tags
    // Critical CSS is already inlined in index.html <style> for instant paint
    cssInjectedByJsPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-router': ['react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
