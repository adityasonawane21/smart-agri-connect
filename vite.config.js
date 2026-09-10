import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  // Vercel serves projects at the domain root, while GitHub Pages serves this
  // repository from a subpath. Keep both deployment targets working.
  base: process.env.VERCEL ? '/' : '/smart-agri-connect/',
}))
