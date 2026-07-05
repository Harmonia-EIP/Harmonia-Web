import {
    ArrowLeft,
    ArrowUpRight,
    Activity,
    BarChart3,
    Brain,
    Cpu,
    Server,
    Type,
    Wand2,
    FileJson,
    KeyRound,
    AudioWaveform,
    GitBranch,
    BookOpen,
    Download,
    MessageSquare,
} from "lucide-react";
import WavesCanvas from "./WavesCanvas";
import "./ProjectPage.css";

const METRICS_URL = "https://harmonia.mcoet.com/#overview";

type Props = {
    onNavigateHome: () => void;
    onOpenFeedback: () => void;
};

const PIPELINE = [
    {
        icon: Type,
        title: "Describe",
        text: "You type a plain-text intent — “warm analog bass”, “soft piano”, “glassy pad”.",
    },
    {
        icon: Brain,
        title: "Generate",
        text: "A trained neural network maps your words to a full set of synthesizer parameters.",
    },
    {
        icon: FileJson,
        title: "Preset",
        text: "The model outputs an editable preset (JSON) describing oscillators, envelope, filter and effects.",
    },
    {
        icon: AudioWaveform,
        title: "Play",
        text: "The preset loads straight into the Harmonia synthesizer — audible, tweakable, ready to perform.",
    },
];

const COMPONENTS = [
    {
        icon: Cpu,
        tag: "Harmonia App",
        title: "The Synthesizer",
        text: "A modern audio synthesizer built in C++17 with JUCE 8 — available both as a standalone desktop app and a VST3 plugin. Custom DSP engine, real-time waveform visualization and preset management.",
        points: [
            "Polyphonic engine, multi-waveform oscillators & detune",
            "ADSR envelope, LFO modulation, multi-mode filter",
            "Reverb, distortion, MIDI keyboard support",
            "Oscilloscope, envelope & LFO visualizers",
        ],
    },
    {
        icon: Brain,
        tag: "Harmonia AI",
        title: "The Intelligence",
        text: "A Python machine-learning pipeline that turns a text description into VST parameter presets. From dataset preparation to training, generation and serving.",
        points: [
            "Text → preset generation (20 parameters in v1)",
            "Dataset preparation & model training scripts",
            "Inference server exposing the model via an API",
            "JSON presets consumable by the plugin",
        ],
    },
    {
        icon: Server,
        tag: "Harmonia Backend",
        title: "The Backbone",
        text: "A FastAPI service handling authentication and user data, designed for scalable web & desktop integration. Secure by default, JWT-based.",
        points: [
            "Signup / signin with bcrypt password hashing",
            "JWT token management (24h expiration)",
            "User profiles & session persistence",
            "PostgreSQL + SQLAlchemy ORM",
        ],
    },
];

const FEATURES = [
    {
        icon: AudioWaveform,
        title: "Audio engine",
        items: [
            "Polyphonic synthesis",
            "Multiple oscillator waveforms",
            "Oscillator mixing & detune",
            "Noise generator",
            "ADSR envelope & LFO",
            "Multi-mode filter",
            "Reverb & distortion",
            "Real-time DSP processing",
        ],
    },
    {
        icon: Wand2,
        title: "AI generation",
        items: [
            "Text-to-preset model",
            "20-parameter space (v1)",
            "Trained on a curated dataset",
            "Editable JSON output",
            "Inference server / API",
            "Expanding parameter coverage",
        ],
    },
    {
        icon: KeyRound,
        title: "Accounts & data",
        items: [
            "Secure authentication",
            "JWT sessions (24h)",
            "User profiles",
            "Preset save / load",
            "PostgreSQL storage",
            "Email validation",
        ],
    },
];

const STACK = [
    "C++17",
    "JUCE 8",
    "CMake",
    "CPR",
    "nlohmann/json",
    "Python",
    "PyTorch / ML",
    "FastAPI",
    "SQLAlchemy",
    "PostgreSQL",
    "JWT",
    "Railway",
];

