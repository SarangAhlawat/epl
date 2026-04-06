import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
// Camera: http://localhost:5173 is a secure context for getUserMedia.
// For LAN IP (http://192.168.x.x) the browser may block camera unless you use HTTPS
// and proxy API to the same origin (see Vite docs) or deploy with TLS.
export default defineConfig({
  plugins: [
    react(),
    // basicSsl(),
  ],

  server: {
    host: true,
  },
});