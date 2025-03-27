import { NextResponse } from "next/server";
// import { promises as fsPromises } from "fs";
import { connectToDatabase } from "@/lib/db";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { PDFEmbedding } from "@/lib/models/PDFEmbedding";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "langchain/document";
import { v4 as uuidv4 } from "uuid";
// --- 1) Initialize OpenAI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddingsModel = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-large",
});

/**
 * Language Detection using OpenAI
 * (replaces the langdetect library)
 */
async function detectLanguage(text: string): Promise<string> {
  try {
    // Skip detection for very short or empty texts
    if (text.trim().length < 10) return "en";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or whichever model you prefer
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

    // A simple whitelist of possible languages; fallback to 'en' if not recognized
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

// --- 2) Extract PDF text
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}

// --- 3) Translate text to English
async function translateToEnglish(
  text: string,
  sourceLanguage?: string
): Promise<string> {
  try {
    // If sourceLanguage wasn't passed in, detect it
    if (!sourceLanguage) {
      sourceLanguage = await detectLanguage(text);
    }

    // If it's already English, skip
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
    return text; // Fallback to original text if translation fails
  }
}

// --- 4) Comprehensive embedding creation
export async function POST(request: Request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get("pdfFile") as File | null;
    const jurisdictionId = formData.get("jurisdictionId") as string;
    const sourceLanguage = formData.get("language") as string | null; // e.g., "hi", "mr", etc.

    if (!pdfFile || !jurisdictionId) {
      return NextResponse.json(
        { message: "Missing pdfFile or jurisdictionId." },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1) Extract original text from PDF
    const originalText = await extractTextFromPdf(buffer);
    if (!originalText.trim()) {
      return NextResponse.json(
        { message: "No text extracted from PDF." },
        { status: 400 }
      );
    }

    // 2) Translate to English if needed
    const translatedText = await translateToEnglish(
      originalText,
      sourceLanguage || undefined
    );

    // 3) Use advanced text splitter for chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Split translated text into Documents
    const docs = await textSplitter.splitDocuments([
      new Document({
        pageContent: translatedText,
        metadata: {
          originalLanguage: sourceLanguage || "auto",
          filename: pdfFile.name || "unknown.pdf",
        },
      }),
    ]);

    // 4) Generate embeddings for these chunked documents
    const embeddings = await embeddingsModel.embedDocuments(
      docs.map((doc) => doc.pageContent)
    );
    const pdfId = uuidv4();

    // 5) Insert chunks with embeddings into the database
    const documentsToInsert = docs.map((doc, i) => ({
      pdfId,
      jurisdictionId,
      filename: doc.metadata.filename,
      originalLanguage: doc.metadata.originalLanguage,
      text: doc.pageContent, // English translation
      originalText, // Keep original text for reference
      embeddings: embeddings[i],
    }));

    const result = await PDFEmbedding.insertMany(documentsToInsert);

    return NextResponse.json(
      {
        message: `PDF uploaded and embeddings created successfully in ${result.length} chunks.`,
        translationDetails: {
          originalLanguage: sourceLanguage || "auto",
          translatedToEnglish: true,
        },
        pdfEmbedding: result,
        pdfId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PDF Upload Error:", error);
    return NextResponse.json(
      {
        message: "Error processing PDF.",
        details: error instanceof Error ? error.message : "",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pdf-embeddings?jurisdictionId=123
 * Returns a list of all PDF embeddings, optionally filtered by `jurisdictionId`.
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const jurisdictionId = searchParams.get("jurisdictionId");
    const query: any = {};
    if (jurisdictionId) {
      query.jurisdictionId = jurisdictionId;
    }

    // Fetch from MongoDB
    const embeddings = await PDFEmbedding.find(query).lean();

    return NextResponse.json({ embeddings }, { status: 200 });
  } catch (error) {
    console.error("GET /api/pdf-embeddings Error:", error);
    return NextResponse.json(
      { message: "Error fetching PDF embeddings.", error: String(error) },
      { status: 500 }
    );
  }
}
