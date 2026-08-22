import React from "react";
import { TrashIcon } from "../Icons";

export const ProfileModal = ({
  isProfileOpen,
  setIsProfileOpen,
  user,
  userInitial,
  isMemoriesLoading,
  memories,
  deletingMemoryConfirmId,
  setDeletingMemoryConfirmId,
  isDeletingMemoryId,
  handleDeleteMemory,
}) => {
  if (!isProfileOpen) return null;

  return (
    <div
      className="profile-modal-overlay"
      onClick={() => setIsProfileOpen(false)}
    >
      <div
        className="profile-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <h3 className="profile-modal-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-primary)" }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Security & Memories</span>
          </h3>
          <button
            className="profile-modal-close-btn"
            onClick={() => setIsProfileOpen(false)}
            title="Close"
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

        <div className="profile-modal-body">
          {/* User Profile Info Card */}
          <div className="profile-user-panel">
            <div className="profile-avatar-large">{userInitial}</div>
            <div className="profile-user-meta">
              <div className="profile-user-name-title">
                {user?.fullName || "User"}
              </div>
              <div className="profile-user-email-text">{user?.email}</div>
              <span className="profile-user-security-badge">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "4px" }}
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                End-to-end Encrypted Session
              </span>
            </div>
          </div>

          {/* Memories Section */}
          <div className="memories-section-header">
            <div className="memories-section-title-row">
              <h4 className="memories-section-title">
                Stored Personal Context
              </h4>
              {!isMemoriesLoading && memories.length > 0 && (
                <span className="memories-count-badge">
                  {memories.length} facts
                </span>
              )}
            </div>
          </div>

          {/* Memories List */}
          {isMemoriesLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--color-muted-soft)",
                fontSize: "14px",
              }}
            >
              Retrieving secure memories...
            </div>
          ) : memories.length === 0 ? (
            <div className="memory-empty-state">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "8px" }}
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <p className="memory-empty-text">
                No persistent memories found. As you converse, Memora
                automatically extracts key details to personalize your
                experience.
              </p>
            </div>
          ) : (
            <div className="memories-container">
              {memories.map((mem) => (
                <div key={mem._id} className="memory-item-card">
                  <div className="memory-item-content">
                    <p className="memory-item-text">{mem.text}</p>
                    <div className="memory-item-meta">
                      {mem.importance && (
                        <span className="memory-badge importance-badge">
                          Impact: {mem.importance}/10
                        </span>
                      )}
                      <span className="memory-badge time-badge">
                        Stored{" "}
                        {new Date(mem.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {deletingMemoryConfirmId === mem._id ? (
                    <div className="memory-delete-confirm-wrapper">
                      {isDeletingMemoryId === mem._id ? (
                        <span
                          className="typing-dot"
                          style={{
                            width: "4px",
                            height: "4px",
                            margin: "0 2px",
                          }}
                        ></span>
                      ) : (
                        <>
                          <span className="delete-confirm-prompt">
                            Delete?
                          </span>
                          <button
                            className="memory-confirm-btn confirm-yes"
                            onClick={() => handleDeleteMemory(mem._id)}
                            disabled={isDeletingMemoryId === mem._id}
                            title="Confirm delete"
                          >
                            Yes
                          </button>
                          <button
                            className="memory-confirm-btn confirm-no"
                            onClick={() => setDeletingMemoryConfirmId(null)}
                            disabled={isDeletingMemoryId === mem._id}
                            title="Cancel delete"
                          >
                            No
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      className="memory-delete-btn"
                      title="Purge Memory"
                      onClick={() => setDeletingMemoryConfirmId(mem._id)}
                      disabled={isDeletingMemoryId !== null}
                    >
                      <TrashIcon size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="profile-disclaimer-box">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginTop: "2px" }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>
              <strong>Privacy Control:</strong> These facts are saved to
              personalize your AI responses. Deleting a fact permanently
              erases it from your database record.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
