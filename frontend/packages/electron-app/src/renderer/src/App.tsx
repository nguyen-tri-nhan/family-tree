import { AppRouter } from '@family-tree/tree-lib'

const shareBaseUrl = import.meta.env.VITE_SHARE_BASE_URL as string | undefined

export default function ElectronApp() {
  return (
    <AppRouter
      headerPadding="8px 20px 8px 90px"
      headerDrag
      shareBaseUrl={shareBaseUrl}
      onHeaderDoubleClick={e => {
        if ((e.target as HTMLElement).closest('button, input, select')) return
        window.api.toggleMaximize()
      }}
    />
  )
}
