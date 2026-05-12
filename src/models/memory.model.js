import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "general",
    },

    importance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Memory = mongoose.model("Memory", memorySchema);