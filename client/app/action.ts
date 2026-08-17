"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { VaultModel } from "@/models/Vault";
import { DocumentModel } from "@/models/Document";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * 1. USER AUTHENTICATION & VERIFICATION ACTIONS
 */
export async function signUpUser(
  email: string,
  password: string,
  username?: string,
  phone?: string,
  dob?: string
) {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: "User already exists with this email." };
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    const newUser = await User.create({
      email,
      password,
      passwordHash,
      salt,
      username,
      phone,
      mobileNumber: phone,
      dob,
      dateOfBirth: dob,
      isVerified: false,
    });

    return {
      success: true,
      user: JSON.parse(JSON.stringify(newUser)),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Registration failed." };
  }
}

export async function signInUser(identifier: string, password: string) {
  try {
    await connectDB();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return { success: false, error: "Invalid credentials." };
    }

    let isValidPassword = false;
    if (user.salt && user.passwordHash) {
      const verifyHash = crypto
        .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
        .toString("hex");
      isValidPassword = verifyHash === user.passwordHash;
    } else if (user.password) {
      isValidPassword = user.password === password;
    }

    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials." };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = verificationCode;
    await user.save();

    try {
      const info = await transporter.sendMail({
        from: `"CryptaDocs Security" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your CryptaDocs Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0b0f19; color: #ffffff; border-radius: 8px;">
            <h2 style="color: #3b82f6;">CryptaDocs Sign-In Verification</h2>
            <p>Your 6-digit security code for signing in is:</p>
            <h1 style="letter-spacing: 6px; color: #60a5fa; background: #1e293b; padding: 12px; display: inline-block; border-radius: 6px;">${verificationCode}</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">If you did not attempt to sign in, please secure your account.</p>
          </div>
        `,
      });
      console.log("Sign-in email sent successfully:", info.messageId);
    } catch (emailErr: any) {
      console.error("Nodemailer Error Details:", emailErr);
      return {
        success: false,
        error: `Failed to send email: ${emailErr.message || "Check server logs"}`,
      };
    }

    return {
      success: true,
      requires2FA: true,
      email: user.email,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username || user.email.split("@")[0],
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Authentication failed." };
  }
}

export async function verifyUserCode(email: string, code: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.verificationCode !== code) {
      return { success: false, error: "Invalid verification code." };
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    return {
      success: true,
      user: JSON.parse(JSON.stringify(user)),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Verification failed." };
  }
}

/**
 * 2. PASSWORD RESET ACTIONS
 */
export async function requestPasswordReset(email: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return { success: false, error: "User not found." };

    return { success: true, message: "Verification code dispatched." };
  } catch (err) {
    return { success: false, error: "Password reset request failed." };
  }
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
) {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return { success: false, error: "User not found." };

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(newPassword, salt, 1000, 64, "sha512")
      .toString("hex");

    user.password = newPassword;
    user.salt = salt;
    user.passwordHash = passwordHash;
    await user.save();

    return { success: true };
  } catch (err) {
    return { success: false, error: "Reset failed." };
  }
}

/**
 * 3. VAULT MANAGEMENT ACTIONS
 */
export async function getVaults(userId: string) {
  try {
    await connectDB();
    const vaults = await VaultModel.find({ userId });
    return JSON.parse(JSON.stringify(vaults));
  } catch (err) {
    return [];
  }
}

export async function createVault(
  userId: string,
  name: string,
  pinHash: string,
  pinSalt: string
) {
  try {
    await connectDB();
    const vault = await VaultModel.create({ userId, name, pinHash, pinSalt });
    return { success: true, vault: JSON.parse(JSON.stringify(vault)) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create vault." };
  }
}

export async function deleteVault(vaultId: string) {
  try {
    await connectDB();
    await VaultModel.findByIdAndDelete(vaultId);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to delete vault." };
  }
}

/**
 * 4. DOCUMENT ACTIONS
 */
export async function getDocumentsByVaultId(vaultId: string) {
  try {
    await connectDB();
    const documents = await DocumentModel.find({ vaultId });
    return JSON.parse(JSON.stringify(documents));
  } catch (err) {
    return [];
  }
}

export async function createDocument(payload: {
  vaultId: string;
  title: string;
  encryptedContent: string;
  contentHash: string;
  fileSize: string;
  mimeType?: string;
  iv: string;
}) {
  try {
    await connectDB();
    const document = await DocumentModel.create(payload);
    return { success: true, document: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save document." };
  }
}

export async function deleteDocument(documentId: string) {
  try {
    await connectDB();
    await DocumentModel.findByIdAndDelete(documentId);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to delete document." };
  }
}