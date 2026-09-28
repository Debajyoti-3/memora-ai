import { toast } from "sonner";
import { MESSAGES } from "../constants/messages";

/**
 * Standardizes extraction of error information from Axios errors, native Errors, or custom payloads.
 */
export const getUserMessage = (err, context = "") => {
  // Always log technical details to the developer console for debugging
  console.error(`[Memora Client Error${context ? ` - ${context}` : ""}]`, err);

  let statusCode = null;
  let serverCode = null;
  let serverMessage = null;
  let referenceId = null;
  let rawMessage = "";

  if (typeof err === "string") {
    rawMessage = err;
  } else if (err && typeof err === "object") {
    statusCode = err.response?.status || err.status || null;
    serverCode = err.response?.data?.code || err.code || null;
    serverMessage = err.response?.data?.message || null;
    referenceId = err.response?.data?.referenceId || null;
    rawMessage =
      serverMessage || err.message || err.statusText || String(err);
  }

  const lowerRaw = rawMessage.toLowerCase();

  // 1. Offline / Network Connectivity Check
  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  const isNetwork =
    isOffline ||
    lowerRaw.includes("network error") ||
    lowerRaw.includes("failed to fetch") ||
    lowerRaw.includes("econnrefused") ||
    lowerRaw.includes("timeout") ||
    lowerRaw.includes("load failed") ||
    serverCode === "ERR_NETWORK" ||
    serverCode === "ECONNABORTED";

  if (isNetwork) {
    const isTimeout =
      lowerRaw.includes("timeout") || serverCode === "ECONNABORTED";
    return {
      type: "network",
      title: "Connection Issue",
      message: isTimeout
        ? MESSAGES.NETWORK.TIMEOUT
        : isOffline
        ? MESSAGES.NETWORK.OFFLINE
        : MESSAGES.NETWORK.SERVER_UNREACHABLE,
      referenceId: null,
      statusCode,
      code: "NETWORK_ERROR",
      isRetryable: true,
    };
  }

  // 2. Rate Limiting & High Traffic (429)
  const isRateLimit =
    statusCode === 429 ||
    serverCode === "RATE_LIMITED" ||
    lowerRaw.includes("429") ||
    lowerRaw.includes("rate limit") ||
    lowerRaw.includes("resource_exhausted") ||
    lowerRaw.includes("quota exceeded");

  if (isRateLimit) {
    return {
      type: "rate-limit",
      title: MESSAGES.RATE_LIMIT.TITLE,
      message: MESSAGES.RATE_LIMIT.MESSAGE,
      referenceId,
      statusCode: 429,
      code: "RATE_LIMITED",
      isRetryable: true,
    };
  }

  // 3. Authentication & Authorization (401 / 403)
  if (
    statusCode === 401 ||
    serverCode === "AUTH_REQUIRED" ||
    serverCode === "AUTH_SESSION_EXPIRED" ||
    serverCode === "AUTH_INVALID_TOKEN" ||
    serverCode === "AUTH_USER_NOT_FOUND"
  ) {
    return {
      type: "auth",
      title: "Session Expired",
      message: MESSAGES.AUTH.SESSION_EXPIRED,
      referenceId: null,
      statusCode: 401,
      code: serverCode || "AUTH_SESSION_EXPIRED",
      isRetryable: false,
    };
  }

  if (serverCode === "AUTH_INVALID_CREDENTIALS") {
    return {
      type: "auth",
      title: "Sign In Failed",
      message: MESSAGES.AUTH.INVALID_CREDENTIALS,
      referenceId: null,
      statusCode: 400,
      code: "AUTH_INVALID_CREDENTIALS",
      isRetryable: false,
    };
  }

  if (serverCode === "AUTH_EMAIL_EXISTS") {
    return {
      type: "auth",
      title: "Account Exists",
      message: MESSAGES.AUTH.EMAIL_EXISTS,
      referenceId: null,
      statusCode: 400,
      code: "AUTH_EMAIL_EXISTS",
      isRetryable: false,
    };
  }

  if (statusCode === 403 || serverCode === "FORBIDDEN") {
    return {
      type: "auth",
      title: "Access Restricted",
      message: MESSAGES.ERRORS.PERMISSION_DENIED,
      referenceId: null,
      statusCode: 403,
      code: "FORBIDDEN",
      isRetryable: false,
    };
  }

  // 4. Resource Not Found (404)
  if (statusCode === 404 || serverCode === "RESOURCE_NOT_FOUND") {
    return {
      type: "validation",
      title: "Not Found",
      message: MESSAGES.ERRORS.NOT_FOUND,
      referenceId: null,
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
      isRetryable: false,
    };
  }

  // 5. AI Service Pipeline Interruption
  if (
    serverCode === "AI_SERVICE_UNAVAILABLE" ||
    lowerRaw.includes("gemini") ||
    lowerRaw.includes("ai assistant")
  ) {
    return {
      type: "server",
      title: "Assistant Unavailable",
      message: MESSAGES.CHAT.AI_UNAVAILABLE,
      referenceId,
      statusCode: statusCode || 500,
      code: "AI_SERVICE_UNAVAILABLE",
      isRetryable: true,
    };
  }

  // 6. Validation Failures (400 / 422)
  if (statusCode === 400 || statusCode === 422) {
    // If the server provided a safe curated message, use it; otherwise use generic validation
    const safeValidationMsg =
      serverMessage && !serverMessage.toLowerCase().includes("error")
        ? serverMessage
        : MESSAGES.ERRORS.GENERIC;

    return {
      type: "validation",
      title: "Check Inputs",
      message: safeValidationMsg,
      referenceId: null,
      statusCode,
      code: serverCode || "VALIDATION_FAILED",
      isRetryable: false,
    };
  }

  // 7. Server / Unexpected Fallback (5xx)
  const fallbackMessage = referenceId
    ? MESSAGES.ERRORS.WITH_REFERENCE(referenceId)
    : MESSAGES.ERRORS.GENERIC;

  return {
    type: "server",
    title: "Something Went Wrong",
    message: fallbackMessage,
    referenceId,
    statusCode: statusCode || 500,
    code: serverCode || "INTERNAL_ERROR",
    isRetryable: true,
  };
};

