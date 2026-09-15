import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["brasao.png"],
      manifest: {
        name: "Pelada Bem Bolada",
        short_name: "Pelada BB",
        description: "Confirma, divide e joga!",
        theme_color: "#2C5282",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/brasao.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/brasao.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
