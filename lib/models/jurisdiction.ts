import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IJurisdiction extends Document {
  name: string;
  subAdmins: string[]; // Array of User IDs
  createdAt: Date;
  updatedAt: Date;
}

const JurisdictionSchema = new Schema<IJurisdiction>(
  {
    name: {
      type: String,
      required: [true, "Please provide a jurisdiction name"],
      trim: true,
      unique: true,
    },
    subAdmins: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model is already defined to prevent overwriting during hot reloads
export const Jurisdiction: Model<IJurisdiction> =
  mongoose.models?.Jurisdiction ||
  mongoose.model<IJurisdiction>("Jurisdiction", JurisdictionSchema);
