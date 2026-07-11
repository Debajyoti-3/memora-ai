# Memory Pipeline (Semantic + Keyword Hybrid Search)

This document details how Memora-AI remembers personal facts and preferences about a user across conversations. 

Memora-AI employs a **Hybrid Memory Retrieval Pipeline** combining **Semantic Vector Search** (using Jina AI embeddings + MongoDB Atlas `$vectorSearch`) and **Keyword Search** (token-based word matching with stemming). This hybrid approach offers the best of both worlds: capturing conceptual meaning and synonyms while maintaining a robust exact-match keyword fallback.

---

## The Big Picture

Every time a user sends a message, the memory system goes through a 5-step lifecycle:

```
User sends message
        |
        v
1. RETRIEVE   -> Run parallel Semantic (Vector) + Keyword searches, then merge and rank results
        |
        v
2. BUILD CONTEXT -> Assemble system prompt + retrieved memories + recent chat history + new message
        |
        v
3. GENERATE   -> Send context to Gemini API, get the chat response
        |
        v
4. EXTRACT    -> Analyze conversation thread with Gemini to extract new facts
        |
        v
5. STORE      -> Generate Jina AI embedding for new facts and store them in MongoDB
```

The long-term memory system is decoupled from the chat loop: memories persist globally per user across all conversation threads, pulled dynamically into the LLM context only when relevant.

---

## Step 1: Hybrid Retrieval ([memoryRetrieval.service.js](file:///C:/Users/Asus/xCODE/memora-ai/backend/src/services/memoryRetrieval.service.js))

When a new message comes in, `retrieveRelevantMemories` runs two parallel query streams to find relevant facts:

```
                      User Message
                           |
            +--------------+--------------+
            |                             |
            v                             v
     Keyword Search                 Semantic Search
   (Extract tokens &              (Call Jina API for
   calculate match score)           query embedding)
            |                             |
            |                             v
            |                    MongoDB Atlas Vector
            |                    Search ($vectorSearch)
            |                             |
            +--------------+--------------+
                           |
                           v
                     Merge & Rank
                (Deduplicate & Score)
                           |
                           v
                Top N Relevant Memories
```

### A. Semantic Search Path (Vector Search)
1. **Query Embedding:** Memora-AI sends the user message to Jina AI's embedding endpoint (`https://api.jina.ai/v1/embeddings`) via [embedding.service.js](file:///C:/Users/Asus/xCODE/memora-ai/backend/src/services/embedding.service.js) using the **`jina-embeddings-v3`** model. The query is embedded as a **1024-dimension vector** of floating-point numbers.
2. **MongoDB Atlas `$vectorSearch`:** The embedding is queried against MongoDB Atlas using the `$vectorSearch` aggregation stage:
   - **Index:** `memory_vector_index`
   - **Path:** `embedding`
   - **Metric:** Cosine similarity
   - **Pre-filtering:** Filters search space strictly by `userId` to maintain secure user isolation.
3. **Similarity Score:** The cosine similarity score returned by Atlas (ranging from 0 to 1) is extracted via `$meta: "vectorSearchScore"`.

### B. Keyword Search Path (Word Matching)
As a fallback (e.g. if the embedding API is rate-limited or offline, or for exact terminology/proper names), a keyword search runs concurrently:
1. **Tokenization:** The user message is normalized (converted to lowercase, possessive `'s` stripped, punctuation removed).
2. **Stopwords Filtering:** Common filler words (like "the", "is", "my", "to") are stripped.
3. **Stemming:** Words are normalized using a simple stemmer (e.g., converting "categories" -> "category", "friends" -> "friend").
4. **Keyword Score:** Stored memories are scanned for matching keyword tokens. The raw similarity score is calculated as `matches / keywords.length`.

### C. Re-Ranking & Scoring Formula
Once both lists of candidate memories are fetched, they are merged and deduplicated. If a memory appears in both search results, the higher-quality vector result is preserved.

Each memory's relevance is evaluated using a composite formula to calculate its final ranking score:

