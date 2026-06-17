# Known Issues & Fixes

A running log of bugs found during development, how they were diagnosed, and how they were fixed. The point of this file isn't just "what broke" — it's "how did we figure out *where* it broke," since that debugging process is often more valuable to document than the final fix itself.

Newest entries at the top.

---

## Issue Log

### #2 — Memory retrieval reading wrong field name (`content` vs `text`)

**Symptom:** Even after memories existed in MongoDB, `retrieveRelevantMemories` always returned an empty array — relevant memories never made it back into context.

**Root cause:** The `Memory` schema stores the memory text under the field `text`. But `memory-retrieval.service.js` was scoring similarity using `memory.content`, a field that doesn't exist on the schema:

```javascript
// wrong - "content" doesn't exist on the Memory schema
const similarityScore = calculateKeywordSimilarity(memory.content, keywords);
```

Since `memory.content` was always `undefined`, every similarity score came back `0`, and the line `.filter((memory) => memory.similarityScore > 0)` silently dropped every single memory before scoring/sorting ever ran. No error was thrown anywhere — it just looked like "no relevant memories found."

**Fix:** Use the correct field name from the schema:

```javascript
const similarityScore = calculateKeywordSimilarity(memory.text, keywords);
```

**Lesson:** Field-name mismatches between schema and service code don't throw errors in JS/Mongoose — they just silently produce `undefined`, which flows downstream and gets filtered out without complaint. Worth double-checking actual schema field names directly rather than assuming from memory, especially across files written at different times.

---

### #1 — Memory extraction silently failing due to markdown-fenced JSON

**Symptom:** The full retrieve → context → generate → extract → store pipeline appeared to run without errors, but no documents were ever appearing in the MongoDB `memories` collection. No crashes, no visible error logs — the app behaved as if memory extraction simply never had anything worth saving.

**Root cause:** `memoryExtraction.service.js` sends a prompt to Gemini asking for a strict JSON response, then runs `JSON.parse(aiResult.response)` directly. Gemini doesn't always return plain JSON — it frequently wraps it in markdown code fences:

````
```json
{ "shouldRemember": true, "memory": "...", "category": "Family", "importance": 7 }
```
````

`JSON.parse()` throws on a string that starts with `` ```json `` instead of `{`. That throw was caught by:

```javascript
catch (parseError) {
  return { success: false, error: "Failed to parse memory JSON" };
}
```

Back in the controller, the check `if (memoryResult.success && memoryResult.memory.shouldRemember)` evaluated to `false`, so the entire `Memory.create()` block was skipped — silently, every time, with no error surfaced anywhere in the request lifecycle.

**How it was found:** Added a temporary `console.log` right before the `JSON.parse` call to print the raw Gemini response. The terminal output showed the fenced JSON clearly, confirming the parse was the failure point rather than the extraction logic itself.

**Fix:** Strip markdown fences before parsing:

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

const cleaned = cleanJsonResponse(aiResult.response);
parsedMemory = JSON.parse(cleaned);
```

**Lesson:** Any time an LLM is asked to "return only JSON," assume it might still wrap the answer in formatting and defend against it — either by stripping fences before parsing, or (better, for later) using the model's structured-output / JSON-mode config if available, so the model can't return fenced text in the first place. Also: catch blocks that swallow errors without logging the *original* failing input make bugs like this nearly invisible — logging the raw input on parse failure was what actually made this fixable in minutes instead of hours.

---

## Template for New Entries

```markdown
### #N — Short description of the symptom

**Symptom:** What you actually observed (be specific — what did/didn't happen).

**Root cause:** What was actually wrong in the code, with a snippet if useful.

**How it was found:** The debugging step that actually revealed the cause (a log line, a test, a screenshot, etc).

**Fix:** The actual code change that resolved it.

**Lesson:** What this teaches about the system, the tools, or the debugging process — for future-you, or for explaining it in a viva.
```