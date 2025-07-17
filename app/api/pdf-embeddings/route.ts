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
import cloudinary from "cloudinary";
import { DocumentModel } from '@/lib/models/document';
// --- 1) Initialize OpenAI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddingsModel = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-large",
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

// --- 2) Extract PDF text and pages
async function extractTextAndPagesFromPdf(buffer: Buffer): Promise<{ pages: string[], fullText: string }> {
  const data = await pdfParse(buffer);
  // pdf-parse returns text and a 'numpages' property, but not page-wise text by default
  // We'll use a regex to split by page if possible (common for pdf-parse)
  // This is a best-effort approach; for more accuracy, use pdfjs directly
  const pageRegex = /\f/; // Form feed is a common page delimiter
  let pages: string[] = [];
  if (data.text.includes('\f')) {
    pages = data.text.split(pageRegex);
  } else {
    // fallback: try to split by double newlines as a rough page delimiter
    pages = data.text.split(/\n\n+/);
  }
  return { pages, fullText: data.text || "" };
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
    await connectToDatabase();

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get("pdfFile") as File | null;
    const jurisdictionId = formData.get("jurisdictionId") as string;
    const subAdminId = formData.get("subAdminId") as string | undefined;
    const sourceLanguage = formData.get("language") as string | null;

    if (!pdfFile || !jurisdictionId) {
      return NextResponse.json(
        { message: "Missing pdfFile or jurisdictionId." },
        { status: 400 }
      );
    }

    // Upload PDF to Cloudinary
    const uploadResult = await cloudinary.v2.uploader.upload_stream(
      { resource_type: "raw", folder: "pdfs" },
      async (error, result) => {
        if (error || !result) {
          throw new Error("Cloudinary upload failed");
        }
      }
    );
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = uploadResult;
    stream.end(buffer);
    const cloudinaryUrl = (await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        { resource_type: "raw", folder: "pdfs" },
        (error, result) => {
          if (error || !result) reject(error || new Error("No result from Cloudinary"));
          else resolve(result.secure_url);
        }
      ).end(buffer);
    })) as string;

    // Create Document record (status: processing)
    const document = await DocumentModel.create({
      jurisdictionId,
      subAdminId: subAdminId || 'unknown',
      fileName: pdfFile.name,
      fileUrl: cloudinaryUrl,
      fileType: 'pdf',
      metadata: {
        originalName: pdfFile.name,
        size: buffer.length,
        uploadedAt: new Date(),
      },
      status: 'processing',
    });

    let status: 'ready' | 'failed' = 'ready';
    let result = [];
    const pdfId = String(document._id);
    try {
      // Extract text and pages
      const { pages, fullText: originalText } = await extractTextAndPagesFromPdf(buffer);
      if (!originalText.trim()) {
        throw new Error('No text extracted from PDF.');
      }
      // Translate to English if needed
      const translatedText = await translateToEnglish(
        originalText,
        sourceLanguage || undefined
      );
      // Chunk by paragraph, associate with page number
      const docs: Document[] = [];
      let paraIdx = 0;
      // Use translatedText for chunking and embedding
      const translatedPages = translatedText.split(/\n\n+/);
      for (let pageNum = 0; pageNum < translatedPages.length; pageNum++) {
        const page = translatedPages[pageNum];
        const paragraphs = page.split(/\n\n+/).filter(p => p.trim().length > 0);
        for (let i = 0; i < paragraphs.length; i++) {
          const para = paragraphs[i];
          docs.push(new Document({
            pageContent: para,
            metadata: {
              originalLanguage: sourceLanguage || "auto",
              filename: pdfFile.name || "unknown.pdf",
              paragraphIndex: paraIdx,
              pageNumber: pageNum + 1,
              originalText: originalText, // Store original for reference
            },
          }));
          paraIdx++;
        }
      }
      // Generate embeddings from translated English text
      const embeddings = await embeddingsModel.embedDocuments(
        docs.map((doc) => doc.pageContent)
      );
      // Insert chunks with embeddings
      const documentsToInsert = docs.map((doc, i) => ({
        pdfId,
        jurisdictionId,
        filename: doc.metadata.filename,
        originalLanguage: doc.metadata.originalLanguage,
        text: doc.pageContent, // English chunk
        originalText: doc.metadata.originalText, // Store original
        embeddings: embeddings[i],
        cloudinaryUrl,
        paragraphIndex: doc.metadata.paragraphIndex,
        pageNumber: doc.metadata.pageNumber,
      }));
      result = await PDFEmbedding.insertMany(documentsToInsert);
      // Update document status to ready
      await DocumentModel.findByIdAndUpdate(pdfId, { status: 'ready' });
    } catch (err) {
      status = 'failed';
      await DocumentModel.findByIdAndUpdate(pdfId, { status: 'failed' });
      return NextResponse.json(
        { message: 'Error processing PDF.', details: err instanceof Error ? err.message : '' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        message: `PDF uploaded and embeddings created successfully in ${result.length} chunks.`,
        documentId: pdfId,
        status,
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
