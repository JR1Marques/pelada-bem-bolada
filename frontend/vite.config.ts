import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "brasao.png", "icons.svg"],
      manifest: {
        name: "Pelada Bem Bolada",
        short_name: "PeladaBemBolada",
        description: "Confirma, divide e joga!",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "brasao.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "brasao.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "brasao.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});