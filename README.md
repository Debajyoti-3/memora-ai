# Memora AI — Your Context-Aware Thinking Partner

Memora AI is a context-aware chatbot designed for deep work. Unlike typical chatbot platforms that treat each new session as a blank slate, Memora actively parses your messages, extracts key preferences or background facts, stores them in a MongoDB database, and dynamically builds them back into context queries. 

---

## Architectural Overview

Memora AI separates **chat history** from **long-term memory stores**. Memory isn't bound to individual chat threads; it is stored as discrete preference snippets linked to the user's account and retrieved contextually across any chat session.

```mermaid
graph TD
    User([User Sends Message]) --> Step1[1. Retrieve: Check Redis Cache for memories]
    Step1 --> CacheDecision{Cache Hit?}
    CacheDecision -- Yes --> Step2[2. Build Context: System prompt + relevant memories + chat history]
    CacheDecision -- No --> MongoStep[Query MongoDB LTM & Populate Redis Cache]
    MongoStep --> Step2
    Step2 --> Step3[3. Generate Reply via Gemini 2.5]
    Step3 --> Step4[4. Extract: Ask Gemini if facts are worth remembering]
    Step4 --> Step5{Should Remember?}
    Step5 -- Yes --> Step6[5. Store Memory in MongoDB & Invalidate Redis Cache]
    Step5 -- No --> End([End Cycle])
    Step6 --> End
```

---

## Key Features

*  **Persistent Long-Term Memory**: Automatically tracks preferences, software stacks, goals, and facts across different chat sessions.
*  **Relevance Scoring Pipeline**: Evaluates memories for relevance on every prompt using keyword matching based on:
  * **Similarity** (60% weight) - Keyword overlaps.
  * **Importance** (25% weight) - Assigned by Gemini (1–10 scale) during extraction.
  * **Recency** (10% weight) - Decay over 30 days.
  * **Access Count** (5% weight) - Bumped each time a memory is retrieved.
* **Comprehensive Privacy Policy**: Access policies detailing how database vectors, local credentials, and Google Gemini API requests are secured.
*  **Mobile-First Layout**: Fully responsive navbar, sidebars, and input overlays tested for small touchscreens.

---

##  Project Structure

* [backend/](file:///C:/Users/Asus/xCODE/memora-ai/backend) — Express server handling authentication, conversation logging, preference parsing, and Gemini API calls.
* [frontend/](file:///C:/Users/Asus/xCODE/memora-ai/frontend) — Vite React client styled with high-performance vanilla CSS variables.
* [docs/](file:///C:/Users/Asus/xCODE/memora-ai/docs) — Deep architectural files:
  * [memory-pipeline.md](file:///C:/Users/Asus/xCODE/memora-ai/docs/memory-pipeline.md): Detailed explanation of the 5-step retrieval cycle.

---

## Configuration & Environment

To run the project, you need to populate `.env` files for both frontend and backend.

### Backend Configurations
Create a [backend/.env](file:///C:/Users/Asus/xCODE/memora-ai/backend/.env) file:
```env
PORT=port_number
MONGODB_URI=your_db_uri
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend Configurations
Create a [frontend/.env](file:///C:/Users/Asus/xCODE/memora-ai/frontend/.env) or rely on Vite's default dev environment:
```env
VITE_API_URL=http://localhost:5173
```

---

##  Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB running locally or a MongoDB Atlas URI
* Docker for local Redis Setup `docker run -d --name my-redis -p 6379:6379 redis:latest`

### Installation & Run

1. **Clone & Setup Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The server runs on [http://localhost:3000](http://localhost:5000)*

2. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *The app compiles and hosts locally on [http://localhost:5173](http://localhost:5173)*

---

##  Privacy & Compliance

Memora AI incorporates user privacy indicators:
* **Account-Bound Isolation**: Memories are query-scoped to individual users.
* **Agreement Consent**: Users must review and accept the [Privacy Policy Page](file:///C:/Users/Asus/xCODE/memora-ai/frontend/src/pages/PrivacyPolicy.jsx) before submitting signup credentials.
* **Strict API Pipelines**: Transmissions to Gemini contain only current prompt context and relevant context-matched metadata (no raw passwords or session tables).
