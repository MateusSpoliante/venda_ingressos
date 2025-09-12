import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite SPA funcionar ao digitar URL direto
    historyApiFallback: true
  }
})
