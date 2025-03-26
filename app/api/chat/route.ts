import OpenAI from "openai";
import { PDFEmbedding } from "@/lib/models/PDFEmbedding";
import { connectToDatabase } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Helper to compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Perform semantic search on embeddings by:
 *  1) Generating an embedding for the query
 *  2) Pulling relevant docs from Mongo
 *  3) Calculating similarity in-memory
 *  4) Sorting and returning topK docs
 */
async function semanticSearch(
  query: string,
  jurisdictionId: string,
  topK: number = 3
) {
  // Generate embedding for the query
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  const queryVec = queryEmbedding.data[0].embedding; // array of numbers

  // 1. Connect to MongoDB (if not already connected)
  await connectToDatabase();

  // 2. Pull all embeddings for the given jurisdiction
  const allEmbeddings = await PDFEmbedding.find({
    jurisdictionId,
  }).lean();

  // 3. Compute cosine similarity in-memory
  const docsWithSimilarity = allEmbeddings.map((doc) => {
    const sim = cosineSimilarity(doc.embeddings, queryVec);
    return { ...doc, similarity: sim };
  });

  // 4. Sort by similarity descending and pick top K
  docsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
  const topDocs = docsWithSimilarity.slice(0, topK);

  // 5. Return the combined text of top matches
  return topDocs.map((d) => d.text).join("\n\n");
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const { messages, jurisdictionId } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Perform semantic search to find relevant context
    const context = await semanticSearch(lastMessage, jurisdictionId);

    // 2. Prepare a system prompt that explicitly requests Markdown + emojis
    const systemPrompt = `You are a helpful AI assistant specializing in jurisdiction-specific document analysis. 
Please provide your **answers in Markdown format**, include **emojis** and simple formatting to make your reply clear and engaging.

Use the following context extracted from relevant documents:
${context}

The user asked: "${lastMessage}"

Be sure to reference the context where helpful, and use at least a few emojis.`;

    // 3. Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    // 4. Return the chat completion text in JSON
    // Must return an array of message objects so it works with your front-end code
    const content = response.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify([
        {
          role: "assistant",
          content,
          // Provide a unique ID so React can key it properly
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
      JSON.stringify({ error: "Error processing chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
