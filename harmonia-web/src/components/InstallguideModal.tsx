import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./InstallGuideModal.css";

/**
 * Modal du guide d'installation Harmonia (VST3 / Standalone).
 *
 * Usage :
 *   const [open, setOpen] = useState(false);
 *   <button onClick={() => setOpen(true)}>Guide d'installation</button>
 *   <InstallGuideModal open={open} onClose={() => setOpen(false)} />
 *
 * Couleurs : surcharge --hg-accent, --hg-bg, --hg-text... sur un parent
 * ou dans ton :root pour l'adapter au site.
 */

type Tab = "vst3" | "standalone";

type Step = {
  title: string;
  text: string;
  rows?: [string, string][];
};

type Guide = {
  label: string;
  intro: string;
  steps: Step[];
  note: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
};

const GUIDES: Record<Tab, Guide> = {
  vst3: {
    label: "Plugin VST3",
    intro: "À utiliser dans ton DAW (FL Studio, Ableton, Reaper…).",
    steps: [
      {
        title: "Télécharger et extraire",
        text: "Clique sur « DOWNLOAD THE PLUGIN » en haut de la page, puis extrais l'archive .zip.",
      },
      {
        title: "Copier le .vst3 dans le dossier VST3",
        text: "Place le fichier Harmonia.vst3 dans le dossier de ton système :",
        rows: [
          ["Windows", "C:\\Program Files\\Common Files\\VST3"],
          ["macOS", "/Library/Audio/Plug-Ins/VST3"],
          ["Linux", "~/.vst3"],
        ],
      },
      {
        title: "Rescanner les plugins dans ton DAW",
        text: "Relance l'analyse des plugins :",
        rows: [
          ["FL Studio", "Options > Manage plugins > Find installed plugins"],
          ["Ableton Live", "Preferences > Plug-ins > Rescan"],
          ["Reaper", "Preferences > Plug-ins > VST > Re-scan"],
          ["Cubase", "Studio > Plug-in Manager > Update"],
        ],
      },
      {
        title: "Ajouter Harmonia à ton projet",
        text: "Ouvre le navigateur de plugins de ton DAW et ajoute Harmonia. C'est prêt.",
      },
    ],
    note: "Harmonia n'apparaît pas ? Vérifie que le .vst3 est bien sorti du .zip et dans un dossier scanné, puis redémarre le DAW.",
  },
  standalone: {
    label: "Standalone",
    intro: "Application autonome, sans DAW. Windows uniquement.",
    steps: [
      {
        title: "Télécharger l'archive",
        text: "Clique sur « DOWNLOAD STANDALONE » en haut de la page.",
      },
      {
        title: "Extraire le .zip",
        text: "Clic droit sur l'archive, puis « Extraire tout… ».",
      },
      {
        title: "Lancer Harmonia.exe",
        text: "Double-clique sur Harmonia.exe dans le dossier extrait.",
      },
    ],
    note: "Si Windows affiche « Windows a protégé votre ordinateur », clique sur « Informations complémentaires » puis « Exécuter quand même ».",
  },
};

const GAP = 12; // px entre les cartes
const DRAG_START = 6; // px avant de considérer que c'est un swipe

export default function InstallGuideModal({
  open,
  onClose,
  defaultTab = "vst3",
}: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [step, setStep] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const closeRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; startX: number; active: boolean } | null>(null);

  const guide = GUIDES[tab];
  const total = guide.steps.length;
  const isLast = step === total - 1;

  // Largeur d'une carte + gap
  const cardStride = () => {
    const card = trackRef.current?.firstElementChild as HTMLElement | null;
    return (card?.offsetWidth ?? 1) + GAP;
  };

  const goTo = (i: number) => setStep(Math.min(total - 1, Math.max(0, i)));

  // --- Swipe (souris, tactile, stylet) ---
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { id: e.pointerId, startX: e.clientX, active: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    let dx = e.clientX - g.startX;

    if (!g.active) {
      if (Math.abs(dx) < DRAG_START) return;
      g.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    // Résistance aux extrémités
    if ((step === 0 && dx > 0) || (step === total - 1 && dx < 0)) dx *= 0.3;
    setDragX(dx);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.active) return;

    const dx = e.clientX - g.startX;
    const threshold = Math.min(60, cardStride() * 0.15);
    setDragging(false);
    setDragX(0);
    if (dx < -threshold) goTo(step + 1);
    else if (dx > threshold) goTo(step - 1);
  };

  // Échap pour fermer, flèches pour naviguer, blocage du scroll de la page
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(step + 1);
      if (e.key === "ArrowLeft") goTo(step - 1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, step, total]);

  // À l'ouverture : onglet par défaut
  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  // À l'ouverture et à chaque changement d'onglet : retour à la 1re carte
  useEffect(() => {
    setStep(0);
    setDragX(0);
    setDragging(false);
  }, [open, tab]);

  if (!open) return null;

  return createPortal(
    <div
      className="igm-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="igm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="igm-title"
      >
        <div className="igm-head">
          <div>
            <h2 className="igm-title" id="igm-title">Installer Harmonia</h2>
            <p className="igm-sub">{guide.intro}</p>
          </div>
          <button
            ref={closeRef}
            className="igm-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="igm-tabs" role="tablist">
          {(Object.keys(GUIDES) as Tab[]).map((key) => (
            <button
              key={key}
              role="tab"
              className="igm-tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
            >
              {GUIDES[key].label}
            </button>
          ))}
        </div>

        <div
          className={`igm-viewport${dragging ? " igm-dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ overflow: "hidden", touchAction: "pan-y" }}
        >
          <div
            className="igm-track"
            ref={trackRef}
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              gap: GAP,
              width: "100%",
              transform: `translateX(${-step * cardStride() + dragX}px)`,
            }}
          >
            {guide.steps.map((s: Step, i: number) => (
              <div
                className="igm-card"
                key={`${tab}-${s.title}`}
                data-active={i === step}
                style={{ flex: "0 0 100%", minWidth: 0, boxSizing: "border-box" }}
              >
                <p className="igm-count">Étape {i + 1} sur {total}</p>
                <h3>{s.title}</h3>
                <p className="igm-text">{s.text}</p>
                {s.rows && (
                  <ul className="igm-rows">
                    {s.rows.map(([k, v]: [string, string]) => (
                      <li key={k}>
                        <b>{k}</b>
                        <code>{v}</code>
                      </li>
                    ))}
                  </ul>
                )}
                {i === total - 1 && <p className="igm-note">{guide.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="igm-foot">
          <button
            className="igm-btn"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
          >
            Précédent
          </button>

          <div className="igm-dots">
            {guide.steps.map((s: Step, i: number) => (
              <button
                key={s.title}
                className="igm-dot"
                aria-label={`Aller à l'étape ${i + 1}`}
                aria-current={i === step}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <button
            className="igm-btn igm-btn--primary"
            onClick={() => (isLast ? onClose() : goTo(step + 1))}
          >
            {isLast ? "Terminé" : "Suivant"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}