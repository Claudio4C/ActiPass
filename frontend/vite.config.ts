import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement selon le mode
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: parseInt(env.VITE_APP_PORT) || 5173,
    },
    define: {
      // Passer la variable d'environnement dans l'application
      'import.meta.env.VITE_APP_TARGET': JSON.stringify(env.VITE_APP_TARGET),
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE),
    },
    build: {
      outDir: `dist-${env.VITE_APP_TARGET}`,
    },
  }
})
