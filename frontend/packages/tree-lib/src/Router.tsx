import { createContext, useContext, useState } from 'react'
import { createHashRouter, RouterProvider, useNavigate } from 'react-router-dom'
import { App } from './App'
import type { AppProps } from './App'
import { AboutPage } from './pages/AboutPage'
import { TermsPage } from './pages/TermsPage'
import { TermsModal, isTermsAccepted, acceptTerms } from './components/TermsModal'

const PropsCtx = createContext<AppProps>({})

// AppRoute reads context so the router singleton doesn't need props at creation time.
function AppRoute() {
  const props = useContext(PropsCtx)
  const navigate = useNavigate()
  const [showTerms, setShowTerms] = useState(() => !isTermsAccepted())

  function handleAccept() {
    acceptTerms()
    setShowTerms(false)
  }

  return (
    <>
      <App {...props} onAbout={() => navigate('/about')} />
      {showTerms && (
        <TermsModal
          onAccept={handleAccept}
          onViewFull={() => navigate('/terms')}
        />
      )}
    </>
  )
}

const router = createHashRouter([
  { path: '/',      element: <AppRoute /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/terms', element: <TermsPage /> },
])

export function AppRouter(props: AppProps) {
  return (
    <PropsCtx.Provider value={props}>
      <RouterProvider router={router} />
    </PropsCtx.Provider>
  )
}
