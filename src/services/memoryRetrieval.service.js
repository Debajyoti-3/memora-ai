import { Memory } from "../models/memory.model.js";

const normalizeText = (text) => {
  return text.toLowerCase().trim();
};

//  Extract keywords from user message
//   Very basic version for Phase 1

const extractKeywords = (text) => {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 2);
};

// Calculate simple keyword match score

const calculateScore = (memoryText, keywords) => {
  const normalizedMemory = normalizeText(memoryText);

  let score = 0;

  for (const keyword of keywords) {
    if (normalizedMemory.includes(keyword)) {
      score += 1;
    }
  }

  return score;
};

//   Retrieve relevant memories

const retrieveRelevantMemories = async ({ userId, message, limit = 5 }) => {
  try {
    // extract keywords from current user message
    const keywords = extractKeywords(message);

    if (!keywords.length) {
      return [];
    }

    // fetch all memories of user
    // (Later you will optimize this)
    const memories = await Memory.find({ userId }).lean();

    const scoredMemories = memories
      .map((memory) => {
        const score = calculateScore(memory.content, keywords);

        return {
          ...memory,
          score,
        };
      })
      .filter((memory) => memory.score > 0);

    // sorting by highest score
    scoredMemories.sort((a, b) => b.score - a.score);

    // returning top memories
    return scoredMemories.slice(0, limit);
  } catch (error) {
    console.error("Memory Retrieval Error:", error);
    return [];
  }
};

export { retrieveRelevantMemories };
