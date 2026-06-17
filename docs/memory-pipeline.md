# Memory Pipeline (Current Version)

This document explains how Memora-AI remembers things about a user across conversations. This is the **current, working implementation** — keyword-based retrieval, no vector embeddings yet. That's a future upgrade, not part of this version.

## The Big Picture

Every time a user sends a message, five things happen in order:

```
User sends message
        |
        v
1. RETRIEVE   -> find old memories relevant to this message
        |
        v
2. BUILD CONTEXT -> combine system prompt + relevant memories + recent chat history + new message
        |
        v
3. GENERATE   -> send context to Gemini, get AI response
        |
        v
4. EXTRACT    -> ask Gemini "was anything worth remembering here?"
        |
        v
5. STORE      -> if yes, save it to MongoDB for future conversations
```

The key idea: **memory and chat are separate systems that talk to each other.** The chat doesn't "remember" anything by itself — every fact it knows about the user has to be explicitly pulled from MongoDB and stuffed into the prompt before Gemini ever sees it.

---

## Step 1: Retrieval (`memory-retrieval.service.js`)

When a new message comes in, this function looks through everything stored about that user in MongoDB and scores each memory for relevance.

**How scoring works (no AI involved — pure keyword matching):**

1. Take the user's new message, lowercase it, strip punctuation, remove common filler words (stopwords like "the", "is", "my").
2. What's left are the "keywords" — e.g. "what is my father's name" becomes `["fathers", "name"]`.
3. For every stored memory, check how many of those keywords appear in the memory's text. More matches = higher similarity score.
4. Combine that similarity score with three other factors into one final score:
   - **Similarity** (60% weight) — keyword overlap, described above
   - **Importance** (25% weight) — a 1-10 score Gemini assigned when the memory was created
   - **Recency** (10% weight) — newer memories score slightly higher; decays over 30 days
   - **Access count** (5% weight) — memories that get retrieved often score slightly higher
5. Sort by final score, return the top matches (default: top 10).
6. Bump `accessCount` and `lastAccessedAt` on whatever memories got returned, so frequently-relevant memories rise over time.

**Important limitation:** this is pure word-matching, not meaning-matching. If a memory says "User enjoys hiking" and someone asks "what outdoor activities do I like?", there's zero literal word overlap, so it won't be found. This is exactly the gap that vector embeddings (a future step) will fix.

---

## Step 2: Context Building (`contextBuilder.service.js`)

This takes the retrieved memories, the recent message history for the current conversation, and the system prompt, and assembles them into one message array shaped the way Gemini expects (`{ role, content }` objects).

This is the step that actually **closes the loop** between "a memory exists in the database" and "the AI can see it." If this step skips or mishandles retrieval, memories can exist perfectly fine in MongoDB and still never reach the model.

---

## Step 3: Generate Response (`gemini.service.js`)

The assembled context is sent to Gemini, which generates the actual reply shown to the user. Nothing memory-specific happens here — this is just the normal chat completion call.

---

## Step 4: Memory Extraction (`memoryExtraction.service.js`)

After the AI replies, a **second, separate** call is made to Gemini — this time with a different system prompt whose only job is to look at the conversation and decide if anything worth remembering long-term was said.

It's instructed to return strict JSON:

```json
{
  "shouldRemember": true,
  "memory": "User's father's name is Biswajit Mitra and he lives near Kharagpur.",
  "category": "Family",
  "importance": 7
}
```

It's told to ignore greetings, small talk, and one-off requests, and only flag durable facts — preferences, background, goals, relationships, habits.

**A real bug we hit here:** Gemini doesn't always return plain JSON — it often wraps the response in markdown code fences, like:

````
```json
{ "shouldRemember": true, ... }
```
````

A plain `JSON.parse()` call chokes on that string because it doesn't start with `{`. The fix was to strip the fences before parsing:

```javascript
const cleanJsonResponse = (raw) => {
  if (!raw || typeof raw !== "string") return raw;
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
};
```

Before this fix, extraction silently failed on almost every response — `JSON.parse` threw, the catch block returned `success: false`, and the calling code just skipped storage with no error shown anywhere. Nothing crashed, nothing logged loudly — memories just quietly never got saved. This is why visible logging at every step (not just on error) matters a lot in a pipeline like this.

---

## Step 5: Storage (`Memory.create()` in the controller)

If `shouldRemember` came back `true`, a new document is saved to MongoDB:

| Field | Meaning |
|---|---|
| `userId` | who this memory belongs to |
| `text` | the actual memory content, in plain English |
| `category` | short label like "Family", "Preference", "Goal" |
| `importance` | 1–10, set by Gemini during extraction |
| `accessCount` | how many times this memory has been retrieved (starts at 0) |
| `lastAccessedAt` | last time it was pulled into a context (starts null) |
| `isArchived` | soft-delete flag, false by default |
| `sourceMessageId` | links back to the user message that triggered this memory |

This document is now sitting in MongoDB, available to be picked up by Step 1 (Retrieval) the *next* time this user sends *any* message, in *any* conversation. That's what makes this long-term memory rather than just chat history — it's not tied to a single conversation thread.

---

## What This Version Does NOT Do Yet

- No vector embeddings / semantic search (matching by meaning, not just exact words)
- No memory consolidation (merging duplicate/similar memories over time)
- No automatic forgetting beyond the soft `isArchived` flag and recency score decay

These are the next layer to build, and are what will give this project its strongest "depth" signal for the FYP — the current version is the working scaffold they sit on top of.