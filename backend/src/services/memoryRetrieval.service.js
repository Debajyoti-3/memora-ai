import { Memory } from "../models/memory.model.js";

const STOPWORDS = [
  "the",
  "is",
  "am",
  "are",
  "with",
  "my",
  "me",
  "and",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "for",
  "at",
  "this",
  "that",
  "it",
  "be",
  "was",
  "were",
];
const normalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
};

//  Extract keywords from user message

const extractKeywords = (text) => {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => !STOPWORDS.includes(word));
};

// Calculate simple keyword match score

const calculateKeywordSimilarity = (memoryText, keywords) => {
  if (!memoryText) return 0;
  const normalizedMemory = normalizeText(memoryText);
  const memoryWords = normalizedMemory.split(/\s+/);

  let matches = 0;

  for (const keyword of keywords) {
    if (memoryWords.includes(keyword)) {
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
    if (!message || typeof message !== "string") return [];
    const keywords = extractKeywords(message);

    if (!keywords.length) {
      return [];
    }

    // candiate retrieval
    const memories = await Memory.find({
      userId,
      isArchived: false,
    })
      .sort({ importance: -1, lastAccessedAt: -1 })
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

    const topMemories = scoredMemories.slice(0, limit);

    // Memory Reinforcement
    await Memory.updateMany(
      {
        _id: {
          $in: topMemories.map((m) => m._id),
        },
      },
      {
        $inc: { accessCount: 1 },
        $set: {
          lastAccessedAt: new Date(),
        },
      },
    );

    return topMemories;
  } catch (error) {
    console.error("Memory Retrieval Error:", error);
    return [];
  }
};

export { retrieveRelevantMemories };
