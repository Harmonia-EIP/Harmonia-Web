import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  KeyRound,
  LogOut,
  Mail,
  Search,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import WavesCanvas from './WavesCanvas'
import { Avatar, NoticeBox } from './accountUi'
import { EmailForm, PasswordForm, ProfileForm } from './AccountForms'
import { useAction } from './useAction'
import * as api from './accountApi'
import type { useAuth } from './useAuth'
import './ProjectPage.css' // réutilise le cadre de page (hm-project-*, hm-section-*)
import './AccountPage.css'

type Auth = ReturnType<typeof useAuth>

type Props = {
  auth: Auth
  onNavigateHome: () => void
  onRequestSignIn: () => void
}

// ─── Dates ──────────────────────────────────────────────────

const DAY = 86_400_000
const dateFmt = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const shortFmt = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
})
const relFmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** Le serveur peut renvoyer des dates sans fuseau : on les considère en UTC. */
function toDate(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  const d = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(d.getTime()) ? new Date(0) : d
}

function timeAgo(d: Date): string {
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', DAY],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms) return relFmt.format(Math.round(diff / ms), unit)
  }
  return 'just now'
}

// ─── Stats ──────────────────────────────────────────────────

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function computeStats(history: api.HistoryEntry[]) {
  const now = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (13 - i),
    )
    return { date, key: dayKey(date), count: 0 }
  })
  const slots = new Map(days.map((d) => [d.key, d]))
  const types = new Map<string, number>()

  let week = 0
  let lastUsed: Date | null = null

  for (const h of history) {
    const created = toDate(h.created_at)
    const used = toDate(h.last_used_at ?? h.created_at)

    const slot = slots.get(dayKey(created))
    if (slot) slot.count += 1
    if (now.getTime() - created.getTime() < 7 * DAY) week += 1
    if (!lastUsed || used > lastUsed) lastUsed = used
    types.set(h.type, (types.get(h.type) ?? 0) + 1)
  }

  const top = [...types.entries()].sort((a, b) => b[1] - a[1])[0]
  return {
    total: history.length,
    week,
    lastUsed,
    top: top ? { type: top[0], count: top[1] } : null,
    days,
    types,
  }
}

// ─── Paramètres d'une génération ────────────────────────────

