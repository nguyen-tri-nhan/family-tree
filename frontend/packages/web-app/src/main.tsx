import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StorageProvider } from '@family-tree/tree-lib'
import { Analytics } from '@vercel/analytics/react'
import { WebAdapter } from './adapters/WebAdapter'
import './index.css'
import App from './App'

const adapter = new WebAdapter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorageProvider value={adapter}>
      <App />
      <Analytics />
    </StorageProvider>
  </StrictMode>,
)