const REPOS = [
    {
        name: "Harmonia-App",
        desc: "JUCE synthesizer — standalone & VST3 plugin (C++17).",
        url: "https://github.com/Harmonia-EIP/Harmonia-App",
    },
    {
        name: "Harmonia-AI",
        desc: "Text-to-preset machine-learning pipeline (Python).",
        url: "https://github.com/Harmonia-EIP/Harmonia-AI",
    },
    {
        name: "Harmonia-Backend",
        desc: "FastAPI authentication & user backend.",
        url: "https://github.com/Harmonia-EIP/Harmonia-Backend",
    },
];

export default function ProjectPage({ onNavigateHome, onOpenFeedback }: Props) {
    return (
        <div className="harmonia-root hm-project">
            <WavesCanvas />
            <div className="harmonia-grain" aria-hidden="true" />
            <div className="harmonia-vignette" aria-hidden="true" />

            <div className="hm-project-shell">
                {/* ── NAV ───────────────────────────────── */}
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

                {/* ── HERO ──────────────────────────────── */}
                <header className="hm-project-hero">
                    <div className="harmonia-eyebrow">
                        Epitech Innovation Project — EIP
                    </div>
                    <h1 className="hm-project-title">
                        Inside <em>Harmonia</em>
                    </h1>
                    <p className="hm-project-lead">
                        Harmonia is an end-to-end system that turns human
                        language into synthesizer sound. Describe what you want
                        to hear, and an AI model designs a playable preset for a
                        purpose-built synthesizer. It brings together three
                        pieces — a JUCE audio plugin, a machine-learning engine,
                        and a backend — into a single creative tool for music
                        producers and sound designers.
                    </p>
                </header>

                {/* ── METRICS CTA ───────────────────────── */}
                <section className="hm-metrics-cta">
                    <div className="hm-metrics-glow" aria-hidden="true" />
                    <div className="hm-metrics-inner">
                        <div className="hm-metrics-text">
                            <div className="hm-metrics-eyebrow">
                                <Activity size={14} strokeWidth={2} />
                                Live metrics
                            </div>
                            <h2 className="hm-metrics-heading">
                                Watch the project in numbers
                            </h2>
                            <p className="hm-metrics-desc">
                                Adoption, generations, model performance and
                                system health — all of it is tracked on a
                                dedicated metrics dashboard, updated in real
                                time.
                            </p>
                        </div>
                        <a
                            href={METRICS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hm-metrics-btn"
                        >
                            <BarChart3 size={22} strokeWidth={2} />
                            <span>Open the metrics page</span>
                            <ArrowUpRight size={20} strokeWidth={2} />
                        </a>
                    </div>
                </section>

                {/* ── PIPELINE ──────────────────────────── */}
                <section className="hm-section">
                    <div className="hm-section-head">
                        <span className="hm-section-index">01</span>
                        <h2 className="hm-section-title">How it works</h2>
                    </div>
                    <div className="hm-pipeline">
                        {PIPELINE.map((step, i) => (
                            <div className="hm-pipeline-step" key={step.title}>
                                <div className="hm-pipeline-icon">
                                    <step.icon size={22} strokeWidth={1.6} />
                                </div>
                                <div className="hm-pipeline-num">
                                    Step {i + 1}
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.text}</p>
                                {i < PIPELINE.length - 1 && (
                                    <span
                                        className="hm-pipeline-arrow"
                                        aria-hidden="true"
                                    >
                                        →
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── ARCHITECTURE ──────────────────────── */}
                <section className="hm-section">
                    <div className="hm-section-head">
                        <span className="hm-section-index">02</span>
                        <h2 className="hm-section-title">
                            Three components, one system
                        </h2>
                    </div>
                    <div className="hm-cards">
                        {COMPONENTS.map((c) => (
                            <article className="hm-card" key={c.tag}>
                                <div className="hm-card-icon">
                                    <c.icon size={24} strokeWidth={1.6} />
                                </div>
                                <span className="hm-card-tag">{c.tag}</span>
                                <h3 className="hm-card-title">{c.title}</h3>
                                <p className="hm-card-text">{c.text}</p>
                                <ul className="hm-card-list">
                                    {c.points.map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── FEATURES ──────────────────────────── */}
                <section className="hm-section">
                    <div className="hm-section-head">
                        <span className="hm-section-index">03</span>
                        <h2 className="hm-section-title">What's inside</h2>
                    </div>
                    <div className="hm-features">
                        {FEATURES.map((f) => (
                            <div className="hm-feature-col" key={f.title}>
                                <div className="hm-feature-head">
                                    <f.icon size={18} strokeWidth={1.8} />
                                    <h3>{f.title}</h3>
                                </div>
                                <ul>
                                    {f.items.map((it) => (
                                        <li key={it}>{it}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── TECH STACK ────────────────────────── */}
                <section className="hm-section">
                    <div className="hm-section-head">
                        <span className="hm-section-index">04</span>
                        <h2 className="hm-section-title">Tech stack</h2>
                    </div>
                    <div className="hm-stack">
                        {STACK.map((s) => (
                            <span className="hm-stack-chip" key={s}>
                                {s}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ── REPOSITORIES ──────────────────────── */}
                <section className="hm-section">
                    <div className="hm-section-head">
                        <span className="hm-section-index">05</span>
                        <h2 className="hm-section-title">Explore the code</h2>
                    </div>
                    <div className="hm-repos">
                        {REPOS.map((r) => (
                            <a
                                key={r.name}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hm-repo"
                            >
                                <GitBranch size={18} strokeWidth={1.8} />
                                <div className="hm-repo-body">
                                    <span className="hm-repo-name">
                                        {r.name}
                                    </span>
                                    <span className="hm-repo-desc">
                                        {r.desc}
                                    </span>
                                </div>
                                <ArrowUpRight
                                    size={16}
                                    strokeWidth={2}
                                    className="hm-repo-arrow"
                                />
                            </a>
                        ))}
                    </div>
                </section>

                {/* ── BOTTOM CTA ────────────────────────── */}
                <section className="hm-final-cta">
                    <h2>Try it, then tell us what you think</h2>
                    <p>
                        Harmonia is experimental and evolving fast. Download the
                        plugin, generate a few presets, and send us your
                        feedback — it shapes every next version.
                    </p>
                    <div className="hm-final-actions">
                        <a
                            href="/downloads/HarmoniaPlugin.vst3.zip"
                            className="harmonia-btn"
                        >
                            <span
                                className="harmonia-btn-glow"
                                aria-hidden="true"
                            />
                            <Download size={16} strokeWidth={2} />
                            <span>Download the plugin</span>
                            <ArrowUpRight
                                size={16}
                                strokeWidth={2}
                                className="harmonia-btn-arrow"
                            />
                        </a>
                        <button
                            type="button"
                            className="harmonia-btn-ghost"
                            onClick={onOpenFeedback}
                        >
                            <MessageSquare size={16} strokeWidth={2} />
                            <span>Give feedback</span>
                        </button>
                    </div>

                    <div className="hm-final-docs">
                        <BookOpen size={14} strokeWidth={1.8} />
                        <span>
                            Full documentation:{" "}
                            <a
                                href="https://harmonia-eip.github.io/Harmonia-App/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                harmonia-eip.github.io/Harmonia-App
                            </a>
                        </span>
                    </div>
                </section>

                <footer className="hm-project-footer">
                    <span>Harmonia — Epitech Innovation Project</span>
                    <span className="harmonia-version-badge">V0.1 BETA</span>
                </footer>
            </div>
        </div>
    );
}
