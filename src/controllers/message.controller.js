import { Conversation } from "../models/conversation.model.js";

const createCoversation = async (req, res) => {
  try {
    const fetchedUser = req.user;

    if (!fetchedUser) {
      return res.json({
        status: 401,
        message: "user not found or unauthenticated",
      });
    }

    await Conversation.create({
      userId: fetchedUser.id,
    });

    return res.json({ message: "Conversation created successfully" });
  } catch (error) {
    console.log("Error in Conversation Creation: ", error.message);
    return res.json({ status: 500, message: "Error in Conversation Creation" });
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

    return res.josn({
      fetchedConversations,
      message: "converstions fetched successfully",
    });
  } catch (error) {
    console.log("Conversation fetch error: ", error.message);
    return res.json({ status: 500, message: "failed to fetch conversations" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

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

    // fetch recent messages

    const recentMessages = await Message.find({
      conversationId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // reverse for chronological order
    recentMessages.reverse();

    // build context
    // future LLM input

    const context = recentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // dummy AI response
    // later replace with any Gemini/OpenAI API

    const aiReply = `AI response to: "${content}"`;

    const assistantMessage = await Message.create({
      conversationId,
      userId: req.user.id,
      role: "assistant",
      content: aiReply,
    });

    conversation.lastMessageAt = new Date();

    await conversation.save();

    return res.status(200).json({
      success: true,

      userMessage,

      assistantMessage,

      contextUsed: context,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { createCoversation, getCoversations, sendMessage };
