import { useState, useEffect } from 'react'
import type { FtreeDocument } from '../types'
import { buildIndex } from '../types'
import { generateQuiz } from '../utils/quizEngine'

interface QuizPanelProps {
  doc:         FtreeDocument
  playerId:    string
  onHighlight: (id: string | undefined) => void
  onClose:     () => void
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D']

export function QuizPanel({ doc, playerId, onHighlight, onClose }: QuizPanelProps) {
  const [session, setSession] = useState(() => generateQuiz(doc, playerId))
  const [done,    setDone]    = useState(false)

  const idx    = buildIndex(doc)
  const player = idx.personMap.get(playerId)
  const { questions, answers, current } = session

  useEffect(() => {
    if (!done && questions.length > 0) onHighlight(questions[current].targetId)
  }, [current, done, questions.length])

  useEffect(() => () => onHighlight(undefined), [])

  if (!player) return null

  // ── Empty state ───────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div style={panel}>
        <div style={panelHeader}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--t-text)' }}>🎮 Trắc nghiệm xưng hô</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={panelBody}>
          <p style={{ color: 'var(--t-text-4)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Không đủ người có quan hệ để tạo câu hỏi.
          </p>
        </div>
      </div>
    )
  }

  // ── Result screen ─────────────────────────────────────────────
  if (done) {
    const score  = answers.filter((a, i) => a === questions[i].correctIndex).length
    const wrongs = questions
      .map((q, i) => ({ q, chosen: answers[i] }))
      .filter(({ q, chosen }) => chosen !== null && chosen !== q.correctIndex)

    return (
      <div style={panel}>
        <div style={panelHeader}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--t-text)' }}>🎉 Kết quả</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={panelBody}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--t-text)', lineHeight: 1 }}>
              {score}<span style={{ fontSize: 18, fontWeight: 400, color: 'var(--t-text-3)' }}>/{questions.length}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--t-text-3)', marginTop: 4 }}>
              {Math.round(score / questions.length * 100)}% đúng
            </div>
            <ProgressBar value={score} max={questions.length} />
          </div>

          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>Câu sai</div>
              {wrongs.map(({ q, chosen }, i) => {
                const target = idx.personMap.get(q.targetId)
                return (
                  <div key={i} style={wrongItem}>
                    <div style={{ fontSize: 12, color: 'var(--t-text-2)', fontWeight: 600 }}>
                      {player.displayName} gọi {target?.displayName ?? '?'} là
                      <span style={{ color: '#16a34a', fontWeight: 800 }}> "{q.correct}"</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-4)', marginTop: 2 }}>
                      Bạn chọn: "{chosen !== null ? q.choices[chosen] : '—'}"
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setSession(generateQuiz(doc, playerId)); setDone(false) }}
              style={actionBtn('#4f46e5')}
            >
              Chơi lại
            </button>
            <button onClick={onClose} style={actionBtn('#6b7280')}>Đóng</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Question screen ───────────────────────────────────────────
  const q        = questions[current]
  const answered = answers[current]
  const target   = idx.personMap.get(q.targetId)
  const isLast   = current === questions.length - 1

  const handleAnswer = (i: number) => {
    if (answered !== null) return
    setSession(prev => {
      const next = [...prev.answers]
      next[prev.current] = i
      return { ...prev, answers: next }
    })
  }

  const handleNext = () => {
    if (isLast) { setDone(true); onHighlight(undefined) }
    else setSession(prev => ({ ...prev, current: prev.current + 1 }))
  }

  return (
    <div style={panel}>
      <div style={panelHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--t-text)' }}>🎮 Trắc nghiệm xưng hô</span>
          <span style={{ fontSize: 11, color: 'var(--t-text-4)' }}>
            {player.displayName} · Câu {current + 1}/{questions.length}
          </span>
        </div>
        <button onClick={onClose} style={closeBtn}>✕</button>
      </div>

      <div style={panelBody}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap' }}>
          {questions.map((_, i) => {
            const a = answers[i]
            const color =
              a !== null     ? (a === questions[i].correctIndex ? '#16a34a' : '#dc2626')
              : i === current ? 'var(--t-brand)'
              :                 'var(--t-border)'
            return <div key={i} style={{ width: 9, height: 9, borderRadius: 5, background: color }} />
          })}
        </div>

        {/* Question */}
        <div style={questionBox}>
          <span style={{ color: 'var(--t-text-3)' }}>{player.displayName} gọi </span>
          <span style={{ color: 'var(--t-text)', fontWeight: 700 }}>{target?.displayName ?? '?'}</span>
          <span style={{ color: 'var(--t-text-3)' }}> là gì?</span>
        </div>

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {q.choices.map((choice, i) => {
            const isCorrect  = i === q.correctIndex
            const isSelected = answered === i
            const revealed   = answered !== null
            const bg     = !revealed ? 'var(--t-surface)' : isCorrect ? '#dcfce7' : isSelected ? '#fee2e2' : 'var(--t-surface)'
            const color  = !revealed ? 'var(--t-text)'   : isCorrect ? '#15803d' : isSelected ? '#b91c1c' : 'var(--t-text-4)'
            const border = !revealed ? 'var(--t-border)'  : isCorrect ? '#16a34a' : isSelected ? '#dc2626' : 'var(--t-border)'
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => handleAnswer(i)}
                style={{
                  background: bg, color,
                  border: `1px solid ${border}`,
                  borderRadius: 8, padding: '10px 14px',
                  textAlign: 'left', cursor: revealed ? 'default' : 'pointer',
                  fontSize: 13, fontWeight: isCorrect && revealed ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 11, opacity: 0.45, minWidth: 14 }}>
                  {CHOICE_LABELS[i]}
                </span>
                <span style={{ flex: 1 }}>{choice}</span>
                {revealed && isCorrect  && <span>✓</span>}
                {revealed && isSelected && !isCorrect && <span>✗</span>}
              </button>
            )
          })}
        </div>

        {answered !== null && (
          <button onClick={handleNext} style={{ ...actionBtn('#4f46e5'), width: '100%', marginTop: 16 }}>
            {isLast ? 'Xem kết quả →' : 'Câu tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round(value / max * 100)
  return (
    <div style={{ background: 'var(--t-border)', borderRadius: 4, height: 6, marginTop: 10, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: value === max ? '#16a34a' : 'var(--t-brand)',
        borderRadius: 4, transition: 'width 0.4s',
      }} />
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
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
}

const questionBox: React.CSSProperties = {
  fontSize: 16, lineHeight: 1.6,
  padding: '14px 16px',
  background: 'var(--t-surface)',
  borderRadius: 10,
  border: '1px solid var(--t-border)',
}

const wrongItem: React.CSSProperties = {
  padding: '8px 10px',
  background: 'var(--t-surface)',
  borderRadius: 6,
  border: '1px solid var(--t-border)',
  marginBottom: 6,
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: color, color: '#fff',
    border: 'none', borderRadius: 8,
    padding: '10px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    flex: 1,
  }
}
