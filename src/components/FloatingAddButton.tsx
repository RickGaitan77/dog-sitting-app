type FloatingAddButtonProps = {
  isOpen: boolean
  onAddBooking: () => void
  onToggle: () => void
}

function FloatingAddButton({
  isOpen,
  onAddBooking,
  onToggle,
}: FloatingAddButtonProps) {
  return (
    <>
      {isOpen && (
        <div className="add-menu">
          <button onClick={onAddBooking}>Add Booking</button>
          <button>Add Event</button>
          <button>Add Meal</button>
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
