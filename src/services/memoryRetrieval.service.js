import { Memory } from "../models/memory.model.js";

const normalizeText = (text) => {
  return text.toLowerCase().trim();
};

//  Extract keywords from user message

const extractKeywords = (text) => {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 2);
};

// Calculate simple keyword match score

const calculateKeywordSimilarity = (memoryText, keywords) => {
  const normalizedMemory = normalizeText(memoryText);

  let matches = 0;

  for (const keyword of keywords) {
    if (normalizedMemory.includes(keyword)) {
      matches++;
    }
  }

  return matches / keywords.length;
};

const calculateRecencyScore = (createdAt) => {
  const daysOld = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);

  // memory freshness decays over 30 days
  return Math.max(0, 1 - daysOld / 30);
};

// final memory relevance score combining multiple factors
const calculateMemoryScore = ({
  similarityScore,
  importance,
  createdAt,
  accessCount = 0,
}) => {
  const normalizedImportance = importance / 10;

  const recencyScore = calculateRecencyScore(createdAt);

  const accessScore = Math.min(accessCount / 20, 1);

  return (
    similarityScore * 0.6 +
    normalizedImportance * 0.25 +
    recencyScore * 0.1 +
    accessScore * 0.05
  );
};

//   Retrieve relevant memories

const retrieveRelevantMemories = async ({ userId, message, limit = 10 }) => {
  try {
    // extract keywords from current user message
    const keywords = extractKeywords(message);

    if (!keywords.length) {
      return [];
    }

    // candiate retrieval
    const memories = await Memory.find({
      userId,
      isArchived: false,
    })
      .sort({ importance: -1 })
      .limit(100)
      .lean();

    const scoredMemories = memories
      .map((memory) => {
        const similarityScore = calculateKeywordSimilarity(
          memory.content,
          keywords,
        );

        const finalScore = calculateMemoryScore({
          similarityScore,
          importance: memory.importance,
          createdAt: memory.createdAt,
          accessCount: memory.accessCount,
        });

        return {
          ...memory,
          similarityScore,
          score: finalScore,
        };
      })
      .filter((memory) => memory.similarityScore > 0);

    // sorting by highest score
    scoredMemories.sort((a, b) => b.score - a.score);

    return scoredMemories.slice(0, limit);
  } catch (error) {
    console.error("Memory Retrieval Error:", error);
    return [];
  }
};

export { retrieveRelevantMemories };
