import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenAI({ apiKey });
};

export const generateEmbedding = async (text) => {
  try {
    const ai = getClient();
    
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",

      content: text,

      config: {
        outputDimensionality: 768,
      },
    });

    console.log("Embedding length:", response.embeddings[0].values.length);
    return response.embeddings[0].values;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    return [];
  }
};
