import { Memory } from "../models/memory.model.js";
import {generateEmbedding} from "./embedding.service.js";

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
    .replace(/'s\b/g, "")       // strip possessive 's before punctuation removal
    .replace(/[^\w\s]/g, "")
    .trim();
};

const simpleStem = (word) => {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";   // categories -> category
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1); // friends -> friend, places -> place
  return word;
};

//  Extract keywords from user message

const extractKeywords = (text) => {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => !STOPWORDS.includes(word))
    .map(simpleStem);
};

// Calculate simple keyword match score

const calculateKeywordSimilarity = (memoryText, keywords) => {
  if (!memoryText) return 0;
  const normalizedMemory = normalizeText(memoryText);
  const memoryWords = normalizedMemory.split(/\s+/).map(simpleStem);

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

// ─── retrieval paths ──────────────────────────────────────────────────────────

const keywordRetrieval = async (userId, keywords, limit) => {
  // your original logic — untouched
  const memories = await Memory.find({ userId, isArchived: false })
    .sort({ importance: -1, lastAccessedAt: -1 })
    .limit(100)
    .lean();

  return memories
    .map((memory) => {
      const similarityScore = calculateKeywordSimilarity(memory.text, keywords);
      return {
        ...memory,
        similarityScore,
        score: calculateMemoryScore({
          similarityScore,
          importance: memory.importance,
          createdAt: memory.createdAt,
          accessCount: memory.accessCount,
        }),
        retrievedBy: "keyword", // tag for dedup logic
      };
    })
    .filter((m) => m.similarityScore > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const vectorRetrieval = async (userId, queryEmbedding, limit) => {
  // $vectorSearch must be the FIRST stage in the pipeline — Atlas requirement
  const results = await Memory.aggregate([
    {
      $vectorSearch: {
        index: "memory_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: limit * 10, // how many docs Atlas considers internally before returning top results
        limit: limit,             // how many it returns to us
        filter: { userId },       // only search this user's memories — requires userId filter field in index
      },
    },
    {
      // $meta: "vectorSearchScore" gives us the cosine similarity Atlas computed
      $addFields: { vectorScore: { $meta: "vectorSearchScore" } },
    },
    {
      $match: { isArchived: false },
    },
  ]);

  return results.map((memory) => ({
    ...memory,
    similarityScore: memory.vectorScore,   // cosine similarity (0-1) plugs straight into calculateMemoryScore
    score: calculateMemoryScore({
      similarityScore: memory.vectorScore,
      importance: memory.importance,
      createdAt: memory.createdAt,
      accessCount: memory.accessCount,
    }),
    retrievedBy: "vector",
  }));
};

// ─── merge & deduplicate ──────────────────────────────────────────────────────

const mergeAndRank = (vectorResults, keywordResults, limit) => {
  const seen = new Map();

  // vector results get priority — add them first
  for (const memory of vectorResults) {
    seen.set(memory._id.toString(), memory);
  }

  // keyword results fill in anything vector missed
  // if a memory appears in both, keep the vector version (higher quality score)
  for (const memory of keywordResults) {
    const id = memory._id.toString();
    if (!seen.has(id)) {
      seen.set(id, memory);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// main export 

const retrieveRelevantMemories = async ({ userId, message, limit = 10 }) => {
  try {
    if (!message || typeof message !== "string") return [];

    const keywords = extractKeywords(message);

    // run both retrievals in parallel — no reason to wait for one before starting the other
    const queryEmbedding = await generateEmbedding(message, "retrieval.query");

    const [vectorResults, keywordResults] = await Promise.all([
      // if embedding failed (empty array), skip vector search entirely
      queryEmbedding.length > 0
        ? vectorRetrieval(userId, queryEmbedding, limit)
        : Promise.resolve([]),

      // keyword search runs regardless — fallback if embedding fails
      keywords.length > 0
        ? keywordRetrieval(userId, keywords, limit)
        : Promise.resolve([]),
    ]);

    console.log(
      `Retrieval — vector: ${vectorResults.length} results, keyword: ${keywordResults.length} results`
    );

    const merged = mergeAndRank(vectorResults, keywordResults, limit);

    if (merged.length === 0) return [];

    // memory reinforcement runs on final merged set — same as before
    await Memory.updateMany(
      { _id: { $in: merged.map((m) => m._id) } },
      { $inc: { accessCount: 1 }, $set: { lastAccessedAt: new Date() } }
    );

    return merged;
  } catch (error) {
    console.error("Memory Retrieval Error:", error);
    return [];
  }
};

export { retrieveRelevantMemories };