function parseParams(raw: unknown): Record<string, unknown> {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return {}
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function formatValue(v: unknown): string {
  if (typeof v === 'number')
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  if (typeof v === 'string' || typeof v === 'boolean') return String(v)
  if (v === null || v === undefined) return '—'
  return JSON.stringify(v)
}

function prettyKey(key: string) {
  return key.replace(/[_-]+/g, ' ')
}

/** Nom du modèle IA à afficher (null si l'entrée n'en a pas gardé). */
function modelLabel(h: api.HistoryEntry): string | null {
  const label = (h.model_name ?? h.model_id ?? '').toString().trim()
  return label || null
}

// ─── Réglages : onglets ─────────────────────────────────────

type SettingsTab = 'profile' | 'email' | 'password'

const SETTINGS_TABS: {
  key: SettingsTab
  label: string
  hint: string
  title: string
  desc: string
  icon: LucideIcon
}[] = [
  {
    key: 'profile',
    label: 'Profile',
    hint: 'Photo, name, username',
    title: 'Your profile',
    desc: 'How you appear on Harmonia. Changes are saved when you press Update.',
    icon: UserRound,
  },
  {
    key: 'email',
    label: 'Email',
    hint: 'Where we reach you',
    title: 'Email address',
    desc: 'Use it to sign in. We ask for your password to confirm the change.',
    icon: Mail,
  },
  {
    key: 'password',
    label: 'Password',
    hint: 'Keep your account safe',
    title: 'Password',
    desc: 'Pick something long and unique. You stay signed in on this device.',
    icon: KeyRound,
  },
]

// ─── Cadre de page ──────────────────────────────────────────

function PageFrame({
  onNavigateHome,
  children,
}: {
  onNavigateHome: () => void
  children: ReactNode
}) {
  return (
    <div className="harmonia-root hm-project ac-page">
      <WavesCanvas />
      <div className="harmonia-grain" aria-hidden="true" />
      <div className="harmonia-vignette" aria-hidden="true" />

      <div className="hm-project-shell">
        <nav className="harmonia-nav hm-project-nav">
          <button
            type="button"
            className="hm-back-btn"
            onClick={onNavigateHome}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back to home
          </button>
          <div className="harmonia-brand">
            <span className="harmonia-brand-dot" aria-hidden="true" />
            <span>Harmonia / Audio</span>
          </div>
        </nav>

        {children}

        <footer className="hm-project-footer">
          <span>Harmonia — Epitech Innovation Project</span>
          <span className="harmonia-version-badge">V0.1 BETA</span>
        </footer>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────

export default function AccountPage({
  auth,
  onNavigateHome,
  onRequestSignIn,
}: Props) {
  const { session, setProfile, signOut } = auth
  const token = session?.token

  const [account, setAccount] = useState<api.Account | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState<'recent' | 'used' | 'name'>('recent')
  const [shown, setShown] = useState(8)
  const [confirmClear, setConfirmClear] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')
  const clear = useAction()

  // Chargement initial du compte complet (profil + historique)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .getAccount(token)
      .then((acc) => {
        if (cancelled) return
        setAccount(acc)
        setLoadError(null)
        setProfile(api.toProfile(acc))
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : 'Could not load your account.',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, setProfile])

  /** Recharge le compte après une modification (profil, historique…). */
  const refresh = useCallback(async () => {
    if (!token) return
    const acc = await api.getAccount(token)
    setAccount(acc)
    setProfile(api.toProfile(acc))
  }, [token, setProfile])

  const stats = useMemo(
    () => (account ? computeStats(account.history) : null),
    [account],
  )

  const entries = useMemo(() => {
    if (!account) return []
    const q = query.trim().toLowerCase()
    const list = account.history.filter(
      (h) =>
        (typeFilter === 'all' || h.type === typeFilter) &&
        (!q ||
          h.name.toLowerCase().includes(q) ||
          (modelLabel(h) ?? '').toLowerCase().includes(q)),
    )
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'used') {
        return (
          toDate(b.last_used_at ?? b.created_at).getTime() -
          toDate(a.last_used_at ?? a.created_at).getTime()
        )
      }
      return toDate(b.created_at).getTime() - toDate(a.created_at).getTime()
    })
  }, [account, query, typeFilter, sort])

  // ── Non connecté ──
  if (!session) {
    return (
      <PageFrame onNavigateHome={onNavigateHome}>
        <section className="ac-gate">
          <h1 className="hm-project-title">Your account</h1>
          <p className="hm-project-lead">
            Sign in to see your generations, your stats and your profile
            settings.
          </p>
          <button
            type="button"
            className="hm-modal-submit ac-gate-btn"
            onClick={onRequestSignIn}
          >
            Sign in
          </button>
        </section>
      </PageFrame>
    )
  }

  const { profile } = session
  const fullName = `${profile.first_name} ${profile.last_name}`.trim()
  const maxDay = Math.max(1, ...(stats?.days.map((d) => d.count) ?? [1]))

  return (
    <PageFrame onNavigateHome={onNavigateHome}>
      {/* ── PROFIL ─────────────────────────────── */}
      <header className="ac-hero">
        <div className="ac-hero-glow" aria-hidden="true" />
        <Avatar url={profile.avatar_url} name={profile.username} large />

        <div className="ac-hero-text">
          <h1 className="ac-name">{profile.username}</h1>
          {fullName && <p className="ac-fullname">{fullName}</p>}
          <p className="ac-email">{profile.email}</p>

          {account && (
            <div className="ac-hero-meta">
              <span>
                Member since {dateFmt.format(toDate(account.created_at))}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="ac-signout"
          onClick={() => {
            signOut()
            onNavigateHome()
          }}
        >
          <LogOut size={14} strokeWidth={2} />
          Sign out
        </button>
      </header>

      {loadError && <NoticeBox notice={{ kind: 'error', text: loadError }} />}

      {/* ── STATS ──────────────────────────────── */}
      <section className="ac-stats" aria-label="Statistics">
        <div className="ac-stat">
          <span className="ac-stat-value">{stats ? stats.total : '–'}</span>
          <span className="ac-stat-label">Generations</span>
        </div>
        <div className="ac-stat">
          <span className="ac-stat-value">{stats ? stats.week : '–'}</span>
          <span className="ac-stat-label">Last 7 days</span>
        </div>
        <div className="ac-stat">
          <span className="ac-stat-value ac-stat-value--text">
            {stats?.lastUsed ? timeAgo(stats.lastUsed) : '–'}
          </span>
          <span className="ac-stat-label">Last used</span>
        </div>
        <div className="ac-stat">
          <span className="ac-stat-value ac-stat-value--text">
            {stats?.top ? stats.top.type : '–'}
          </span>
          <span className="ac-stat-label">
            {stats?.top ? `Top type · ${stats.top.count}` : 'Top type'}
          </span>
        </div>

        <div className="ac-activity">
          <div className="ac-activity-head">
            <h3>Activity</h3>
            <span>Generations per day, last 14 days</span>
          </div>
          <div className="ac-bars">
            {(stats?.days ?? []).map((d) => (
              <div
                className="ac-bar-col"
                key={d.key}
                title={`${shortFmt.format(d.date)} · ${d.count} generation${d.count === 1 ? '' : 's'}`}
              >
                <div
                  className={`ac-bar${d.count === 0 ? ' is-empty' : ''}`}
                  style={{
                    height: `${d.count === 0 ? 4 : (d.count / maxDay) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="ac-bars-axis">
            <span>{stats ? shortFmt.format(stats.days[0].date) : ''}</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* ── HISTORIQUE ─────────────────────────── */}
      <section className="hm-section">
        <div className="hm-section-head">
          <span className="hm-section-index">01</span>
          <h2 className="hm-section-title">Generation history</h2>
        </div>

        {!account ? (
          !loadError && <p className="ac-empty">Loading your history…</p>
        ) : account.history.length === 0 ? (
          <p className="ac-empty">
            Nothing here yet. Presets you generate while signed in will show up
            here, with all their parameters.
          </p>
        ) : (
          <>
            <div className="ac-toolbar">
              <label className="ac-search">
                <Search size={15} strokeWidth={2} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search by name or model"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShown(8)
                  }}
                  aria-label="Search generations by name or model"
                />
              </label>

              <div className="am-tabs ac-sort" role="tablist" aria-label="Sort">
                {(
                  [
                    ['recent', 'Newest'],
                    ['used', 'Last used'],
                    ['name', 'Name'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={sort === key}
                    className="am-tab"
                    onClick={() => setSort(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {stats && stats.types.size > 1 && (
              <div className="ac-chips">
                <button
                  type="button"
                  className={`ac-chip${typeFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => {
                    setTypeFilter('all')
                    setShown(8)
                  }}
                >
                  All · {stats.total}
                </button>
                {[...stats.types.entries()].map(([type, count]) => (
                  <button
                    key={type}
                    type="button"
                    className={`ac-chip${typeFilter === type ? ' is-active' : ''}`}
                    onClick={() => {
                      setTypeFilter(type)
                      setShown(8)
                    }}
                  >
                    {type} · {count}
                  </button>
                ))}
              </div>
            )}

            {entries.length === 0 ? (
              <p className="ac-empty">No generation matches your search.</p>
            ) : (
              <div className="ac-entries">
                {entries.slice(0, shown).map((h) => (
                  <HistoryCard
                    key={h.id}
                    entry={h}
                    token={session.token}
                    onChanged={refresh}
                  />
                ))}
              </div>
            )}

            {entries.length > shown && (
              <button
                type="button"
                className="am-chip-btn ac-more"
                onClick={() => setShown((n) => n + 8)}
              >
                Show more ({entries.length - shown})
              </button>
            )}

            <div className="ac-clear">
              {confirmClear ? (
                <>
                  <span>Delete all {account.history.length} generations?</span>
                  <button
                    type="button"
                    className="ac-danger"
                    disabled={clear.busy}
                    onClick={() =>
                      clear.run(async () => {
                        await api.clearHistory(session.token)
                        await refresh()
                        setConfirmClear(false)
                        return 'History cleared.'
                      })
                    }
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    {clear.busy ? 'Deleting…' : 'Yes, delete all'}
                  </button>
                  <button
                    type="button"
                    className="am-chip-btn"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="am-chip-btn"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Clear history
                </button>
              )}
            </div>
            <NoticeBox notice={clear.notice} />
          </>
        )}
      </section>

      {/* ── RÉGLAGES ───────────────────────────── */}
      <section className="hm-section">
        <div className="hm-section-head">
          <span className="hm-section-index">02</span>
          <h2 className="hm-section-title">Account settings</h2>
        </div>

        <div className="ac-settings">
          <div
            className="ac-snav"
            role="tablist"
            aria-label="Account settings"
            aria-orientation="vertical"
            onKeyDown={(e) => {
              if (
                !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(
                  e.key,
                )
              )
                return
              e.preventDefault()
              const i = SETTINGS_TABS.findIndex((t) => t.key === settingsTab)
              const step =
                e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1
              const next =
                SETTINGS_TABS[
                  (i + step + SETTINGS_TABS.length) % SETTINGS_TABS.length
                ]
              setSettingsTab(next.key)
              document.getElementById(`ac-tab-${next.key}`)?.focus()
            }}
          >
            {SETTINGS_TABS.map(({ key, label, hint, icon: Icon }) => (
              <button
                key={key}
                id={`ac-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={settingsTab === key}
                aria-controls={`ac-panel-${key}`}
                tabIndex={settingsTab === key ? 0 : -1}
                className="ac-snav-item"
                onClick={() => setSettingsTab(key)}
              >
                <span className="ac-snav-icon">
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span className="ac-snav-text">
                  <span className="ac-snav-label">{label}</span>
                  <span className="ac-snav-hint">{hint}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="ac-panels">
            {SETTINGS_TABS.map(({ key, title, desc, icon: Icon }) => (
              <div
                key={key}
                id={`ac-panel-${key}`}
                role="tabpanel"
                aria-labelledby={`ac-tab-${key}`}
                className="ac-panel"
                hidden={settingsTab !== key}
              >
                <header className="ac-panel-head">
                  <span className="ac-panel-icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </header>

                <div className="ac-panel-body">
                  {key === 'profile' && (
                    <ProfileForm session={session} onChanged={refresh} />
                  )}
                  {key === 'email' && (
                    <EmailForm session={session} onChanged={refresh} />
                  )}
                  {key === 'password' && <PasswordForm session={session} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  )
}

// ─── Carte d'une génération ─────────────────────────────────

function HistoryCard({
  entry,
  token,
  onChanged,
}: {
  entry: api.HistoryEntry
  token: string
  onChanged: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const { busy, notice, run } = useAction()

  const params = useMemo(
    () => parseParams(entry.parameters),
    [entry.parameters],
  )
  const rows = Object.entries(params)
  const model = modelLabel(entry)

  return (
    <article className={`ac-entry${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="ac-entry-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ac-entry-main">
          <span className="ac-entry-name">{entry.name}</span>
          <span className="ac-entry-meta">
            Created {timeAgo(toDate(entry.created_at))}
            {entry.last_used_at &&
              ` · used ${timeAgo(toDate(entry.last_used_at))}`}
          </span>
        </span>
        <span className="ac-entry-type">{entry.type}</span>
        {model && (
          <span className="ac-entry-model" title={`Model: ${model}`}>
            <Cpu size={12} strokeWidth={2} aria-hidden="true" />
            <span>{model}</span>
          </span>
        )}
        <span className="ac-entry-count">{rows.length} params</span>
        <ChevronDown size={16} strokeWidth={2} className="ac-entry-chevron" />
      </button>

      {open && (
        <div className="ac-entry-body">
          <dl className="ac-entry-info">
            <div>
              <dt>Model</dt>
              <dd className={model ? '' : 'is-muted'}>
                {model ?? 'Not recorded'}
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{dateFmt.format(toDate(entry.created_at))}</dd>
            </div>
            <div>
              <dt>Last used</dt>
              <dd>
                {dateFmt.format(toDate(entry.last_used_at ?? entry.created_at))}
              </dd>
            </div>
          </dl>

          {rows.length === 0 ? (
            <p className="ac-empty">
              No parameters stored for this generation.
            </p>
          ) : (
            <dl className="ac-params">
              {rows.map(([key, value]) => (
                <div className="ac-param" key={key}>
                  <dt>{prettyKey(key)}</dt>
                  <dd>{formatValue(value)}</dd>
                  {typeof value === 'number' && value >= 0 && value <= 1 && (
                    <span className="ac-param-bar" aria-hidden="true">
                      <i style={{ width: `${value * 100}%` }} />
                    </span>
                  )}
                </div>
              ))}
            </dl>
          )}

          <div className="ac-entry-actions">
            <button
              type="button"
              className="am-chip-btn"
              onClick={() =>
                run(async () => {
                  await navigator.clipboard.writeText(
                    JSON.stringify(params, null, 2),
                  )
                  return 'Parameters copied as JSON.'
                })
              }
            >
              <Copy size={14} strokeWidth={2} />
              Copy JSON
            </button>

            {confirm ? (
              <>
                <button
                  type="button"
                  className="ac-danger"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await api.deleteHistoryEntry(token, entry.id)
                      await onChanged()
                    })
                  }
                >
                  <Check size={14} strokeWidth={2} />
                  {busy ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  type="button"
                  className="am-chip-btn"
                  onClick={() => setConfirm(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="am-chip-btn"
                onClick={() => setConfirm(true)}
              >
                <Trash2 size={14} strokeWidth={2} />
                Delete
              </button>
            )}
          </div>
          <NoticeBox notice={notice} />
        </div>
      )}
    </article>
  )
}
