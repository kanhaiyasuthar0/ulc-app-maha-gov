import OpenAI from "openai";
import { PDFEmbedding } from "@/lib/models/PDFEmbedding";
import { connectToDatabase } from "@/lib/db";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getVectorStore } from "@/lib/documents/vectorStore";
import type { Document as MongooseDoc } from 'mongoose';
import mongoose from 'mongoose';
interface ChunkDoc extends MongooseDoc {
  paragraphIndex?: number;
  filename?: string;
  _id: any;
  text?: string;
}

const FeedbackSchema = new mongoose.Schema({
  answerId: String,
  userQuery: String,
  feedback: String, // 'helpful' or 'not_helpful'
  createdAt: { type: Date, default: Date.now },
});
export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddingsModel = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-large", // More advanced embedding model
});

/**
 * Simple language detection using OpenAI
 */
async function detectLanguage(text: string): Promise<string> {
  try {
    // Skip detection for very short or empty texts
    if (text.trim().length < 10) return "en";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a language detection expert. Identify the language of the given text. Respond ONLY with the two-letter ISO 639-1 language code (e.g., 'en', 'hi', 'mr', 'fr').",
        },
        {
          role: "user",
          content: `Detect the language of this text:\n\n${text.slice(0, 500)}`,
        },
      ],
      max_tokens: 10,
    });

    const detectedLang =
      response.choices[0]?.message?.content?.trim().toLowerCase() || "en";
    return ["en", "hi", "mr", "fr", "es", "de", "zh", "ar"].includes(
      detectedLang
    )
      ? detectedLang
      : "en";
  } catch (error) {
    console.error("Language Detection Error:", error);
    return "en";
  }
}

/**
 * Translate text to English
 */
async function translateToEnglish(
  text: string,
  sourceLanguage?: string
): Promise<string> {
  try {
    // Skip translation if already in English or empty
    if (!text || text.trim() === "") return text;

    // Detect language if not provided
    if (!sourceLanguage) {
      sourceLanguage = await detectLanguage(text);
    }

    // Skip translation if already in English
    if (sourceLanguage === "en") return text;

    // Use OpenAI for translation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the entire text to English precisely, maintaining the original meaning and technical terminology.",
        },
        {
          role: "user",
          content: `Translate the following text from ${sourceLanguage} to English:\n\n${text}`,
        },
      ],
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text; // Fallback to original text
  }
}

async function expandQueryWithLLM(query: string): Promise<string[]> {
  // Use LLM to generate paraphrases/expansions
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates alternative phrasings for search queries. Respond with 3 alternative phrasings for the following query, as a JSON array of strings." },
        { role: "user", content: query },
      ],
      max_tokens: 200,
    });
    const content = response.choices[0]?.message?.content || "[]";
    const expansions = JSON.parse(content);
    if (Array.isArray(expansions)) {
      return [query, ...expansions];
    }
    return [query];
  } catch (e) {
    return [query];
  }
}

async function rerankWithLLM(query: string, chunks: any[]): Promise<any[]> {
  // Use LLM to rerank chunks for relevance
  try {
    const context = chunks.map((c, i) => `Chunk ${i + 1}:\n${c.text}`).join("\n\n");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that selects the most relevant chunks for a user query. Given a query and a list of text chunks, return the indices (1-based) of the 5 most relevant chunks as a JSON array." },
        { role: "user", content: `Query: ${query}\n\nChunks:\n${context}` },
      ],
      max_tokens: 50,
    });
    const content = response.choices[0]?.message?.content || "[]";
    const indices = JSON.parse(content);
    if (Array.isArray(indices)) {
      return indices
        .map((idx: number) => chunks[idx - 1])
        .filter(Boolean);
    }
    return chunks.slice(0, 5);
  } catch (e) {
    return chunks.slice(0, 5);
  }
}

async function keywordSearch(query: string, jurisdictionId: string, limit: number = 10) {
  // Simple keyword search fallback using MongoDB text index
  await connectToDatabase();
  const results = await PDFEmbedding.find({
    jurisdictionId,
    $text: { $search: query },
  }, {
    score: { $meta: "textScore" },
  })
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean();
  // Assign a fake similarity score for reranking
  return results.map((doc: any) => ({ ...doc, similarity: 0.35 }));
}

/**
 * Advanced semantic search with multilingual support
 */
