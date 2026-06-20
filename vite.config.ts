import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Undercover - Pass & Play Party Game',
        short_name: 'Undercover',
        description: 'Undercover party game - offline PWA pass & play',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        // 'start_url' doit pointer sur la racine de ton sous-dossier
        start_url: '/undercover-app/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // REMPLACE 'undercover-app' PAR LE NOM EXACT DE TON REPO GITHUB
  base: '/undercover-app/',
})