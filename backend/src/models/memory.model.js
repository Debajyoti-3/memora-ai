import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "preference",
        "personal",
        "project",
        "fact",
        "conversation",
        "general",
      ],
      default: "general",
      index: true,
    },

    importance: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
      index: true,
    },
    accessCount: {
      type: Number,
      default: 0,
    },

    lastAccessedAt: {
      type: Date,
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    embedding: {
      type: [Number],
      default: [],
    },

    sourceMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

export const Memory = mongoose.model("Memory", memorySchema);
