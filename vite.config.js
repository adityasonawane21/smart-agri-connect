import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // A relative asset base works both on GitHub Pages (project sites) and when
  // the frontend is served by Express.
  base: './',
})
