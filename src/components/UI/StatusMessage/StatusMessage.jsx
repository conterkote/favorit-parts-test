import { CircleAlert, SearchX } from 'lucide-react'
import { Button } from '@Ui/Button'

export default function StatusMessage({ title, description, error = false, onRetry, children }) {
  const Icon = error ? CircleAlert : SearchX

  return (
    <div
      className={`status-message ${error ? 'status-message--error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Повторить запрос
        </Button>
      )}
      {children}
    </div>
  )
}
