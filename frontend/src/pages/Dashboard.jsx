import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { authAPI, messageAPI } from "../services/api";
import { showErrorToast } from "../services/errorParser";
import { Sidebar } from "../components/dashboard/Sidebar";
import { ChatArea } from "../components/dashboard/ChatArea";
import { ProfileModal } from "../components/dashboard/ProfileModal";

export const Dashboard = ({ user, setUser, setView }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("memora_sidebar_collapsed") === "true";
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("memora_sidebar_collapsed", String(next));
      return next;
    });
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [menuOpenConvId, setMenuOpenConvId] = useState(null);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState(false);
  const [isDeletingMemoryId, setIsDeletingMemoryId] = useState(null);
  const [deletingMemoryConfirmId, setDeletingMemoryConfirmId] = useState(null);

  const feedEndRef = useRef(null);
  const textInputRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversationId);
  const skipMessagesFetchRef = useRef(false);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

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

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      if (skipMessagesFetchRef.current) {
        skipMessagesFetchRef.current = false;
      } else {
        fetchMessages(activeConversationId);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (activeConversationId && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeConversationId]);

  useEffect(() => {
    setDeletingMemoryConfirmId(null);
    if (isProfileOpen) {
      const fetchMemories = async () => {
        setIsMemoriesLoading(true);
        try {
          const res = await messageAPI.getUserMemories();
          if (res.status === 200) {
            setMemories(res.memories || []);
          } else {
            toast.error(res.message || "Failed to load memories");
          }
        } catch (err) {
          console.error("Fetch memories error:", err);
          toast.error("Failed to load memories");
        } finally {
          setIsMemoriesLoading(false);
        }
      };
      fetchMemories();
    }
  }, [isProfileOpen]);

  const handleDeleteMemory = async (memoryId) => {
    setIsDeletingMemoryId(memoryId);
    try {
      const res = await messageAPI.deleteMemory(memoryId);
      if (res.status === 200) {
        toast.success("Memory deleted successfully");
        setMemories((prev) => prev.filter((m) => m._id !== memoryId));
        setDeletingMemoryConfirmId(null);
      } else {
        toast.error(res.message || "Failed to delete memory");
      }
    } catch (err) {
      console.error("Delete memory error:", err);
      toast.error("Failed to delete memory");
    } finally {
      setIsDeletingMemoryId(null);
    }
  };

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

  const fetchMessages = async (convId) => {
    setIsMessagesLoading(true);
    try {
      const result = await messageAPI.getMessages(convId);
      if (
        activeConversationIdRef.current === convId &&
        result.success &&
        result.messages
      ) {
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

  // Create new conversation
  const handleCreateNewConversation = async (initialMessage = "") => {
    try {
      const result = await messageAPI.createConversation();

      if (result.conversation && result.conversation._id) {
        const newConv = result.conversation;
        setConversations((prev) => [newConv, ...prev]);

        if (initialMessage.trim()) {
          const tempUserMsg = {
            _id: `temp-user-${Date.now()}`,
            role: "user",
            content: initialMessage,
            createdAt: new Date().toISOString(),
          };
          setMessages([tempUserMsg]);
        } else {
          setMessages([]);
        }

        skipMessagesFetchRef.current = true;
        setActiveConversationId(newConv._id);

        if (initialMessage.trim()) {
          await sendMessageToServer(newConv._id, initialMessage, true);
        }
      } else {
        await fetchConversations();
      }
    } catch (err) {
      console.error("Failed to create conversation", err);
      showErrorToast(err, "Failed to initialize discussion");
    }
  };

  const sendMessageToServer = async (
    convId,
    text,
    alreadyAddedOptimistically = false,
  ) => {
    setIsTyping(true);

    const tempUserMsg = {
      _id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    if (!alreadyAddedOptimistically) {
      setMessages((prev) => [...prev, tempUserMsg]);
    }

    try {
      const result = await messageAPI.sendMessage(convId, text);

      if (result.success) {
        if (activeConversationIdRef.current === convId) {
          setMessages((prev) => {
            const filtered = alreadyAddedOptimistically
              ? prev.filter((m) => !m._id.startsWith("temp-user-"))
              : prev.filter((m) => m._id !== tempUserMsg._id);
            return filtered.concat([
              result.userMessage,
              result.assistantMessage,
            ]);
          });

          fetchConversations();
        }
      } else {
        throw new Error(result.message || "Failed to get AI response");
      }
    } catch (err) {
      console.error("Failed to send message", err);
      if (activeConversationIdRef.current === convId) {
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Could not connect to the assistant.";
        showErrorToast(err, "Query Failed");

        setMessages((prev) => {
          const filtered = alreadyAddedOptimistically
            ? prev.filter((m) => !m._id.startsWith("temp-user-"))
            : prev.filter((m) => m._id !== tempUserMsg._id);
          return filtered.concat([
            {
              _id: `error-${Date.now()}`,
              role: "assistant",
              isError: true,
              content: errMsg,
              retryText: text,
            },
          ]);
        });
      }
    } finally {
      if (activeConversationIdRef.current === convId) {
        setIsTyping(false);
      }
    }
  };

  // Send message form handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText("");

    if (!activeConversationId) {
      await handleCreateNewConversation(textToSend);
    } else {
      await sendMessageToServer(activeConversationId, textToSend);
    }
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Delete conversation permanently
  const handleDeleteConversation = async (convId) => {
    try {
      await messageAPI.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
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

  
  const handleRenameConversation = async (convId, newTitle) => {
    if (!newTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      await messageAPI.renameConversation(convId, newTitle);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === convId ? { ...c, title: newTitle.trim() } : c,
        ),
      );
      toast.success("Conversation renamed successfully.");
    } catch (err) {
      console.error("Failed to rename conversation", err);
      showErrorToast(err, "Rename Failed");
    } finally {
      setEditingConvId(null);
    }
  };

  
  const handleCopyCode = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(id);
      toast.success("Snippet copied to clipboard.");
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  
  const handleRetryMessage = async (errorMsgId, retryText) => {
    setMessages((prev) => prev.filter((m) => m._id !== errorMsgId));
    await sendMessageToServer(activeConversationId, retryText);
  };

  
  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="dashboard-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setView={setView}
        setActiveConversationId={setActiveConversationId}
        isConversationsLoading={isConversationsLoading}
        conversations={conversations}
        activeConversationId={activeConversationId}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        editingConvId={editingConvId}
        setEditingConvId={setEditingConvId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        menuOpenConvId={menuOpenConvId}
        setMenuOpenConvId={setMenuOpenConvId}
        handleRenameConversation={handleRenameConversation}
        handleDeleteConversation={handleDeleteConversation}
        setIsProfileOpen={setIsProfileOpen}
        user={user}
        userInitial={userInitial}
        handleLogout={handleLogout}
      />

      <ChatArea
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
        activeConversationId={activeConversationId}
        conversations={conversations}
        messages={messages}
        isMessagesLoading={isMessagesLoading}
        isTyping={isTyping}
        userInitial={userInitial}
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        handleKeyDown={handleKeyDown}
        handleCopyCode={handleCopyCode}
        copiedIndex={copiedIndex}
        handleRetryMessage={handleRetryMessage}
        textInputRef={textInputRef}
        feedEndRef={feedEndRef}
      />

      <ProfileModal
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        user={user}
        userInitial={userInitial}
        isMemoriesLoading={isMemoriesLoading}
        memories={memories}
        deletingMemoryConfirmId={deletingMemoryConfirmId}
        setDeletingMemoryConfirmId={setDeletingMemoryConfirmId}
        isDeletingMemoryId={isDeletingMemoryId}
        handleDeleteMemory={handleDeleteMemory}
      />
    </div>
  );
};
