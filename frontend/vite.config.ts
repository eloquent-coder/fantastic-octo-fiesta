import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const allowedHostsEnv = process.env.ALLOWED_HOSTS;
const allowedHosts: true | string[] =
  allowedHostsEnv === "*"
    ? true
    : allowedHostsEnv
      ? allowedHostsEnv.split(",").map((host) => host.trim()).filter(Boolean)
      : ["localhost", "127.0.0.1"];

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
