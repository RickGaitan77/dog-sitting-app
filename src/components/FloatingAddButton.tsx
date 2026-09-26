type FloatingAddButtonProps = {
  isOpen: boolean
  onAddBooking: () => void
  onAddEvent: () => void
  onAddMeal: () => void
  onToggle: () => void
}

function FloatingAddButton({
  isOpen,
  onAddBooking,
  onAddEvent,
  onAddMeal,
  onToggle,
}: FloatingAddButtonProps) {
  return (
    <>
      {isOpen && (
        <div className="add-menu">
          <button onClick={onAddBooking}>Add Booking</button>
          <button onClick={onAddEvent}>Add Event</button>
          <button onClick={onAddMeal}>Add Meal</button>
        </div>
      )}

      <button
        className="floating-add-button"
        aria-label="Add new item"
        onClick={onToggle}
      >
        +
      </button>
    </>
  )
}

export default FloatingAddButton
