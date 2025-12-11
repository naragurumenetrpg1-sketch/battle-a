import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/battle-a/',   // ← ここを必ず追加！！！！！
})