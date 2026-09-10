import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project from a repository subpath. An explicit
  // base makes every compiled JavaScript and CSS URL resolve from that path.
  base: '/smart-agri-connect/',
})
