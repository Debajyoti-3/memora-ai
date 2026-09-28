import jwt from "jsonwebtoken";
import { sendError, ERROR_CODES } from "../utils/apiResponse.js";

export const generateToken = async (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day expiry
      httpOnly: true, // prevent XSS attacks
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });

    return token;
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Could not establish a secure session. Please try again.",
      error,
    });
  }
};
