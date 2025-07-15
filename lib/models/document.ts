import mongoose, {
  Schema,
  type Document as MongooseDoc,
  type Model,
} from "mongoose";

export interface IDocument extends MongooseDoc {
  jurisdictionId: string; // Reference to the Jurisdiction
  subAdminId: string; // Reference to the User (Sub Admin)
  fileName: string;
  fileUrl: string;
  fileType: string; // e.g., 'pdf', 'doc', 'docx'
  cloudinaryPublicId?: string; // For Cloudinary management
  metadata: {
    originalName: string;
    size: number;
    uploadedAt: Date;
    pageCount?: number; // For PDFs
  };
  tags?: string[]; // Optional tags for better organization
  isActive: boolean; // To soft delete documents
  status?: 'processing' | 'ready' | 'failed'; // Track processing state
}

const DocumentSchema = new Schema<IDocument>(
  {
    jurisdictionId: {
      type: String,
      required: [true, "Jurisdiction is required"],
      ref: "Jurisdiction",
    },
    subAdminId: {
      type: String,
      required: [true, "Sub Admin is required"],
      ref: "User",
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
      enum: ["pdf", "doc", "docx", "txt"],
    },
    cloudinaryPublicId: {
      type: String,
    },
    metadata: {
      originalName: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      pageCount: {
        type: Number,
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
  },
  {
    timestamps: true,
  }
);

// Soft delete method
DocumentSchema.methods.softDelete = function () {
  this.isActive = false;
  return this.save();
};

// Query helper to only show active documents
//@ts-expect-error

DocumentSchema.query.active = function () {
  //@ts-expect-error

  return this.where({ isActive: true });
};

// Check if the model is already defined to prevent overwriting during hot reloads
export const DocumentModel: Model<IDocument> =
  mongoose.models?.Document ||
  mongoose.model<IDocument>("Document", DocumentSchema);
