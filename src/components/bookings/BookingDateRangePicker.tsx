import { useMemo, useState } from 'react'

type BookingDateRangePickerProps = {
  endDate: string
  onCancel: () => void
  onConfirm: (startDate: string, endDate: string) => void
  startDate: string
}

type CalendarMonth = {
  monthIndex: number
  year: number
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

function dateToMonth(date: string): CalendarMonth {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      year: Number(date.slice(0, 4)),
      monthIndex: Number(date.slice(5, 7)) - 1,
    }
  }

  const today = new Date()
  return { year: today.getFullYear(), monthIndex: today.getMonth() }
}

function moveMonth(month: CalendarMonth, offset: number): CalendarMonth {
  const date = new Date(Date.UTC(month.year, month.monthIndex + offset, 1))
  return { year: date.getUTCFullYear(), monthIndex: date.getUTCMonth() }
}

function toDateOnly(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatMonth(month: CalendarMonth): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(Date.UTC(month.year, month.monthIndex, 1)))
}

function formatDate(date: string): string {
  if (date === '') return 'Not selected'
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function BookingDateRangePicker({ endDate, onCancel, onConfirm, startDate }: BookingDateRangePickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => dateToMonth(startDate))
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)
  const [selectingEnd, setSelectingEnd] = useState(false)
  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(visibleMonth.year, visibleMonth.monthIndex, 1)).getUTCDay()
    const dayCount = new Date(Date.UTC(visibleMonth.year, visibleMonth.monthIndex + 1, 0)).getUTCDate()
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: dayCount }, (_value, index) => index + 1),
    ]
  }, [visibleMonth])

  const selectDate = (date: string) => {
    if (!selectingEnd) {
      setDraftStart(date)
      setDraftEnd('')
      setSelectingEnd(true)
      return
    }

    if (date < draftStart) {
      setDraftStart(date)
      setDraftEnd('')
      return
    }

    setDraftEnd(date)
    setSelectingEnd(false)
  }

  return (
    <div className="booking-picker-backdrop" role="dialog" aria-modal="true" aria-labelledby="booking-date-picker-title">
      <section className="booking-picker-sheet booking-date-picker">
        <div className="booking-picker-heading">
          <div>
            <p className="eyebrow">Date-only range</p>
            <h3 id="booking-date-picker-title">Choose booking dates</h3>
          </div>
          <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
        </div>

        <div className="booking-range-summary" aria-live="polite">
          <div className={!selectingEnd ? 'active' : undefined}><span>Start</span><strong>{formatDate(draftStart)}</strong></div>
          <div className={selectingEnd ? 'active' : undefined}><span>End</span><strong>{formatDate(draftEnd)}</strong></div>
        </div>
        <p className="booking-date-instruction">{selectingEnd ? 'Now choose the end date.' : 'Choose a start date, or confirm this range.'}</p>

        <div className="booking-date-month-heading">
          <button type="button" onClick={() => setVisibleMonth((current) => moveMonth(current, -1))} aria-label="Previous month">‹</button>
          <strong>{formatMonth(visibleMonth)}</strong>
          <button type="button" onClick={() => setVisibleMonth((current) => moveMonth(current, 1))} aria-label="Next month">›</button>
        </div>
        <div className="booking-date-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
        </div>
        <div className="booking-date-grid">
          {calendarDays.map((day, index) => {
            if (day === null) return <span className="booking-date-blank" key={`blank-${index}`} />
            const date = toDateOnly(visibleMonth.year, visibleMonth.monthIndex, day)
            const isStart = date === draftStart
            const isEnd = date === draftEnd
            const isInRange = draftStart !== '' && draftEnd !== '' && date > draftStart && date < draftEnd
            return (
              <button
                className={`${isStart ? 'range-start ' : ''}${isEnd ? 'range-end ' : ''}${isInRange ? 'in-range' : ''}`.trim()}
                type="button"
                aria-label={date}
                aria-pressed={isStart || isEnd || isInRange}
                onClick={() => selectDate(date)}
                key={date}
              >
                {day}
              </button>
            )
          })}
        </div>

        {selectingEnd && draftStart !== '' && (
          <button className="text-button booking-same-day-button" type="button" onClick={() => { setDraftEnd(draftStart); setSelectingEnd(false) }}>
            Use {formatDate(draftStart)} as a same-day booking
          </button>
        )}

        <div className="form-actions booking-picker-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" type="button" disabled={draftStart === '' || draftEnd === ''} onClick={() => onConfirm(draftStart, draftEnd)}>Confirm dates</button>
        </div>
      </section>
    </div>
  )
}

export default BookingDateRangePicker
