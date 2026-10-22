import { LoaderCircle } from 'lucide-react'

export default function Loader({ label = 'Загрузка…' }) {
  return (
    <div className="loader" role="status">
      <LoaderCircle className="spin" size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
