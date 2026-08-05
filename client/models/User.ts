import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String },
    dateOfBirth: { type: String },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = models.User || model("User", UserSchema);