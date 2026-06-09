import { useState, useMemo } from 'react'
import type { FtreeDocument } from '../types'
import { normalizeVi } from '../utils/normalizeVi'

interface SearchBarProps {
  doc:      FtreeDocument
  onSelect: (personId: string) => void
}

export function SearchBar({ doc, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)

  const results = useMemo(() => {
    const q = normalizeVi(query.trim())
    if (!q) return []
    return doc.persons
      .filter(p =>
        normalizeVi(p.displayName).includes(q) ||
        (p.names?.birth     && normalizeVi(p.names.birth).includes(q)) ||
        (p.names?.nickname  && normalizeVi(p.names.nickname).includes(q)),
      )
      .slice(0, 8)
  }, [query, doc.persons])

  function handleSelect(personId: string) {
    setQuery('')
    setOpen(false)
    onSelect(personId)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={searchBox}>
        <span style={{ color: 'var(--t-text-4)', fontSize: 14, lineHeight: 1 }}>⌕</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Tìm người…"
          style={inputStyle}
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(''); setOpen(false) }}
            style={clearBtn}
          >✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={dropdown}>
          {results.map(p => (
            <div
              key={p.id}
              onMouseDown={() => handleSelect(p.id)}
              style={dropdownItem}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--t-card)')}
            >
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-text)' }}>
                {p.displayName}
              </span>
              {p.birthDate?.year && (
                <span style={{ fontSize: 11, color: 'var(--t-text-4)', marginLeft: 6 }}>
                  {p.birthDate.year}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div style={{ ...dropdown, padding: '10px 14px', color: 'var(--t-text-4)', fontSize: 13 }}>
          Không tìm thấy
        </div>
      )}
    </div>
  )
}

const searchBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'var(--t-card)', border: '1px solid var(--t-border-2)',
  borderRadius: 8, padding: '5px 10px',
  width: 220,
}

const inputStyle: React.CSSProperties = {
  border: 'none', outline: 'none', fontSize: 13,
  flex: 1, background: 'transparent',
  color: 'var(--t-text)',
  minWidth: 0,
}

const clearBtn: React.CSSProperties = {
  border: 'none', background: 'none', cursor: 'pointer',
  color: 'var(--t-text-4)', fontSize: 12, padding: '0 2px',
  lineHeight: 1,
}

const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0,
  marginTop: 4, background: 'var(--t-card)',
  border: '1px solid var(--t-border)', borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 200, minWidth: 240, overflow: 'hidden',
}

const dropdownItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '8px 14px', cursor: 'pointer',
  background: 'var(--t-card)', transition: 'background 0.1s',
}
