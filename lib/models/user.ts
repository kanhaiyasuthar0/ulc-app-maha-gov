import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: number; // 1: Admin, 2: Sub Admin, 3: Consumer
  jurisdictions?: string[]; // Only for Sub Admins
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
    },
    role: {
      type: Number,
      required: true,
      enum: [1, 2, 3], // 1: Admin, 2: Sub Admin, 3: Consumer
      default: 3,
    },
    jurisdictions: {
      type: [String],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model is already defined to prevent overwriting during hot reloads
export const User: Model<IUser> =
  mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);
