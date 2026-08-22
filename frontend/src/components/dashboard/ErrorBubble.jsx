import React, { useState } from "react";
import { parseError } from "../../services/errorParser";

const RateLimitIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const NetworkIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-15.19 2A6 6 0 0 0 6 24h13a5 5 0 0 0 3.61-7.05z" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const AuthIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ConfigIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const ServerIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const getErrorIcon = (type) => {
  switch (type) {
    case "rate-limit":
      return <RateLimitIcon />;
    case "network":
      return <NetworkIcon />;
    case "auth":
      return <AuthIcon />;
    case "config":
      return <ConfigIcon />;
    case "server":
      return <ServerIcon />;
    default:
      return <AlertIcon />;
  }
};

export const ErrorBubble = ({ message, retryText, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const parsed = parseError(message);

  return (
    <div
      className="error-card anim-slide-up"
      style={{
        backgroundColor: "rgba(198, 69, 69, 0.03)",
        border: "1px solid rgba(198, 69, 69, 0.18)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "520px",
        textAlign: "left",
        boxSizing: "border-box",
        boxShadow: "0 2px 8px rgba(198, 69, 69, 0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          color: "var(--color-error)",
        }}
      >
        {getErrorIcon(parsed.type)}
        <h4
          style={{
            margin: 0,
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.2px",
          }}
        >
          {parsed.friendlyTitle}
        </h4>
        {parsed.isDev && (
          <span
            style={{
              fontSize: "8.5px",
              backgroundColor: "rgba(198, 69, 69, 0.08)",
              color: "var(--color-error)",
              padding: "1.5px 5px",
              borderRadius: "4px",
              textTransform: "uppercase",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            Dev
          </span>
        )}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "13.5px",
          color: "var(--color-body)",
          lineHeight: "1.5",
          fontFamily: "var(--font-sans)",
        }}
      >
        {parsed.friendlyMessage}
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginTop: "2px",
        }}
      >
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-secondary"
            style={{
              height: "28px",
              fontSize: "11px",
              padding: "0 10px",
              borderColor: "rgba(198, 69, 69, 0.2)",
              backgroundColor: "transparent",
              color: "var(--color-error)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Retry Message
          </button>
        )}
        {parsed.isDev && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-text"
            style={{
              height: "28px",
              fontSize: "11px",
              padding: "0",
              color: "var(--color-muted)",
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            {showDetails ? "Hide technical details" : "Show technical details"}
          </button>
        )}
      </div>

      {parsed.isDev && showDetails && (
        <pre
          style={{
            margin: "4px 0 0 0",
            backgroundColor: "rgba(20, 20, 19, 0.03)",
            border: "1px solid rgba(20, 20, 19, 0.08)",
            borderRadius: "6px",
            padding: "10px 12px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: "1.4",
          }}
        >
          {parsed.technicalDetails || "No technical details provided."}
        </pre>
      )}
    </div>
  );
};
