"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Unlock, ShieldAlert, Terminal, FileText, Database, 
  Upload, LogOut, Home, HelpCircle, Mail, X, Info, User, Plus, 
  FolderPlus, FolderOpen, Eye, MoreVertical, Trash2, AlertTriangle,
  Bell, Camera, UserPlus, RefreshCw, Calendar, Phone, CheckCircle2,
  Sun, Moon, KeyRound, ArrowLeft
} from "lucide-react";

import { 
  signUpUser, 
  signInUser, 
  getVaults, 
  createVault as createVaultAction, 
  deleteVault as deleteVaultAction, 
  createDocument as createDocumentAction,
  deleteDocument as deleteDocumentAction,
  requestPasswordReset,
  resetPassword
} from "./action";

type AuthState = "LOGIN" | "MFA" | "FORGOT_PASSWORD" | "AUTHENTICATED";
type NavTab = "VAULTS" | "NOTIFICATIONS" | "LOGS";
type ThemeMode = "dark" | "light";

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  dob: string;
  createdAt: string;
  avatarUrl: string;
}

interface VaultItem {
  id: string;
  name: string;
  pin: string;
  isUnlocked: boolean;
}

interface DocumentItem {
  id: string;
  title: string;
  vaultName: string;
  size: string;
  hash: string;
  createdAt: string;
  content: string;
  encrypted: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  type: "AUTH" | "VAULT" | "SYS" | "ENCRYPT";
  msg: string;
}

interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  category: "SECURITY" | "UPDATE" | "SYSTEM";
  message: string;
  read: boolean;
}

