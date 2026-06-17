import { toast } from "sonner";

/**
 * Error parsing utility to provide a consistent and polished UX
 * for rate limits, connection failures, session timeouts, and configuration issues.
 *
 * It provides technical debugging details for developers in development mode,
 * and elegant, reassuring, polite instructions for users in production mode.
 */

// Determine if we are in development mode based on Vite's env
const isDevMode = () => {
  try {
    return typeof import.meta !== "undefined" && import.meta.env ? !!import.meta.env.DEV : true;
  } catch (e) {
    return true;
  }
};

export const parseError = (err) => {
  let rawMessage = "";
  let statusCode = null;

  if (typeof err === "string") {
    rawMessage = err;
  } else if (err && typeof err === "object") {
    // Check axios error responses first, then general error properties
    rawMessage = err.response?.data?.message || err.response?.data?.error || err.message || err.toString();
    statusCode = err.response?.status || err.status || null;
  }

  const lowerMessage = rawMessage.toLowerCase();
  const dev = isDevMode();

  // 1. Rate Limit / Quota Exceeded (429)
  const isRateLimit =
    statusCode === 429 ||
    lowerMessage.includes("429") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("quota exceeded") ||
    lowerMessage.includes("resource_exhausted") ||
    lowerMessage.includes("resource exhausted") ||
    lowerMessage.includes("exhausted");

  // 2. Connection / Network Unreachable
  const isNetwork =
    lowerMessage.includes("network error") ||
    lowerMessage.includes("unreachable") ||
    lowerMessage.includes("connect") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("status code 0") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("load failed") ||
    lowerMessage.includes("cors");

  // 3. Session Expired / Authentication (401/403)
  const isAuth =
    statusCode === 401 ||
    statusCode === 403 ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("jwt") ||
    lowerMessage.includes("token") ||
    lowerMessage.includes("expired") ||
    lowerMessage.includes("forbidden");

  // 4. API Key / Configuration (developer error)
  const isConfig =
    lowerMessage.includes("api_key") ||
    lowerMessage.includes("api key") ||
    lowerMessage.includes("gemini_api_key") ||
    lowerMessage.includes("invalid api key") ||
    lowerMessage.includes("missing api key") ||
    lowerMessage.includes("config error") ||
    lowerMessage.includes("api key not set");

  // 5. Validation or user inputs (400, 409, 422, etc.)
  const isValidation =
    statusCode === 400 ||
    statusCode === 409 ||
    statusCode === 422 ||
    statusCode === 404;

  // Default values
  let type = "generic";
  let friendlyTitle = "Service Interruption";
  let friendlyMessage = "We encountered an unexpected issue while communicating with the AI model. Please try again in a moment.";

  if (isRateLimit) {
    type = "rate-limit";
    friendlyTitle = "Rate Limit Exceeded";
    friendlyMessage = "You've reached the request limit. Please wait about 30 seconds before sending your next message to allow the service to reset.";
  } else if (isNetwork) {
    type = "network";
    friendlyTitle = "Connection Unreachable";
    friendlyMessage = "We can't connect to the backend server. Please verify your internet connection and check if the backend service is running locally on port 3000.";
  } else if (isConfig) {
    type = "config";
    friendlyTitle = "AI API Key Missing";
    friendlyMessage = "The AI service is currently unavailable. If you are hosting this application, please ensure your GEMINI_API_KEY environment variable is configured correctly.";
  } else if (isAuth) {
    type = "auth";
    friendlyTitle = "Session Expired";
    friendlyMessage = "Your security token has expired or is invalid. Please sign out and sign back in to establish a new session.";
  } else if (isValidation) {
    type = "validation";
    friendlyTitle = "Request Failed";
    friendlyMessage = rawMessage || "The requested operation could not be completed with the provided inputs.";
  } else if (statusCode === 500 || lowerMessage.includes("500") || lowerMessage.includes("internal server error")) {
    type = "server";
    friendlyTitle = "Server Error";
    friendlyMessage = "We encountered an internal error on our servers. Our system log has captured the issue, and we're working on restoring normal operation.";
  }

  return {
    type,
    friendlyTitle,
    friendlyMessage,
    technicalDetails: rawMessage,
    isDev: dev,
    statusCode
  };
};

/**
 * Standardized Sonner error toast launcher
 */
export const showErrorToast = (err, contextTitle = "Error occurred") => {
  const parsed = parseError(err);
  
  if (parsed.isDev) {
    toast.error(`${parsed.friendlyTitle} (Dev Mode)`, {
      description: `[Status ${parsed.statusCode || "unknown"}] ${parsed.technicalDetails}`,
      duration: 8000,
    });
  } else {
    toast.error(parsed.friendlyTitle, {
      description: parsed.friendlyMessage,
      duration: 6000,
    });
  }
};
