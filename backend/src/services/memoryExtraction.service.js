import { generateAIResponse } from "../services/gemini.service.js";

// system instruction

const MEMORY_EXTRACTION_PROMPT = `
You are an AI memory extraction system.

Your task:
Analyze the conversation and determine whether
there is useful long-term memory worth storing.

Extract ONLY durable and meaningful memories such as:
- user preferences
- interests
- personal background
- habits
- goals
- relationships
- important facts

IGNORE:
- greetings
- temporary requests
- casual filler
- generic conversation

Return ONLY valid JSON.

Format:
{
  "shouldRemember": boolean,
  "memory": string,
  "category": string,
  "importance": number
}

Rules:
- importance must be between 1 and 10
- category should be short
- if nothing important exists:
{
  "shouldRemember": false,
  "memory": "",
  "category": "",
  "importance": 0
}
`;

const extractMemory = async ({ messages }) => {
  try {
    const formattedMessages = [
      {
        role: "system",
        content: MEMORY_EXTRACTION_PROMPT,
      },

      ...messages,
    ];

    const aiResult = await generateAIResponse({
      messages: formattedMessages,

      temperature: 0.2,
    });

    if (!aiResult.success) {
      return {
        success: false,
        error: aiResult.error,
      };
    }

    const cleanJsonResponse = (raw) => {
  if (!raw || typeof raw !== "string") return raw;
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
};

    // parsing JSON safely

    let parsedMemory;
    // console.log("AI MEMORY EXTRACTION RESPONSE:", aiResult.response);

    try {
      const cleaned = cleanJsonResponse(aiResult.response);
      parsedMemory = JSON.parse(cleaned);
    } catch (parseError) {
       console.error("MEMORY JSON PARSE FAILED. Raw response was:", aiResult.response);
      return {
        success: false,
        error: "Failed to parse memory JSON",
      };
    }

    return {
      success: true,
      memory: parsedMemory,
    };
  } catch (error) {
    console.error("MEMORY EXTRACTION ERROR:", error);

    return {
      success: false,
      error: error.message || "Memory extraction failed",
    };
  }
};

export { extractMemory };
