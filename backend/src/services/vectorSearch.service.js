import { Memory } from "../models/memory.model.js";
import { generateEmbedding } from "./embedding.service.js";

export const vectorSearchMemories = async ({
  query,
  userId,
  limit = 5,
}) => {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Vector search pipeline
  const memories = await Memory.aggregate([
    {
      $vectorSearch: {
        index: "memory_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: limit,
        filter: {
          userId,
        },
      },
    },

    {
      $project: {
        content: 1,
        type: 1,
        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  return memories;
};