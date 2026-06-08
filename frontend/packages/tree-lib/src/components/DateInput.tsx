import { useState, useEffect } from 'react'
import { LunarDate, SolarDate } from 'lunar-date-vn'
import type { PartialDate } from '../types'

interface DateInputProps {
  value?:    PartialDate
  onChange:  (v: PartialDate | undefined) => void
  disabled?: boolean
}

function lunarToSolar(
  year: number, month: number, day: number, leapMonth: boolean,
): { year: number; month: number; day: number } | null {
  try {
    const ld = new LunarDate({ day, month, year, yearIndex: 0, hour: 0, leap_month: leapMonth })
    ld.init()
    const sd = ld.toSolarDate()
    if (!sd) return null
    const g = sd.get()
    return { year: g.year, month: g.month, day: g.day }
  } catch {
    return null
  }
}

function getCanChi(lunarYear: number): string {
  try {
    const ld = new LunarDate({ day: 1, month: 1, year: lunarYear, yearIndex: 0, hour: 0 })
    ld.init()
    return ld.getYearName()
  } catch {
    return ''
  }
}

function solarToLunarName(year: number, month: number, day: number): string {
  try {
    const sd = new SolarDate({ day, month, year, yearIndex: 0, hour: 0 })
    const ld = sd.toLunarDate()
    if (!ld) return ''
    return ld.getYearName()
  } catch {
    return ''
  }
}

export function DateInput({ value, onChange, disabled }: DateInputProps) {
  const [cal,       setCal]       = useState<'solar' | 'lunar'>(value?.displayCalendar ?? 'solar')
  const [year,      setYear]      = useState(value?.year?.toString()  ?? '')
  const [month,     setMonth]     = useState(value?.month?.toString() ?? '')
  const [day,       setDay]       = useState(value?.day?.toString()   ?? '')
  const [leapMonth, setLeapMonth] = useState(value?.lunar?.leapMonth ?? false)

  // Sync lên parent mỗi khi fields thay đổi
  useEffect(() => {
    const y = parseInt(year)
    if (!year || isNaN(y)) { onChange(undefined); return }

    const m = month ? parseInt(month) : undefined
    const d = day   ? parseInt(day)   : undefined

    if (cal === 'solar') {
      onChange({ year: y, month: m, day: d, displayCalendar: 'solar' })
      return
    }

    // Lunar: cần convert sang solar canonical
    if (m && d) {
      const solar = lunarToSolar(y, m, d, leapMonth)
      if (solar) {
        onChange({
          year: solar.year, month: solar.month, day: solar.day,
          lunar: { year: y, month: m, day: d, leapMonth },
          displayCalendar: 'lunar',
        })
      } else {
        // Ngày không hợp lệ (vd tháng nhuận không tồn tại) → chỉ lưu năm
        onChange({ year: y, displayCalendar: 'lunar', lunar: { year: y, month: m, leapMonth } })
      }
    } else {
      // Chỉ có năm (hoặc năm + tháng) → lưu partial
      onChange({ year: y, month: m, displayCalendar: 'lunar', ...(m ? { lunar: { year: y, month: m, leapMonth } } : {}) })
    }
  }, [cal, year, month, day, leapMonth])   // eslint-disable-line react-hooks/exhaustive-deps

  function switchCal(next: 'solar' | 'lunar') {
    setCal(next)
    setMonth(''); setDay('')
    setLeapMonth(false)
  }

  const canChi = cal === 'lunar' && year
    ? getCanChi(parseInt(year))
    : cal === 'solar' && year && month && day
      ? solarToLunarName(parseInt(year), parseInt(month), parseInt(day))
      : ''

  const solarPreview = cal === 'lunar' && year && month && day
    ? lunarToSolar(parseInt(year), parseInt(month), parseInt(day), leapMonth)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Solar / Lunar toggle */}
      <div style={{ display: 'flex', gap: 16 }}>
        {(['solar', 'lunar'] as const).map(c => (
          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: disabled ? 'default' : 'pointer', fontSize: 13 }}>
            <input
              type="radio" name="cal" value={c}
              checked={cal === c}
              onChange={() => !disabled && switchCal(c)}
              disabled={disabled}
            />
            {c === 'solar' ? 'Dương lịch' : 'Âm lịch'}
          </label>
        ))}
      </div>

      {/* Year / Month / Day */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number" placeholder="Năm" value={year}
          onChange={e => setYear(e.target.value)}
          disabled={disabled}
          style={inputStyle(60)}
        />
        <input
          type="number" placeholder="Tháng" value={month} min={1} max={12}
          onChange={e => setMonth(e.target.value)}
          disabled={disabled}
          style={inputStyle(56)}
        />
        <input
          type="number" placeholder="Ngày" value={day} min={1} max={30}
          onChange={e => setDay(e.target.value)}
          disabled={disabled}
          style={inputStyle(50)}
        />
        {cal === 'lunar' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
            <input
              type="checkbox" checked={leapMonth}
              onChange={e => setLeapMonth(e.target.checked)}
              disabled={disabled}
            />
            Tháng nhuận
          </label>
        )}
      </div>

      {/* Preview */}
      {(canChi || solarPreview) && (
        <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {canChi     && <span>Năm {canChi}</span>}
          {solarPreview && (
            <span>→ Dương lịch: {solarPreview.day}/{solarPreview.month}/{solarPreview.year}</span>
          )}
        </div>
      )}
    </div>
  )
}

function inputStyle(w: number): React.CSSProperties {
  return {
    width: w, padding: '4px 6px', fontSize: 13,
    border: '1px solid #d1d5db', borderRadius: 6,
    outline: 'none',
  }
}
