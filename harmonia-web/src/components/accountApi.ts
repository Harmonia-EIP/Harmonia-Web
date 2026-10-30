/**
 * Client HTTP pour l'API Harmonia (auth + profil).
 *
 * URL de l'API : variable d'env VITE_API_URL (ex. https://api.mon-domaine.com).
 * Si les routes de ton backend diffèrent, ajuste uniquement ROUTES ci-dessous.
 */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

export const ROUTES = {
  signin: '/auth/signin', // POST { identifier, password }
  signup: '/auth/signup', // POST { first_name, last_name, username, email, password }
  me: '/profile/me', // GET
  updateProfile: '/profile/me', // PATCH { first_name?, last_name?, username? }
  updateEmail: '/profile/me/email', // PUT { current_password, new_email }
  updatePassword: '/profile/me/password', // PUT { current_password, new_password }
  avatar: '/profile/me/avatar', // POST (multipart, champ "file") / DELETE
  history: '/profile/me/history', // DELETE (tout) ; DELETE /{id} (une entrée)
} as const

export type Profile = {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
  avatar_url: string | null
}

export type HistoryEntry = {
  id: number
  name: string
  type: string
  parameters: unknown // objet { paramètre: valeur } (ou chaîne JSON)
  /** Modèle IA utilisé (null pour les anciennes entrées / modèle par défaut). */
  model_id?: string | null
  model_name?: string | null
  created_at: string
  last_used_at: string | null
}

export type PaletteColor = { id: number; color: string }

/** Profil complet renvoyé par GET /profile/me (avec historique et palette). */
export type Account = Profile & {
  created_at: string
  palette: PaletteColor[]
  last_color_id: number | null
  history: HistoryEntry[]
}

export type ProfileChanges = Partial<
  Pick<Profile, 'first_name' | 'last_name' | 'username'>
>

export type SignUpBody = {
  first_name: string
  last_name: string
  username: string
  email: string
  password: string
}

export class ApiError extends Error {
  status: number
  /** ERROR_CODE renvoyé par le backend (si présent), utile pour mapper côté front. */
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Extrait un texte lisible d'une valeur `detail` (string, liste, ou objet). */
function messageFrom(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    const msgs = v
      .map((d) => messageFrom(d))
      .filter((m): m is string => Boolean(m))
    return msgs.length ? msgs.join(' · ') : null
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    for (const k of ['message', 'msg', 'detail', 'error']) {
      const m = messageFrom(o[k])
      if (m) return m
    }
  }
  return null
}

/**
 * Gère les formats d'erreur FastAPI :
 *  - { detail: "texte" }
 *  - { detail: [{ msg }] }                     (validation Pydantic)
 *  - { detail: { error_code, message } }       (erreurs custom)
 *  - { error_code, detail } / { message }      (à plat)
 */
function extractError(data: unknown): {
  message: string | null
  code?: string
} {
  if (!data || typeof data !== 'object') return { message: null }
  const obj = data as Record<string, unknown>
  const detail = obj.detail
  const detailObj =
    detail && typeof detail === 'object' && !Array.isArray(detail)
      ? (detail as Record<string, unknown>)
      : null
  const rawCode = obj.error_code ?? detailObj?.error_code
  return {
    message: messageFrom(detail) ?? messageFrom(obj),
    code: typeof rawCode === 'string' ? rawCode : undefined,
  }
}

/** Récupère le token même si le backend le nomme autrement. */
function pickToken(r: unknown): string {
  const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
  const t = o.token ?? o.access_token ?? o.accessToken
  if (typeof t !== 'string' || !t) {
    throw new ApiError(
      500,
      'Unexpected server response (no token). Check VITE_API_URL and the sign-in route.',
    )
  }
  return t
}

function assertProfile(p: unknown): asserts p is Profile {
  if (!p || typeof p !== 'object' || !('username' in p)) {
    throw new ApiError(
      500,
      'Unexpected server response (profile). Check VITE_API_URL and the /profile/me route.',
    )
  }
}

type RequestOptions = {
  method?: string
  token?: string
  json?: unknown
  form?: FormData
}

async function request<T>(
  path: string,
  { method = 'GET', token, json, form }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form // le navigateur ajoute le boundary multipart
  }

  let res: Response
  try {
    res = await fetch(BASE + path, { method, headers, body })
  } catch {
    // Réseau coupé, API éteinte, ou blocage CORS : le détail est dans la console.
    console.error(`[api] ${method} ${BASE}${path} a échoué (réseau / CORS ?)`)
    throw new ApiError(
      0,
      `Cannot reach the server (${BASE}). Check your connection or the API URL.`,
    )
  }

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* réponse non JSON */
  }

  if (!res.ok) {
    const { message, code } = extractError(data)
    throw new ApiError(
      res.status,
      message ?? `Request failed (${res.status}).`,
      code,
    )
  }
  return data as T
}

// ─── Auth ────────────────────────────────────────────────
export async function signIn(identifier: string, password: string) {
  const data = await request<unknown>(ROUTES.signin, {
    method: 'POST',
    json: { identifier, password },
  })
  return { token: pickToken(data) }
}

export async function signUp(body: SignUpBody) {
  const data = await request<unknown>(ROUTES.signup, {
    method: 'POST',
    json: body,
  })
  return { token: pickToken(data) }
}

// ─── Profil ──────────────────────────────────────────────
/** Réduit un profil complet à la partie légère gardée en session. */
export function toProfile(p: Profile): Profile {
  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    username: p.username,
    email: p.email,
    avatar_url: p.avatar_url ?? null,
  }
}

export async function getProfile(token: string): Promise<Profile> {
  const p = await request<unknown>(ROUTES.me, { token })
  assertProfile(p)
  return toProfile(p)
}

export async function getAccount(token: string): Promise<Account> {
  const raw = await request<unknown>(ROUTES.me, { token })
  assertProfile(raw)
  const p = raw as Account
  return {
    ...toProfile(p),
    created_at: p.created_at,
    palette: p.palette ?? [],
    last_color_id: p.last_color_id ?? null,
    history: p.history ?? [],
  }
}

export const updateProfile = (token: string, changes: ProfileChanges) =>
  request<unknown>(ROUTES.updateProfile, {
    method: 'PATCH',
    token,
    json: changes,
  })

export const updateEmail = (
  token: string,
  body: { current_password: string; new_email: string },
) => request<unknown>(ROUTES.updateEmail, { method: 'PUT', token, json: body })

export const updatePassword = (
  token: string,
  body: { current_password: string; new_password: string },
) =>
  request<unknown>(ROUTES.updatePassword, { method: 'PUT', token, json: body })

export function uploadAvatar(token: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return request<unknown>(ROUTES.avatar, { method: 'POST', token, form })
}

export const deleteAvatar = (token: string) =>
  request<unknown>(ROUTES.avatar, { method: 'DELETE', token })

// ─── Historique ──────────────────────────────────────────
export const deleteHistoryEntry = (token: string, id: number) =>
  request<unknown>(`${ROUTES.history}/${id}`, { method: 'DELETE', token })

export const clearHistory = (token: string) =>
  request<unknown>(ROUTES.history, { method: 'DELETE', token })
