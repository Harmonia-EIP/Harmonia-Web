import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { X, LogIn, UserPlus } from 'lucide-react'
import { Field, NoticeBox } from './accountUi'
import { useAction } from './useAction'
import type { useAuth } from './useAuth'

type Auth = ReturnType<typeof useAuth>
type Mode = 'signin' | 'signup'

/** Modale de connexion / création de compte. */
export default function AuthModal({
  auth,
  onClose,
  onSuccess,
}: {
  auth: Auth
  onClose: () => void
  onSuccess?: () => void
}) {
  const [mode, setMode] = useState<Mode>('signin')
  const [f, setF] = useState({
    identifier: '',
    password: '',
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  })
  const { busy, notice, setNotice, run } = useAction()

  // Toujours la dernière version de onClose, sans relancer l'effet à chaque rendu.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const set = (key: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }))

  const switchMode = (next: Mode) => {
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
      onSuccess?.()
    })
  }

  const isSignIn = mode === 'signin'

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

        <form onSubmit={onSubmit}>
          <div className="hm-modal-eyebrow">Account</div>
          <h2 className="hm-modal-title">
            {isSignIn ? 'Sign in to Harmonia' : 'Create your account'}
          </h2>
          <p className="hm-modal-sub">
            {isSignIn
              ? 'Use your username or email to pick up where you left off.'
              : 'Save your profile and keep your generations in one place.'}
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
      </div>
    </div>,
    document.body,
  )
}
