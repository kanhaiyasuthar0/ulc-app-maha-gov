import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPDFEmbedding extends Document {
  jurisdictionId: string; // references the Jurisdiction
  filename: string; // name of the PDF file
  text?: string; // optionally store the extracted text
  embeddings?: number[]; // store the computed embeddings
  createdAt: Date;
  updatedAt: Date;
}

const PDFEmbeddingSchema = new Schema<IPDFEmbedding>(
  {
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
  },
  { timestamps: true }
);

// Check if the model is already defined to prevent overwriting during hot reloads
export const PDFEmbedding: Model<IPDFEmbedding> =
  mongoose.models?.PDFEmbedding ||
  mongoose.model<IPDFEmbedding>("PDFEmbedding", PDFEmbeddingSchema);
