import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function indexing(publicIndexing: boolean): Plugin {
  return {
    name: "rak-indexing",
    apply: "build",
    transformIndexHtml(html) {
      return publicIndexing
        ? html.replace(
            /\s*<meta name="robots" content="noindex,nofollow" \/>/,
            "",
          )
        : html;
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: publicIndexing
          ? "User-agent: *\nDisallow: /app/\nDisallow: /conta\nDisallow: /solicitacao\nDisallow: /acompanhamento\nDisallow: /conclusao\nSitemap: https://realmeidakits.com.br/sitemap.xml\n"
          : "User-agent: *\nDisallow: /\n",
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, ".", "RAK_");
  const replica = command === "serve" ? env.RAK_DEV_REPLICA : undefined;
  if (replica) {
    const target = new URL(replica);
    if (
      !["http:", "https:"].includes(target.protocol) ||
      !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
      target.username ||
      target.password ||
      target.pathname !== "/" ||
      target.search ||
      target.hash
    ) {
      throw new Error(
        "RAK_DEV_REPLICA deve apontar para uma origem HTTP(S) de loopback.",
      );
    }
  }
  const proxy = replica ? { target: replica, changeOrigin: false } : undefined;
  return {
    plugins: [react(), tailwindcss(), indexing(mode === "hostgator")],
    build: { manifest: true },
    server: proxy
      ? {
          proxy: {
            "^/app(?:/|$)": proxy,
            "^/corridas(?:[/?]|$)": proxy,
            "^/sitemap\\.xml(?:\\?|$)": proxy,
            "^/assets/": proxy,
          },
        }
      : undefined,
  };
});
