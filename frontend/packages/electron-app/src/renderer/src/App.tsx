import { AppRouter } from '@family-tree/tree-lib'

export default function ElectronApp() {
  return (
    <AppRouter
      headerPadding="8px 20px 8px 90px"
      headerDrag
      onHeaderDoubleClick={e => {
        if ((e.target as HTMLElement).closest('button, input, select')) return
        window.api.toggleMaximize()
      }}
    />
  )
}
