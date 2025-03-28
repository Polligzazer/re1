import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  server: {
    host: true,
    proxy: {
      "/v1": {
        target: "https://cloud.appwrite.io",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
