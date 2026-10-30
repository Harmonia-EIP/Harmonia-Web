import { useCallback, useEffect, useState } from 'react'
import './App.css'
import './components/AccountModal.css' // .am-nav-avatar (bouton compte de la landing)
import Landing from './components/Landing'
import ProjectPage from './components/ProjectPage'
import AccountPage from './components/AccountPage'
import AuthModal from './components/AuthModal'
import FeedbackModal from './components/FeedbackModal'
import { useAuth } from './components/useAuth'

type Route = 'home' | 'project' | 'account'

function routeFromHash(): Route {
  const hash = window.location.hash
  if (hash.startsWith('#/project')) return 'project'
  if (hash.startsWith('#/account')) return 'account'
  return 'home'
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Session partagée par toutes les pages (landing, projet, compte)
  const auth = useAuth()

  // Tiny hash router — no server config needed for static hosting.
  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const goProject = () => {
    window.location.hash = '#/project'
  }
  const goHome = () => {
    window.location.hash = '#/'
  }
  const goAccount = useCallback(() => {
    window.location.hash = '#/account'
  }, [])

  // Callbacks stables : AuthModal / FeedbackModal les mettent en dépendance
  // de leurs effets (Échap, blocage du scroll).
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  const closeFeedback = useCallback(() => setFeedbackOpen(false), [])
  const onAuthSuccess = useCallback(() => {
    setAuthOpen(false)
    goAccount()
  }, [goAccount])

  // Connecté : page compte. Déconnecté : modale de connexion.
  const onAccountClick = () => {
    if (auth.profile) goAccount()
    else setAuthOpen(true)
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText('harmoniaeip@gmail.com').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {route === 'project' ? (
        <ProjectPage
          onNavigateHome={goHome}
          onOpenFeedback={() => setFeedbackOpen(true)}
        />
      ) : route === 'account' ? (
        <AccountPage
          auth={auth}
          onNavigateHome={goHome}
          onRequestSignIn={() => setAuthOpen(true)}
        />
      ) : (
        <Landing
          onNavigateProject={goProject}
          profile={auth.profile}
          onAccountClick={onAccountClick}
        />
      )}

      {/* Shared fixed bottom-right actions */}
      <div className="harmonia-fixed-actions">
        <button
          type="button"
          className="harmonia-action-btn harmonia-feedback-btn"
          onClick={() => setFeedbackOpen(true)}
        >
          <span className="harmonia-action-icon">✦</span>
          Give Feedback
        </button>

        <div
          className="harmonia-action-btn harmonia-contact-btn harmonia-contact-hover"
          onClick={handleCopy}
        >
          <span className="harmonia-action-icon">✉</span>

          <span className="harmonia-contact-text">
            {copied ? 'Copied!' : 'harmoniaeip@gmail.com'}
          </span>

          <div className="harmonia-contact-tooltip">
            {copied ? 'Copied!' : 'Click to copy'}
          </div>
        </div>
      </div>

      {feedbackOpen && <FeedbackModal onClose={closeFeedback} />}

      {authOpen && (
        <AuthModal auth={auth} onClose={closeAuth} onSuccess={onAuthSuccess} />
      )}
    </>
  )
}
