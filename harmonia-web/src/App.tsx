import { useEffect, useRef } from "react";
import "./App.css";
import { ArrowUpRight, Download } from "lucide-react";

const Landing = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let rafId: number;
        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener("resize", resize);

        const lines = Array.from({ length: 14 }, (_, i) => ({
            amp: 22 + Math.random() * 48,
            freq: 0.0018 + Math.random() * 0.0022,
            speed: 0.0005 + Math.random() * 0.0009,
            phase: Math.random() * Math.PI * 2,
            offsetY: (i / 13) * 1.0,
            hueShift: Math.random() * 20 - 10,
            alpha: 0.08 + Math.random() * 0.18,
            thickness: 0.6 + Math.random() * 1.1,
        }));

        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random(),
            y: Math.random(),
            vx: (Math.random() - 0.5) * 0.00012,
            vy: -0.00008 - Math.random() * 0.00015,
            r: 0.4 + Math.random() * 1.3,
            a: 0.12 + Math.random() * 0.35,
        }));

        let t = 0;

        const draw = () => {
            t += 1;

            ctx.clearRect(0, 0, width, height);

            const grad = ctx.createRadialGradient(
                width * 0.78,
                height * 0.18,
                0,
                width * 0.78,
                height * 0.18,
                Math.max(width, height) * 0.7
            );

            grad.addColorStop(0, "rgba(43,125,255,0.10)");
            grad.addColorStop(0.5, "rgba(43,125,255,0.02)");
            grad.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            lines.forEach((ln, idx) => {
                ctx.beginPath();

                const yBase = height * ln.offsetY;

                for (let x = 0; x <= width; x += 6) {
                    const y =
                        yBase +
                        Math.sin(x * ln.freq + t * ln.speed * 8 + ln.phase) *
                            ln.amp +
                        Math.sin(x * ln.freq * 0.4 + t * ln.speed * 3) *
                            ln.amp *
                            0.35;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                const isAccent = idx % 4 === 0;

                ctx.strokeStyle = isAccent
                    ? `rgba(120, 180, 255, ${ln.alpha + 0.06})`
                    : `rgba(180, 200, 230, ${ln.alpha * 0.55})`;

                ctx.lineWidth = ln.thickness;

                ctx.shadowColor = isAccent
                    ? "rgba(78,161,255,0.55)"
                    : "transparent";

                ctx.shadowBlur = isAccent ? 10 : 0;

                ctx.stroke();
            });

            ctx.shadowBlur = 0;

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < -0.02) {
                    p.y = 1.02;
                    p.x = Math.random();
                }

                if (p.x < -0.02) p.x = 1.02;
                if (p.x > 1.02) p.x = -0.02;

                ctx.beginPath();
                ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);

                ctx.fillStyle = `rgba(180,210,255,${p.a})`;
                ctx.fill();
            });

            rafId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <div className="harmonia-root">
            <canvas
                ref={canvasRef}
                className="harmonia-canvas"
                aria-hidden="true"
            />

            <div className="harmonia-grain" aria-hidden="true" />
            <div className="harmonia-vignette" aria-hidden="true" />

            <div className="harmonia-shell">
                <nav className="harmonia-nav">
                    <div className="harmonia-brand">
                        <span
                            className="harmonia-brand-dot"
                            aria-hidden="true"
                        />
                        <span>Harmonia / Audio</span>
                    </div>

                    <div className="harmonia-nav-meta">
                        <span>v 0.1 beta</span>
                        <span>VST3 · AU · CLAP</span>
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
                        <strong>HARMONIA</strong> aims to automate preset
                        generation for keyboards and synthesizers from
                        simple text descriptions.
                    </p>

                    <div className="harmonia-cta-row">
                        <a href="/downloads/HarmoniaPlugin.vst3.zip/HarmoniaPlugin.vst3.zip" className="harmonia-btn">
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

                        <div className="harmonia-cta-meta">
                            <span className="dot" />
                            free · macOS · Windows
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default function App() {
    return <Landing />;
}