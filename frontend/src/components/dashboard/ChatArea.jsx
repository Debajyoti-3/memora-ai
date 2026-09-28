import {
  MemoraLogo,
  MenuIcon,
  SendIcon,
  MicIcon,
  MicActiveIcon,
  MicOffIcon,
} from "../Icons";
import { MarkdownMessage } from "../MarkdownMessage";
import { ErrorBubble } from "./ErrorBubble";
import { useSpeechToText } from "../../hooks/useSpeechToText";

export const ChatArea = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  toggleSidebarCollapsed,
  activeConversationId,
  conversations,
  messages,
  isMessagesLoading,
  isTyping,
  userInitial,
  inputText,
  setInputText,
  handleSendMessage,
  handleKeyDown,
  handleCopyCode,
  copiedIndex,
  handleRetryMessage,
  textInputRef,
  feedEndRef,
}) => {
  const quickPrompts = [
    {
      title: "System Architecture",
      desc: "Design a resilient backend with Express and MongoDB vector embeddings.",
    },
    {
      title: "Memory & Context",
      desc: "Explain vector embeddings & persistent context retrieval mechanisms.",
    },
    {
      title: "Code Refactoring",
      desc: "Help me refactor and organize my frontend components cleanly.",
    },
    {
      title: "Debug & Diagnostics",
      desc: "Help me troubleshoot API rate limits, CORS headers, and async errors.",
    },
  ];

  const {
    isListening,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
  } = useSpeechToText({
    onTranscript: (newText) => {
      setInputText(newText);
    },
  });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(inputText);
    }
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const handleFormSubmit = (e) => {
    if (isListening) {
      stopListening();
    }
    handleSendMessage(e);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (isListening) {
        stopListening();
      }
    }
    handleKeyDown(e);
  };

  const handleQuickPromptClick = (promptText) => {
    if (isListening) {
      stopListening();
    }
    setInputText(promptText);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  return (
    <main className="chat-window">
      {/* Top Navbar */}
      <header className="chat-header">
        <div className="header-left-cluster">
          <button
            className="sidebar-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 768) {
                setSidebarOpen(!sidebarOpen);
              } else {
                toggleSidebarCollapsed();
              }
            }}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <MenuIcon />
          </button>
          <h2 className="chat-active-title">
            {activeConversationId
              ? conversations.find((c) => c._id === activeConversationId)
                  ?.title || "Active Discussion"
              : "New Discussion"}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pulse-dot"></span>
          <span
            className="caption"
            style={{
              color: "var(--color-muted)",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            Memora model online
          </span>
        </div>
      </header>

      {/* Message Feed / Chat Arena */}
      {!activeConversationId && messages.length === 0 ? (
        <div className="empty-chat-state anim-fade-in">
          <div className="welcome-logo">
            <MemoraLogo size={48} />
          </div>
          <h1 className="welcome-title">Meet your thinking partner.</h1>
          <p className="welcome-subtitle">
            Memora is designed to help you organize thoughts, remember
            context, and execute workflows in a humanist, warm-cream
            dashboard.
          </p>

          {/* Quick Prompt Suggestions */}
          <div className=" suggestions-grid">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPromptClick(prompt.desc)}
                className="suggestion-card"
                type="button"
              >
                <div className="suggestion-header">{prompt.title}</div>
                <div className="suggestion-desc">{prompt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-feed">
          {isMessagesLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "var(--color-muted-soft)",
              }}
            >
              Loading conversation thread...
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className={`message-row ${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="message-avatar">AI</div>
                )}
                <div className="message-bubble">
                  {msg.isError ? (
                    <ErrorBubble
                      message={msg.content}
                      retryText={msg.retryText}
                      onRetry={() =>
                        handleRetryMessage(msg._id, msg.retryText)
                      }
                    />
                  ) : msg.role === "user" ? (
                    <div className="message-text">{msg.content}</div>
                  ) : (
                    <MarkdownMessage
                      content={msg.content}
                      onCopyCode={handleCopyCode}
                      copiedIndex={copiedIndex}
                    />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="message-avatar">{userInitial}</div>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="message-row assistant">
              <div className="message-avatar">AI</div>
              <div className="message-bubble">
                <div className="typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={feedEndRef} />
        </div>
      )}

      {/* Input Text Form Area */}
      <div className="chat-input-container">
        <form onSubmit={handleFormSubmit} className="chat-input-wrapper">
          <textarea
            ref={textInputRef}
            className="chat-textarea"
            placeholder="Ask anything, query your context, or write a prompt..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
          />
          <div className="chat-input-controls">
            <div className="chat-input-tips-cluster">
              {errorMessage ? (
                <span className="chat-input-voice-status error">
                  <span className="voice-status-dot error"></span>
                  {errorMessage}
                </span>
              ) : isListening ? (
                <span className="chat-input-voice-status listening">
                  <span className="voice-status-dot listening"></span>
                  Listening... speak now
                </span>
              ) : (
                <span className="chat-input-tips">
                  <span>Press Enter to send, Shift + Enter for new line</span>
                </span>
              )}
            </div>

            <div className="chat-input-actions">
              <button
                type="button"
                className={`mic-btn ${isListening ? "listening" : ""} ${errorMessage ? "error" : ""}`}
                onClick={handleMicClick}
                disabled={!isSupported || isTyping}
                title={
                  !isSupported
                    ? "Voice input works in Chrome/Edge"
                    : isListening
                    ? "Stop listening"
                    : errorMessage
                    ? errorMessage
                    : "Voice input"
                }
                aria-label={
                  !isSupported
                    ? "Voice input unsupported"
                    : isListening
                    ? "Stop voice input"
                    : "Voice input"
                }
              >
                {isListening ? (
                  <MicActiveIcon size={16} />
                ) : errorMessage ? (
                  <MicOffIcon size={16} />
                ) : (
                  <MicIcon size={16} />
                )}
              </button>
              <button
                type="submit"
                className="send-message-btn"
                disabled={!inputText.trim() || isTyping}
                title="Send Prompt"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </form>
        <div className="chat-footer-disclaimer">
          <p className="body-sm">&copy; {new Date().getFullYear()} Memora AI</p>
        </div>
      </div>
    </main>
  );
};