/**
 * Backward compatibility parser for ErrorBubble and legacy components.
 */
export const parseError = (err) => {
  const result = getUserMessage(err);
  return {
    type: result.type,
    friendlyTitle: result.title,
    friendlyMessage: result.message,
    referenceId: result.referenceId,
    statusCode: result.statusCode,
    code: result.code,
    isRetryable: result.isRetryable,
  };
};

/**
 * Central Toast Controller using Sonner
 * Enforces UX standards:
 * - Error duration ~5.5s, Success duration ~3s
 * - Deduplication via unique toast ID
 * - Action button for retryable failures
 */
export const showAppToast = {
  error: (err, { context = "", onRetry = null, id = null } = {}) => {
    const parsed = getUserMessage(err, context);
    const toastId = id || `toast-err-${parsed.code || parsed.title}`;

    toast.error(parsed.title, {
      id: toastId,
      description: parsed.message,
      duration: 5500,
      ...(onRetry
        ? {
            action: {
              label: "Try again",
              onClick: onRetry,
            },
          }
        : {}),
    });
  },

  success: (message, { id = null, description = null } = {}) => {
    const toastId = id || `toast-succ-${message.slice(0, 20)}`;
    toast.success(message, {
      id: toastId,
      description,
      duration: 3000,
    });
  },

  warning: (message, { id = null, description = null } = {}) => {
    const toastId = id || `toast-warn-${message.slice(0, 20)}`;
    toast.warning(message, {
      id: toastId,
      description,
      duration: 5000,
    });
  },

  info: (message, { id = null, description = null } = {}) => {
    const toastId = id || `toast-info-${message.slice(0, 20)}`;
    toast.info(message, {
      id: toastId,
      description,
      duration: 4000,
    });
  },
};

/**
 * Backwards compatibility helper for showErrorToast(err, contextTitle)
 */
export const showErrorToast = (err, contextTitle = "Error occurred") => {
  showAppToast.error(err, { context: contextTitle });
};
