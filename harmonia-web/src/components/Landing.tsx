import { useState } from 'react'
import { ArrowUpRight, Download, BookOpen, FileText } from 'lucide-react'
import WavesCanvas from './WavesCanvas'
import InstallGuideModal from './InstallGuideModal'
import './Landing.css'

type Props = {
  onNavigateProject: () => void
  // Plus utilisé : le bouton "User guide" ouvre maintenant la modal.
  // Gardé optionnel pour ne pas casser App.tsx.
  onNavigateGuide?: () => void
}

function WindowsLogoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="9" height="9" fill="currentColor" />
      <rect x="13" y="2" width="9" height="9" fill="currentColor" />
      <rect x="2" y="13" width="9" height="9" fill="currentColor" />
      <rect x="13" y="13" width="9" height="9" fill="currentColor" />
    </svg>
  )
}

export default function Landing({ onNavigateProject }: Props) {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <div
      className="harmonia-root harmonia-landing"
      style={{ overflow: 'visible' }}
    >
      <WavesCanvas />

      <div className="harmonia-grain" aria-hidden="true" />
      <div className="harmonia-vignette" aria-hidden="true" />

      <div className="harmonia-shell">
        <nav className="harmonia-nav">
          <div className="harmonia-nav-left">
            <div className="harmonia-brand">
              <span className="harmonia-brand-dot" aria-hidden="true" />
              <span>Harmonia / Audio</span>
            </div>

            <span className="harmonia-nav-sep" aria-hidden="true" />

            <span className="harmonia-nav-tagline">
              AI Synth Preset Generator
            </span>
          </div>

          <div className="harmonia-nav-meta harmonia-nav-meta--desktop">
            <button
              type="button"
              className="harmonia-nav-discover"
              onClick={onNavigateProject}
            >
              <BookOpen size={14} strokeWidth={2} />
              <span className="harmonia-expand-label">
                <span>Discover the project</span>
              </span>
            </button>

            <button
              type="button"
              className="harmonia-guide-btn"
              onClick={() => setGuideOpen(true)}
              aria-label="User guide"
            >
              <FileText size={18} strokeWidth={2} />
              <span className="harmonia-expand-label">
                <span>User guide</span>
              </span>
            </button>
          </div>
        </nav>

        {/* Logo affiché dès le chargement, centré */}
        <section className="harmonia-logo-section">
          <img
            src="/harmonia-logo.png"
            alt="Harmonia"
            className="harmonia-logo"
          />
        </section>

        <section className="harmonia-hero">
          <h1 className="harmonia-title">Harmonia.</h1>

          <p className="harmonia-description">
            Harmonia is an experimental AI system that generates synthesizer
            presets from simple text descriptions, turning human intent into
            sound. This is a first version (v1), still actively in development,
            currently based on a limited set of 20 parameters. While it already
            produces fully audible results, quality and consistency are still
            evolving and will improve as the system and parameter space expand
            over time.
          </p>

          <div className="harmonia-stats">
            <div className="harmonia-stat">
              <span className="harmonia-stat-value">20</span>
              <span className="harmonia-stat-label">Parameters</span>
            </div>
            <div className="harmonia-stat-divider" />
            <div className="harmonia-stat">
              <span className="harmonia-stat-value">VST3</span>
              <span className="harmonia-stat-label">AU · CLAP</span>
            </div>
          </div>

          <div className="harmonia-cta-row harmonia-cta-row--triple">
            <a
              href="/downloads/Harmonia.vst3.zip"
              className="harmonia-btn"
            >
              <span className="harmonia-btn-glow" aria-hidden="true" />
              <Download size={16} strokeWidth={2} />
              <span>Download the plugin</span>
              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className="harmonia-btn-arrow"
              />
            </a>

            <a
              href="/downloads/Harmonia.exe.zip"
              className="harmonia-btn harmonia-btn--standalone"
            >
              <span className="harmonia-btn-glow" aria-hidden="true" />
              <WindowsLogoIcon size={16} />
              <span>Download standalone</span>
              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className="harmonia-btn-arrow"
              />
            </a>
          </div>

          <div className="harmonia-mobile-actions">
            <button
              type="button"
              className="harmonia-nav-discover harmonia-nav-discover--mobile"
              onClick={onNavigateProject}
            >
              <BookOpen size={16} strokeWidth={2} />
              <span>Discover the project</span>
            </button>

            <button
              type="button"
              className="harmonia-guide-btn"
              onClick={() => setGuideOpen(true)}
              aria-label="User guide"
            >
              <FileText size={18} strokeWidth={2} />
              <span className="harmonia-expand-label">User guide</span>
            </button>
          </div>

          <div className="harmonia-warning">
            <span className="harmonia-warning-icon">⚠</span>
            V0.1 Beta · Experimental version — Results are still evolving
          </div>
        </section>

        <div className="harmonia-synth-preview">
          <img
            src="/harmonia-v1-visual.png"
            alt="Harmonia synthesizer interface"
          />
        </div>

        {/* Espace en bas pour pouvoir scroller plus haut : ajuste la hauteur */}
        <div style={{ height: 70, flexShrink: 0 }} aria-hidden="true" />
      </div>

      <InstallGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  )
}