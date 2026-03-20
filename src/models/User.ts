import mongoose, { Schema, models, model } from "mongoose";

export interface IUserDocument {
  email: string;
  passwordHash: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.User || model<IUserDocument>("User", UserSchema);
