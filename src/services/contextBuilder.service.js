import { Message } from '../models/message.model.js';

const MAX_CONTEXT_MESSAGES = 10;


const DEFAULT_SYSTEM_PROMPT = `
You are a helpful AI assistant.

Guidelines:
- Be conversational and concise.
- Use previous conversation context when relevant.
- Give direct and accurate responses.
- Avoid repeating yourself.
`;

// fetch recent conversation messages

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

// normalize DB messages
// into internal AI message format

const normalizeMessages = (messages) => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

// build final context

const buildConversationContext = async ({
  conversationId,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
}) => {
  

  const recentMessages =
    await fetchRecentMessages({
      conversationId,
    });



  const formattedMessages =
    normalizeMessages(recentMessages);

  

  const context = [
    {
      role: "system",
      content: systemPrompt,
    },

    ...formattedMessages,
  ];

  return context;
};

export { buildConversationContext };