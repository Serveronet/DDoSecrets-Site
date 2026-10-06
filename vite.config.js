import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Publishes the built SPA straight into the Serveronet client's
// developed_sites directory (serveronet/serveronet-app/storage/app/developed_sites/ddosecrets).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: path.resolve(
      __dirname,
      '../serveronet/serveronet-app/storage/app/developed_sites/ddosecrets'
    ),
    emptyOutDir: true,
    modulePreload: { polyfill: false },
  },
})
