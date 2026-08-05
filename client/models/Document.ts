import { Schema, model, models } from "mongoose";

const DocumentSchema = new Schema(
  {
    vaultId: { type: Schema.Types.ObjectId, ref: "Vault", required: true },
    title: { type: String, required: true },
    encryptedContent: { type: String, required: true },
    contentHash: { type: String, required: true },
    fileSize: { type: String, required: true },
    mimeType: { type: String },
    iv: { type: String, required: true },
  },
  { timestamps: true }
);

export const DocumentModel = models.Document || model("Document", DocumentSchema);