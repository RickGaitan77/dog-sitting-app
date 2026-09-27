import { useEffect, type ReactNode } from 'react'

type CalendarBottomSheetProps = {
  children: ReactNode
  onClose: () => void
  title: string
}

function CalendarBottomSheet({
  children,
  onClose,
  title,
}: CalendarBottomSheetProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="calendar-sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="calendar-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-sheet-title"
      >
        <div className="calendar-sheet-handle" aria-hidden="true" />
        <header className="calendar-sheet-heading">
          <h2 id="calendar-sheet-title">{title}</h2>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="calendar-sheet-content">{children}</div>
      </section>
    </div>
  )
}

export default CalendarBottomSheet
