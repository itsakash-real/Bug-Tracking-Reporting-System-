const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Service — wraps Google Gemini API for all AI operations.
 *
 * Architecture:
 *   Input → Preprocessing → Gemini API → Structured JSON → Output
 *
 * Uses gemini-2.0-flash for speed and cost-efficiency.
 * All prompts are engineered for structured JSON output to enable
 * programmatic consumption by the frontend.
 */

let genAI = null;
let model = null;

const getModel = () => {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
};

/**
 * Helper: safely parse JSON from Gemini response.
 * Gemini sometimes wraps JSON in markdown code fences.
 */
const parseJsonResponse = (text) => {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
};

/**
 * A. Bug Classification
 * Classifies a bug into categories: UI, Backend, Performance, Security, Database, Network, Other
 * Returns category + confidence + reasoning (for explainable AI)
 */
const classifyBug = async (title, description, stepsToReproduce = '') => {
  const m = getModel();

  const prompt = `You are a senior QA engineer. Classify this bug report into exactly ONE category.

Categories: UI, Backend, Performance, Security, Database, Network, Other

Bug Title: ${title}
Bug Description: ${description}
${stepsToReproduce ? `Steps to Reproduce: ${stepsToReproduce}` : ''}

Respond in this exact JSON format (no markdown, no extra text):
{
  "category": "<one of the categories above>",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<1-2 sentence explanation of WHY this category was chosen>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
}`;

  const result = await m.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
};

/**
 * C. Smart Priority Prediction
 * Predicts severity (Low/Medium/High/Critical) and priority (P1-P4)
 * with explainable reasoning.
 */
const predictPriority = async (title, description, stepsToReproduce = '', environment = '') => {
  const m = getModel();

  const prompt = `You are a senior software engineer triaging bugs. Predict the severity and priority of this bug.

Severity levels: Low, Medium, High, Critical
Priority levels: P1 (Critical), P2 (High), P3 (Medium), P4 (Low)

Severity criteria:
- Critical: System crash, data loss, security breach, blocks ALL users
- High: Major feature broken, significant user impact, no workaround
- Medium: Feature partially broken, workaround exists
- Low: Minor cosmetic issue, edge case, typo

Bug Title: ${title}
Bug Description: ${description}
${stepsToReproduce ? `Steps to Reproduce: ${stepsToReproduce}` : ''}
${environment ? `Environment: ${environment}` : ''}

Respond in this exact JSON format:
{
  "severity": "<Low|Medium|High|Critical>",
  "priority": "<P1|P2|P3|P4>",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<2-3 sentence explanation of WHY this severity/priority>",
  "factors": [
    {"factor": "<factor name>", "impact": "<positive|negative|neutral>", "explanation": "<brief>"}
  ]
}`;

  const result = await m.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
};

/**
 * D. AI Bug Summarizer
 * Converts verbose bug reports into concise, actionable summaries.
 */
const summarizeBug = async (title, description, stepsToReproduce = '', comments = []) => {
  const m = getModel();

  const commentText = comments.length
    ? comments.map((c, i) => `Comment ${i + 1}: ${c.text}`).join('\n')
    : 'No comments yet.';

  const prompt = `You are a technical writer. Create a concise summary of this bug report.

Bug Title: ${title}
Bug Description: ${description}
${stepsToReproduce ? `Steps to Reproduce: ${stepsToReproduce}` : ''}
Comments: ${commentText}

Respond in this exact JSON format:
{
  "summary": "<2-3 sentence concise summary>",
  "impact": "<1 sentence describing user/system impact>",
  "suggestedAction": "<1 sentence recommended next step>"
}`;

  const result = await m.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
};

/**
 * E. Auto Assignment Suggestion
 * Suggests the best developer based on bug category and developer expertise.
 */
const suggestAssignment = async (bugTitle, bugDescription, bugCategory, developers) => {
  const m = getModel();

  if (!developers.length) {
    return {
      suggestedDeveloperId: null,
      developerName: null,
      confidence: 0,
      reasoning: 'No developers available for assignment.',
    };
  }

  const devList = developers.map(d => ({
    id: d._id.toString(),
    name: d.name,
    expertise: d.expertise || {},
    resolvedBugs: d.resolvedBugs || 0,
  }));

  const prompt = `You are a project manager assigning bugs to developers. Choose the BEST developer.

Bug Title: ${bugTitle}
Bug Description: ${bugDescription}
Bug Category: ${bugCategory || 'Unknown'}

Available Developers:
${JSON.stringify(devList, null, 2)}

Consider:
1. Developer expertise in the bug's category
2. Number of bugs they've resolved (experience)
3. Workload balance

Respond in this exact JSON format:
{
  "suggestedDeveloperId": "<developer id from the list>",
  "developerName": "<developer name>",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<2-3 sentence explanation>"
}`;

  const result = await m.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
};

/**
 * Generate embedding for a bug report using Gemini's embedding model.
 * Used for duplicate detection via cosine similarity.
 */
const generateEmbedding = async (text) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const embeddingModel = ai.getGenerativeModel({ model: 'text-embedding-004' });

  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
};

/**
 * Full analysis — runs classification, priority prediction, and summarization
 * in parallel for a single bug. Used during bug creation for real-time insights.
 */
const fullAnalysis = async (title, description, stepsToReproduce = '', environment = '') => {
  const [classification, priority, summary] = await Promise.all([
    classifyBug(title, description, stepsToReproduce),
    predictPriority(title, description, stepsToReproduce, environment),
    summarizeBug(title, description, stepsToReproduce),
  ]);

  return { classification, priority, summary };
};

module.exports = {
  classifyBug,
  predictPriority,
  summarizeBug,
  suggestAssignment,
  generateEmbedding,
  fullAnalysis,
};
