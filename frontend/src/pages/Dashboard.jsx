import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { authAPI, messageAPI } from "../services/api";
import { MarkdownMessage } from "../components/MarkdownMessage";
import { 
  MemoraLogo, 
  TrashIcon, 
  PlusIcon, 
  SendIcon, 
  LogoutIcon, 
  MenuIcon,
  MoreIcon,
  EditIcon
} from "../components/Icons";
import { parseError, showErrorToast } from "../services/errorParser";

// Premium error icons matching the design language
const RateLimitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const NetworkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-15.19 2A6 6 0 0 0 6 24h13a5 5 0 0 0 3.61-7.05z" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const AuthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ConfigIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const ServerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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

const ErrorBubble = ({ message, retryText, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const parsed = parseError(message);

  return (
    <div className="error-card anim-slide-up" style={{
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
      boxShadow: "0 2px 8px rgba(198, 69, 69, 0.02)"
    }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-error)" }}>
        {getErrorIcon(parsed.type)}
        <h4 style={{ margin: 0, fontWeight: 600, fontSize: "14px", fontFamily: "var(--font-sans)", letterSpacing: "-0.2px" }}>
          {parsed.friendlyTitle}
        </h4>
        {parsed.isDev && (
          <span style={{
            fontSize: "8.5px",
            backgroundColor: "rgba(198, 69, 69, 0.08)",
            color: "var(--color-error)",
            padding: "1.5px 5px",
            borderRadius: "4px",
            textTransform: "uppercase",
            fontWeight: "700",
            letterSpacing: "0.5px"
          }}>
            Dev
          </span>
        )}
      </div>
      
      <p style={{ margin: 0, fontSize: "13.5px", color: "var(--color-body)", lineHeight: "1.5", fontFamily: "var(--font-sans)" }}>
        {parsed.friendlyMessage}
      </p>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "2px" }}>
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
              fontWeight: 500
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
              border: "none"
            }}
          >
            {showDetails ? "Hide technical details" : "Show technical details"}
          </button>
        )}
      </div>

      {parsed.isDev && showDetails && (
        <pre style={{
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
          lineHeight: "1.4"
        }}>
          {parsed.technicalDetails || "No technical details provided."}
        </pre>
      )}
    </div>
  );
};

