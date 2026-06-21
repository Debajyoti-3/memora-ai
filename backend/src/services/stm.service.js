import  redisClient  from '../config/redis.js'

const MAX_TURNS = 10;
const TTL_SECONDS = 60 * 60; // 1 hour sliding

function key(conversationId) {
  return `stm:${conversationId}`;
}

/**
 * Append a turn to STM and trim to last MAX_TURNS.
 * @param {string} conversationId
 * @param {{role: string, content: string}} turn
 */
async function appendTurn(conversationId, turn) {
  const k = key(conversationId);

  const raw = await redisClient.get(k);
  const turns = raw ? JSON.parse(raw) : [];

  turns.push(turn);
  const trimmed = turns.slice(-MAX_TURNS);

  await redisClient.set(k, JSON.stringify(trimmed), 'EX', TTL_SECONDS);
  return trimmed;
}

/**
 * Get recent turns for a conversation. Returns [] on cache miss
 * (cold start or expired) — caller should fall back to Mongo if needed.
 * @param {string} conversationId
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
async function getRecentTurns(conversationId) {
  const raw = await redisClient.get(key(conversationId));
  return raw ? JSON.parse(raw) : [];
}

/**
 * Explicit clear, e.g. when a conversation is deleted.
 * @param {string} conversationId
 */
async function clearSTM(conversationId) {
  await redisClient.del(key(conversationId));
}

export { appendTurn, getRecentTurns, clearSTM };