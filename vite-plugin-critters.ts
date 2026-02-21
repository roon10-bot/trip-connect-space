import type { Plugin } from "vite";

/**
 * Vite plugin that uses Critters to inline critical CSS and lazy-load the rest.
 * Only runs during build (not dev).
 */
export default function criticalCss(): Plugin {
  return {
    name: "vite-plugin-critters",
    apply: "build",
    enforce: "post",
    async transformIndexHtml(html) {
      // @ts-ignore - critters types not properly exported
      const { default: Critters } = await import("critters");
      // @ts-ignore
      const critters = new Critters({
        // Inline critical CSS
        preload: "swap",
        // Don't remove the original <link> — just make it async
        pruneSource: false,
        // Reduce aggressiveness to avoid missing styles
        reduceInlineStyles: true,
        // Include font-face rules
        inlineFonts: false,
      });
      return critters.process(html);
    },
  };
}
