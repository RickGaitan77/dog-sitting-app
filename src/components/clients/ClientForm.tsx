import { useState, type FormEvent } from 'react'
import type { Area, Client } from '../../Types'
import type { NewEntity } from '../../services'

type ClientFormProps = {
  areas: Area[]
  client?: Client
  isSaving: boolean
  onCancel: () => void
  onSubmit: (client: NewEntity<Client>) => Promise<void>
}

type ClientFormValues = {
  name: string
  phone: string
  email: string
  address: string
  areaId: string
  notes: string
  emergencyContact: string
  veterinarianInfo: string
}

function optionalValue(value: string): string | undefined {
  const normalizedValue = value.trim()
  return normalizedValue === '' ? undefined : normalizedValue
}

function ClientForm({ areas, client, isSaving, onCancel, onSubmit }: ClientFormProps) {
  const [nameError, setNameError] = useState(false)
  const [values, setValues] = useState<ClientFormValues>({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    address: client?.address ?? '',
    areaId: client?.areaId ?? '',
    notes: client?.notes ?? '',
    emergencyContact: client?.emergencyContact ?? '',
    veterinarianInfo: client?.veterinarianInfo ?? '',
  })

  const updateValue = (field: keyof ClientFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = values.name.trim()

    if (name === '') {
      setNameError(true)
      return
    }

    void onSubmit({
      name,
      phone: optionalValue(values.phone),
      email: optionalValue(values.email),
      address: optionalValue(values.address),
      areaId: optionalValue(values.areaId),
      notes: optionalValue(values.notes),
      emergencyContact: optionalValue(values.emergencyContact),
      veterinarianInfo: optionalValue(values.veterinarianInfo),
      archived: client?.archived ?? false,
    })
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">Client</p>
          <h2>{client === undefined ? 'New client' : 'Edit client'}</h2>
        </div>
        <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>

      <div className="form-grid">
        <label>
          Name <span aria-hidden="true">*</span>
          <input
            autoFocus
            required
            aria-invalid={nameError}
            value={values.name}
            onChange={(event) => {
              updateValue('name', event.target.value)
              setNameError(false)
            }}
          />
          {nameError && <span className="field-error">Name is required.</span>}
        </label>
        <label>
          Phone
          <input type="tel" value={values.phone} onChange={(event) => updateValue('phone', event.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={values.email} onChange={(event) => updateValue('email', event.target.value)} />
        </label>
        <label>
          Area
          <select value={values.areaId} onChange={(event) => updateValue('areaId', event.target.value)}>
            <option value="">No area selected</option>
            {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
        </label>
        <label className="full-width-field">
          Address
          <textarea rows={2} value={values.address} onChange={(event) => updateValue('address', event.target.value)} />
        </label>
        <label className="full-width-field">
          Emergency contact
          <textarea rows={2} value={values.emergencyContact} onChange={(event) => updateValue('emergencyContact', event.target.value)} />
        </label>
        <label className="full-width-field">
          Veterinarian information
          <textarea rows={3} value={values.veterinarianInfo} onChange={(event) => updateValue('veterinarianInfo', event.target.value)} />
        </label>
        <label className="full-width-field">
          Notes
          <textarea rows={4} value={values.notes} onChange={(event) => updateValue('notes', event.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save client'}</button>
      </div>
    </form>
  )
}

export default ClientForm
