# Key Terms & Concepts — Memora-AI

This document explains the core technical concepts behind Memora-AI's memory architecture, in the context of how they're actually used in this project. 

---

## 1. Token

A **token** is the basic unit of text an LLM reads and generates — not quite a word, not quite a character. Roughly, "unfriendly" might split into `un`, `friend`, `ly`. Models have a **context window** measured in tokens (e.g. "128k context" = 128,000 tokens of combined input + output it can consider at once).

**Why it matters here:** Everything Memora-AI feeds into a Gemini call — the STM sliding window, retrieved LTM memories, the system prompt — competes for the same token budget. This is *why* memory can't just be "store everything and dump it all into context": token limits (and cost, since API pricing is per-token) force retrieval to be selective rather than exhaustive. It's the fundamental constraint that makes memory *retrieval* (picking the right few memories) a harder and more interesting problem than memory *storage*.

---

## 2. Embedding

An **embedding** is a numerical representation of text — a vector (list of numbers) that captures its *meaning*, not its exact wording. Text with similar meaning produces vectors that are numerically close together in that vector space.

Example: "I live in Kolkata" and "My city is Kolkata" will have very similar embedding vectors, even though they share almost no exact words — because an embedding model captures semantics, not string overlap.

**In Memora-AI:** Every memory stored in LTM is passed through **Jina AI's `jina-embeddings-v3`** model, producing a **1024-dimension** vector, which is stored alongside the memory text in MongoDB. Jina distinguishes between `retrieval.passage` (used when *storing* a memory) and `retrieval.query` (used when *searching*) — these are two different embedding modes tuned for their respective roles, even though they use the same underlying model.

---

## 3. Vector Database / Vector Search

A **vector database** (or vector search capability layered on a regular database) stores embeddings and can efficiently find the vectors most similar to a given query vector — i.e., "find me the 5 memories whose *meaning* is closest to this question."

This is fundamentally different from a normal database query (`WHERE text = 'Kolkata'`), which only matches exact or pattern-based text.

**In Memora-AI:** MongoDB Atlas provides this via **Atlas Vector Search**, a separate subsystem from regular MongoDB queries or even Atlas's own text-search feature (Atlas Search). It runs on **HNSW** (see below), uses **cosine similarity** as the distance metric, and is queried through a distinct `$vectorSearch` aggregation stage, filtered by `userId` so users only ever retrieve their own memories.

---

## 4. Cosine Similarity

A method of measuring how similar two vectors are by looking at the **angle** between them, not their length/magnitude. Result ranges from -1 (opposite meaning) to 1 (identical meaning); values near 1 mean "very semantically similar."

**Why cosine and not just distance?** Two embeddings can point in almost the same direction (same meaning) but have different magnitudes depending on text length or phrasing. Cosine similarity ignores magnitude and only cares about direction — which is what you want when comparing *meaning*, not text length.

---

## 5. HNSW (Hierarchical Navigable Small World)

The algorithm Atlas Vector Search uses under the hood to make similarity search fast. Naively, finding the closest vector to a query means comparing it against *every single* stored vector (brute-force, O(n) — too slow at scale). HNSW instead builds a multi-layered graph structure where each vector is linked to a small number of "nearby" vectors, letting search skip through the graph and reach a good approximate answer in a fraction of the comparisons.

It's called **approximate nearest neighbor (ANN)** search because it trades a tiny bit of accuracy for a large gain in speed — practically indistinguishable from exact search at Memora-AI's data scale, but far faster as the memory collection grows.

---

## 6. Keyword Search

Traditional text search that matches based on literal words/phrases (with stemming, tokenizing, sometimes fuzzy matching), rather than meaning. Powered in Memora-AI's case by MongoDB's own text index / query matching on the `memories` collection.

**Why keep it if we have semantic search?** Keyword search is *precise*: it reliably finds exact proper nouns and numbers. Vector search, by contrast, is *fuzzy by design* — it can miss an exact name because it's optimizing for semantic closeness, not exact match. Example: a query for "Debajyoti's college roll number" might retrieve semantically related memories about "Debajyoti's college" while ranking the exact roll-number memory lower, because the embedding model doesn't treat exact digit sequences as specially important the way a keyword match does.

---

## 7. Semantic Search

Search based on **meaning** rather than exact words — implemented here via embeddings + vector search (terms 2 and 3 above). Lets the system retrieve a relevant memory even when the query's wording doesn't match the stored memory's wording at all.

---

## 8. Hybrid Retrieval

Memora-AI's actual retrieval strategy: **run vector search and keyword search in parallel** (`Promise.all`), then combine the results — deduplicating by `_id` (with vector-search hits prioritized on conflict), and applying one unified scoring function (`calculateMemoryScore`) across both result sets so they're ranked on equal footing.

**Why hybrid instead of picking one?** They fail in complementary ways — semantic search generalizes well but is weak on exact recall (names, numbers, specific facts); keyword search is precise but blind to rephrasing/synonyms. Combining them covers both failure modes. This is also a designed fallback path: if the embedding call fails (e.g. Jina API error), the system degrades gracefully to keyword-only search rather than failing the whole retrieval.


---

## 9. STM vs LTM (Short-Term / Long-Term Memory)

Mirrors the human memory analogy deliberately:

- **STM** — the last few turns of the *current* conversation, held in **Redis** as a sliding 10-turn window with a 1-hour TTL. Fast, temporary, automatically expires.
- **LTM** — durable facts extracted from conversations and stored in **MongoDB**, persisting across sessions indefinitely (until explicitly deleted via the dashboard).

The tiered design mirrors how STM is cheap-but-volatile (recency-biased, no persistence) while LTM is more expensive to write to (requires an extraction step + embedding call) but persists and is retrieved selectively.

---

## 10. Atlas Search vs Atlas Vector Search (distinct systems — common source of confusion)

Two separate MongoDB subsystems that are easy to conflate:

| | Atlas Search | Atlas Vector Search |
|---|---|---|
| Query operator | `$search` | `$vectorSearch` |
| Index format | `mappings` (JSON) | `fields` (array) |
| Underlying engine | Lucene | HNSW |
| Matches on | text/keywords | embedding similarity |

Mixing up index formats between these two is a classic hard-to-debug error — the index will silently fail to behave as expected rather than throwing an obvious error.

---

## 11. Dimensionality (of embeddings)

The length of the embedding vector — e.g. **1024 dimensions** for `jina-embeddings-v3`. More dimensions can capture more nuance but cost more to store and are slower to compare. This directly informed the choice of `v3` over `v4` in this project — `v4` doubles storage cost and the additional capability it offers (multimodal/image embeddings) isn't in current project scope.