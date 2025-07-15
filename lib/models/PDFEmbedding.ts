import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPDFEmbedding extends Document {
  pdfId: string; // <--- NEW: A unique identifier for one PDF upload
  jurisdictionId: string;
  filename: string;
  text?: string;
  embeddings?: number[];
  paragraphIndex?: number;
  originalText?: string;
  cloudinaryUrl?: string;
  pageNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PDFEmbeddingSchema = new Schema<IPDFEmbedding>(
  {
    pdfId: {
      // <--- NEW
      type: String,
      required: true,
    },
    jurisdictionId: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    text: {
      type: String,
    },
    embeddings: {
      type: [Number],
    },
    paragraphIndex: {
      type: Number,
    },
    originalText: {
      type: String,
    },
    cloudinaryUrl: {
      type: String,
    },
    pageNumber: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const PDFEmbedding: Model<IPDFEmbedding> =
  mongoose.models?.PDFEmbedding ||
  mongoose.model<IPDFEmbedding>("PDFEmbedding", PDFEmbeddingSchema);
