import React from "react";
import { MemoraLogo } from "../components/Icons";

export const PrivacyPolicy = ({ setView, previousView = "landing" }) => {
  return (
    <div className="landing-container anim-fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="brand-wrapper" onClick={() => setView("landing")} style={{ cursor: "pointer" }}>
            <span className="brand-logo" style={{ color: "var(--color-primary)" }}>
              <MemoraLogo size={24} />
            </span>
            <span className="brand-name">Memora AI</span>
          </div>

          <div className="nav-actions">
            <button 
              className="btn btn-secondary" 
              onClick={() => setView(previousView)}
              style={{ fontSize: "13px" }}
            >
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main Privacy Document Content */}
      <main style={{ flex: 1, padding: "64px 24px", maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
        <h1 className="display-lg" style={{ marginBottom: "16px", color: "var(--color-ink)" }}>Privacy Policy</h1>
        <p className="caption" style={{ color: "var(--color-primary)", marginBottom: "48px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
          Last Updated: June 21, 2026
        </p>

        <div className="prose" style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "15px", lineHeight: "1.65", color: "var(--color-body)" }}>
          <section>
            <h2 className="title-lg" style={{ color: "var(--color-ink)", marginBottom: "12px", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "8px" }}>
              1. Introduction
            </h2>
            <p>
              Welcome to Memora AI ("we," "our," or "us"). We are committed to protecting your privacy and security. This Privacy Policy explains how we handle your personal data when you use our context-aware vector memory chatbot dashboard. By creating an account, you consent to the practices described in this document.
            </p>
          </section>

          <section>
            <h2 className="title-lg" style={{ color: "var(--color-ink)", marginBottom: "12px", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "8px" }}>
              2. Data Storage & Local Vector Memory
            </h2>
            <p>
              Unlike standard AI assistants that forget conversations between sessions, Memora AI is built on <strong>Contextual Vector Memory</strong>. 
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong>Preference Extraction:</strong> When you message the chatbot, our backend parses context to identify preferences, stack configurations, and development choices.
              </li>
              <li>
                <strong>Local Embedding Storage:</strong> Extracted facts are converted into high-dimensional vector embeddings and stored securely in a local database managed through MongoDB.
              </li>
              <li>
                <strong>Retrieval:</strong> Stored vector snippets are queried semantically during subsequent prompt sessions to enrich prompt context logs.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="title-lg" style={{ color: "var(--color-ink)", marginBottom: "12px", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "8px" }}>
              3. Information We Collect
            </h2>
            <p>
              We collect the following classes of data to provide services:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Account Credentials:</strong> Full name, email address, and encrypted passwords stored securely in our MongoDB database.</li>
              <li><strong>Conversation History:</strong> Message logs, files parsed, and metadata relating to chatbot sessions.</li>
              <li><strong>Memory Indexes:</strong> Extracted vectors representing recalled contexts and facts.</li>
            </ul>
          </section>

          <section>
            <h2 className="title-lg" style={{ color: "var(--color-ink)", marginBottom: "12px", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "8px" }}>
              4. Third-Party Model Providers
            </h2>
            <p>
              To process your chatbot queries, we transmit prompt text (enriched with semantically matched vector context) to modern model APIs, specifically <strong>Google Gemini</strong> models. No credentials, raw database connection string secrets, or unrelated conversation vectors are transmitted to third parties. We do not sell or trade your personal information.
            </p>
          </section>

          <section>
            <h2 className="title-lg" style={{ color: "var(--color-ink)", marginBottom: "12px", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "8px" }}>
              5. Your Choices & Data Control
            </h2>
            <p>
              You maintain complete control over your context database:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>You may request complete account erasure by contacting security operations.</li>
              <li>You may delete conversations permanently in the sidebar. Doing so removes associated message records and indexes immediately.</li>
            </ul>
          </section>

          <section style={{ backgroundColor: "var(--color-surface-soft)", padding: "20px", borderRadius: "8px", border: "1px solid var(--color-hairline)" }}>
            <h3 className="title-md" style={{ color: "var(--color-ink)", marginBottom: "8px" }}>Security Safeguards</h3>
            <p style={{ fontSize: "14px", color: "var(--color-body)" }}>
              We leverage modern hashing mechanisms (bcrypt) for credentials and run communication pipelines over encrypted pathways (HTTPS/TLS). Although we execute rigorous safety checks, users should exercise review when managing production API keys or high-sensitivity corporate secrets.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer" style={{ padding: "32px 24px", marginTop: "64px", borderTop: "1px solid var(--color-hairline)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <p className="body-sm" style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Memora AI. All rights reserved.</p>
          <button 
            className="btn btn-text" 
            onClick={() => setView(previousView)}
            style={{ padding: 0, fontSize: "13.5px", color: "var(--color-primary)" }}
          >
            Return to signup
          </button>
        </div>
      </footer>
    </div>
  );
};
