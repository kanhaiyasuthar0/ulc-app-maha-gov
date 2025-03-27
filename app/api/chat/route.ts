import OpenAI from "openai";
import { PDFEmbedding } from "@/lib/models/PDFEmbedding";
import { connectToDatabase } from "@/lib/db";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "@langchain/openai";

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

/**
 * Advanced semantic search with multilingual support
 */
async function semanticSearch(
  query: string,
  jurisdictionId: string,
  topK: number = 10,
  minSimilarity: number = 0.1 // Lowered threshold for more flexible matching
) {
  console.log("🚀 ~ jurisdictionId:", jurisdictionId);
  try {
    // 1. Detect language and translate query to English
    const detectedLanguage = await detectLanguage(query);
    const translatedQuery = await translateToEnglish(query, detectedLanguage);
    console.log("Detected Language:", detectedLanguage);
    console.log("Translated Query:", translatedQuery);

    // 2. Generate embedding for the translated query
    const queryEmbedding = await embeddingsModel.embedQuery(translatedQuery);
    console.log("🚀 ~ queryEmbedding:", queryEmbedding);

    // 3. Connect to MongoDB (if not already connected)
    await connectToDatabase();

    // 4. Pull all embeddings for the given jurisdiction
    const allEmbeddings = await PDFEmbedding.find({
      jurisdictionId,
    }).lean();
    console.log("🚀 ~ allEmbeddings:", allEmbeddings);

    // 5. Compute cosine similarity and rank results
    const docsWithSimilarity = allEmbeddings.map((doc) => {
      const sim = cosineSimilarity(doc.embeddings!, queryEmbedding);
      return {
        ...doc,
        similarity: sim,
        // Additional metadata for debugging and transparency
        docId: doc._id,
        filename: doc.filename,
      };
    });

    // 6. Sort by similarity descending
    docsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    console.log("🚀 ~ docsWithSimilarity:", docsWithSimilarity);

    // 7. Pick top K above minSimilarity
    const topDocs = docsWithSimilarity
      .filter((d) => d.similarity >= minSimilarity)
      .slice(0, topK);
    console.log("🚀 ~ topDocs:", topDocs);

    // If no docs pass the threshold, return an empty context
    if (topDocs.length === 0) {
      return {
        context: "",
        sources: [],
        originalQuery: query,
        translatedQuery: translatedQuery,
        detectedLanguage,
      };
    }

    // Return the context and source information
    return {
      context: topDocs.map((d) => d.text).join("\n\n"),
      sources: topDocs.map((d) => ({
        docId: d.docId,
        filename: d.filename,
        similarity: d.similarity,
        //@ts-ignore
        originalLanguage: d.originalLanguage || "unknown",
      })),
      originalQuery: query,
      translatedQuery: translatedQuery,
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

export async function POST(req: Request) {
  try {
    // Parse request body
    const { messages, jurisdictionId, language = "auto" } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Perform semantic search to find relevant context
    const {
      context,
      sources,
      originalQuery,
      translatedQuery,
      detectedLanguage,
    } = await semanticSearch(lastMessage, jurisdictionId);
    console.log("Original Query:", originalQuery);
    console.log("Translated Query:", translatedQuery);
    console.log("Context:", context);

    // 2. Build an enhanced system prompt with multilingual handling
    const systemPrompt = `You are a multilingual AI assistant specializing in jurisdiction-specific document analysis.

Language Detection:
- Detected Language: ${detectedLanguage}

Query Translation:
- Original Query: "${originalQuery}"
- Translated Query: "${translatedQuery}"

Context Guidelines:
- You have access to the following context extracted from relevant documents:
${context || "No relevant context found."}

Language Handling:
- Respond in the same language as the original user input (${detectedLanguage})
- If no context is found, acknowledge this transparently

Contextual Response Instructions:
- Use the provided context to formulate your response
- If the context is insufficient or irrelevant, explain why
- Provide a helpful and informative response
- Include relevant emojis to enhance engagement

Sources Referenced: ${sources
      .map(
        (s) =>
          `\n- ${s.filename} (Relevance: ${(s.similarity * 100).toFixed(
            2
          )}%, Language: ${s.originalLanguage})`
      )
      .join("")}

User's Last Message: "${lastMessage}"
`;

    // 3. Call OpenAI for the completion with enhanced multilingual capabilities
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Latest model with strong multilingual support
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1000,
    });

    // 4. Return the chat completion with additional metadata
    const content =
      response.choices[0]?.message?.content ||
      "I'm unable to provide a response based on the available context. 🤔";

    return new Response(
      JSON.stringify([
        {
          role: "assistant",
          content,
          sources: sources, // Include source information
          context: context ? "Relevant context found" : "No context available",
          originalQuery,
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