$$\text{Final Score} = (\text{Similarity Score} \times 0.60) + (\text{Normalized Importance} \times 0.25) + (\text{Recency Score} \times 0.10) + (\text{Access Score} \times 0.05)$$

* **Similarity Score (60% weight):** Either the cosine similarity score (vector path) or the keyword overlap percentage (keyword path).
* **Normalized Importance (25% weight):** The 1–10 importance score assigned by Gemini during extraction, divided by 10.
* **Recency Score (10% weight):** A time-decay score. Fresh memories start at 1.0 and decay lineary to 0.0 over 30 days.
* **Access Score (5% weight):** A reinforcing score based on how frequently the memory is retrieved (capped at 20 accesses, `min(accessCount / 20, 1)`).

The merged list is sorted by this composite score, and the top matches (default: up to 10) are returned.

### D. Memory Reinforcement
To make frequently-relevant memories float to the top in the future, the retrieval service performs a bulk increment update on the returned memories:
- Increments `accessCount` by 1.
- Sets `lastAccessedAt` to the current timestamp.

---

## Step 2: Context Building ([contextBuilder.service.js](file:///C:/Users/Asus/xCODE/memora-ai/backend/src/services/contextBuilder.service.js))

This stage formats the retrieved memories into standard system guidelines. 

The context builder formats the memories list as a bulleted text block and injects it directly into the system instructions before appending the user's chat history and active message. This ensures the AI model has immediate, context-relevant facts before formulating its answer.

---

## Step 3: Response Generation ([gemini.service.js](file:///C:/Users/Asus/xCODE/memora-ai/backend/src/services/gemini.service.js))

The fully built context is passed to the Gemini model to generate a response. The model naturally references facts injected in the system prompt to customize its responses (e.g., remembering a family member's name or a technical preference).

---

## Step 4: Memory Extraction ([memoryExtraction.service.js](file:///C:/Users/Asus/xCODE/memora-ai/backend/src/services/memoryExtraction.service.js))

After the response is shown to the user, a background extraction cycle is run:
1. The recent conversation turns are sent to Gemini with a dedicated prompt that asks: *"Is there any durable personal detail, background fact, relationship, or preference worth remembering in this exchange?"*
2. Gemini returns a structured JSON payload:
   ```json
   {
     "shouldRemember": true,
     "memory": "User prefers coding in React and node.js.",
     "category": "preferences",
     "importance": 7
   }
   ```
3. A JSON cleanup helper strips any Markdown code blocks (e.g., ` ```json ` fences) before parsing to prevent parsing crashes.

---

## Step 5: Storage ([message.controller.js](file:///C:/Users/Asus/xCODE/memora-ai/backend/src/controllers/message.controller.js))

If `shouldRemember` is `true`, the extraction pipeline saves the new memory:
1. **Vector Embedding Generation:** The service calls `generateEmbedding` with the extracted `memory` text, generating a **1024-dimension float array** (vector) using Jina AI's `jina-embeddings-v3` model.
2. **MongoDB Insertion:** A new `Memory` document is created in MongoDB:

```json
{
  "userId": "60d5ecb8b5a7537b045eef81",
  "text": "User prefers coding in React and node.js.",
  "embedding": [0.0123, -0.0456, ..., 0.0891], // 1024 floats
  "category": "preferences",
  "importance": 7,
  "accessCount": 0,
  "lastAccessedAt": null,
  "isArchived": false,
  "sourceMessageId": "60d5ecb8b5a7537b045eef82"
}
```

This vector is now stored in MongoDB, ready for instant semantic retrieval in future conversations.

---

## MongoDB Atlas Vector Search Index Configuration

To support semantic search, MongoDB Atlas requires a vector search index (`memory_vector_index`) defined on the `memories` collection:

```json
{
  "fields": [
    {
      "type": "knnVector",
      "path": "embedding",
      "dimensions": 1024,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

- **`knnVector`:** Specifies the vector search settings, mapping the `embedding` field with `1024` dimensions and the `cosine` metric.
- **`filter`:** Defines index fields that can be used for pre-filtering (specifically isolating queries by `userId`).