import { useId, type InputHTMLAttributes } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import './FeedbackModal.css' // styles de base des champs / boutons (hm-*)
import './AccountModal.css' // styles partagés du compte (am-*)
import type { Notice } from './useAction'

export function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null
  const isError = notice.kind === 'error'
  return (
    <div
      className={isError ? 'hm-modal-error' : 'am-notice-ok'}
      role={isError ? 'alert' : 'status'}
    >
      {isError ? (
        <AlertTriangle size={15} strokeWidth={2} />
      ) : (
        <CheckCircle2 size={15} strokeWidth={2} />
      )}
      <span>{notice.text}</span>
    </div>
  )
}

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <>
      <label className="hm-field-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="hm-input" {...props} />
    </>
  )
}

export function Avatar({
  url,
  name,
  large = false,
}: {
  url: string | null
  name: string
  large?: boolean
}) {
  return (
    <span className={`am-avatar${large ? ' am-avatar--lg' : ''}`}>
      {url ? (
        <img src={url} alt="" />
      ) : (
        <span aria-hidden="true">{name.charAt(0).toUpperCase() || '?'}</span>
      )}
    </span>
  )
}
