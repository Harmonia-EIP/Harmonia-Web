import { ArrowUpRight, Download, BookOpen } from "lucide-react";
import WavesCanvas from "./WavesCanvas";

type Props = {
    onNavigateProject: () => void;
};

export default function Landing({ onNavigateProject }: Props) {
    return (
        <div className="harmonia-root">
            <WavesCanvas />

            <div className="harmonia-grain" aria-hidden="true" />
            <div className="harmonia-vignette" aria-hidden="true" />

            <div className="harmonia-shell">
                <nav className="harmonia-nav">
                    <div className="harmonia-brand">
                        <span className="harmonia-brand-dot" aria-hidden="true" />
                        <span>Harmonia / Audio</span>
                    </div>

                    <div className="harmonia-nav-meta">
                        <button
                            type="button"
                            className="harmonia-nav-link"
                            onClick={onNavigateProject}
                        >
                            The Project
                        </button>
                        <span className="harmonia-version-badge">V0.1 BETA</span>
                    </div>
                </nav>

                <section className="harmonia-hero">
                    <div className="harmonia-eyebrow">
                        AI Synth Preset Generator
                    </div>

                    <h1 className="harmonia-title">
                        Harm<em>o</em>nia.
                    </h1>

                    <p className="harmonia-description">
                        Harmonia is an experimental AI system that generates synthesizer presets from
                        simple text descriptions, turning human intent into sound. This is a first version (v1),
                        still actively in development, currently based on a limited set of 20 parameters.
                        While it already produces fully audible results, quality and consistency are still
                        evolving and will improve as the system and parameter space expand over time.
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

                    <div className="harmonia-cta-row">
                        <a
                            href="/downloads/HarmoniaPlugin.vst3.zip"
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

                        <button
                            type="button"
                            className="harmonia-btn-ghost"
                            onClick={onNavigateProject}
                        >
                            <BookOpen size={16} strokeWidth={2} />
                            <span>Discover the project</span>
                        </button>
                    </div>

                    <div className="harmonia-warning">
                        <span className="harmonia-warning-icon">⚠</span>
                        Experimental version — Results are still evolving
                    </div>
                </section>

                {}
                <div className="harmonia-synth-preview">
                    <img
                        src="/harmonia-v1-visual.png"
                        alt="Harmonia synthesizer interface"
                    />
                </div>
            </div>
        </div>
    );
}
