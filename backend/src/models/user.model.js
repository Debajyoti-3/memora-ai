import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please enter a valid email"
    ]
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
      "Password must contain uppercase, lowercase, number and special character"
    ]
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const User =  mongoose.model("User", userSchema)
