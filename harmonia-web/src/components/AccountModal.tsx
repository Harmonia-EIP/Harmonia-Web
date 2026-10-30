import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  LogIn,
  UserPlus,
  Camera,
  Trash2,
  Check,
  LogOut,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import './FeedbackModal.css'
import './AccountModal.css'
import * as api from './accountApi'
import type { useAuth } from './useAuth'

type Auth = ReturnType<typeof useAuth>
type Session = NonNullable<Auth['session']>
type Notice = { kind: 'ok' | 'error'; text: string } | null

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function useAction() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const run = async (fn: () => Promise<string | void>) => {
    if (busy) return
    setBusy(true)
    setNotice(null)
    try {
      const message = await fn()
      if (message) setNotice({ kind: 'ok', text: message })
    } catch (e) {
      setNotice({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setBusy(false)
    }
  }

  return { busy, notice, setNotice, run }
}

function NoticeBox({ notice }: { notice: Notice }) {
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

function Field({
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

function Avatar({
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

// ─── Modale ─────────────────────────────────────────────────

export default function AccountModal({
  auth,
  onClose,
}: {
  auth: Auth
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="hm-modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Account"
    >
      <div className="hm-modal am-modal">
        <button className="hm-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={2} />
        </button>

        {auth.session ? (
          <AccountPanel auth={auth} session={auth.session} onClose={onClose} />
        ) : (
          <AuthPanel auth={auth} />
        )}
      </div>
    </div>,
    document.body,
  )
}

// ─── Connexion / création de compte ─────────────────────────

function AuthPanel({ auth }: { auth: Auth }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [f, setF] = useState({
    identifier: '',
    password: '',
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  })
  const { busy, notice, setNotice, run } = useAction()

  const set = (key: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }))

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setNotice(null)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (mode === 'signin') {
        await auth.signIn(f.identifier.trim(), f.password)
      } else {
        await auth.signUp({
          first_name: f.first_name.trim(),
          last_name: f.last_name.trim(),
          username: f.username.trim(),
          email: f.email.trim(),
          password: f.password,
        })
      }
    })
  }

  const isSignIn = mode === 'signin'

  return (
    <form onSubmit={onSubmit}>
      <div className="hm-modal-eyebrow">Account</div>
      <h2 className="hm-modal-title">
        {isSignIn ? 'Sign in to Harmonia' : 'Create your account'}
      </h2>
      <p className="hm-modal-sub">
        {isSignIn
          ? 'Use your username or email to pick up where you left off.'
          : 'Save your profile and keep your presets in one place.'}
      </p>

      <div className="am-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isSignIn}
          className="am-tab"
          onClick={() => switchMode('signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignIn}
          className="am-tab"
          onClick={() => switchMode('signup')}
        >
          Create account
        </button>
      </div>

      {isSignIn ? (
        <Field
          label="Username or email"
          value={f.identifier}
          onChange={set('identifier')}
          autoComplete="username"
          required
          autoFocus
        />
      ) : (
        <>
          <div className="am-row">
            <div>
              <Field
                label="First name"
                value={f.first_name}
                onChange={set('first_name')}
                autoComplete="given-name"
                required
                autoFocus
              />
            </div>
            <div>
              <Field
                label="Last name"
                value={f.last_name}
                onChange={set('last_name')}
                autoComplete="family-name"
                required
              />
            </div>
          </div>
          <Field
            label="Username"
            value={f.username}
            onChange={set('username')}
            autoComplete="username"
            required
          />
          <Field
            label="Email"
            type="email"
            value={f.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />
        </>
      )}

      <Field
        label="Password"
        type="password"
        value={f.password}
        onChange={set('password')}
        autoComplete={isSignIn ? 'current-password' : 'new-password'}
        required
      />

      <NoticeBox notice={notice} />

      <button type="submit" className="hm-modal-submit" disabled={busy}>
        {isSignIn ? (
          <LogIn size={15} strokeWidth={2} />
        ) : (
          <UserPlus size={15} strokeWidth={2} />
        )}
        {busy
          ? isSignIn
            ? 'Signing in…'
            : 'Creating account…'
          : isSignIn
            ? 'Sign in'
            : 'Create account'}
      </button>
    </form>
  )
}

// ─── Compte connecté ────────────────────────────────────────

function AccountPanel({
  auth,
  session,
  onClose,
}: {
  auth: Auth
  session: Session
  onClose: () => void
}) {
  const [tab, setTab] = useState<'profile' | 'security'>('profile')
  const { profile } = session

  return (
    <div>
      <div className="am-head">
        <Avatar url={profile.avatar_url} name={profile.username} />
        <div className="am-head-text">
          <h2 className="hm-modal-title am-head-name">{profile.username}</h2>
          <p className="am-head-mail">{profile.email}</p>
        </div>
      </div>

      <div className="am-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'profile'}
          className="am-tab"
          onClick={() => setTab('profile')}
        >
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'security'}
          className="am-tab"
          onClick={() => setTab('security')}
        >
          Email &amp; password
        </button>
      </div>

      {tab === 'profile' ? (
        <ProfileTab auth={auth} session={session} />
      ) : (
        <SecurityTab auth={auth} session={session} />
      )}

      <button
        type="button"
        className="am-signout"
        onClick={() => {
          auth.signOut()
          onClose()
        }}
      >
        <LogOut size={14} strokeWidth={2} />
        Sign out
      </button>
    </div>
  )
}

// ─── Onglet Profil : avatar + pseudo + noms ─────────────────

function ProfileTab({ auth, session }: { auth: Auth; session: Session }) {
  const { token, profile } = session

  const [first, setFirst] = useState(profile.first_name)
  const [last, setLast] = useState(profile.last_name)
  const [username, setUsername] = useState(profile.username)

  // Avatar : on prépare le changement localement, il n'est envoyé qu'au clic sur "Update profile".
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
          auth.setProfile(await api.getProfile(token))
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

// ─── Onglet Sécurité : email + mot de passe ─────────────────

function SecurityTab({ auth, session }: { auth: Auth; session: Session }) {
  return (
    <div>
      <EmailForm auth={auth} session={session} />
      <hr className="am-divider" />
      <PasswordForm session={session} />
    </div>
  )
}

function EmailForm({ auth, session }: { auth: Auth; session: Session }) {
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
      auth.setProfile(await api.getProfile(token))
      setNewEmail('')
      setPassword('')
      return 'Email updated.'
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <h3 className="am-section-title">Email</h3>
      <p className="am-hint">Current: {profile.email}</p>
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

function PasswordForm({ session }: { session: Session }) {
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
      <h3 className="am-section-title">Password</h3>
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
