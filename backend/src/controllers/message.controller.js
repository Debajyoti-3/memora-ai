import { Conversation } from "../models/conversation.model.js";
import { buildConversationContext } from "../services/contextBuilder.service.js";
import { Message } from "../models/message.model.js";
import { generateAIResponse } from "../services/gemini.service.js";
import { Memory } from "../models/memory.model.js";
import { extractMemory } from "../services/memoryExtraction.service.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { appendTurn } from "../services/stm.service.js";
import { sendError, sendSuccess, ERROR_CODES } from "../utils/apiResponse.js";

const createCoversation = async (req, res) => {
  try {
    const fetchedUser = req.user;

    if (!fetchedUser) {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_REQUIRED,
        message: "Your session has expired. Please sign in again.",
        req,
      });
    }

    const newConversation = await Conversation.create({
      userId: fetchedUser.id,
    });

    return res.status(200).json({
      success: true,
      message: "Chat session started successfully.",
      conversation: newConversation,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't start a new chat. Please try again.",
      error,
      req,
    });
  }
};

const getCoversations = async (req, res) => {
  try {
    const fetchedUser = req.user;

    if (!fetchedUser) {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_REQUIRED,
        message: "Your session has expired. Please sign in again.",
        req,
      });
    }

    const fetchedConversations = await Conversation.find({
      userId: fetchedUser.id,
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      fetchedConversations,
      message: "Chat history loaded successfully.",
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't load your chat history. Please try again.",
      error,
      req,
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!conversationId || !content || !content.trim()) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Please enter a message to send.",
        req,
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id,
    });

    if (!conversation) {
      return sendError(res, {
        statusCode: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: "This chat conversation could not be found.",
        req,
      });
    }

    const userMessage = await Message.create({
      conversationId,
      userId: req.user.id,
      role: "user",
      content,
    });
    await appendTurn(conversationId, { role: "user", content: content });

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
      const errString = String(aiResult.error || "");
      const isRateLimit =
        errString.includes("429") ||
        errString.toLowerCase().includes("quota") ||
        errString.toLowerCase().includes("resource_exhausted") ||
        errString.toLowerCase().includes("rate limit");

      if (isRateLimit) {
        return sendError(res, {
          statusCode: 429,
          code: ERROR_CODES.RATE_LIMITED,
          message:
            "We're receiving a lot of requests right now. Please try again in a minute.",
          error: aiResult.error,
          req,
        });
      }

      return sendError(res, {
        statusCode: 500,
        code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
        message:
          "The assistant couldn't generate a reply right now. Your message was saved. Please try again.",
        error: aiResult.error,
        req,
      });
    }

    await appendTurn(conversationId, {
      role: "assistant",
      content: aiResult.response,
    });

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
      const titleText =
        words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
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
          embedding,
          category: memoryResult.memory.category,
          importance: memoryResult.memory.importance,
          sourceMessageId: userMessage._id,
        });
      } catch (error) {
        console.error("Memory creation error:", error);
      }
    }

    if (!memoryResult.success) {
      console.error("Memory extraction failed:", memoryResult.error);
    }

    return res.status(200).json({
      success: true,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't process your message. Please try again.",
      error,
      req,
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
      return sendError(res, {
        statusCode: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: "This chat conversation could not be found.",
        req,
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
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't load the messages for this chat. Please try again.",
      error,
      req,
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // 1. Verify and find conversation owned by requesting user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id,
    });

    if (!conversation) {
      return sendError(res, {
        statusCode: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: "This chat conversation could not be found.",
        req,
      });
    }

    // 2. Find associated message IDs to clear extracted memories
    const messages = await Message.find({ conversationId });
    const messageIds = messages.map((m) => m._id);

    // 3. Delete associated Memory records
    if (messageIds.length > 0) {
      await Memory.deleteMany({ sourceMessageId: { $in: messageIds } });
    }

    // 4. Delete messages in thread
    await Message.deleteMany({ conversationId });

    // 5. Delete conversation record itself
    await Conversation.deleteOne({ _id: conversationId });

    return sendSuccess(res, {
      message: "Chat deleted permanently.",
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't delete this chat. Please try again.",
      error,
      req,
    });
  }
};

const renameConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Please enter a title for the chat.",
        req,
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id,
    });

    if (!conversation) {
      return sendError(res, {
        statusCode: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: "This chat conversation could not be found.",
        req,
      });
    }

    conversation.title = title.trim();
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Chat renamed successfully.",
      conversation,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't rename this chat. Please try again.",
      error,
      req,
    });
  }
};

const getUserMemories = async (req, res) => {
  try {
    const fetchedUser = req.user;

    if (!fetchedUser) {
      return sendError(res, {
        statusCode: 401,
        code: ERROR_CODES.AUTH_REQUIRED,
        message: "Your session has expired. Please sign in again.",
        req,
      });
    }

    const userMemories = await Memory.find({ userId: fetchedUser.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Memories loaded successfully.",
      memories: userMemories,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't load your saved memories. Please try again.",
      error,
      req,
    });
  }
};

const deleteMemory = async (req, res) => {
  try {
    const { memoryId } = req.params;

    if (!memoryId) {
      return sendError(res, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "A memory identifier is required.",
        req,
      });
    }

    const result = await Memory.deleteOne({
      _id: memoryId,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return sendError(res, {
        statusCode: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: "This memory could not be found.",
        req,
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Memory deleted successfully.",
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "We couldn't delete this memory. Please try again.",
      error,
      req,
    });
  }
};

export {
  createCoversation,
  getCoversations,
  sendMessage,
  getMessages,
  deleteConversation,
  renameConversation,
  getUserMemories,
  deleteMemory,
};