async function semanticSearch(
  query: string,
  jurisdictionId: string,
  topK: number = 2, // Stricter: only top 2 chunks
  minSimilarity: number = 0.6 // Stricter: higher threshold
) {
  try {
    // 1. Detect language and translate query to English
    const detectedLanguage = await detectLanguage(query);
    const translatedQuery = await translateToEnglish(query, detectedLanguage);

    // 2. Expand query for better recall (optional, but we will only use the original for filtering)
    const expandedQueries = await expandQueryWithLLM(translatedQuery);

    // 3. Generate embedding for each expanded query
    const { client, vectorStore } = await getVectorStore();
    let allResults: any[] = [];
    for (const q of expandedQueries) {
      const embedding = await embeddingsModel.embedQuery(q);
      // 4. Use MongoDBAtlasVectorSearch for hybrid search
      const results = await vectorStore.similaritySearchVectorWithScore(
        embedding,
        20, // Retrieve more for filtering
        { jurisdictionId }
      );
      allResults = allResults.concat(
        results.map(([doc, score]: any) => ({
          ...doc,
          similarity: score,
        }))
      );
    }
    // Deduplicate by _id
    const seen = new Set();
    allResults = allResults.filter((r) => {
      if (seen.has(r._id?.toString())) return false;
      seen.add(r._id?.toString());
      return true;
    });
    // Filter by similarity threshold
    allResults = allResults.filter((d) => d.similarity >= minSimilarity);
    // If no results, fallback to keyword search
    if (allResults.length === 0) {
      const keywordResults = await keywordSearch(translatedQuery, jurisdictionId, 20);
      allResults = keywordResults;
    }
    // Sort by similarity
    allResults.sort((a, b) => b.similarity - a.similarity);

    // --- STRICT KEYWORD FILTERING ---
    // Extract main keywords from the query (ignore stopwords, case-insensitive)
    const stopwords = new Set(["the","is","at","which","on","a","an","and","or","of","to","in","for","with","by","as","from","that","this","it","be","are","was","were","has","have","had","but","not","do","does","did"]);
    const queryKeywords = translatedQuery
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !stopwords.has(w));
    function chunkHasAnyKeyword(text: string) {
      const lower = text.toLowerCase();
      return queryKeywords.some((kw) => lower.includes(kw));
    }
    allResults = allResults.filter((d) => d.text && chunkHasAnyKeyword(d.text));
    // Limit to topK
    const topDocs = allResults.slice(0, topK);
    if (topDocs.length === 0) {
      return {
        context: "",
        sources: [],
        originalQuery: query,
        translatedQuery,
        detectedLanguage,
      };
    }
    return {
      context: topDocs.map((d) => d.text).join("\n\n"),
      sources: topDocs.map((d) => ({
        docId: d._id,
        filename: d.filename,
        similarity: d.similarity,
        originalLanguage: d.originalLanguage || "unknown",
        paragraphIndex: d.paragraphIndex ?? null,
        cloudinaryUrl: d.cloudinaryUrl, // Added for PDF button
        pageNumber: d.pageNumber,       // Added for PDF button
      })),
      originalQuery: query,
      translatedQuery,
      detectedLanguage,
    };
  } catch (error) {
    console.error("Semantic Search Error:", error);
    return {
      context: "",
      sources: [],
      originalQuery: query,
      translatedQuery: query,
      detectedLanguage: "en",
    };
  }
}

