import { useState, useRef, useEffect } from 'react'
import type { WorkspaceEntry } from '../storage'

interface Props {
  name: string | null
  entries: WorkspaceEntry[]
  activeId: string | null
  onSelect:      (id: string) => void
  onCreate:      () => void
  onOpenFolder:  () => void
  onDelete:      (id: string) => void
  onRename:      (id: string) => void
  onClose:       () => void
  top?:          number   // default 48 (below header); 0 on welcome screen
}

export function WorkspaceSidebar({
  name, entries, activeId,
  onSelect, onCreate, onOpenFolder, onDelete, onRename, onClose,
  top = 48,
}: Props) {
  const [menuId, setMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuId])

  return (
    <div style={{ ...sidebar, top }}>
      {/* Header */}
      <div style={sidebarHeader}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--t-text-4)', textTransform: 'uppercase' }}>
          {name ?? 'Gia phả'}
        </span>
        <button onClick={onClose} style={iconBtn} title="Đóng sidebar">✕</button>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entries.length === 0 && (
          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--t-text-4)', fontStyle: 'italic' }}>
            Chưa có file .ftree nào
          </div>
        )}
        {entries.map(entry => {
          const isActive = entry.id === activeId
          return (
            <div
              key={entry.id}
              style={fileRow(isActive)}
              onClick={() => { setMenuId(null); onSelect(entry.id) }}
            >
              {isActive && <div style={activeAccent} />}
              <span style={{ fontSize: 13, marginRight: 6, flexShrink: 0 }}>🌳</span>
              <span style={{
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--t-text)' : 'var(--t-text-2)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.displayName}
              </span>

              {/* Context menu trigger */}
              <div style={{ position: 'relative', flexShrink: 0 }} ref={menuId === entry.id ? menuRef : undefined}>
                <button
                  style={moreBtn}
                  title="Tuỳ chọn"
                  onClick={e => { e.stopPropagation(); setMenuId(menuId === entry.id ? null : entry.id) }}
                >
                  ···
                </button>
                {menuId === entry.id && (
                  <div style={contextMenu}>
                    <button style={menuItem} onClick={e => { e.stopPropagation(); setMenuId(null); onRename(entry.id) }}>
                      ✏ Đổi tên
                    </button>
                    <button style={{ ...menuItem, color: '#dc2626' }} onClick={e => { e.stopPropagation(); setMenuId(null); onDelete(entry.id) }}>
                      🗑 Xoá
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div style={footer}>
        <button style={footerBtn} onClick={onCreate}>+ Tạo mới</button>
        <button style={footerBtn} onClick={onOpenFolder}>📁 Đổi folder</button>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const sidebar = {
  position: 'fixed',
  top: 0,   // overridden inline via style prop
  left: 0,
  bottom: 0,
  width: 200,
  background: 'var(--t-card)',
  borderRight: '1px solid var(--t-border)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 8,
  userSelect: 'none',
  WebkitAppRegion: 'no-drag',  // opt out of Electron drag region
} as React.CSSProperties

const sidebarHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 10px 6px',
  borderBottom: '1px solid var(--t-border)',
  flexShrink: 0,
}

const fileRow = (active: boolean): React.CSSProperties => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  padding: '5px 10px 5px 14px',
  cursor: 'pointer',
  background: active ? 'rgba(124,58,237,0.08)' : 'transparent',
  transition: 'background 0.1s',
})

const activeAccent: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 2,
  background: '#7c3aed',
  borderRadius: '0 1px 1px 0',
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  color: 'var(--t-text-4)',
  padding: '2px 4px',
  borderRadius: 4,
  lineHeight: 1,
}

const moreBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 11,
  color: 'var(--t-text-4)',
  padding: '0 3px',
  borderRadius: 3,
  lineHeight: 1.2,
  letterSpacing: '-1px',
  opacity: 0.6,
}

const contextMenu: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '100%',
  zIndex: 100,
  background: 'var(--t-card)',
  border: '1px solid var(--t-border)',
  borderRadius: 6,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  minWidth: 120,
  overflow: 'hidden',
}

const menuItem: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 500,
  textAlign: 'left',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--t-text-2)',
}

const footer: React.CSSProperties = {
  padding: '8px',
  borderTop: '1px solid var(--t-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flexShrink: 0,
}

const footerBtn: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 5,
  border: '1px solid var(--t-border)',
  background: 'transparent',
  color: 'var(--t-text-3)',
  cursor: 'pointer',
  textAlign: 'left',
}
