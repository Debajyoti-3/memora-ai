import { Message } from "../models/message.model.js";
import { retrieveRelevantMemories } from "../services/memoryRetrieval.service.js";
import { getRecentTurns , appendTurn} from "../services/stm.service.js";

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

const fetchRecentTurnsWithFallback = async (conversationId) => {
  const stmTurns = await getRecentTurns(conversationId);

  if (stmTurns.length > 0) {
    // console.log(`Short Time Memory hit for conversation ${conversationId}`);
    return stmTurns;
  }

  // console.log(`STM miss for conversation ${conversationId}, falling back to Mongo`);

  const mongoMessages = await fetchRecentMessages({ conversationId });

  // Optionally rehydrate STM so the next request hits cache
  if (mongoMessages.length > 0) {
    await rehydrateSTM(conversationId, mongoMessages);
  }

  return mongoMessages;
};

const rehydrateSTM = async (conversationId, messages) => {
  for (const msg of messages) {
    await appendTurn(conversationId, { role: msg.role, content: msg.content });
  }
};

const formatMemoriesForPrompt = (memories) => {
  if (!memories.length) return "";

  const memoryLines = memories.map((memory) => `- ${memory.text}`);

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
  // Fetch recent conversation messages

  const recentMessages = await fetchRecentTurnsWithFallback(conversationId)

  const formattedMessages = normalizeMessages(recentMessages);

  //  Retrieve relevant memories

  const relevantMemories = await retrieveRelevantMemories({
    userId,
    message: currentMessage,
  });

  const memoryContext = formatMemoriesForPrompt(relevantMemories);

  console.log("Memory context for prompt:", memoryContext);

  //  Inject memory into system prompt

  const enhancedSystemPrompt = `
${systemPrompt}

${memoryContext}
`;

  //  Final context

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
