import { Message } from "../models/message.model.js";
import { retrieveRelevantMemories } from "../services/memoryRetrieval.service.js";

const MAX_CONTEXT_MESSAGES = 10;

const DEFAULT_SYSTEM_PROMPT = `
You are a helpful AI assistant.

Guidelines:
- Be conversational and concise.
- Use previous conversation context when relevant.
- Use stored user memories when useful.
- Give personalized responses.
- Avoid repeating yourself.
`;

const fetchRecentMessages = async ({
  conversationId,
  limit = MAX_CONTEXT_MESSAGES,
}) => {
  const messages = await Message.find({
    conversationId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse();
};

const normalizeMessages = (messages) => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

const formatMemoriesForPrompt = (memories) => {
  if (!memories.length) return "";

  const memoryLines = memories.map((memory) => `- ${memory.content}`);

  return `
Relevant User Memories:
${memoryLines.join("\n")}
`;
};

const buildConversationContext = async ({
  conversationId,
  userId,
  currentMessage,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
}) => {
  // 1. Fetch recent conversation messages

  const recentMessages = await fetchRecentMessages({
    conversationId,
  });

  const formattedMessages = normalizeMessages(recentMessages);

  // 2. Retrieve relevant memories

  const relevantMemories = await retrieveRelevantMemories({
    userId,
    message: currentMessage,
    limit: 5,
  });

  const memoryContext = formatMemoriesForPrompt(relevantMemories);

  // 4. Inject memory into system prompt

  const enhancedSystemPrompt = `
${systemPrompt}

${memoryContext}
`;

  // 5. Final context

  const context = [
    {
      role: "system",
      content: enhancedSystemPrompt,
    },

    ...formattedMessages,
  ];

  return context;
};

export { buildConversationContext };
