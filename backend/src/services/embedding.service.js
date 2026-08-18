import fetch from "node-fetch";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const EMBEDDING_MODEL = "jina-embeddings-v3";
const EMBEDDING_DIMENSIONS = 1024;

const getApiKey = () => {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY is not set in environment");
  return apiKey;
};

export const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string" || text.trim() === "") {
    console.error("generateEmbedding: received empty or invalid text");
    return [];
  }

  try {
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: [text], // Jina expects an array
        dimensions: EMBEDDING_DIMENSIONS,
        task: "retrieval.passage", // use retrieval.query when embedding a search query
        late_chunking: false,
        embedding_type: "float",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Jina API error: ${response.status} ${response.statusText}`,
        errorBody,
      );
      return [];
    }

    const data = await response.json();

    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error(
        "generateEmbedding: unexpected response shape from Jina",
        JSON.stringify(data),
      );
      return [];
    }

    console.log(
      `Embedding generated — model: ${EMBEDDING_MODEL}, dimensions: ${embedding.length}`,
    );
    // console.log("Embedding vector:", embedding);
    return embedding;
  } catch (error) {
    console.error("generateEmbedding: network or parse error", error);
    return [];
  }
};
