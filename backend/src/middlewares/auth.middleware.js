import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { sendError, ERROR_CODES } from "../utils/apiResponse.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const extractedToken = req.cookies.token;

    if (!extractedToken) {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_REQUIRED,
        message: "Your session has expired. Please sign in again.",
        req,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(extractedToken, process.env.JWT_SECRET_KEY);
    } catch {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_INVALID_TOKEN,
        message: "Your session has expired. Please sign in again.",
        req,
      });
    }

    if (!decoded || !decoded.userId) {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_INVALID_TOKEN,
        message: "Your session has expired. Please sign in again.",
        req,
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: "Your session could not be validated. Please sign in again.",
        req,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Something went wrong on our side. Please try again.",
      error,
      req,
    });
  }
};