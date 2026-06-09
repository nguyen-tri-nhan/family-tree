import type { FtreeDocument, Person, FtreeIndex } from '../types'
import { buildIndex } from '../types'
import { computeKinship } from '../kinship'
import type { Region, KinshipResult } from '../kinship'

interface KinshipDrawerProps {
  doc:       FtreeDocument
  personAId: string
  personBId: string
  onClose:   () => void
}

export function KinshipDrawer({ doc, personAId, personBId, onClose }: KinshipDrawerProps) {
  const region: Region = doc.clan.region ?? 'north'
  const idx  = buildIndex(doc)
  const pA   = idx.personMap.get(personAId)
  const pB   = idx.personMap.get(personBId)

  if (!pA || !pB) return null

  const ab = computeKinship(doc, personAId, personBId, region)
  const ba = computeKinship(doc, personBId, personAId, region)

  return (
    <div style={panel}>
      {/* Header */}
      <div style={panelHeader}>
        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--t-text)' }}>
          Quan hệ họ hàng
        </span>
        <button onClick={onClose} style={closeBtn}>✕</button>
      </div>

      <div style={panelBody}>
        {/* Person pair */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <PersonChip person={pA} />
          <span style={{ color: 'var(--t-text-4)', fontSize: 16, fontWeight: 300, flexShrink: 0 }}>↔</span>
          <PersonChip person={pB} />
        </div>

        {!ab && !ba ? (
          <div style={{ textAlign: 'center', color: 'var(--t-text-4)', fontSize: 13 }}>
            Không tìm thấy quan hệ họ hàng
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ab && <RelRow fromName={pA.displayName} toName={pB.displayName} result={ab} />}
            {ba && <RelRow fromName={pB.displayName} toName={pA.displayName} result={ba} />}
          </div>
        )}

        {/* Annotated path — only when 3+ nodes in path */}
        {ab && ab.path.length > 2 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--t-border)' }}>
            <div style={sectionLabel}>Đường nối · {ab.path.length - 1} bậc</div>
            <PathDisplay
              doc={doc}
              result={ab}
              region={region}
              idx={idx}
              viewerId={personAId}
              targetId={personBId}
            />
          </div>
        )}

        {/* Hint */}
        <div style={{ marginTop: 16, fontSize: 10, color: 'var(--t-text-4)', textAlign: 'center' }}>
          Nhấn vào người trên cây để thay đổi đích
        </div>
      </div>
    </div>
  )
}

// ── RelRow ────────────────────────────────────────────────────────

function RelRow({ fromName, toName, result }: {
  fromName: string
  toName:   string
  result:   KinshipResult
}) {
  const absGen = Math.abs(result.genDelta)
  const showGenBadge = absGen >= 3

  return (
    <div style={{
      background: 'var(--t-surface)', borderRadius: 8,
      padding: '10px 12px', border: '1px solid var(--t-border)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--t-text-3)', marginBottom: 3 }}>
        <span style={{ fontWeight: 600, color: 'var(--t-text-2)' }}>{fromName}</span> gọi{' '}
        <span style={{ fontWeight: 600, color: 'var(--t-text-2)' }}>{toName}</span> là:
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-text)' }}>
          "{result.label}"
        </span>
        {showGenBadge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
            background: 'var(--t-brand)', color: 'var(--t-brand-fg)', flexShrink: 0,
          }}>
            đời thứ {absGen}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t-text-4)' }}>
        {fromName} tự xưng:{' '}
        <span style={{ fontWeight: 600, color: 'var(--t-text-3)' }}>"{result.selfLabel}"</span>
      </div>
    </div>
  )
}

// ── PathDisplay ───────────────────────────────────────────────────

function stepLabel(doc: FtreeDocument, fromId: string, toId: string, region: Region): string {
  return computeKinship(doc, fromId, toId, region)?.label ?? '?'
}

