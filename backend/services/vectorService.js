/**
 * Vector Search Service — in-memory cosine similarity for duplicate bug detection.
 *
 * Architecture:
 *   New bug text → Embedding (Gemini text-embedding-004) → Cosine similarity vs stored embeddings → Ranked results
 *
 * Why not FAISS?
 *   - FAISS requires native bindings (complex deployment on Render/Railway)
 *   - For < 10,000 bugs per project, in-memory cosine similarity is fast enough (< 50ms)
 *   - MongoDB stores the embeddings; we load them per-project on demand
 *
 * Cost optimization:
 *   - Embeddings are generated once per bug and stored in MongoDB
 *   - Only re-generated if title/description changes
 *   - Project-scoped searches reduce comparison set
 */

const Bug = require('../models/Bug');
const { generateEmbedding } = require('./aiService');

/**
 * Cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 = identical.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

/**
 * Find duplicate/similar bugs using semantic similarity.
 *
 * Pipeline:
 *   1. Generate embedding for the new bug's text
 *   2. Load all bugs with embeddings from the same project
 *   3. Compute cosine similarity for each
 *   4. Return top matches above threshold
 *
 * @param {string} title - New bug title
 * @param {string} description - New bug description
 * @param {string} projectId - Project to search within
 * @param {Object} options - { threshold: 0.75, limit: 5, excludeBugId: null }
 * @returns {Object} { embedding, duplicates: [...] }
 */
const findDuplicates = async (title, description, projectId, options = {}) => {
  const {
    threshold = 0.75,
    limit = 5,
    excludeBugId = null,
  } = options;

  // 1. Generate embedding for the new bug
  const queryText = `${title}. ${description}`;
  const queryEmbedding = await generateEmbedding(queryText);

  // 2. Load existing bugs with embeddings from same project
  const filter = {
    projectId,
    embedding: { $exists: true, $ne: [] },
  };
  if (excludeBugId) {
    filter._id = { $ne: excludeBugId };
  }

  const existingBugs = await Bug.find(filter)
    .select('title description severity priority status embedding assignedTo createdAt')
    .populate('assignedTo', 'name')
    .lean();

  // 3. Compute similarity scores
  const results = existingBugs
    .map(bug => ({
      bugId: bug._id,
      title: bug.title,
      description: bug.description.substring(0, 200),
      severity: bug.severity,
      priority: bug.priority,
      status: bug.status,
      assignedTo: bug.assignedTo?.name || 'Unassigned',
      createdAt: bug.createdAt,
      similarity: cosineSimilarity(queryEmbedding, bug.embedding),
    }))
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  // 4. Flag as duplicate if similarity > 0.90
  const isDuplicate = results.some(r => r.similarity > 0.90);

  return {
    embedding: queryEmbedding,
    isDuplicate,
    duplicates: results.map(r => ({
      ...r,
      similarity: Math.round(r.similarity * 100),
      isDuplicate: r.similarity > 0.90,
    })),
  };
};

/**
 * Generate and store embedding for a bug document.
 * Called after bug creation or update of title/description.
 */
const storeBugEmbedding = async (bugId) => {
  const bug = await Bug.findById(bugId);
  if (!bug) return null;

  const text = `${bug.title}. ${bug.description}`;
  const embedding = await generateEmbedding(text);

  bug.embedding = embedding;
  await bug.save();

  return embedding;
};

module.exports = {
  cosineSimilarity,
  findDuplicates,
  storeBugEmbedding,
};
