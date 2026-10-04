import { useState, type CSSProperties, type FormEvent } from 'react'
import type { Area } from '../../Types'
import type { AreaInput } from '../../services'
import {
  AREA_COLOR_PALETTE,
  getReadableTextColor,
  resolveColorHex,
} from '../../utils/areaColors'

type AreaFormProps = {
  area?: Area
  isSaving: boolean
  onCancel: () => void
  onSubmit: (input: AreaInput) => Promise<void>
}

function AreaForm({ area, isSaving, onCancel, onSubmit }: AreaFormProps) {
  const [name, setName] = useState(area?.name ?? '')
  const [color, setColor] = useState(
    area?.color ?? AREA_COLOR_PALETTE[0].value,
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const previewStyle = {
    backgroundColor: resolveColorHex(color),
    color: getReadableTextColor(color),
  } as CSSProperties

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name.trim() === '') {
      setValidationError('Area name is required.')
      return
    }
    if (color.trim() === '') {
      setValidationError('Select an Area color.')
      return
    }
    setValidationError(null)
    void onSubmit({ name, color })
  }

  return (
    <form className="entity-form area-form" onSubmit={submit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">Scheduling area</p>
          <h3>{area === undefined ? 'New Area' : 'Edit Area'}</h3>
        </div>
        <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>

      {validationError !== null && (
        <p className="error-message" role="alert">{validationError}</p>
      )}

      <label>
        Area name <span aria-hidden="true">*</span>
        <input
          autoFocus
          value={name}
          aria-invalid={validationError !== null && name.trim() === ''}
          onChange={(event) => {
            setName(event.target.value)
            setValidationError(null)
          }}
        />
      </label>

      <fieldset className="area-color-fieldset">
        <legend>Color <span aria-hidden="true">*</span></legend>
        <div className="area-color-palette">
          {AREA_COLOR_PALETTE.map((option) => (
            <button
              className={`area-color-choice${color.toLowerCase() === option.value ? ' selected' : ''}`}
              type="button"
              title={option.label}
              aria-label={`Use ${option.label}`}
              aria-pressed={color.toLowerCase() === option.value}
              style={{ backgroundColor: option.value }}
              onClick={() => setColor(option.value)}
              key={option.value}
            />
          ))}
        </div>
      </fieldset>

      <label className="area-custom-color">
        Custom color
        <span>
          <input
            type="color"
            value={resolveColorHex(color)}
            onChange={(event) => setColor(event.target.value)}
          />
          <code>{color}</code>
        </span>
      </label>

      <div className="area-color-preview" style={previewStyle}>
        {name.trim() || 'Area preview'}
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Area'}</button>
      </div>
    </form>
  )
}

export default AreaForm
