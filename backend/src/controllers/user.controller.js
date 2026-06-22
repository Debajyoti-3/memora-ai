import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/generateToken.js";

const signupUser = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!passRegex.test(password)) {
      return res.json({
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }

    if (!emailRegex.test(email)) {
      return res.json({ message: "given email is not valid" });
    }
    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "Email already exist" });
    }

    const salt = await bcrypt.genSalt(10); //  10 salt rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      await newUser.save();

      res.status(201).json({
        message: "Signup successful",
        data: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          profilePic: newUser.profilePic,
        },
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in Signup", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { password, email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = await generateToken(user._id, res);

    res.status(200).json({
      message: "login successfull",
      data: {
        success: true,
        _id: user._id,
        email: user.email,
        fullNmae: user.fullName,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.log("Error in Login", error.message);
    res.status(500).json({ message: "Internal Server Error" });
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
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout", error.message);
    res.status(500).json({ message: "Internal Server Error" });
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

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { signupUser, loginUser, logoutUser, deleteAccount };
