import { Schema, model, models } from "mongoose";

const VaultSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    pinHash: { type: String, required: true },
    pinSalt: { type: String, required: true },
  },
  { timestamps: true }
);

export const VaultModel = models.Vault || model("Vault", VaultSchema);