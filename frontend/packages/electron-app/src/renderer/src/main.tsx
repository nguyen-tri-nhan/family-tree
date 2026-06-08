import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StorageProvider } from '@family-tree/tree-lib'
import { ElectronAdapter } from './adapters/ElectronAdapter'
import App from './App'

const adapter = new ElectronAdapter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorageProvider value={adapter}>
      <App />
    </StorageProvider>
  </StrictMode>,
)
