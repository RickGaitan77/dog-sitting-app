import { useState, type FormEvent } from 'react'
import type { Service } from '../../Types'
import type { ServiceInput } from '../../services'

type ServiceFormProps = {
  service?: Service
  isSaving: boolean
  onCancel: () => void
  onSubmit: (input: ServiceInput) => Promise<void>
}

function ServiceForm({
  service,
  isSaving,
  onCancel,
  onSubmit,
}: ServiceFormProps) {
  const [name, setName] = useState(service?.name ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name.trim() === '') {
      setValidationError('Service name is required.')
      return
    }
    setValidationError(null)
    void onSubmit({ name })
  }

  return (
    <form className="entity-form service-form" onSubmit={submit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">Booking service</p>
          <h3>{service === undefined ? 'New Service' : 'Edit Service'}</h3>
        </div>
        <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
      </div>

      {validationError !== null && (
        <p className="error-message" role="alert">{validationError}</p>
      )}

      <label>
        Service name <span aria-hidden="true">*</span>
        <input
          autoFocus
          value={name}
          aria-invalid={validationError !== null}
          onChange={(event) => {
            setName(event.target.value)
            setValidationError(null)
          }}
        />
      </label>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Service'}</button>
      </div>
    </form>
  )
}

export default ServiceForm