function PathDisplay({ doc, result, region, idx, viewerId, targetId }: {
  doc:      FtreeDocument
  result:   KinshipResult
  region:   Region
  idx:      FtreeIndex
  viewerId: string
  targetId: string
}) {
  const { path, lcaIndex } = result

  function name(id: string) {
    return idx.personMap.get(id)?.displayName ?? id
  }

  // Direct line: viewer → ... → target (all ascending) or viewer → ... → target (all descending)
  const isDirectLine = lcaIndex === 0 || lcaIndex === path.length - 1

  if (isDirectLine) {
    // Show oldest at top, youngest at bottom
    const ordered = lcaIndex === path.length - 1
      ? [...path].reverse()  // target is LCA/oldest → put at top
      : path                 // viewer is LCA/oldest → already at top

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {ordered.map((id, i) => (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PathNode id={id} name={name(id)} viewerId={viewerId} targetId={targetId} />
            {i < ordered.length - 1 && (
              <ArrowStep
                label={stepLabel(doc, ordered[i + 1], ordered[i], region)}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // V-split: collateral relationship through LCA
  const leftBranch  = path.slice(0, lcaIndex + 1).reverse() // [LCA, ..., viewer]
  const rightBranch = path.slice(lcaIndex)                   // [LCA, ..., target]
  const lcaId       = leftBranch[0]

  return (
    <div>
      {/* LCA centered at top */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <PathNode id={lcaId} name={name(lcaId)} viewerId={viewerId} targetId={targetId} />
      </div>

      {/* Branch indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 2, padding: '0 12px' }}>
        <span style={{ color: 'var(--t-border-2)', fontSize: 14, lineHeight: 1 }}>╱</span>
        <span style={{ color: 'var(--t-border-2)', fontSize: 14, lineHeight: 1 }}>╲</span>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {/* Left: viewer's side (LCA's child → ... → viewer) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {leftBranch.slice(1).map((id, i) => (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ArrowStep label={stepLabel(doc, id, leftBranch[i], region)} />
              <PathNode id={id} name={name(id)} viewerId={viewerId} targetId={targetId} />
            </div>
          ))}
        </div>

        {/* Right: target's side (LCA's child → ... → target) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {rightBranch.slice(1).map((id, i) => (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ArrowStep label={stepLabel(doc, id, rightBranch[i], region)} />
              <PathNode id={id} name={name(id)} viewerId={viewerId} targetId={targetId} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function PathNode({ id, name, viewerId, targetId }: {
  id: string; name: string; viewerId: string; targetId: string
}) {
  const isViewer   = id === viewerId
  const isTarget   = id === targetId
  const isEndpoint = isViewer || isTarget
  return (
    <div style={{
      padding: '4px 10px', borderRadius: 20,
      background: isEndpoint ? 'var(--t-brand)' : 'var(--t-surface)',
      border: `1px solid ${isEndpoint ? 'var(--t-brand)' : 'var(--t-border)'}`,
      color: isEndpoint ? 'var(--t-brand-fg)' : 'var(--t-text)',
      fontSize: 11, fontWeight: isEndpoint ? 700 : 500,
      whiteSpace: 'nowrap', maxWidth: 130,
      overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {name}
    </div>
  )
}

function ArrowStep({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
      <div style={{ width: 1, height: 6, background: 'var(--t-border-2)' }} />
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'var(--t-text-3)',
        background: 'var(--t-card)', border: '1px solid var(--t-border)',
        borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{ width: 1, height: 5, background: 'var(--t-border-2)' }} />
      <div style={{ fontSize: 9, color: 'var(--t-border-2)', lineHeight: 0.9 }}>▾</div>
    </div>
  )
}

function PersonChip({ person }: { person: Person }) {
  const color = person.gender === 'female' ? '#be185d' : '#1d4ed8'
  const bg    = `var(${person.gender === 'female' ? '--t-female-bg' : '--t-male-bg'})`
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: bg,
        border: `2px solid ${color}`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18, margin: '0 auto 4px',
      }}>
        {person.gender === 'female' ? '♀' : '♂'}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--t-text)',
        lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {person.displayName}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  position: 'fixed', top: 0, right: 0, bottom: 0,
  width: 320, zIndex: 100,
  background: 'var(--t-card)',
  borderLeft: '1px solid var(--t-border)',
  boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
  display: 'flex', flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
}

const panelHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px 12px',
  borderBottom: '1px solid var(--t-border)',
  flexShrink: 0,
}

const panelBody: React.CSSProperties = {
  flex: 1, overflowY: 'auto',
  padding: '16px',
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, color: 'var(--t-text-4)', padding: '2px 6px',
  borderRadius: 4, lineHeight: 1,
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--t-text-4)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
}