export const Dashboard = ({ user, setUser, setView }) => {
  // --- States ---
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [menuOpenConvId, setMenuOpenConvId] = useState(null);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Loading States
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  // Reference for Auto scroll & guard checks
  const feedEndRef = useRef(null);
  const textInputRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversationId);
  const skipMessagesFetchRef = useRef(false);

  // Auto-scroll messages
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Sync ref with active conversation ID
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Close menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".conversation-menu-container")) {
        setMenuOpenConvId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Load conversations once user is authenticated
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages once active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      if (skipMessagesFetchRef.current) {
        skipMessagesFetchRef.current = false; // Reset the flag
      } else {
        fetchMessages(activeConversationId);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Focus textarea when conversation shifts
  useEffect(() => {
    if (activeConversationId && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeConversationId]);

  // --- API Integrations ---

  // Auth: Logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout request error", err);
    } finally {
      localStorage.removeItem("memora_user");
      setUser(null);
      setView("landing");
      toast.success("Sign out successful.");
    }
  };

  // Fetch Conversations List
  const fetchConversations = async () => {
    setIsConversationsLoading(true);
    try {
      const result = await messageAPI.getConversations();
      if (result.fetchedConversations) {
        setConversations(result.fetchedConversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      showErrorToast(err, "Failed to load chat history");
    } finally {
      setIsConversationsLoading(false);
    }
  };

  // Fetch Messages for active Conversation
  const fetchMessages = async (convId) => {
    setIsMessagesLoading(true);
    try {
      const result = await messageAPI.getMessages(convId);
      if (activeConversationIdRef.current === convId && result.success && result.messages) {
        setMessages(result.messages);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
      if (activeConversationIdRef.current === convId) {
        showErrorToast(err, "Failed to fetch thread");
      }
    } finally {
      if (activeConversationIdRef.current === convId) {
        setIsMessagesLoading(false);
      }
    }
  };

  // Create new conversation and immediately send a message or activate it
  const handleCreateNewConversation = async (initialMessage = "") => {
    try {
      const result = await messageAPI.createConversation();

      if (result.conversation && result.conversation._id) {
        const newConv = result.conversation;
        setConversations(prev => [newConv, ...prev]);
        
        // Optimistically set message list if we have an initial message
        if (initialMessage.trim()) {
          const tempUserMsg = {
            _id: `temp-user-${Date.now()}`,
            role: "user",
            content: initialMessage,
            createdAt: new Date().toISOString()
          };
          setMessages([tempUserMsg]);
        } else {
          setMessages([]);
        }

        skipMessagesFetchRef.current = true; // Tell the useEffect not to fetch from DB
        setActiveConversationId(newConv._id);

        if (initialMessage.trim()) {
          // If there is an initial prompt, send it
          await sendMessageToServer(newConv._id, initialMessage, true); // true indicates it was already optimistically added
        }
      } else {
        // Fallback: reload list to get the conversation
        await fetchConversations();
      }
    } catch (err) {
      console.error("Failed to create conversation", err);
      showErrorToast(err, "Failed to initialize discussion");
    }
  };

  // Send message helper
  const sendMessageToServer = async (convId, text, alreadyAddedOptimistically = false) => {
    setIsTyping(true);
    
    // Add User Message Optimistically if not already added
    const tempUserMsg = {
      _id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString()
    };
    
    if (!alreadyAddedOptimistically) {
      setMessages(prev => [...prev, tempUserMsg]);
    }

    try {
      const result = await messageAPI.sendMessage(convId, text);

      if (result.success) {
        if (activeConversationIdRef.current === convId) {
          // Remove temp and add actual user & assistant messages
          setMessages(prev => {
            const filtered = alreadyAddedOptimistically 
              ? prev.filter(m => !m._id.startsWith("temp-user-")) // filter any temp user messages
              : prev.filter(m => m._id !== tempUserMsg._id);
            return filtered.concat([result.userMessage, result.assistantMessage]);
          });
          
          // Refresh conversation list to show updated title dynamically generated by backend
          fetchConversations();
        }
      } else {
        throw new Error(result.message || "Failed to get AI response");
      }
    } catch (err) {
      console.error("Failed to send message", err);
      if (activeConversationIdRef.current === convId) {
        const errMsg = err.response?.data?.message || err.message || "Could not connect to the assistant.";
        showErrorToast(err, "Query Failed");
        
        // Add error system message
        setMessages(prev => {
          const filtered = alreadyAddedOptimistically 
            ? prev.filter(m => !m._id.startsWith("temp-user-"))
            : prev.filter(m => m._id !== tempUserMsg._id);
          return filtered.concat([{
            _id: `error-${Date.now()}`,
            role: "assistant",
            isError: true,
            content: errMsg,
            retryText: text
          }]);
        });
      }
    } finally {
      if (activeConversationIdRef.current === convId) {
        setIsTyping(false);
      }
    }
  };

  // Send message handler (from input box)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText("");

    if (!activeConversationId) {
      // Create conversation first, then send
      await handleCreateNewConversation(textToSend);
    } else {
      await sendMessageToServer(activeConversationId, textToSend);
    }
  };

  // Handle Enter key inside textarea (Shift + Enter for new lines)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Permanent deletion of conversation from DB and state
  const handleDeleteConversation = async (convId) => {
    try {
      await messageAPI.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast.success("Conversation deleted permanently.");
    } catch (err) {
      console.error("Failed to delete conversation", err);
      showErrorToast(err, "Delete Failed");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Rename conversation title in DB and state
  const handleRenameConversation = async (convId, newTitle) => {
    if (!newTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      await messageAPI.renameConversation(convId, newTitle);
      setConversations(prev => prev.map(c => c._id === convId ? { ...c, title: newTitle.trim() } : c));
      toast.success("Conversation renamed successfully.");
    } catch (err) {
      console.error("Failed to rename conversation", err);
      showErrorToast(err, "Rename Failed");
    } finally {
      setEditingConvId(null);
    }
  };

  // Copy code helper
  const handleCopyCode = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(id);
      toast.success("Snippet copied to clipboard.");
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Retry failed message helper
  const handleRetryMessage = async (errorMsgId, retryText) => {
    setMessages(prev => prev.filter(m => m._id !== errorMsgId));
    await sendMessageToServer(activeConversationId, retryText);
  };

  // Quick Prompt cards action
  const handleQuickPrompt = (promptText) => {
    setInputText(promptText);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  // Get User Initial for Avatar
  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar Panel */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-wrapper" onClick={() => setView("landing")} style={{ cursor: "pointer" }}>
            <span className="brand-logo" style={{ color: "var(--color-primary)" }}>
              <MemoraLogo />
            </span>
            <span className="brand-name">Memora AI</span>
          </div>
        </div>

        <div className="sidebar-action">
          <button 
            className="btn btn-secondary new-chat-btn" 
            onClick={() => {
              setActiveConversationId(null);
              setSidebarOpen(false);
            }}
          >
            <PlusIcon />
            New Chat
          </button>
        </div>

        <div className="conversations-list">
          <div className="conversations-section-title">Conversations</div>
          
          {isConversationsLoading && (
            <div style={{ textAlign: "center", padding: "16px", fontSize: "13px", color: "var(--color-muted-soft)" }}>
              Loading chats...
            </div>
          )}

          {!isConversationsLoading && conversations.length === 0 && (
            <div style={{ padding: "12px", fontSize: "13px", color: "var(--color-muted-soft)", fontStyle: "italic", textAlign: "center" }}>
              No chats yet. Start one!
            </div>
          )}

          {conversations.map((conv) => {
            const isConfirming = confirmDeleteId === conv._id;
            return (
              <div 
                key={conv._id} 
                className={`conversation-item ${activeConversationId === conv._id ? "active" : ""} ${isConfirming ? "confirm-delete" : ""}`}
                onClick={() => {
                  if (!isConfirming && editingConvId !== conv._id) {
                    setActiveConversationId(conv._id);
                    setSidebarOpen(false);
                  }
                }}
              >
                {editingConvId === conv._id ? (
                  <div className="rename-input-wrapper" style={{ display: "flex", width: "100%", alignItems: "center", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="text" 
                      className="rename-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameConversation(conv._id, editTitle);
                        } else if (e.key === "Escape") {
                          setEditingConvId(null);
                        }
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        background: "var(--color-surface-soft)",
                        border: "1px solid var(--color-hairline)",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "13px",
                        color: "var(--color-ink)",
                        outline: "none"
                      }}
                    />
                    <button 
                      className="btn-save"
                      onClick={() => handleRenameConversation(conv._id, editTitle)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-success)",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Save"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => setEditingConvId(null)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-muted)",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Cancel"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ) : isConfirming ? (
                  <div className="delete-confirm-wrapper" style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-error)", whiteSpace: "nowrap" }}>Delete permanently?</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button 
                        className="btn-text" 
                        style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-error)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv._id); }}
                      >
                        Yes
                      </button>
                      <button 
                        className="btn-text" 
                        style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="conversation-title-text">
                      {conv.title || "Chat Session"}
                    </span>
                    <div className="conversation-menu-container" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className={`conversation-options-btn ${menuOpenConvId === conv._id ? "active" : ""}`}
                        title="Options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenConvId(menuOpenConvId === conv._id ? null : conv._id);
                        }}
                      >
                        <MoreIcon />
                      </button>
                      
                      {menuOpenConvId === conv._id && (
                        <div className="conversation-dropdown-menu">
                          <button 
                            className="dropdown-item" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConvId(conv._id);
                              setEditTitle(conv.title || "Chat Session");
                              setMenuOpenConvId(null);
                            }}
                          >
                            <EditIcon />
                            <span>Rename</span>
                          </button>
                          <button 
                            className="dropdown-item delete-item" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(conv._id);
                              setMenuOpenConvId(null);
                            }}
                          >
                            <TrashIcon />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle">{userInitial}</div>
            <div className="user-info">
              <span className="user-name">{user?.fullName}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="logout-icon-btn" onClick={handleLogout} title="Sign Out">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Main Chat Display */}
      <main className="chat-window">
        {/* Top Navbar */}
        <header className="chat-header">
          <div className="header-left-cluster">
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MenuIcon />
            </button>
            <h2 className="chat-active-title">
              {activeConversationId 
                ? (conversations.find(c => c._id === activeConversationId)?.title || "Active Discussion")
                : "New Discussion"}
            </h2>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pulse-dot"></span>
            <span className="caption" style={{ color: "var(--color-muted)", fontSize: "12px", fontWeight: "600" }}>
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
              Memora is designed to help you organize thoughts, remember context, and execute workflows in a humanist, warm-cream dashboard.
            </p>

            <div className="suggestions-grid">
              <div 
                className="suggestion-card" 
                onClick={() => handleQuickPrompt("Write a recursive Python function to compute Fibonacci numbers, with memoization.")}
              >
                <span className="suggestion-header">Write Fibonacci in Python</span>
                <span className="suggestion-desc">Generates code using dynamic programming in a clean workspace format.</span>
              </div>
              <div 
                className="suggestion-card" 
                onClick={() => handleQuickPrompt("Can you draft an outline for an AI brand design project focusing on cream canvas and coral accents?")}
              >
                <span className="suggestion-header">Brand editorial outline</span>
                <span className="suggestion-desc">Drafts details highlighting color choices, font hierarchies, and styling cues.</span>
              </div>
              <div 
                className="suggestion-card" 
                onClick={() => handleQuickPrompt("Give me a list of key items to prepare for an upcoming technical systems design interview.")}
              >
                <span className="suggestion-header">System design preparation</span>
                <span className="suggestion-desc">Lists databases, caching strategies, horizontal scaling rules, and load balancers.</span>
              </div>
              <div 
                className="suggestion-card" 
                onClick={() => handleQuickPrompt("Explain why some AI applications use warm palettes (like cream/coral) instead of tech-blue.")}
              >
                <span className="suggestion-header">Warm-palette aesthetics</span>
                <span className="suggestion-desc">Discusses humanist vs corporate brand representation and reader-friendliness.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-feed">
            {isMessagesLoading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--color-muted-soft)" }}>
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
                        onRetry={() => handleRetryMessage(msg._id, msg.retryText)} 
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
          <form onSubmit={handleSendMessage} className="chat-input-wrapper">
            <textarea
              ref={textInputRef}
              className="chat-textarea"
              placeholder="Ask anything, query your context, or write a prompt..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="chat-input-controls">
              <span className="chat-input-tips">
                <span>Press Enter to send, Shift + Enter for new line</span>
              </span>
              <button 
                type="submit" 
                className="send-message-btn" 
                disabled={!inputText.trim() || isTyping}
                title="Send Prompt"
              >
                <SendIcon />
              </button>
            </div>
          </form>
          <div className="chat-footer-disclaimer">
            Memora AI leverages Gemini 1.5/2.0 to help you analyze, remember, and build. Accuracy is verified by user checks.
          </div>
        </div>
      </main>
    </div>
  );
};