/**
 * Helper to compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Helper to detect list-type queries
function isListQuery(query: string): boolean {
  return /what.*acts|list.*acts|which.*acts|all.*acts/i.test(query);
}

// Helper to extract act name from query (simple heuristic)
function extractActNameFromQuery(query: string): string | null {
  const match = query.match(/(land acquisition act|registration act|[A-Z][a-z]+ Act(,? \d{4})?)/i);
  return match ? match[0] : null;
}

// Helper to include neighboring chunks
function getChunksWithNeighbors(chunks: ChunkDoc[], allChunks: ChunkDoc[], window = 1): ChunkDoc[] {
  const indices = new Set<number>(chunks.map((c) => c.paragraphIndex ?? -1));
  const withNeighbors: ChunkDoc[] = [];
  for (const idx of indices) {
    for (let offset = -window; offset <= window; offset++) {
      const neighbor = allChunks.find(
        (c) => (c.paragraphIndex ?? -9999) === idx + offset && c.filename === chunks[0]?.filename
      );
      if (neighbor && !withNeighbors.some((c) => c._id?.toString() === neighbor._id?.toString())) {
        withNeighbors.push(neighbor);
      }
    }
  }
  return withNeighbors;
}

// Helper to detect 'mention only' context (looser)
function isMentionOnly(context: string): boolean {
  // Only fallback if context is very short (< 100 chars) and has no detail keywords
  return context.length < 100 && !/section|provision|definition|purpose|means|includes|describes|explains|applies|scope/i.test(context);
}

// Enhanced hybrid search with neighbors
async function hybridSearch(query: string, jurisdictionId: string, topK: number = 10) {
  const { client, vectorStore } = await getVectorStore();
  const embedding = await embeddingsModel.embedQuery(query);
  const vectorResults = await vectorStore.similaritySearchVectorWithScore(
    embedding,
    20,
    { jurisdictionId }
  );
  const vectorDocs = vectorResults.map(([doc, score]: any) => ({ ...doc, similarity: score }));

  await connectToDatabase();
  const keywordResults = await PDFEmbedding.find({
    jurisdictionId,
    text: { $regex: /act(s)?/i }
  }).lean();

  // Merge, deduplicate
  const allResults = [...vectorDocs, ...keywordResults];
  const seen = new Set();
  const deduped = allResults.filter(r => {
    if (seen.has(r._id?.toString())) return false;
    seen.add(r._id?.toString());
    return true;
  });
  return deduped;
}

// --- Hybrid Retrieval: Vector + BM25/Keyword ---
async function hybridRetrieve(query: string, jurisdictionId: string, topN: number = 30) {
  // 1. Vector search
  const { vectorStore } = await getVectorStore();
  const embedding = await embeddingsModel.embedQuery(query);
  const vectorResults = await vectorStore.similaritySearchVectorWithScore(
    embedding,
    topN,
    { jurisdictionId }
  );
  // Type guard for vector chunk
  function getId(doc: any) {
    return doc._id?.toString() || doc.id?.toString() || '';
  }
  function getText(doc: any) {
    return doc.text || doc.pageContent || '';
  }
  const vectorChunks = vectorResults.map(([doc, score]) => ({ ...doc, similarity: score, _id: getId(doc), text: getText(doc) }));

  // 2. BM25/keyword search (MongoDB text index)
  await connectToDatabase();
  const bm25Results = await PDFEmbedding.find(
    { $text: { $search: query }, jurisdictionId },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } }).limit(topN).lean();
  // Ensure _id and text fields
  const bm25Chunks = bm25Results.map(doc => ({ ...doc, _id: getId(doc), text: getText(doc) }));

  // 3. Merge and boost
  const bm25Ids = new Set(bm25Chunks.map(r => r._id));
  function extractKeywords(q: string) {
    const stopwords = new Set(["the","is","at","which","on","a","an","and","or","of","to","in","for","with","by","as","from","that","this","it","be","are","was","were","has","have","had","but","not","do","does","did"]);
    return q.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w && !stopwords.has(w));
  }
  function containsAnyKeyword(text: string, keywords: string[]) {
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
  }
  const keywords = extractKeywords(query);
  // Merge, boost, and filter
  let merged = vectorChunks.map(chunk => ({
    ...chunk,
    boost: bm25Ids.has(chunk._id) ? 1 : 0,
    keywordMatch: containsAnyKeyword(chunk.text, keywords) ? 1 : 0,
    combinedScore: chunk.similarity + (bm25Ids.has(chunk._id) ? 0.2 : 0) + (containsAnyKeyword(chunk.text, keywords) ? 0.2 : 0),
    pageContent: chunk.text,
    metadata: {},
  }));
  // Add BM25-only chunks
  for (const bm25 of bm25Chunks) {
    if (!merged.some(c => c._id === bm25._id)) {
      merged.push({
        _id: bm25._id,
        text: bm25.text,
        similarity: 0.35,
        boost: 0.2,
        keywordMatch: containsAnyKeyword(bm25.text, keywords) ? 1 : 0,
        combinedScore: 0.35 + 0.2 + (containsAnyKeyword(bm25.text, keywords) ? 0.2 : 0),
        pageContent: bm25.text,
        metadata: {},
      });
    }
  }
  // Filter to those containing any main keyword
  merged = merged.filter(chunk => chunk.keywordMatch);
  // Sort by combined score
  merged.sort((a, b) => b.combinedScore - a.combinedScore);
  // Use a comprehensive stopword list
  const stopwords = new Set([
    "the","is","at","which","on","a","an","and","or","of","to","in","for","with","by","as","from","that","this","it","be","are","was","were","has","have","had","but","not","do","does","did","can","you","me","about","tell","please","i","we","us","our","your","my","so","if","will","shall","may","should","would","could","what","who","when","where","why","how","all","any","more","most","some","such","no","nor","too","very","just","also","than","then","now","only","own","same","says","said","get","got","let","lets","make","made","like","use","used","using","etc"
  ]);
  const queryKeywords = extractKeywords(query).filter(w => w.length > 2);
  // Instead of requiring all keywords, require at least one meaningful keyword
  let filtered = merged.filter(chunk =>
    queryKeywords.some(kw => chunk.text && chunk.text.toLowerCase().includes(kw))
  );
  // Fallback: if no chunks, use all merged (loose match)
  if (filtered.length === 0 && queryKeywords.length > 0) {
    filtered = merged.filter(chunk =>
      queryKeywords.some(kw => chunk.text && chunk.text.toLowerCase().includes(kw.slice(0, 3)))
    );
  }
  // If still no chunks, fallback to topN merged
  if (filtered.length === 0) filtered = merged.slice(0, topN);
  // Sort by combined score
  filtered.sort((a, b) => b.combinedScore - a.combinedScore);
  return filtered;
}

// Translate text between any two languages using OpenAI
async function translateText(text: string, from: string, to: string): Promise<string> {
  if (from === to) return text;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${from} to ${to}, preserving all meaning and technical/legal terms.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 4000,
    });
    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
}

export async function PUT(req: Request) {
  try {
    const { answerId, userQuery, feedback } = await req.json();
    await connectToDatabase();
    await Feedback.create({ answerId, userQuery, feedback });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Feedback error', details: error instanceof Error ? error.message : 'Unknown error' }), { status: 500 });
  }
}

// --- FEEDBACK RETRIEVAL API ENDPOINT ---
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(100).lean();
    return new Response(JSON.stringify(feedback), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Feedback fetch error', details: error instanceof Error ? error.message : 'Unknown error' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const { messages, jurisdictionId, language = "auto" } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Hybrid retrieval and reranking
    const detectedLanguage = await detectLanguage(lastMessage);
    const translatedQuery = await translateToEnglish(lastMessage, detectedLanguage);
    const mergedChunks = await hybridRetrieve(translatedQuery, jurisdictionId, 30);
    // Rerank with LLM
    const rerankedChunks = await rerankWithLLM(translatedQuery, mergedChunks.slice(0, 20));
    const topChunks = rerankedChunks.slice(0, 5); // Use top 5 reranked chunks
    const context = topChunks.map((d) => d.text).join("\n\n");
    const sources = topChunks.map((d) => ({
      docId: d._id,
      filename: d.filename,
      similarity: d.similarity,
      paragraphIndex: d.paragraphIndex ?? null,
      pageNumber: d.pageNumber,
      cloudinaryUrl: d.cloudinaryUrl,
    }));

    // 2. Build a STRICT RAG system prompt
    const systemPrompt = `You are an AI assistant for the Urban Land Ceiling Maharashtra portal. This website is for citizens to easily ask questions about public government documents (PDFs) uploaded by government bodies, instead of manually reading the documents.

INSTRUCTIONS:
- You must ONLY answer using the provided context below.
- If the answer is not found verbatim in the context, reply: "I could not find an answer in the uploaded documents. Please try rephrasing your question or check with the relevant department."
- Do not use your own knowledge or make up any information.
- Quote the relevant text from the context in your answer.
- Always cite the filename and paragraph index (or page) for every answer.
- If the user asks a greeting or off-topic question (like 'hi', 'hello', 'how are you?'), politely explain your purpose: "Hello! I can help you with questions about government documents. Please ask your question."
- Always answer in the same language as the user. If the context is in a different language, translate the answer for the user.

Language Detection:
- Detected Language: ${detectedLanguage}

Query Translation:
- Original Query: "${lastMessage}"
- Translated Query: "${translatedQuery}"

Context Guidelines:
- You have access to the following context extracted from relevant documents:
${context || "No relevant context found."}

Sources Referenced: ${sources.map((s) => `\n- ${s.filename || 'N/A'} (Paragraph: ${s.paragraphIndex ?? 'N/A'}, Page: ${s.pageNumber ?? 'N/A'})`).join("")}

User's Last Message: "${lastMessage}"
`;

    // 3. Call OpenAI for the completion with enhanced multilingual capabilities
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1000,
    });

    // 4. Return the chat completion with additional metadata
    let content =
      response.choices[0]?.message?.content ||
      "I'm unable to provide a response based on the available context. 🤔";

    // Polite fallback for chit-chat or off-topic
    if (
      /^(hi|hello|hey|how are you|namaste|good morning|good evening|good afternoon)$/i.test(lastMessage.trim())
    ) {
      content =
        "Hello! I can help you with questions about government documents. Please ask your question.";
    }

    // Translate answer to user's language if needed
    if (detectedLanguage !== 'en') {
      content = await translateText(content, 'en', detectedLanguage);
    }

    return new Response(
      JSON.stringify([
        {
          role: "assistant",
          content,
          sources: sources, // Include source information
          context: context ? "Relevant context found" : "No context available",
          originalQuery: lastMessage,
          translatedQuery,
          detectedLanguage,
          id: Date.now().toString(),
        },
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
