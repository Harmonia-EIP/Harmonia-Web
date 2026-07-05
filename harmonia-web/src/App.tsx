import { useEffect, useState } from "react";
import "./App.css";
import Landing from "./components/Landing";
import ProjectPage from "./components/ProjectPage";
import FeedbackModal from "./components/FeedbackModal";

type Route = "home" | "project";

function routeFromHash(): Route {
    return window.location.hash.startsWith("#/project") ? "project" : "home";
}

export default function App() {
    const [route, setRoute] = useState<Route>(routeFromHash);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Tiny hash router — no server config needed for static hosting.
    useEffect(() => {
        const onHashChange = () => {
            setRoute(routeFromHash());
            window.scrollTo({ top: 0 });
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const goProject = () => {
        window.location.hash = "#/project";
    };
    const goHome = () => {
        window.location.hash = "#/";
    };

    const handleCopy = () => {
        navigator.clipboard.writeText("harmoniaeip@gmail.com");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {route === "project" ? (
                <ProjectPage
                    onNavigateHome={goHome}
                    onOpenFeedback={() => setFeedbackOpen(true)}
                />
            ) : (
                <Landing onNavigateProject={goProject} />
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
                        {copied ? "Copied!" : "harmoniaeip@gmail.com"}
                    </span>

                    <div className="harmonia-contact-tooltip">
                        {copied ? "Copied!" : "Click to copy"}
                    </div>
                </div>
            </div>

            {feedbackOpen && (
                <FeedbackModal onClose={() => setFeedbackOpen(false)} />
            )}
        </>
    );
}
