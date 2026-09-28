import crypto from "crypto";

/**
 * Standardized error codes for machine-readable client responses.
 */
export const ERROR_CODES = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_EMAIL_EXISTS: "AUTH_EMAIL_EXISTS",
  AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

/**
 * Generate a short 6-character alphanumeric reference ID for tracing 5xx errors.
 */
export const generateReferenceId = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

/**
 * Centralized error responder.
 * Never leaks stack traces, DB queries, or raw internal errors to the client.
 * Logs full technical details server-side only with the matching referenceId.
 */
export const sendError = (
  res,
  {
    statusCode = 500,
    code = ERROR_CODES.INTERNAL_ERROR,
    message = "Something went wrong on our side. Please try again.",
    error = null,
    req = null,
  } = {}
) => {
  const isServerFailure = statusCode >= 500;
  const referenceId = isServerFailure ? generateReferenceId() : null;

  // Log full technical details server-side only
  if (isServerFailure || error) {
    const contextInfo = req ? `${req.method} ${req.originalUrl}` : "Internal";
    const refTag = referenceId ? `[Ref: ${referenceId}]` : "";
    console.error(
      `[API Error ${statusCode}] ${refTag} ${contextInfo} - ${code}:`,
      error?.stack || error?.message || error || message
    );
  }

  const payload = {
    success: false,
    code,
    message,
    ...(referenceId ? { referenceId } : {}),
  };

  return res.status(statusCode).json(payload);
};

/**
 * Centralized success responder.
 */
export const sendSuccess = (
  res,
  { statusCode = 200, message = "Success", data = {} } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};
