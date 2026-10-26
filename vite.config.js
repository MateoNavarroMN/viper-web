import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola cuando subes cambios
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Viper - Gestión Deportiva',
        short_name: 'Viper',
        description: 'Sistema Integral de Gestión Deportiva',
        theme_color: '#09090B',
        background_color: '#09090B',
        lang: 'es',
        display: 'standalone', // Hace que al abrirse no se vea la barra de direcciones del navegador
        // Íconos de la guía del logo: el común y el adaptable de Android van por separado
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
})