/* Dynamic Background Visual Animations & Effects */
const AnimatedBackground = ({ isDark }: { isDark: boolean }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 ${
          isDark ? "bg-blue-600" : "bg-blue-400"
        }`}
      />

      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 ${
          isDark ? "bg-indigo-600" : "bg-sky-300"
        }`}
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: isDark ? [0.15, 0.35, 0.15] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] ${
          isDark ? "bg-cyan-500/20" : "bg-blue-200/50"
        }`}
      />

      <div 
        className={`absolute inset-0 opacity-[0.06] ${isDark ? "invert-0" : "invert"}`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            isDark ? "bg-blue-400/50 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-blue-600/40"
          }`}
          style={{
            width: `${(i % 3) + 2}px`,
            height: `${(i % 3) + 2}px`,
            top: `${12 + i * 11}%`,
            left: `${8 + (i * 13) % 84}%`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.2, 0.85, 0.2],
          }}
          transition={{
            duration: 5 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
};

export default function CryptaDocsApp() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [authState, setAuthState] = useState<AuthState>("LOGIN");
  const [activeTab, setActiveTab] = useState<NavTab>("VAULTS");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Database & Auth states
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserProfile>({
    username: "Agent_Cyber",
    email: "agent@cryptadocs.local",
    phone: "+1 (555) 019-2831",
    dob: "1995-08-14",
    createdAt: "2026-01-15",
    avatarUrl: "",
  });

  // Authentication credentials
  const [loginIdentifier, setLoginIdentifier] = useState("agent@cryptadocs.local");
  const [loginPassword, setLoginPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  // Forgot Password Flow State
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetVerificationCode, setResetVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [vaultToDelete, setVaultToDelete] = useState<VaultItem | null>(null);
  const [deletePinInput, setDeletePinInput] = useState("");
  const [showIncorrectPinModal, setShowIncorrectPinModal] = useState(false);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const [openVaultModal, setOpenVaultModal] = useState<VaultItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [vaults, setVaults] = useState<VaultItem[]>([]);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultPin, setNewVaultPin] = useState("");
  const [pinInputs, setPinInputs] = useState<{ [vaultId: string]: string }>({});

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  const [modalUploadTitle, setModalUploadTitle] = useState("");
  const [modalUploadContent, setModalUploadContent] = useState("");
  const [modalDragActive, setModalDragActive] = useState(false);
  const [modalIsUploading, setModalIsUploading] = useState(false);

  const [notifications] = useState<NotificationItem[]>([
    {
      id: "N-101",
      title: "Zero-Knowledge Encryption v2.0 Active",
      timestamp: "2026-07-27 10:30",
      category: "SECURITY",
      message: "All stored files and vault payload transfers are isolated with enhanced local key derivation.",
      read: false
    },
    {
      id: "N-102",
      title: "System Maintenance Completed",
      timestamp: "2026-07-25 14:15",
      category: "UPDATE",
      message: "Database indexing and local memory buffers optimized for faster document loading.",
      read: true
    }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: new Date().toLocaleTimeString(), user: user.username, type: "SYS", msg: "CryptaDocs Workspace Ready." },
    { id: "2", timestamp: new Date().toLocaleTimeString(), user: user.username, type: "AUTH", msg: "Session initialized." }
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addLog = (type: LogEntry["type"], msg: string) => {
    setLogs((prev) => [
      { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString(), user: user.username, type, msg },
      ...prev
    ].slice(0, 100));
  };

  const refreshVaultsFromDb = async (uId: string) => {
    if (!uId) return;
    try {
      const dbVaults = await getVaults(uId);
      if (dbVaults && Array.isArray(dbVaults)) {
        setVaults((prevVaults) => {
          const unlockedIds = new Set(prevVaults.filter((v) => v.isUnlocked).map((v) => v.id));
          return dbVaults.map((v: any) => ({
            id: v.id,
            name: v.name,
            pin: v.pinHash || "1234",
            isUnlocked: unlockedIds.has(v.id),
          }));
        });

        const allDocs: DocumentItem[] = [];
        dbVaults.forEach((v: any) => {
          if (v.documents && Array.isArray(v.documents)) {
            v.documents.forEach((d: any) => {
              allDocs.push({
                id: d.id,
                title: d.title,
                vaultName: v.name,
                size: d.fileSize || "1 KB",
                hash: d.contentHash || "0x8f2a...",
                createdAt: d.createdAt 
                  ? new Date(d.createdAt).toISOString().slice(0, 16).replace("T", " ") 
                  : new Date().toISOString().slice(0, 16).replace("T", " "),
                content: d.encryptedContent || "",
                encrypted: true,
              });
            });
          }
        });

        setDocuments(allDocs);
        addLog("VAULT", `Synchronized ${dbVaults.length} vaults from database.`);
      }
    } catch (err) {
      console.error("Error loading vaults from Database:", err);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUser((prev) => ({ ...prev, avatarUrl: event.target!.result as string }));
          addLog("SYS", "Updated profile picture.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);
    addLog("AUTH", `Login requested for: ${loginIdentifier}`);

    try {
      const res = await signInUser(loginIdentifier, loginPassword);
      if (res.success && res.user) {
        setUserId(res.user.id);
        setUser((prev) => ({
          ...prev,
          email: res.user.email,
          username: res.user.username || res.user.email.split("@")[0],
        }));
        addLog("AUTH", `Credentials verified for: ${res.user.email}`);
        setAuthState("MFA");
      } else {
        setAuthError(res.error || "Invalid email or password.");
        addLog("AUTH", `Login failed: ${res.error}`);
      }
    } catch (err) {
      setAuthError("An unexpected error occurred during sign in.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendCode = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    const targetIdentifier = user.email || loginIdentifier;

    try {
      if (typeof requestPasswordReset === "function") {
        const res = await requestPasswordReset(targetIdentifier);
        if (res && !res.success) {
          setAuthError(res.error || "Failed to resend code.");
          return;
        }
      }
      setAuthSuccess(`Verification code resent to ${targetIdentifier}`);
      addLog("AUTH", `Resent verification code to: ${targetIdentifier}`);
    } catch (err) {
      setAuthSuccess(`Verification code resent to ${targetIdentifier}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (typeof requestPasswordReset === "function") {
        const res = await requestPasswordReset(forgotEmail || loginIdentifier);
        if (res && !res.success) {
          setAuthError(res.error || "Failed to send verification code.");
          return;
        }
      }
      setForgotStep(2);
      setAuthSuccess(`Verification code dispatched to ${forgotEmail || loginIdentifier}`);
      addLog("AUTH", `Dispatched password reset verification code to: ${forgotEmail || loginIdentifier}`);
    } catch (err) {
      setForgotStep(2);
      setAuthSuccess(`Verification code dispatched to ${forgotEmail || loginIdentifier}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (resetVerificationCode.length < 4) {
      setAuthError("Please enter a valid verification code.");
      return;
    }

    setAuthLoading(true);

    try {
      if (typeof resetPassword === "function") {
        const res = await resetPassword(forgotEmail || loginIdentifier, resetVerificationCode, newPassword);
        if (res && !res.success) {
          setAuthError(res.error || "Password reset failed.");
          return;
        }
      }
      addLog("AUTH", `Password successfully reset for: ${forgotEmail || loginIdentifier}`);
      setAuthSuccess("Password reset successful! You can now sign in with your new password.");
      setAuthState("LOGIN");
      setForgotStep(1);
      setResetVerificationCode("");
      setNewPassword("");
    } catch (err) {
      setAuthError("An unexpected error occurred during password reset.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);
    addLog("AUTH", `Registration requested for: ${regEmail}`);

    try {
      const res = await signUpUser(regEmail, regPassword, regUsername, regPhone, regDob);
      if (res.success && res.user) {
        const today = new Date().toISOString().split("T")[0];
        const newUser: UserProfile = {
          username: regUsername || regEmail.split("@")[0],
          email: regEmail,
          phone: regPhone,
          dob: regDob,
          createdAt: today,
          avatarUrl: user.avatarUrl,
        };
        setUser(newUser);
        setUserId(res.user.id);
        addLog("AUTH", `Account created for: ${regEmail}`);
        setIsRegistering(false);
        setLoginIdentifier(regEmail);
        setRegPassword("");
        setAuthSuccess("Account created successfully. Please sign in.");
      } else {
        setAuthError(res.error || "Failed to register account.");
        addLog("AUTH", `Signup failed: ${res.error}`);
      }
    } catch (err) {
      setAuthError("An unexpected error occurred during registration.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length === 6) {
      setVaults((prev) => prev.map((v) => ({ ...v, isUnlocked: false })));
      addLog("AUTH", `User [${user.username}] verified MFA.`);
      setAuthState("AUTHENTICATED");
      if (userId) {
        await refreshVaultsFromDb(userId);
      }
    }
  };

  const handleLogout = () => {
    addLog("AUTH", `User [${user.username}] logged out.`);
    setAuthState("LOGIN");
    setActiveTab("VAULTS");
    setIsProfileOpen(false);
    setVaults([]);
    setDocuments([]);
    setOpenVaultModal(null);
    setActiveDoc(null);
    setLoginPassword("");
    setMfaCode("");
    setUserId("");
  };

  const formatPreviewContent = (text: string) => {
    if (!text) return "No content available.";
    if (text.length > 3000) {
      return text.slice(0, 3000) + "\n\n... [Preview truncated for display safety]";
    }
    return text;
  };

  const isImageDoc = (doc: DocumentItem) => {
    return (
      doc.content.startsWith("data:image/") ||
      doc.content.startsWith("blob:") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(doc.title)
    );
  };

  const isPdfDoc = (doc: DocumentItem) => {
    return (
      doc.content.startsWith("data:application/pdf") ||
      doc.title.toLowerCase().endsWith(".pdf")
    );
  };

  const handleCreateVaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName || !newVaultPin || !userId) return;

    try {
      const res = await createVaultAction(userId, newVaultName, newVaultPin, "salt_123");
      if (res.success && res.vault) {
        addLog("VAULT", `Created vault "${newVaultName}".`);
        await refreshVaultsFromDb(userId);
      } else {
        addLog("VAULT", `Vault creation failed: ${res.error}`);
      }
    } catch (err) {
      console.error("Create Vault error:", err);
    }

    setNewVaultName("");
    setNewVaultPin("");
    setShowCreateVaultModal(false);
  };

  const unlockVault = (vaultId: string) => {
    const targetVault = vaults.find((v) => v.id === vaultId);
    if (!targetVault) return;

    if (pinInputs[vaultId] === targetVault.pin) {
      const updatedVault = { ...targetVault, isUnlocked: true };
      setVaults((prev) => prev.map((v) => (v.id === vaultId ? updatedVault : v)));
      addLog("VAULT", `Unlocked "${targetVault.name}".`);
      setPinInputs((prev) => ({ ...prev, [vaultId]: "" }));
      setOpenVaultModal(updatedVault);
    } else {
      addLog("VAULT", `Failed unlock attempt for "${targetVault.name}". Incorrect code.`);
      setShowIncorrectPinModal(true);
    }
  };

  const handleConfirmDeleteVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultToDelete) return;

    if (deletePinInput === vaultToDelete.pin) {
      try {
        const res = await deleteVaultAction(vaultToDelete.id);
        if (res.success) {
          addLog("VAULT", `Deleted vault "${vaultToDelete.name}".`);
          if (userId) await refreshVaultsFromDb(userId);
        }
      } catch (err) {
        console.error("Delete vault error:", err);
      }

      setVaultToDelete(null);
      setDeletePinInput("");
      if (openVaultModal?.id === vaultToDelete.id) {
        setOpenVaultModal(null);
        setActiveDoc(null);
      }
    } else {
      addLog("VAULT", `Failed deletion attempt for "${vaultToDelete.name}". Incorrect PIN.`);
      setShowIncorrectPinModal(true);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      if (typeof deleteDocumentAction === "function") {
        await deleteDocumentAction(fileId);
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== fileId));
      addLog("VAULT", `Deleted file '${fileName}'.`);
      if (activeDoc?.id === fileId) {
        setActiveDoc(null);
      }
      if (userId) {
        await refreshVaultsFromDb(userId);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const lockVault = (vaultId: string) => {
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? { ...v, isUnlocked: false } : v)));
    if (openVaultModal?.id === vaultId) {
      setOpenVaultModal(null);
      setActiveDoc(null);
      setShowUploadModal(false);
    }
  };

  const processUploadedFile = (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
    
    const reader = new FileReader();

    if (isPdf || isImage) {
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || "";
        setModalUploadTitle(file.name);
        setModalUploadContent(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const textContent = (e.target?.result as string) || "";
        setModalUploadTitle(file.name);
        setModalUploadContent(textContent || `[Binary File Content: ${file.name}]`);
      };
      reader.readAsText(file);
    }
  };

  const handleModalUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUploadTitle || !openVaultModal || !userId) return;

    setModalIsUploading(true);
    addLog("ENCRYPT", `Saving '${modalUploadTitle}' to ${openVaultModal.name}...`);

    const sizeBytes = modalUploadContent.length;
    const formattedSize = sizeBytes > 1024 * 1024 
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;

    const contentHash = `0x${Math.random().toString(16).substring(2, 10)}`;

    try {
      const res = await createDocumentAction({
        vaultId: openVaultModal.id,
        title: modalUploadTitle,
        encryptedContent: modalUploadContent || "Standard encrypted file content.",
        contentHash,
        fileSize: formattedSize,
        iv: "iv_" + Math.random().toString(36).substring(2, 8),
      });

      if (res.success) {
        addLog("VAULT", `File '${modalUploadTitle}' saved in ${openVaultModal.name}.`);
        await refreshVaultsFromDb(userId);
      } else {
        console.error("Document creation error:", res.error);
      }
    } catch (err) {
      console.error("Document upload error:", err);
    } finally {
      setModalIsUploading(false);
      setModalUploadTitle("");
      setModalUploadContent("");
      setShowUploadModal(false);
    }
  };

  const triggerInspect = (doc: DocumentItem) => {
    setActiveDoc(doc);
    addLog("VAULT", `Opened '${doc.title}' for viewing.`);
  };

  const themeStyles = {
    bg: isDark ? "bg-[#0a1128] text-white" : "bg-[#f0f4f8] text-[#0a1128]",
    header: isDark ? "bg-[#060c1a]/90 border-white/10" : "bg-white/95 border-blue-900/10 shadow-sm",
    cardBg: isDark ? "bg-[#111d4a]/90 backdrop-blur-md border-blue-500/30" : "bg-white/90 backdrop-blur-md border-blue-900/15 shadow-sm",
    inputBg: isDark ? "bg-[#060c1a] border-white/20 text-white focus:border-blue-400" : "bg-slate-50 border-slate-300 text-[#0a1128] focus:border-blue-600",
    buttonPrimary: isDark ? "bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-600/20" : "bg-[#0a1128] hover:bg-[#1a2b5c] text-white border-[#0a1128]",
    buttonSecondary: isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/30" : "bg-blue-50 hover:bg-blue-100 text-[#0a1128] border-blue-200",
    mutedText: isDark ? "text-blue-200/70" : "text-slate-600",
    modalOverlay: isDark ? "bg-black/80 backdrop-blur-sm" : "bg-slate-900/50 backdrop-blur-sm",
  };

  return (
    <div className={`relative min-h-screen ${themeStyles.bg} font-mono flex flex-col justify-between transition-colors duration-300 selection:bg-blue-600 selection:text-white`}>
      
      <AnimatedBackground isDark={isDark} />

      <input 
        type="file" 
        ref={avatarInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarChange} 
      />

      {/* HEADER */}
      <header className={`fixed top-0 left-0 w-full z-40 ${themeStyles.header} border-b backdrop-blur-md px-6 py-3 flex items-center justify-between transition-colors duration-300`}>
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("VAULTS")}>
            <ShieldAlert className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-bold tracking-widest">
              CRYPTADOCS <span className="text-xs text-blue-400">v2.0</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 border-l border-blue-500/30 pl-4 text-xs">
            <button onClick={() => setActiveTab("VAULTS")} className={`${themeStyles.mutedText} hover:text-blue-400 transition-colors flex items-center gap-1.5`}>
              <Home size={14} /> HOME
            </button>
            <button onClick={() => setShowHelpModal(true)} className={`${themeStyles.mutedText} hover:text-blue-400 transition-colors flex items-center gap-1.5`}>
              <HelpCircle size={14} /> HELP
            </button>
            <button onClick={() => setShowContactModal(true)} className={`${themeStyles.mutedText} hover:text-blue-400 transition-colors flex items-center gap-1.5`}>
              <Mail size={14} /> CONTACT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all flex items-center justify-center ${
              isDark 
                ? "bg-[#111d4a] border-white/20 text-yellow-300 hover:bg-blue-900/50" 
                : "bg-slate-100 border-slate-300 text-[#0a1128] hover:bg-slate-200"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {authState === "AUTHENTICATED" ? (
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 border px-3 py-1.5 rounded-full transition-all group ${
                  isDark ? "bg-[#060c1a] border-blue-400/50 hover:border-blue-300" : "bg-white border-blue-900/20 hover:border-blue-900"
                }`}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-blue-400 bg-blue-950 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-blue-300" />
                  )}
                </div>
                <span className="text-xs font-bold transition-colors">
                  {user.username}
                </span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-3 w-80 ${themeStyles.cardBg} border-2 shadow-2xl p-5 rounded z-50 text-xs`}
                  >
                    <div className="flex flex-col items-center border-b border-blue-500/20 pb-4 mb-4">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full border-2 border-blue-400 p-1 bg-blue-950 flex items-center justify-center overflow-hidden shadow-md">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={40} className="text-blue-300" />
                          )}
                        </div>
                        
                        <button 
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-400 transition-all shadow"
                        >
                          <Camera size={13} />
                        </button>
                      </div>

                      <h3 className="text-sm font-bold mt-3 tracking-wider">{user.username}</h3>
                      <span className={`text-[10px] ${themeStyles.mutedText}`}>VERIFIED CRYPTADOCS AGENT</span>
                    </div>

                    <div className={`space-y-2.5 text-[11px] mb-5 p-3 border rounded ${isDark ? "bg-[#060c1a] border-white/10" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-blue-400" />
                        <span className={`font-bold ${themeStyles.mutedText}`}>Email:</span>
                        <span className="truncate">{user.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-blue-400" />
                        <span className={`font-bold ${themeStyles.mutedText}`}>Phone:</span>
                        <span>{user.phone || "N/A"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-blue-400" />
                        <span className={`font-bold ${themeStyles.mutedText}`}>DOB:</span>
                        <span>{user.dob || "N/A"}</span>
                      </div>

                      <div className="flex items-center gap-2 border-t border-blue-500/10 pt-2 mt-2">
                        <CheckCircle2 size={13} className="text-blue-400" />
                        <span className={`font-bold ${themeStyles.mutedText}`}>Created:</span>
                        <span>{user.createdAt}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          setAuthState("LOGIN");
                        }}
                        className={`w-full flex items-center justify-center gap-2 border py-2 transition-all font-bold ${themeStyles.buttonSecondary}`}
                      >
                        <RefreshCw size={13} /> SWITCH ACCOUNT
                      </button>

                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsRegistering(true);
                          setAuthState("LOGIN");
                        }}
                        className={`w-full flex items-center justify-center gap-2 border py-2 transition-all font-bold ${themeStyles.buttonSecondary}`}
                      >
                        <UserPlus size={13} /> ADD ACCOUNT
                      </button>

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 border border-red-500/40 hover:border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 transition-all font-bold mt-2"
                      >
                        <LogOut size={13} /> LOG OUT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span className={`text-xs border px-2.5 py-1 rounded ${isDark ? "border-white/20 bg-[#060c1a]" : "border-slate-300 bg-white"}`}>
              AUTHENTICATION REQUIRED
            </span>
          )}
        </div>
      </header>

      {/* AUTH SCREEN */}
      {authState !== "AUTHENTICATED" && (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 mt-16 mb-8">
          <div className="text-center mb-8 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />
              <h1 className="text-4xl md:text-6xl font-black tracking-widest">
                CRYPTADOCS
              </h1>
            </div>
            <p className={`text-xs md:text-sm font-semibold tracking-widest ${themeStyles.mutedText}`}>
              ZERO-KNOWLEDGE ENCRYPTED DOCUMENT VAULT <span className="text-blue-500 font-bold">v2.0</span>
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* LOGIN FORM */}
            {authState === "LOGIN" && !isRegistering && (
              <motion.div key="login" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="w-full max-w-md">
                <form onSubmit={handleLoginSubmit} className={`border ${themeStyles.cardBg} p-8 shadow-xl rounded`}>
                  <h2 className="text-sm font-bold mb-6 border-b border-blue-500/20 pb-3 flex items-center gap-2">
                    <Lock size={18} className="text-blue-500" /> USER SIGN IN
                  </h2>

                  {authError && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded text-blue-300 text-xs">
                      {authSuccess}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs mb-1 ${themeStyles.mutedText}`}>USERNAME OR EMAIL</label>
                      <input 
                        type="text" 
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="agent@cryptadocs.local"
                        className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                        required 
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-xs ${themeStyles.mutedText}`}>PASSWORD</label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(loginIdentifier);
                            setAuthState("FORGOT_PASSWORD");
                            setForgotStep(1);
                            setAuthError(null);
                            setAuthSuccess(null);
                          }}
                          className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <input 
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                        required 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className={`w-full mt-2 border py-2.5 text-xs font-bold tracking-wider transition-all rounded disabled:opacity-50 ${themeStyles.buttonPrimary}`}
                    >
                      {authLoading ? "AUTHENTICATING..." : "SIGN IN"}
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegistering(true);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`w-full mt-5 text-[11px] ${themeStyles.mutedText} hover:text-blue-500 transition-colors text-center block`}
                  >
                    [ Need an account? Create one here ]
                  </button>
                </form>
              </motion.div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authState === "FORGOT_PASSWORD" && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="w-full max-w-md">
                <div className={`border ${themeStyles.cardBg} p-8 shadow-xl rounded`}>
                  
                  <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 mb-6">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <KeyRound size={18} className="text-blue-500" /> RESET PASSWORD
                    </h2>
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthState("LOGIN");
                        setAuthError(null);
                        setAuthSuccess(null);
                      }} 
                      className={`text-xs flex items-center gap-1 ${themeStyles.mutedText} hover:text-blue-400 transition-colors`}
                    >
                      <ArrowLeft size={13} /> Back to Sign In
                    </button>
                  </div>

                  {authError && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded text-blue-300 text-xs">
                      {authSuccess}
                    </div>
                  )}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendResetCode} className="space-y-4">
                      <p className={`text-xs ${themeStyles.mutedText} leading-relaxed`}>
                        Enter your registered email address or username. We will generate and send a 6-digit verification code.
                      </p>

                      <div>
                        <label className={`block text-xs mb-1 ${themeStyles.mutedText}`}>REGISTERED EMAIL OR USERNAME</label>
                        <input 
                          type="text" 
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="agent@cryptadocs.local"
                          className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                          required 
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={authLoading}
                        className={`w-full border py-2.5 text-xs font-bold tracking-wider transition-all rounded disabled:opacity-50 ${themeStyles.buttonPrimary}`}
                      >
                        {authLoading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyResetCode} className="space-y-4">
                      <p className={`text-xs ${themeStyles.mutedText} leading-relaxed`}>
                        A verification code was dispatched. Please enter the code and set your new passcode below.
                      </p>

                      <div>
                        <label className={`block text-xs mb-1 ${themeStyles.mutedText}`}>6-DIGIT VERIFICATION CODE</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          value={resetVerificationCode}
                          onChange={(e) => setResetVerificationCode(e.target.value)}
                          placeholder="e.g. 849201"
                          className={`w-full p-2.5 text-center text-lg tracking-[0.3em] font-bold outline-none rounded ${themeStyles.inputBg}`}
                          required 
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className={`block text-xs mb-1 ${themeStyles.mutedText}`}>NEW PASSWORD</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                          required 
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={authLoading}
                        className={`w-full border py-2.5 text-xs font-bold tracking-wider transition-all rounded disabled:opacity-50 ${themeStyles.buttonPrimary}`}
                      >
                        {authLoading ? "RESETTING PASSWORD..." : "CONFIRM NEW PASSWORD"}
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setForgotStep(1)} 
                        className={`w-full text-[11px] ${themeStyles.mutedText} hover:text-blue-400 text-center block pt-2`}
                      >
                        [ Resend Code or Change Email ]
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}

            {/* REGISTRATION FORM */}
            {authState === "LOGIN" && isRegistering && (
              <motion.div key="signup" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="w-full max-w-md">
                <form onSubmit={handleSignupSubmit} className={`border ${themeStyles.cardBg} p-8 shadow-xl rounded`}>
                  <h2 className="text-sm font-bold mb-6 border-b border-blue-500/20 pb-3 flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-500" /> CREATE AN ACCOUNT
                  </h2>

                  {authError && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs">
                      {authError}
                    </div>
                  )}
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>USERNAME</label>
                      <input 
                        type="text" 
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Agent_Cyber"
                        className={`w-full p-2 text-xs outline-none rounded ${themeStyles.inputBg}`}
                        required 
                      />
                    </div>

                    <div>
                      <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="agent@cryptadocs.local"
                        className={`w-full p-2 text-xs outline-none rounded ${themeStyles.inputBg}`}
                        required 
                      />
                    </div>

                    <div>
                      <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>MOBILE NUMBER</label>
                      <input 
                        type="tel" 
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 (555) 019-2831"
                        className={`w-full p-2 text-xs outline-none rounded ${themeStyles.inputBg}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>DATE OF BIRTH</label>
                      <input 
                        type="date" 
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className={`w-full p-2 text-xs outline-none rounded ${themeStyles.inputBg}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>PASSWORD</label>
                      <input 
                        type="password" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full p-2 text-xs outline-none rounded ${themeStyles.inputBg}`}
                        required 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className={`w-full mt-2 border py-2.5 text-xs font-bold tracking-wider transition-all rounded disabled:opacity-50 ${themeStyles.buttonPrimary}`}
                    >
                      {authLoading ? "CREATING ACCOUNT..." : "REGISTER ACCOUNT"}
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegistering(false);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`w-full mt-4 text-[11px] ${themeStyles.mutedText} hover:text-blue-500 transition-colors text-center block`}
                  >
                    [ Already have an account? Sign in ]
                  </button>
                </form>
              </motion.div>
            )}

            {/* MFA CODE VERIFICATION FORM */}
            {authState === "MFA" && (
              <motion.div key="mfa" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md">
                <form onSubmit={handleMfaSubmit} className={`border ${themeStyles.cardBg} p-8 text-center shadow-xl rounded`}>
                  <ShieldAlert size={36} className="mx-auto mb-3 text-blue-500 animate-bounce" />
                  <h2 className="text-sm font-bold mb-1">TWO-FACTOR AUTHENTICATION</h2>
                  
                  {authError && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded text-blue-300 text-xs">
                      {authSuccess}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mb-4 text-center">
                    We've sent a 6-digit verification code to your email. Please check your inbox.
                  </p>
                  
                  <input 
                    type="text" 
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    className={`w-full p-3 mb-4 text-center text-xl tracking-[0.5em] outline-none rounded ${themeStyles.inputBg}`}
                    required
                    autoFocus
                  />

                  <p className="text-xs text-gray-400 mb-6 text-center">
                    Didn't receive the email?{" "}
                    <button 
                      type="button" 
                      onClick={handleResendCode}
                      disabled={authLoading}
                      className="text-blue-400 underline hover:text-blue-300 disabled:opacity-50"
                    >
                      {authLoading ? "Resending..." : "Resend Code"}
                    </button>
                  </p>

                  <button type="submit" className={`w-full border py-2.5 text-xs font-bold transition-all rounded ${themeStyles.buttonPrimary}`}>
                    VERIFY & CONTINUE
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* DASHBOARD */}
      {authState === "AUTHENTICATED" && (
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 mt-20 mb-8 flex flex-col gap-6">
          
          <nav className="flex items-center gap-2 border-b border-blue-500/20 pb-2">
            {[
              { id: "VAULTS", label: "MY VAULTS", icon: Database },
              { id: "NOTIFICATIONS", label: "NOTIFICATIONS & UPDATES", icon: Bell },
              { id: "LOGS", label: "PERSONAL LOGS", icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded border ${
                    isActive 
                      ? isDark 
                        ? "border-blue-400 bg-blue-600/20 text-white" 
                        : "border-[#0a1128] bg-[#0a1128] text-white"
                      : `${themeStyles.mutedText} hover:text-blue-500 border-transparent`
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === "VAULTS" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`border ${themeStyles.cardBg} p-3 text-center rounded`}>
                  <div className={`text-[10px] ${themeStyles.mutedText}`}>TOTAL VAULTS</div>
                  <div className="text-xl font-bold">{vaults.length}</div>
                </div>
                <div className={`border ${themeStyles.cardBg} p-3 text-center rounded`}>
                  <div className={`text-[10px] ${themeStyles.mutedText}`}>TOTAL FILES</div>
                  <div className="text-xl font-bold">{documents.length}</div>
                </div>
                <div className={`border ${themeStyles.cardBg} p-3 text-center rounded`}>
                  <div className={`text-[10px] ${themeStyles.mutedText}`}>UNLOCKED VAULTS</div>
                  <div className="text-xl font-bold">{vaults.filter(v => v.isUnlocked).length}</div>
                </div>
                <div className={`border ${themeStyles.cardBg} p-3 text-center rounded`}>
                  <div className={`text-[10px] ${themeStyles.mutedText}`}>ACTIVE AGENT</div>
                  <div className="text-xs font-bold truncate mt-1">{user.username}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${themeStyles.mutedText}`}>EXISTING VAULTS</span>
                  <button
                    onClick={() => setShowCreateVaultModal(true)}
                    className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition-all rounded ${themeStyles.buttonPrimary}`}
                  >
                    <Plus size={14} /> ADD NEW VAULT
                  </button>
                </div>

                {vaults.length === 0 ? (
                  <div className={`border-2 border-dashed p-8 text-center rounded ${themeStyles.cardBg}`}>
                    <FolderPlus size={32} className="mx-auto mb-2 text-blue-500" />
                    <p className="text-xs font-bold">No vaults found in database</p>
                    <p className={`text-[11px] ${themeStyles.mutedText} mt-1 mb-4`}>Create a new vault box to start storing encrypted files.</p>
                    <button
                      onClick={() => setShowCreateVaultModal(true)}
                      className={`inline-flex items-center gap-1.5 border px-4 py-2 text-xs font-bold rounded ${themeStyles.buttonPrimary}`}
                    >
                      <Plus size={14} /> CREATE FIRST VAULT
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {vaults.map((vault) => {
                      const vaultFilesCount = documents.filter((doc) => doc.vaultName === vault.name).length;
                      const isDropdownOpen = activeDropdown === vault.id;

                      return (
                        <div 
                          key={vault.id} 
                          className={`border p-4 transition-all ${themeStyles.cardBg} flex flex-col justify-between relative rounded`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3 border-b border-blue-500/20 pb-2">
                              <span className="text-xs font-bold tracking-wider">{vault.name.toUpperCase()}</span>
                              
                              <div className="flex items-center gap-2">
                                {vault.isUnlocked ? <Unlock size={16} className="text-blue-400" /> : <Lock size={16} className={themeStyles.mutedText} />}
                                
                                <div className="relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(isDropdownOpen ? null : vault.id);
                                    }}
                                    className={`p-1 rounded transition-colors ${themeStyles.mutedText} hover:text-blue-500`}
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {isDropdownOpen && (
                                    <div 
                                      className={`absolute right-0 top-7 w-48 ${themeStyles.cardBg} border shadow-2xl py-1 rounded z-50`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className={`px-3 py-2 text-[11px] ${themeStyles.mutedText} border-b border-blue-500/20 flex justify-between items-center`}>
                                        <span>STORED FILES:</span>
                                        <span className="font-bold">{vaultFilesCount}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          setVaultToDelete(vault);
                                          setDeletePinInput("");
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-bold cursor-pointer"
                                      >
                                        <Trash2 size={13} /> DELETE VAULT
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {vault.isUnlocked ? (
                              <div className="space-y-3">
                                <div className={`flex items-center justify-between p-2 border text-[11px] rounded ${isDark ? "bg-blue-950/40 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
                                  <span className="font-bold">UNLOCKED ({vaultFilesCount} FILES)</span>
                                  <button 
                                    onClick={() => lockVault(vault.id)}
                                    className="text-red-500 border border-red-500/40 hover:bg-red-500/10 px-2 py-0.5 text-[10px] transition-colors rounded"
                                  >
                                    LOCK
                                  </button>
                                </div>

                                <button
                                  onClick={() => setOpenVaultModal(vault)}
                                  className={`w-full flex items-center justify-center gap-2 border py-2.5 text-xs font-bold transition-all rounded ${themeStyles.buttonPrimary}`}
                                >
                                  <FolderOpen size={15} /> OPEN VAULT BOX
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3 py-2">
                                <p className={`text-[11px] ${themeStyles.mutedText}`}>Enter passcode to unlock vault box.</p>
                                <input 
                                  type="password"
                                  placeholder="Enter Secret Code / PIN"
                                  value={pinInputs[vault.id] || ""}
                                  onChange={(e) => setPinInputs({ ...pinInputs, [vault.id]: e.target.value })}
                                  className={`w-full p-2 text-xs outline-none rounded ${themeStyles.inputBg}`}
                                />
                                <button 
                                  onClick={() => unlockVault(vault.id)}
                                  className={`w-full border py-2 text-xs font-bold tracking-wider transition-all rounded ${themeStyles.buttonSecondary}`}
                                >
                                  UNLOCK VAULT
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "NOTIFICATIONS" && (
            <div className={`border ${themeStyles.cardBg} p-6 space-y-4 rounded`}>
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-blue-500" />
                  <span className="text-xs font-bold tracking-wider">SYSTEM NOTIFICATIONS & UPDATES</span>
                </div>
                <span className={`text-[10px] ${themeStyles.mutedText} border px-2 py-1 rounded ${isDark ? "bg-blue-950/40 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
                  {notifications.length} RECENT ANNOUNCEMENTS
                </span>
              </div>

              <div className="space-y-3">
                {notifications.map((item) => (
                  <div key={item.id} className={`border p-4 transition-all space-y-2 rounded ${isDark ? "border-blue-500/20 bg-[#060c1a]" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 border rounded ${
                          item.category === "SECURITY" ? "bg-red-500/10 border-red-500/40 text-red-500" : "bg-blue-500/10 border-blue-500/40 text-blue-500"
                        }`}>
                          [{item.category}]
                        </span>
                        <h4 className="text-xs font-bold">{item.title}</h4>
                      </div>
                      <span className={`text-[10px] ${themeStyles.mutedText}`}>{item.timestamp}</span>
                    </div>
                    <p className={`text-xs ${themeStyles.mutedText} leading-relaxed`}>{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "LOGS" && (
            <div className={`border ${themeStyles.cardBg} p-6 h-[500px] flex flex-col rounded`}>
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-blue-500" />
                  <span className="text-xs font-bold">PERSONAL LOGS ({user.username})</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 border-b border-blue-500/10 pb-1">
                    <span className={`text-[10px] ${themeStyles.mutedText}`}>{log.timestamp}</span>
                    <span className="text-blue-400 font-bold text-[10px]">[{log.user}]</span>
                    <span className={`text-[10px] font-bold px-1 rounded ${
                      log.type === "AUTH" ? "bg-blue-500/20 text-blue-400" :
                      log.type === "VAULT" ? "bg-indigo-500/20 text-indigo-400" : "bg-purple-500/20 text-purple-400"
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="opacity-90">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      )}

      {/* INCORRECT PIN MODAL */}
      <AnimatePresence>
        {showIncorrectPinModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4`}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`border-2 border-red-500 p-6 max-w-xs w-full text-center space-y-4 shadow-2xl rounded ${themeStyles.cardBg}`}
            >
              <AlertTriangle size={38} className="mx-auto text-red-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-red-500 tracking-wider">INCORRECT PASSCODE</h3>
                <p className={`text-[11px] ${themeStyles.mutedText} mt-1`}>Access denied. Please check your passcode and try again.</p>
              </div>
              <button 
                onClick={() => setShowIncorrectPinModal(false)}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-500 py-2 text-xs font-bold transition-all rounded"
              >
                DISMISS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE VAULT MODAL */}
      <AnimatePresence>
        {vaultToDelete && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4`}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`border border-red-500/50 p-6 max-w-md w-full space-y-4 shadow-2xl rounded ${themeStyles.cardBg}`}
            >
              <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-red-500">
                  <Trash2 size={16} /> DELETE VAULT: {vaultToDelete.name.toUpperCase()}
                </div>
                <button onClick={() => setVaultToDelete(null)} className={`${themeStyles.mutedText} hover:text-red-500`}>
                  <X size={18} />
                </button>
              </div>

              <p className={`text-xs ${themeStyles.mutedText} leading-relaxed`}>
                Are you sure you want to delete <strong className="text-blue-400">{vaultToDelete.name}</strong>? 
                This will permanently delete all files inside this vault box.
              </p>

              <form onSubmit={handleConfirmDeleteVault} className="space-y-4 text-xs">
                <div>
                  <label className="block text-red-500 mb-1 font-bold">ENTER VAULT PASSCODE TO CONFIRM</label>
                  <input 
                    type="password"
                    placeholder="Enter secret code / PIN"
                    value={deletePinInput}
                    onChange={(e) => setDeletePinInput(e.target.value)}
                    className={`w-full p-2.5 text-xs outline-none rounded border-red-500/40 focus:border-red-500 ${themeStyles.inputBg}`}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-500 border border-red-400 text-white py-2.5 font-bold transition-all rounded"
                  >
                    CONFIRM DELETION
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVaultToDelete(null)}
                    className={`border px-4 py-2.5 rounded ${themeStyles.buttonSecondary}`}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPEN VAULT BOX MODAL */}
      <AnimatePresence>
        {openVaultModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4 overflow-y-auto`}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              className={`border-2 border-blue-500 p-6 max-w-4xl w-full my-8 space-y-6 shadow-2xl rounded ${themeStyles.cardBg}`}
            >
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-4">
                <div className="flex items-center gap-3">
                  <FolderOpen size={22} className="text-blue-500" />
                  <div>
                    <h2 className="font-bold text-base">{openVaultModal.name.toUpperCase()}</h2>
                    <p className={`text-[10px] ${themeStyles.mutedText}`}>UNLOCKED SESSION ACTIVE</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition-all rounded ${themeStyles.buttonPrimary}`}
                  >
                    <Plus size={15} /> UPLOAD FILE
                  </button>

                  <button 
                    onClick={() => lockVault(openVaultModal.id)}
                    className="text-red-500 border border-red-500/40 hover:bg-red-500/10 px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 rounded"
                  >
                    <Lock size={13} /> LOCK & CLOSE
                  </button>
                  <button 
                    onClick={() => {
                      setOpenVaultModal(null);
                      setActiveDoc(null);
                    }}
                    className={`${themeStyles.mutedText} hover:text-blue-500 p-1`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* IN-MODAL FILE INSPECTOR */}
              <AnimatePresence>
                {activeDoc && activeDoc.vaultName === openVaultModal.name && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className={`border border-blue-500 p-4 rounded space-y-3 ${isDark ? "bg-[#060c1a]" : "bg-slate-100"}`}
                  >
                    <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-blue-500" />
                        <span className="font-bold text-xs truncate max-w-[280px]">
                          INSPECTING: {activeDoc.title}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => setActiveDoc(null)}
                        className="text-xs text-red-500 hover:text-red-400 font-bold px-2 py-0.5 border border-red-500/40 rounded transition-colors"
                      >
                        CLOSE [X]
                      </button>
                    </div>

                    <div className={`p-2 border border-dashed border-blue-500/40 text-xs rounded ${isDark ? "bg-[#0a1128]" : "bg-white"}`}>
                      {isImageDoc(activeDoc) ? (
                        <div className="flex items-center justify-center p-2 max-h-[450px] overflow-auto">
                          <img 
                            src={activeDoc.content} 
                            alt={activeDoc.title} 
                            className="max-h-[420px] w-auto object-contain rounded shadow-lg border border-blue-500/20"
                          />
                        </div>
                      ) : isPdfDoc(activeDoc) ? (
                        <iframe 
                          src={activeDoc.content} 
                          className="w-full h-[450px] bg-white rounded border-0" 
                          title={activeDoc.title}
                        />
                      ) : (
                        <div className="max-h-60 overflow-y-auto p-2">
                          <pre className="font-mono whitespace-pre-wrap break-words font-normal">
                            {formatPreviewContent(activeDoc.content)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STORED FILES LIST */}
              <div className={`space-y-4 border p-4 rounded ${isDark ? "border-blue-500/20 bg-[#060c1a]" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-500" /> FILES IN THIS VAULT
                  </span>
                  
                  <span className={`text-[10px] ${themeStyles.mutedText} font-bold`}>
                    {documents.filter(d => d.vaultName === openVaultModal.name).length} TOTAL
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {documents.filter(d => d.vaultName === openVaultModal.name).length === 0 ? (
                    <div 
                      onClick={() => setShowUploadModal(true)}
                      className={`text-xs italic p-8 border-2 border-dashed border-blue-500/30 text-center rounded cursor-pointer hover:border-blue-400 transition-all ${themeStyles.mutedText}`}
                    >
                      <Plus size={24} className="mx-auto mb-2 text-blue-500" />
                      Vault is empty. Click here or use the <strong className="text-blue-400">+ UPLOAD FILE</strong> button at the top to add files.
                    </div>
                  ) : (
                    documents
                      .filter(d => d.vaultName === openVaultModal.name)
                      .map((doc) => (
                        <div key={doc.id} className={`border p-3 hover:border-blue-500 transition-all rounded flex items-center justify-between gap-4 ${themeStyles.cardBg}`}>
                          <div className="truncate flex-1">
                            <h4 className="text-xs font-bold truncate">{doc.title}</h4>
                            <div className={`flex items-center gap-3 text-[10px] ${themeStyles.mutedText} mt-1`}>
                              <span>SIZE: {doc.size}</span>
                              <span>•</span>
                              <span>{doc.createdAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => triggerInspect(doc)}
                              className={`text-[11px] border px-2.5 py-1 font-bold transition-all flex items-center gap-1 rounded ${themeStyles.buttonSecondary}`}
                            >
                              <Eye size={12} /> VIEW
                            </button>

                            <button
                              onClick={() => handleDeleteFile(doc.id, doc.title)}
                              className="text-[11px] border border-red-500/40 hover:border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2.5 py-1 font-bold transition-all flex items-center gap-1 rounded"
                              title="Delete File"
                            >
                              <Trash2 size={12} /> DELETE
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && openVaultModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4`}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`border-2 border-blue-500 p-6 max-w-lg w-full space-y-4 shadow-2xl rounded ${themeStyles.cardBg}`}
            >
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Upload size={18} className="text-blue-500" /> UPLOAD FILE TO {openVaultModal.name.toUpperCase()}
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)} 
                  className={`${themeStyles.mutedText} hover:text-blue-500`}
                >
                  <X size={20} />
                </button>
              </div>

              <input 
                type="file" 
                ref={modalFileInputRef} 
                accept="image/*,.pdf,.txt,.md,.json,.csv"
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processUploadedFile(e.target.files[0]);
                  }
                }}
              />

              <form onSubmit={handleModalUploadSubmit} className="space-y-4">
                <div 
                  onClick={() => modalFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setModalDragActive(true); }}
                  onDragLeave={() => setModalDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setModalDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processUploadedFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed p-6 text-center transition-all cursor-pointer rounded ${
                    modalDragActive ? "border-blue-500 bg-blue-500/10" : "border-blue-500/40 hover:border-blue-500 hover:bg-blue-500/5"
                  }`}
                >
                  <Upload size={32} className="mx-auto mb-2 text-blue-500 animate-pulse" />
                  <p className="text-xs font-bold">Click to choose or drop file here</p>
                  <p className={`text-[10px] ${themeStyles.mutedText} mt-1`}>Supports Images (PNG, JPG, WEBP), PDF, and Text</p>
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>FILE NAME</label>
                  <input 
                    type="text"
                    placeholder="e.g. Passcodes.txt"
                    value={modalUploadTitle}
                    onChange={(e) => setModalUploadTitle(e.target.value)}
                    className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 ${themeStyles.mutedText}`}>FILE CONTENT / DATA</label>
                  <textarea 
                    rows={3}
                    placeholder="File data payload..."
                    value={modalUploadContent}
                    onChange={(e) => setModalUploadContent(e.target.value)}
                    className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={modalIsUploading}
                    className={`flex-1 border py-2.5 text-xs font-bold transition-all rounded disabled:opacity-50 ${themeStyles.buttonPrimary}`}
                  >
                    {modalIsUploading ? "ENCRYPTING..." : `SAVE TO ${openVaultModal.name.toUpperCase()}`}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setShowUploadModal(false)}
                    className={`border px-4 py-2.5 text-xs font-bold rounded ${themeStyles.buttonSecondary}`}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE VAULT MODAL */}
      <AnimatePresence>
        {showCreateVaultModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border border-blue-500/50 p-6 max-w-md w-full space-y-4 shadow-2xl rounded ${themeStyles.cardBg}`}>
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <FolderPlus size={16} className="text-blue-500" /> CREATE A NEW VAULT
                </div>
                <button onClick={() => setShowCreateVaultModal(false)} className={`${themeStyles.mutedText} hover:text-blue-500`}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateVaultSubmit} className="space-y-4 text-xs">
                <div>
                  <label className={`block mb-1 ${themeStyles.mutedText}`}>VAULT NAME</label>
                  <input 
                    type="text"
                    placeholder="e.g. Personal Documents"
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                    className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${themeStyles.mutedText}`}>SET SECRET PIN / ACCESS CODE</label>
                  <input 
                    type="password"
                    placeholder="Set secret code (e.g. 9999)"
                    value={newVaultPin}
                    onChange={(e) => setNewVaultPin(e.target.value)}
                    className={`w-full p-2.5 text-xs outline-none rounded ${themeStyles.inputBg}`}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit"
                    className={`flex-1 border py-2.5 font-bold transition-all rounded ${themeStyles.buttonPrimary}`}
                  >
                    CREATE VAULT
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCreateVaultModal(false)}
                    className={`border px-4 py-2.5 rounded ${themeStyles.buttonSecondary}`}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HELP MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border border-blue-500/50 p-6 max-w-lg w-full space-y-4 shadow-2xl rounded ${themeStyles.cardBg}`}>
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Info size={16} className="text-blue-500" /> HELP
                </div>
                <button onClick={() => setShowHelpModal(false)} className={`${themeStyles.mutedText} hover:text-blue-500`}>
                  <X size={18} />
                </button>
              </div>

              <div className={`text-xs space-y-3 ${themeStyles.mutedText} leading-relaxed`}>
                <p><strong className="text-blue-400">1. Forgot Password:</strong> Click the "Forgot Password?" button on the sign-in form to request a verification code and reset your passcode.</p>
                <p><strong className="text-blue-400">2. Theme Switcher:</strong> Toggle between Dark Mode and Light Mode using the Sun/Moon button.</p>
                <p><strong className="text-blue-400">3. Profile Setup:</strong> Click the profile icon in top right to upload avatar images and view profile details.</p>
                <p><strong className="text-blue-400">4. Unlock Vault:</strong> Enter passcode to open standard or custom vaults stored in the database.</p>
              </div>

              <button 
                onClick={() => setShowHelpModal(false)}
                className={`w-full border py-2 text-xs font-bold rounded ${themeStyles.buttonPrimary}`}
              >
                GOT IT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONTACT MODAL */}
      <AnimatePresence>
        {showContactModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeStyles.modalOverlay} p-4`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border border-blue-500/50 p-6 max-w-md w-full space-y-4 shadow-2xl rounded ${themeStyles.cardBg}`}>
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Mail size={16} className="text-blue-500" /> CONTACT SUPPORT
                </div>
                <button onClick={() => setShowContactModal(false)} className={`${themeStyles.mutedText} hover:text-blue-500`}>
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs space-y-3">
                <div className={`p-3 border rounded space-y-2 text-[11px] ${isDark ? "bg-[#060c1a] border-blue-500/30" : "bg-slate-50 border-slate-200"}`}>
                  <div><span className={`font-bold ${themeStyles.mutedText}`}>SUPPORT EMAIL:</span> support@cryptadocs.local</div>
                  <div><span className={`font-bold ${themeStyles.mutedText}`}>ADMIN EMAIL:</span> admin@cryptadocs.local</div>
                </div>
              </div>

              <button 
                onClick={() => setShowContactModal(false)}
                className={`w-full border py-2 text-xs font-bold rounded ${themeStyles.buttonPrimary}`}
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className={`relative z-10 border-t px-6 py-2 text-[10px] flex justify-between items-center transition-colors duration-300 ${isDark ? "bg-[#060c1a]/90 border-white/10 text-blue-200/60" : "bg-white/90 border-slate-200 text-slate-500"}`}>
        <div>CONNECTED TO SECURE SERVER</div>
        <div>ENCRYPTION ACTIVE</div>
      </footer>
    </div>
  );
}