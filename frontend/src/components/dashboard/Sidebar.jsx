import React from "react";
import {
  MemoraLogo,
  PlusIcon,
  MoreIcon,
  EditIcon,
  TrashIcon,
  LogoutIcon,
} from "../Icons";

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setView,
  setActiveConversationId,
  isConversationsLoading,
  conversations,
  activeConversationId,
  confirmDeleteId,
  setConfirmDeleteId,
  editingConvId,
  setEditingConvId,
  editTitle,
  setEditTitle,
  menuOpenConvId,
  setMenuOpenConvId,
  handleRenameConversation,
  handleDeleteConversation,
  setIsProfileOpen,
  user,
  userInitial,
  handleLogout,
}) => {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Panel */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""} ${
          sidebarCollapsed ? "collapsed" : ""
        }`}
      >
        <div className="sidebar-header">
          <div
            className="brand-wrapper"
            onClick={() => setView("landing")}
            style={{ cursor: "pointer" }}
          >
            <span
              className="brand-logo"
              style={{ color: "var(--color-primary)" }}
            >
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
            <div
              style={{
                textAlign: "center",
                padding: "16px",
                fontSize: "13px",
                color: "var(--color-muted-soft)",
              }}
            >
              Loading chats...
            </div>
          )}

          {!isConversationsLoading && conversations.length === 0 && (
            <div
              style={{
                padding: "12px",
                fontSize: "13px",
                color: "var(--color-muted-soft)",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              No chats yet. Start one!
            </div>
          )}

          {conversations.map((conv) => {
            const isConfirming = confirmDeleteId === conv._id;
            return (
              <div
                key={conv._id}
                className={`conversation-item ${
                  activeConversationId === conv._id ? "active" : ""
                } ${isConfirming ? "confirm-delete" : ""}`}
                onClick={() => {
                  if (!isConfirming && editingConvId !== conv._id) {
                    setActiveConversationId(conv._id);
                    setSidebarOpen(false);
                  }
                }}
              >
                {editingConvId === conv._id ? (
                  <div
                    className="rename-input-wrapper"
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
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
                        outline: "none",
                      }}
                    />
                    <button
                      className="btn-save"
                      onClick={() =>
                        handleRenameConversation(conv._id, editTitle)
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-success)",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Save"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
                        alignItems: "center",
                      }}
                      title="Cancel"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ) : isConfirming ? (
                  <div
                    className="delete-confirm-wrapper"
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "var(--color-error)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Delete permanently?
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn-text"
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--color-error)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv._id);
                        }}
                      >
                        Yes
                      </button>
                      <button
                        className="btn-text"
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--color-muted)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
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
                    <div
                      className="conversation-menu-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={`conversation-options-btn ${
                          menuOpenConvId === conv._id ? "active" : ""
                        }`}
                        title="Options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenConvId(
                            menuOpenConvId === conv._id ? null : conv._id
                          );
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
          <div
            className="user-profile clickable"
            onClick={() => setIsProfileOpen(true)}
            title="View Profile & Memories"
          >
            <div className="avatar-circle">{userInitial}</div>
            <div className="user-info">
              <span className="user-name">{user?.fullName || "User"}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button
            className="logout-icon-btn"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>
    </>
  );
};
