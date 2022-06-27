import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react'
import react from '@vitejs/plugin-react'
import alias from '@rollup/plugin-alias'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    alias(),
    react(),
    //reactRefresh()
  ],
  resolve: {
    alias: {
      '~/': path.join(process.cwd(), 'node_modules/'),
      '@src': path.resolve(__dirname, './src')
    },
  },
})
