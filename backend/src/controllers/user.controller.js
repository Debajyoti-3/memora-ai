import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/generateToken.js";
import { sendError, sendSuccess, ERROR_CODES } from "../utils/apiResponse.js";

const signupUser = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName || !email || !password) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Please provide your full name, email, and password.",
        req,
      });
    }

    if (!emailRegex.test(email)) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Please enter a valid email address.",
        req,
      });
    }

    if (!passRegex.test(password)) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
        req,
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.AUTH_EMAIL_EXISTS,
        message: "An account with this email already exists. Try signing in instead.",
        req,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    return sendSuccess(res, {
      statusCode: 201,
      message: "Account created successfully. Please sign in.",
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't create your account right now. Please try again.",
      error,
      req,
    });
  }
};

const loginUser = async (req, res) => {
  const { password, email } = req.body;

  try {
    if (!email || !password) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Please enter your email and password.",
        req,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against account enumeration: use identical timing-safe comparison where feasible
    // and identical error message for both non-existent user and wrong password
    let isPasswordCorrect = false;
    if (user) {
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    }

    if (!user || !isPasswordCorrect) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: "That email or password doesn't look right. Please check and try again.",
        req,
      });
    }

    await generateToken(user._id, res);

    return res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: {
        success: true,
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't sign you in right now. Please try again.",
      error,
      req,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });
    return sendSuccess(res, {
      message: "Signed out successfully.",
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't sign you out right now. Please try again.",
      error,
      req,
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });

    return sendSuccess(res, {
      message: "Your account has been deleted permanently.",
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't delete your account right now. Please try again.",
      error,
      req,
    });
  }
};

export { signupUser, loginUser, logoutUser, deleteAccount };
