// models/Conversation.js

import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      trim: true,
      default: "New Chat"
    },

    // future feature
    summary: {
      type: String,
      default: ""
    },

    // future feature
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// useful for sorting recent chats
conversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);