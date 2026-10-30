import { useCallback, useEffect, useState } from 'react'
import * as api from './accountApi'

const STORAGE_KEY = 'harmonia.session'

type Session = { token: string; profile: api.Profile }

function load(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function save(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* stockage indisponible : la session ne survivra pas au rechargement */
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(load)

  const signOut = useCallback(() => {
    save(null)
    setSession(null)
  }, [])

  const setProfile = useCallback((profile: api.Profile) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = { ...prev, profile }
      save(next)
      return next
    })
  }, [])

  const startSession = useCallback(async (token: string) => {
    const profile = await api.getProfile(token)
    const next = { token, profile }
    save(next)
    setSession(next)
  }, [])

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const { token } = await api.signIn(identifier, password)
      await startSession(token)
    },
    [startSession],
  )

  const signUp = useCallback(
    async (body: api.SignUpBody) => {
      const { token } = await api.signUp(body)
      await startSession(token)
    },
    [startSession],
  )

  // Au chargement : rafraîchit le profil, et déconnecte si le token est refusé.
  const token = session?.token
  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .getProfile(token)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch((e) => {
        const dead =
          e instanceof api.ApiError && [401, 403, 404].includes(e.status)
        if (!cancelled && dead) signOut()
      })
    return () => {
      cancelled = true
    }
  }, [token, setProfile, signOut])

  return {
    session,
    profile: session?.profile ?? null,
    signIn,
    signUp,
    signOut,
    setProfile,
  }
}
