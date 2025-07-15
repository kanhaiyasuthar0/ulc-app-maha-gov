import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  assignedTo: string; // Sub-admin user ID
  assignedBy: string; // Admin user ID
  status: 'pending' | 'in_progress' | 'completed';
  relatedDocumentId?: string; // Optional: link to a document
  jurisdictionId?: string; // Optional: link to jurisdiction
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: String, required: true, ref: "User" },
    assignedBy: { type: String, required: true, ref: "User" },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    relatedDocumentId: { type: String, ref: "Document" },
    jurisdictionId: { type: String, ref: "Jurisdiction" },
  },
  {
    timestamps: true,
  }
);

export const Task: Model<ITask> =
  mongoose.models?.Task || mongoose.model<ITask>("Task", TaskSchema); 