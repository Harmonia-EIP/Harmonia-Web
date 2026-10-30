import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Camera, Trash2, Check } from 'lucide-react'
import * as api from './accountApi'
import { Avatar, Field, NoticeBox } from './accountUi'
import { useAction } from './useAction'

type SessionLike = { token: string; profile: api.Profile }

type FormProps = {
  session: SessionLike
  /** Recharge le compte depuis le serveur après une modification. */
  onChanged: () => Promise<void>
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

// ─── Profil : avatar + pseudo + noms ────────────────────────

export function ProfileForm({ session, onChanged }: FormProps) {
  const { token, profile } = session

  const [first, setFirst] = useState(profile.first_name)
  const [last, setLast] = useState(profile.last_name)
  const [username, setUsername] = useState(profile.username)

  // Avatar : préparé localement, envoyé seulement au clic sur "Update profile".
  const fileInput = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const { busy, notice, setNotice, run } = useAction()

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    [],
  )

  const clearPreview = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreview(null)
    setFile(null)
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = '' // permet de re-sélectionner le même fichier
    if (!picked) return

    if (!ALLOWED_TYPES.includes(picked.type)) {
      setNotice({ kind: 'error', text: 'Use a PNG, JPEG, GIF or WebP image.' })
      return
    }
    if (picked.size > MAX_AVATAR_BYTES) {
      setNotice({ kind: 'error', text: 'Image is too large (max 2 MB).' })
      return
    }

    clearPreview()
    const url = URL.createObjectURL(picked)
    previewRef.current = url
    setPreview(url)
    setFile(picked)
    setRemoveAvatar(false)
    setNotice(null)
  }

  const onRemove = () => {
    clearPreview()
    setRemoveAvatar(Boolean(profile.avatar_url))
  }

  const changes: api.ProfileChanges = {}
  if (first.trim() !== profile.first_name) changes.first_name = first.trim()
  if (last.trim() !== profile.last_name) changes.last_name = last.trim()
  if (username.trim() !== profile.username) changes.username = username.trim()

  const dirty = Object.keys(changes).length > 0 || file !== null || removeAvatar

  const shownUrl = removeAvatar ? null : (preview ?? profile.avatar_url)
  const canRemove = !removeAvatar && Boolean(preview ?? profile.avatar_url)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!dirty) return

    run(async () => {
      try {
        if (Object.keys(changes).length) await api.updateProfile(token, changes)
        if (file) await api.uploadAvatar(token, file)
        else if (removeAvatar) await api.deleteAvatar(token)
      } finally {
        // Même en cas d'échec partiel, on resynchronise avec le serveur.
        try {
          await onChanged()
        } catch {
          /* on garde la copie locale */
        }
      }

      clearPreview()
      setRemoveAvatar(false)
      setFirst(first.trim())
      setLast(last.trim())
      setUsername(username.trim())
      return 'Profile updated.'
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="am-avatar-block">
        <Avatar url={shownUrl} name={username || profile.username} large />
        <div className="am-avatar-actions">
          <button
            type="button"
            className="am-chip-btn"
            onClick={() => fileInput.current?.click()}
          >
            <Camera size={14} strokeWidth={2} />
            Change photo
          </button>
          {canRemove && (
            <button type="button" className="am-chip-btn" onClick={onRemove}>
              <Trash2 size={14} strokeWidth={2} />
              Remove
            </button>
          )}
          {removeAvatar && (
            <button
              type="button"
              className="am-chip-btn"
              onClick={() => setRemoveAvatar(false)}
            >
              Keep current photo
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={onPick}
            hidden
          />
        </div>
      </div>
      <p className="am-hint">PNG, JPEG, GIF or WebP · 2 MB max</p>

      <div className="am-row">
        <div>
          <Field
            label="First name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            autoComplete="given-name"
            required
          />
        </div>
        <div>
          <Field
            label="Last name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            autoComplete="family-name"
            required
          />
        </div>
      </div>
      <Field
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />

      <NoticeBox notice={notice} />

      <button
        type="submit"
        className="hm-modal-submit"
        disabled={busy || !dirty}
      >
        <Check size={15} strokeWidth={2} />
        {busy ? 'Updating…' : 'Update profile'}
      </button>
    </form>
  )
}

// ─── Email ──────────────────────────────────────────────────

export function EmailForm({ session, onChanged }: FormProps) {
  const { token, profile } = session
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, notice, run } = useAction()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await api.updateEmail(token, {
        current_password: password,
        new_email: newEmail.trim(),
      })
      await onChanged()
      setNewEmail('')
      setPassword('')
      return 'Email updated.'
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="ac-current">
        <span className="ac-current-label">Current email</span>
        <span className="ac-current-value">{profile.email}</span>
      </div>
      <Field
        label="New email"
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Field
        label="Current password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <NoticeBox notice={notice} />
      <button type="submit" className="am-btn-secondary" disabled={busy}>
        {busy ? 'Updating…' : 'Update email'}
      </button>
    </form>
  )
}

// ─── Mot de passe ───────────────────────────────────────────

export function PasswordForm({ session }: { session: SessionLike }) {
  const { token } = session
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const { busy, notice, run } = useAction()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (next !== confirm) throw new Error('The new passwords do not match.')
      await api.updatePassword(token, {
        current_password: current,
        new_password: next,
      })
      setCurrent('')
      setNext('')
      setConfirm('')
      return 'Password updated.'
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <Field
        label="Current password"
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        autoComplete="current-password"
        required
      />
      <Field
        label="New password"
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        autoComplete="new-password"
        required
      />
      <Field
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />
      <NoticeBox notice={notice} />
      <button type="submit" className="am-btn-secondary" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
