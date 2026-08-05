"use server";

import { connectDB } from "@/lib/db";
import mongoose, { Schema, model, models } from "mongoose";

// --- MONGOOSE SCHEMAS ---

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    username: { type: String, default: "" },
    phone: { type: String, default: "" },
    dob: { type: String, default: "" },
  },
  { timestamps: true }
);

const DocumentSchema = new Schema(
  {
    title: { type: String, required: true },
    encryptedContent: { type: String, required: true },
    fileSize: { type: String, default: "1 KB" },
    contentHash: { type: String, default: "" },
    iv: { type: String, default: "" },
  },
  { timestamps: true }
);

const VaultSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    pinHash: { type: String, required: true },
    salt: { type: String, required: true },
    documents: [DocumentSchema],
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
const Vault = models.Vault || model("Vault", VaultSchema);

// --- SERVER ACTIONS ---

export async function signUpUser(
  email: string, 
  passwordHash: string, 
  username?: string, 
  phone?: string, 
  dob?: string
) {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser = await User.create({
      email,
      passwordHash,
      username: username || email.split("@")[0],
      phone: phone || "",
      dob: dob || "",
    });

    return { 
      success: true, 
      user: { 
        id: newUser._id.toString(), 
        email: newUser.email, 
        username: newUser.username 
      } 
    };
  } catch (error: any) {
    console.error("SignUp error:", error);
    return { success: false, error: error.message || "Failed to create user." };
  }
}

export async function signInUser(email: string, passwordHash: string) {
  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.passwordHash !== passwordHash) {
      return { success: false, error: "Invalid password." };
    }

    return { 
      success: true, 
      user: { 
        id: user._id.toString(), 
        email: user.email, 
        username: user.username 
      } 
    };
  } catch (error: any) {
    console.error("SignIn error:", error);
    return { success: false, error: error.message || "Authentication failed." };
  }
}

export async function getVaults(userId: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    const vaults = await Vault.find({ userId }).lean();
    return vaults.map((v: any) => ({
      id: v._id.toString(),
      name: v.name,
      pinHash: v.pinHash,
      documents: (v.documents || []).map((d: any) => ({
        id: d._id.toString(),
        title: d.title,
        encryptedContent: d.encryptedContent,
        fileSize: d.fileSize,
        contentHash: d.contentHash,
        createdAt: d.createdAt,
      })),
    }));
  } catch (error: any) {
    console.error("getVaults error:", error);
    return [];
  }
}

export async function createVault(
  userId: string, 
  name: string, 
  pinHash: string, 
  salt: string
) {
  try {
    await connectDB();

    const newVault = await Vault.create({
      userId,
      name,
      pinHash,
      salt,
      documents: [],
    });

    return { 
      success: true, 
      vault: { 
        id: newVault._id.toString(), 
        name: newVault.name 
      } 
    };
  } catch (error: any) {
    console.error("createVault error:", error);
    return { success: false, error: error.message || "Could not create vault." };
  }
}

export async function deleteVault(vaultId: string) {
  try {
    await connectDB();

    await Vault.findByIdAndDelete(vaultId);
    return { success: true };
  } catch (error: any) {
    console.error("deleteVault error:", error);
    return { success: false, error: error.message || "Could not delete vault." };
  }
}

export async function createDocument({
  vaultId,
  title,
  encryptedContent,
  fileSize,
  contentHash,
  iv,
}: {
  vaultId: string;
  title: string;
  encryptedContent: string;
  fileSize?: string;
  contentHash?: string;
  iv?: string;
}) {
  try {
    await connectDB();

    const vault = await Vault.findById(vaultId);
    if (!vault) {
      return { success: false, error: "Vault target not found." };
    }

    vault.documents.push({
      title,
      encryptedContent,
      fileSize: fileSize || "1 KB",
      contentHash: contentHash || "",
      iv: iv || "",
    });

    await vault.save();
    return { success: true };
  } catch (error: any) {
    console.error("createDocument error:", error);
    return { success: false, error: error.message || "Could not save document." };
  }
}