import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    //  vector db integration
    embeddingId: {
      type: String,
      default: null,
    },

    //  future memory architecture
    memoryType: {
      type: String,
      enum: ["short_term", "long_term"],
      default: "short_term",
    },
  },
  {
    timestamps: true,
  },
);

// indexing
messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
