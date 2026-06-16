import  { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-2.0-flash";

// convert internal format
// to Gemini format

const formatMessagesForGemini = (messages) => {
  return messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "assistant"
        ? "model"
        : "user",

      parts: [
        {
          text: msg.content,
        },
      ],
    }));
};

// extract system instruction

const extractSystemPrompt = (messages) => {
  const systemMessage = messages.find(
    (msg) => msg.role === "system"
  );

  return systemMessage?.content || "";
};

// main AI generation function

const generateAIResponse = async ({
  messages,
  temperature = 0.7,
  maxOutputTokens = 500,
}) => {
  try {
    const systemInstruction =
      extractSystemPrompt(messages);

    const contents =
      formatMessagesForGemini(messages);

    const response =
      await ai.models.generateContent({
        model: MODEL_NAME,

        contents,

        config: {
          systemInstruction,

          temperature,

          maxOutputTokens,
        },
      });

    return {
      success: true,

      response: response.text(),
    };
  } catch (error) {
    console.error(
      "GEMINI SERVICE ERROR:",
      error
    );

    return {
      success: false,

      error:
        error?.message ||
        "Failed to generate AI response",
    };
  }
};

export {generateAIResponse}