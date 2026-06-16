import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { authAPI, messageAPI } from "../services/api";
import { MarkdownMessage } from "../components/MarkdownMessage";
import { 
  SpikeLogo, 
  TrashIcon, 
  PlusIcon, 
  SendIcon, 
  LogoutIcon, 
  MenuIcon 
} from "../components/Icons";

export const Dashboard = ({ user, setUser, setView }) => {
  // --- States ---
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      toast.error("Failed to load your chat history.");
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
        toast.error("Failed to fetch the conversation thread.");
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
      toast.error("Failed to initialize a new discussion.");
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
        toast.error(`Query Failed: ${errMsg}`);
        
        // Add error system message
        setMessages(prev => {
          const filtered = alreadyAddedOptimistically 
            ? prev.filter(m => !m._id.startsWith("temp-user-"))
            : prev.filter(m => m._id !== tempUserMsg._id);
          return filtered.concat([{
            _id: `error-${Date.now()}`,
            role: "assistant",
            content: `**Error**: ${errMsg}`
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

  // Local deletion of conversation state (since backend has no delete endpoint)
  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c._id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
    }
    toast.success("Discussion cleared from session.");
  };

  // Copy code helper
  const handleCopyCode = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(id);
      toast.success("Snippet copied to clipboard.");
      setTimeout(() => setCopiedIndex(null), 2000);
    });
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
              <SpikeLogo />
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

          {conversations.map((conv) => (
            <div 
              key={conv._id} 
              className={`conversation-item ${activeConversationId === conv._id ? "active" : ""}`}
              onClick={() => {
                setActiveConversationId(conv._id);
                setSidebarOpen(false);
              }}
            >
              <span className="conversation-title-text">
                {conv.title || "Chat Session"}
              </span>
              <button 
                className="conversation-delete-btn"
                title="Remove Chat"
                onClick={(e) => handleDeleteConversation(e, conv._id)}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
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
              <SpikeLogo />
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
                    {msg.role === "user" ? (
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
