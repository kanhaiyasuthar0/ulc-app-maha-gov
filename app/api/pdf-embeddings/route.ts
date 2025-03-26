import { NextResponse } from "next/server";
import { promises as fsPromises } from "fs";
import { connectToDatabase } from "@/lib/db";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { PDFEmbedding } from "@/lib/models/PDFEmbedding";

// --- 1) Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- 2) Extract PDF text
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}

// --- 3) Chunk text safely (approx. by char length)
function chunkTextBySize(text: string, maxLength = 6000): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxLength, text.length);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

// --- 4) Embed multiple chunks at once.
// IMPORTANT: If you have many large chunks, you may need to batch calls instead of one single call.
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: chunks, // an array of strings
  });
  // Each item in `response.data` is an embedding for one chunk
  return response.data.map((item) => item.embedding);
}

// --- 5) Route handler
export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get("pdfFile") as File | null;
    const jurisdictionId = formData.get("jurisdictionId") as string;

    if (!pdfFile || !jurisdictionId) {
      return NextResponse.json(
        { message: "Missing pdfFile or jurisdictionId." },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1) Extract text
    const text = await extractTextFromPdf(buffer);
    if (!text.trim()) {
      return NextResponse.json(
        { message: "No text extracted from PDF." },
        { status: 400 }
      );
    }

    // 2) Chunk text to avoid token limit issues
    const chunks = chunkTextBySize(text, 6000);

    // 3) Generate embeddings for all chunks
    // If you have *many* chunks, do them in small batches to avoid large requests.
    const allEmbeddings = await generateEmbeddings(chunks);

    // 4) Insert each chunk's embedding into DB
    // One record per chunk for best searching later
    const documentsToInsert = chunks.map((chunkText, i) => ({
      jurisdictionId,
      filename: pdfFile.name || "unknown.pdf",
      text: chunkText,
      embeddings: allEmbeddings[i],
    }));
    const result = await PDFEmbedding.insertMany(documentsToInsert);

    return NextResponse.json(
      {
        message: `PDF uploaded and embeddings created successfully in ${result.length} chunks.`,
        pdfEmbedding: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in PDF Embedding route:", error);

    // If error is from OpenAI
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          message: "OpenAI API Error",
          details: error.message,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { message: "Error processing PDF." },
      { status: 500 }
    );
  }
}
