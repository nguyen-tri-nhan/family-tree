import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry:    resolve(__dirname, 'src/index.ts'),
      formats:  ['es'],
      fileName: 'tree-lib',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'd3'],
    },
  },
})
