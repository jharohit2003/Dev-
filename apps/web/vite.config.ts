import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, forward /api calls to the backend so the browser sees one origin.
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
