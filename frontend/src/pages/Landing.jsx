import React from "react";
import { MemoraLogo } from "../components/Icons";

export const Landing = ({ user, setView }) => {
  return (
    <div className="landing-container anim-fade-in">
      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="brand-wrapper" onClick={() => setView("landing")} style={{ cursor: "pointer" }}>
            <span className="brand-logo" style={{ color: "var(--color-primary)" }}>
              <MemoraLogo size={24} />
            </span>
            <span className="brand-name">Memora AI</span>
          </div>

          <div className="landing-nav-links" aria-label="Primary navigation">
            <a href="#features">Platform</a>
            <a href="https://github.com/Debajyoti-3/memora-ai" target="_blank" rel="noreferrer">Developers</a>
            <a href="https://github.com/Debajyoti-3/memora-ai#readme" target="_blank" rel="noreferrer">Resources</a>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <button className="btn btn-primary nav-primary-action" onClick={() => setView("dashboard")}>
                  Go to Dashboard
                </button>
                <a href="https://github.com/Debajyoti-3/memora-ai" target="_blank" rel="noreferrer" className="btn btn-secondary nav-secondary-action">
                  Contact Us
                </a>
              </>
            ) : (
              <>
                <button className="btn btn-text nav-link-text" onClick={() => setView("auth")}>
                  Sign In
                </button>
                <button className="btn btn-primary nav-primary-action" onClick={() => setView("auth")}>
                  Try Memora AI
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Band Section */}
      <header className="landing-hero landing-section">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="badge-coral" style={{ width: "fit-content", marginBottom: "24px" }}>
              <span className="desktop-badge-text">INTRODUCING</span>
              <span className="mobile-badge-text">INTRODUCING</span>
            </div>
            <h1 className="display-xl hero-title">
              Meet your thinking partner.
            </h1>
            <p className="body-md hero-subtitle">
              Memora AI is a context-aware chatbot designed for deep work. It actively extracts memories from your conversations, builds contextual memories, and provides highly-personalized responses.
            </p>
            <div className="hero-cta-group">
              <button 
                className="btn btn-primary btn-lg-premium" 
                onClick={() => setView(user ? "dashboard" : "auth")}
              >
                Start Chatting
              </button>
              <a href="#features" className="btn btn-secondary btn-lg-premium">
                Explore Features
              </a>
            </div>
          </div>

          {/* Code Window Mockup on the right */}
          <div className="hero-visual anim-slide-up">
            <div className="code-window-card shadow-premium">
              <div className="code-header">
                <div className="window-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <span className="code-lang">memora-session.log</span>
              </div>
              <div className="mock-chat-preview">
                <div className="mock-msg user">
                  <span className="mock-avatar">U</span>
                  <div className="mock-bubble">
                    <p>What is my name ? what you know about me ?</p>
                  </div>
                </div>
                <div className="mock-msg assistant">
                  <span className="mock-avatar ai">AI</span>
                  <div className="mock-bubble">
                    <p className="mock-memory-tag">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg>
                      Recalled: User <details><summary>John Doe</summary></details>
                    </p>
                    <p>You are John Doe, a software engineer student </p>
                    <div classname="m-2">
                      <p>Here are the things that I know about you:</p>
                      <ul classname="mock-memory-list m-2">
                        <li>You are a software engineer student.</li>
                        <li>You are interested in software development.</li>
                        <li>You have a dog named Rex.</li>
                      </ul>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Section */}
      <section id="features" className="features-section landing-section">
        <div className="section-header">
          <h2 className="display-lg section-title">Built for deep context.</h2>
          <p className="body-md section-subtitle">
            Most LLM chatbots forget who you are the second you click new chat. Memora remembers.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 className="title-md feature-card-title">Extracts Memories</h3>
            <p className="body-md feature-card-desc">
              Analyzes context during messaging to automatically isolate preferences, stack choices, and project facts, building your personal context log.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <h3 className="title-md feature-card-title">Semantic Context Database</h3>
            <p className="body-md feature-card-desc">
              Converts extracted memories into vector embeddings, storing them in a local MongoDB database to retrieve exact facts when relevant.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="6.34" y1="17.66" x2="4.93" y2="19.07"></line><line x1="19.07" y1="4.93" x2="17.66" y2="6.34"></line></svg>
            </div>
            <h3 className="title-md feature-card-title">Warm Editorial UX</h3>
            <p className="body-md feature-card-desc">
              Designed around high-quality design principles. Soft cream canvas, elegant serif displays, coral focus triggers, and JetBrains Mono coding layouts.
            </p>
          </div>
        </div>
      </section>

      {/* Model Grid Section (Alternating Page Rhythm) */}
      <section id="models" className="model-section landing-section dark-section">
        <div className="section-header text-center">
          <h2 className="display-lg section-title text-white">Models configured to think.</h2>
          <p className="body-md section-subtitle text-muted-on-dark">
            Memora links your local contextual database directly with leading large language intelligence models.
          </p>
        </div>

        <div className="model-grid">
          <div className="model-card">
            <div className="badge-coral">PREMIUM</div>
            <h3 className="display-sm text-white">Gemini 2.5 Flash</h3>
            <p className="body-md text-muted-on-dark">
              Speed and reasoning capabilities perfectly suited for code generation, outline writing, and real-time context database queries.
            </p>
          </div>
          <div className="model-card">
            <div className="badge-pill" style={{ width: "fit-content", backgroundColor: "var(--color-surface-dark-elevated)", color: "var(--color-on-dark)" }}>EMBEDDING</div>
            <h3 className="display-sm text-white">jina-embeddings-3</h3>
            <p className="body-md text-muted-on-dark">
              The embedding backbone converting conversation snippets into high-dimensional vectors to search your MongoDB memory indexes.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Coral Callout Band */}
      <section className="cta-band-coral-wrapper landing-section">
        <div className="cta-band-coral shadow-premium anim-slide-up">
          <h2 className="display-sm text-white" style={{ marginBottom: "16px" }}>
            Ready to build with a partner that remembers?
          </h2>
          <p className="body-md text-white" style={{ maxWidth: "560px", opacity: 0.9, marginBottom: "32px" }}>
            Create an account or login to start managing your ideas, scripts, outlines, and databases with persistent vector memory.
          </p>
          <button 
            className="btn btn-secondary btn-lg-premium" 
            onClick={() => setView(user ? "dashboard" : "auth")}
            style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", border: "none" }}
          >
            Start For Free
          </button>
        </div>
      </section>

      {/* Dark Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand-column">
            <div className="brand-wrapper" style={{ color: "var(--color-on-dark)" }}>
              <span className="brand-logo" style={{ color: "var(--color-primary)" }}>
                <MemoraLogo size={26} />
              </span>
              <span className="brand-name">Memora AI</span>
            </div>
            <p className="body-sm footer-disclaimer">
               Memora AI is a context-aware chatbot designed for deep work. It actively extracts memories from your conversations, builds contextual memories, and provides highly-personalized responses.
            </p>
          </div>

          <div className="footer-links-column">
            <h4 className="title-sm text-white">Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView(user ? "dashboard" : "auth"); }}>Console</a></li>
            </ul>
          </div>

          <div className="footer-links-column">
            <h4 className="title-sm text-white">Company</h4>
            <ul>
              <li><a href="https://github.com/Debajyoti-3/memora-ai" target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href="https://github.com/Debajyoti-3/memora-ai#readme" target="_blank" rel="noreferrer">Documentation</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView("privacy"); }}>Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="body-sm">&copy; {new Date().getFullYear()} Memora AI</p>
        </div>
      </footer>
    </div>
  );
};
