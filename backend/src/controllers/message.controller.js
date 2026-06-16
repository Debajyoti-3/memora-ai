import { Conversation } from "../models/conversation.model.js";
import { buildConversationContext } from "../services/contextBuilder.service.js";
import { Message } from "../models/message.model.js";
import { generateAIResponse } from "../services/gemini.service.js";
import { Memory } from "../models/memory.model.js";
import { extractMemory } from "../services/memoryExtraction.service.js";
import { generateEmbedding } from "../services/embedding.service.js";

const createCoversation = async (req, res) => {
  try {
    const fetchedUser = req.user;

    if (!fetchedUser) {
      return res.json({
        status: 401,
        message: "user not found or unauthenticated",
      });
    }

    const newConversation = await Conversation.create({
      userId: fetchedUser.id,
    });

    return res.json({
      message: "Conversation created successfully",
      conversation: newConversation
    });
  } catch (error) {
    console.log("Error in Conversation Creation: ", error.message);
    return res.status(500).json({ message: "Error in Conversation Creation" });
  }
};

const getCoversations = async (req, res) => {
  try {
    const fetchedUser = req.user;

    if (!fetchedUser) {
      return res.json({
        status: 401,
        message: "user not found or unauthenticated",
      });
    }

    const fetchedConversations = await Conversation.find({
      userId: fetchedUser.id,
    }).sort({ updatedAt: -1 });

    return res.json({
      fetchedConversations,
      message: "conversations fetched successfully",
    });
  } catch (error) {
    console.log("Conversation fetch error: ", error.message);
    return res.json({ status: 500, message: "failed to fetch conversations" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: "conversationId and content are required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const userMessage = await Message.create({
      conversationId,
      userId: req.user.id,
      role: "user",
      content,
    });

    // build context for AI response
    const context = await buildConversationContext({
      conversationId,
      userId: req.user.id,
      currentMessage: content,
      systemPrompt: `
You are a helpful AI assistant.

Guidelines:
- Be concise and accurate.
- Use previous conversation context.
- Be polite and conversational.
- If unsure, say you don't know.
`,
    });

    const aiResult = await generateAIResponse({
      messages: context,
    });

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: aiResult.error,
      });
    }

    const assistantMessage = await Message.create({
      conversationId,
      userId: req.user.id,
      role: "assistant",
      content: aiResult.response,
    });

    // update conversation metadata

    conversation.lastMessageAt = new Date();

    if (conversation.title === "New Chat" || !conversation.title) {
      const words = content.trim().split(/\s+/);
      const titleText = words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
      conversation.title = titleText;
    }

    await conversation.save();

    const memoryResult = await extractMemory({
      messages: context,
    });

    if (memoryResult.success && memoryResult.memory.shouldRemember) {
      try {
        const memoryText = memoryResult.memory.memory;

        // Generate embedding vector
        const embedding = await generateEmbedding(memoryText);

        await Memory.create({
          userId: req.user.id,

          text: memoryResult.memory.memory,

          category: memoryResult.memory.category,

          importance: memoryResult.memory.importance,

          embedding,

          sourceMessageId: userMessage._id,
        });
      } catch (error) {
        console.error("Memory creation error:", error);
      }
    }

    return res.status(200).json({
      success: true,

      userMessage,

      assistantMessage,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversationId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,

      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
      },

      totalMessages: messages.length,

      messages,
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { createCoversation, getCoversations, sendMessage, getMessages };
