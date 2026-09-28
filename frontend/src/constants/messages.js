/**
 * Centralized User-Facing Copy Catalog
 * Adheres strictly to industry UX writing guidelines:
 * - Plain language, sentence case, no technical jargon or status codes
 * - Problem + next action in every message
 * - Calm, empathetic, non-blaming tone
 * - Consistent terminology across the app
 */

export const MESSAGES = {
  // Authentication & Session
  AUTH: {
    INVALID_CREDENTIALS:
      "That email or password doesn't look right. Please check and try again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
    SESSION_REQUIRED: "Please sign in to access your chat history and memories.",
    EMAIL_EXISTS:
      "An account with this email already exists. Try signing in instead.",
    SIGNUP_SUCCESS: "Your account is ready. Please sign in to continue.",
    SIGNIN_SUCCESS: (name) => `Welcome back${name ? `, ${name}` : ""}.`,
    SIGNOUT_SUCCESS: "You have been signed out.",
    DELETE_ACCOUNT_SUCCESS: "Your account and data have been permanently deleted.",
    PASSWORD_REQUIREMENT:
      "Password must be at least 8 characters with uppercase, lowercase, a number, and a special symbol.",
    EMAIL_INVALID: "Please enter a valid email address.",
    ALL_FIELDS_REQUIRED: "Please fill in all fields to continue.",
    PRIVACY_POLICY_REQUIRED: "Please agree to the privacy policy to continue.",
  },

  // Network & Connectivity
  NETWORK: {
    OFFLINE: "You appear to be offline. Check your connection and try again.",
    TIMEOUT: "This is taking longer than expected. Please try again.",
    SERVER_UNREACHABLE:
      "We can't connect to the server right now. Check your connection and try again.",
  },

  // Rate Limiting & Service Quota
  RATE_LIMIT: {
    TITLE: "High Demand",
    MESSAGE:
      "We're getting a lot of requests right now. Please try again in a minute.",
  },

  // AI & Chat Message Generation
  CHAT: {
    AI_UNAVAILABLE:
      "The assistant couldn't respond right now. Your message was not lost. Please try again.",
    AI_RETRY_ACTION: "Try again",
    LOAD_HISTORY_FAILED: "We couldn't load your chat history. Please try again.",
    LOAD_MESSAGES_FAILED: "We couldn't load the messages for this chat. Please try again.",
    CREATE_CHAT_FAILED: "We couldn't start a new chat. Please try again.",
    DELETE_CHAT_SUCCESS: "Chat deleted permanently.",
    DELETE_CHAT_FAILED: "We couldn't delete this chat. Please try again.",
    RENAME_CHAT_SUCCESS: "Chat title updated.",
    RENAME_CHAT_FAILED: "We couldn't rename this chat. Please try again.",
    TITLE_REQUIRED: "Please enter a title for the chat.",
    COPY_CODE_SUCCESS: "Code snippet copied to clipboard.",
  },

  // Personal Memories
  MEMORIES: {
    LOAD_FAILED: "We couldn't load your saved memories. Please try again.",
    DELETE_SUCCESS: "Memory deleted.",
    DELETE_FAILED: "We couldn't delete this memory. Please try again.",
    EMPTY_STATE:
      "No memories saved yet. As you converse, important details will be remembered here to personalize future responses.",
    RETRIEVING: "Loading your saved memories...",
  },

  // Fallbacks & Unexpected
  ERRORS: {
    GENERIC: "Something went wrong on our side. Please try again.",
    WITH_REFERENCE: (ref) =>
      `Something went wrong on our side. Please try again. Reference: ${ref}`,
    NOT_FOUND: "We couldn't find what you were looking for.",
    PERMISSION_DENIED: "You don't have permission to do that.",
  },
};
