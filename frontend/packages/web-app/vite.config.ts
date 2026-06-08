import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@family-tree/tree-lib': resolve(__dirname, '../tree-lib/src/index.ts'),
    },
  },
})
