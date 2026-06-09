import { createContext, useContext } from 'react'
import { createHashRouter, RouterProvider, useNavigate } from 'react-router-dom'
import { App } from './App'
import type { AppProps } from './App'
import { AboutPage } from './pages/AboutPage'

const PropsCtx = createContext<AppProps>({})

// AppRoute reads context so the router singleton doesn't need props at creation time.
function AppRoute() {
  const props = useContext(PropsCtx)
  const navigate = useNavigate()
  return <App {...props} onAbout={() => navigate('/about')} />
}

const router = createHashRouter([
  { path: '/',      element: <AppRoute /> },
  { path: '/about', element: <AboutPage /> },
])

export function AppRouter(props: AppProps) {
  return (
    <PropsCtx.Provider value={props}>
      <RouterProvider router={router} />
    </PropsCtx.Provider>
  )
}
