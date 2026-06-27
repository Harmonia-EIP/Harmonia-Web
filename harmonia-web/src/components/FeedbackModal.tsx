import { useEffect, useState, type FormEvent } from "react";
import { X, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import "./FeedbackModal.css";

const WEB3FORMS_ACCESS_KEY =
    import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ||
    "c47278f5-3754-46f9-8069-4fa5a6d07cec";

const CATEGORIES = ["Bug", "Sound quality", "Feature idea", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

type Status = "idle" | "sending" | "success" | "error";

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
    const [category, setCategory] = useState<Category>("Sound quality");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Close on Escape, and lock body scroll while open.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim() || status === "sending") return;

        setStatus("sending");
        setErrorMsg("");

        try {
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    access_key: WEB3FORMS_ACCESS_KEY,
                    subject: `Harmonia feedback — ${category}`,
                    from_name: "Harmonia Website",
                    category,
                    email: email.trim() || "(not provided)",
                    message: message.trim(),
                    botcheck: "", // honeypot, left empty by humans
                }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMsg(
                    data.message ||
                        "Something went wrong. Please try again later."
                );
            }
        } catch {
            setStatus("error");
            setErrorMsg("Network error. Please check your connection.");
        }
    };

    return (
        <div
            className="hm-modal-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
        >
            <div
                className="hm-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="hm-modal-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X size={18} strokeWidth={2} />
                </button>

                {status === "success" ? (
                    <div className="hm-modal-success">
                        <CheckCircle2 size={44} strokeWidth={1.5} />
                        <h3>Thank you!</h3>
                        <p>
                            Your feedback was sent to the Harmonia team. It helps
                            shape the next versions.
                        </p>
                        <button className="hm-modal-submit" onClick={onClose}>
                            Close
                        </button>
                    </div>
                ) : (
                    <form className="hm-modal-form" onSubmit={handleSubmit}>
                        <div className="hm-modal-eyebrow">Feedback</div>
                        <h2 className="hm-modal-title">Share your thoughts</h2>
                        <p className="hm-modal-sub">
                            Harmonia is experimental — your input directly guides
                            what we build next.
                        </p>

                        <label className="hm-field-label">Topic</label>
                        <div className="hm-cat-row">
                            {CATEGORIES.map((c) => (
                                <button
                                    type="button"
                                    key={c}
                                    className={`hm-cat-chip ${
                                        category === c ? "is-active" : ""
                                    }`}
                                    onClick={() => setCategory(c)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <label className="hm-field-label" htmlFor="hm-message">
                            Message
                        </label>
                        <textarea
                            id="hm-message"
                            className="hm-textarea"
                            placeholder="What worked, what didn't, what you'd love to see…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            required
                        />

                        <label className="hm-field-label" htmlFor="hm-email">
                            Email <span className="hm-optional">(optional)</span>
                        </label>
                        <input
                            id="hm-email"
                            className="hm-input"
                            type="email"
                            placeholder="So we can follow up with you"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        {status === "error" && (
                            <div className="hm-modal-error">
                                <AlertTriangle size={15} strokeWidth={2} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="hm-modal-submit"
                            disabled={
                                status === "sending" || !message.trim()
                            }
                        >
                            <Send size={15} strokeWidth={2} />
                            {status === "sending"
                                ? "Sending…"
                                : "Send feedback"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
