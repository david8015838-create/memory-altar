import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// gh-pages 部署需要 base 設定為 repo 名稱
// 如果你的 repo 名稱不同，請修改這裡
const REPO_NAME = 'memory-altar'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: '回憶祭壇',
        short_name: '回憶',
        description: '我們的專屬數位回憶空間',
        theme_color: '#1a0a2e',
        background_color: '#0d0620',
        display: 'standalone',
        orientation: 'any',
        start_url: `/${REPO_NAME}/`,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
