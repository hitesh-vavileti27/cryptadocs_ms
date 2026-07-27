"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Unlock, ShieldAlert, Terminal, FileText, Database, 
  Upload, LogOut, Home, HelpCircle, Mail, X, Info, User, Plus, 
  FolderPlus, FolderOpen, Eye, MoreVertical, Trash2, AlertTriangle,
  Bell, Camera, UserPlus, RefreshCw, Calendar, Phone, CheckCircle2
} from "lucide-react";

type AuthState = "LOGIN" | "MFA" | "AUTHENTICATED";
type NavTab = "VAULTS" | "NOTIFICATIONS" | "LOGS";

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

export default function CryptaDocsApp() {
  // Core System States
  const [authState, setAuthState] = useState<AuthState>("LOGIN");
  const [activeTab, setActiveTab] = useState<NavTab>("VAULTS");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // File & Avatar Refs
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const [user, setUser] = useState<UserProfile>({
    username: "Agent_Cyber",
    email: "agent@cryptadocs.local",
    phone: "+1 (555) 019-2831",
    dob: "1995-08-14",
    createdAt: "2026-01-15",
    avatarUrl: "",
  });

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState("agent@cryptadocs.local");
  const [loginPassword, setLoginPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  // Sign Up Form State
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Dropdown & Deletion States
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [vaultToDelete, setVaultToDelete] = useState<VaultItem | null>(null);
  const [deletePinInput, setDeletePinInput] = useState("");
  const [showIncorrectPinModal, setShowIncorrectPinModal] = useState(false);

  // Modals
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const [openVaultModal, setOpenVaultModal] = useState<VaultItem | null>(null);

  // Vaults State
  const [vaults, setVaults] = useState<VaultItem[]>([
    { id: "V-1", name: "Standard Vault", pin: "1234", isUnlocked: false },
    { id: "V-2", name: "High-Grade Vault", pin: "7788", isUnlocked: false },
    { id: "V-3", name: "Quantum Vault", pin: "0000", isUnlocked: false },
  ]);

  // Create Vault Form Inputs
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultPin, setNewVaultPin] = useState("");

  // PIN Inputs for unlocking
  const [pinInputs, setPinInputs] = useState<{ [vaultId: string]: string }>({});

  // Document Inspection States
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  // Modal Upload Form State
  const [modalUploadTitle, setModalUploadTitle] = useState("");
  const [modalUploadContent, setModalUploadContent] = useState("");
  const [modalDragActive, setModalDragActive] = useState(false);
  const [modalIsUploading, setModalIsUploading] = useState(false);

  // Notifications Feed
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "N-101",
      title: "Zero-Knowledge Encryption v2.0 Active",
      timestamp: "2026-07-27 10:30",
      category: "SECURITY",
      message: "All stored files and vault payload transfers are now isolated with enhanced local key derivation.",
      read: false
    },
    {
      id: "N-102",
      title: "System Maintenance Completed",
      timestamp: "2026-07-25 14:15",
      category: "UPDATE",
      message: "Database indexing and local memory buffers have been optimized for faster document loading.",
      read: true
    },
    {
      id: "N-103",
      title: "MFA Authentication Policy Updated",
      timestamp: "2026-07-20 09:00",
      category: "SYSTEM",
      message: "Two-factor authorization is mandatory across all active sessions to secure vault access.",
      read: true
    }
  ]);

  // Documents Database
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: "DOC-101",
      title: "Tech Travels_ 10 Years of Change.txt",
      vaultName: "Standard Vault",
      size: "0.9 MB",
      hash: "0x8f2a9110...",
      createdAt: "2026-07-27 11:56",
      content: "Over the past decade, technology has transformed every aspect of software engineering, cloud architecture, and data privacy...",
      encrypted: true,
    },
    {
      id: "DOC-102",
      title: "User_Guide_Protocol.md",
      vaultName: "Standard Vault",
      size: "128 KB",
      hash: "0x3b11e400...",
      createdAt: "2026-07-25 09:12",
      content: "Welcome to CryptaDocs. Uploaded files are safely isolated within designated encrypted vaults.",
      encrypted: false,
    }
  ]);

  // Activity Logs State
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: new Date().toLocaleTimeString(), user: user.username, type: "SYS", msg: "CryptaDocs Workspace Ready." },
    { id: "2", timestamp: new Date().toLocaleTimeString(), user: user.username, type: "AUTH", msg: "Authenticated user session active." }
  ]);

  const addLog = (type: LogEntry["type"], msg: string) => {
    setLogs((prev) => [
      { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString(), user: user.username, type, msg },
      ...prev
    ].slice(0, 100));
  };

  // Avatar Upload Handler
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

  // Auth Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLog("AUTH", `Login requested for: ${loginIdentifier}`);
    setAuthState("MFA");
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const newUser: UserProfile = {
      username: regUsername || "NewAgent",
      email: regEmail,
      phone: regPhone,
      dob: regDob,
      createdAt: today,
      avatarUrl: user.avatarUrl,
    };
    setUser(newUser);
    addLog("AUTH", `Account created for: ${regEmail}`);
    setIsRegistering(false);
    setLoginIdentifier(regEmail);
    setRegPassword("");
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length === 6) {
      setVaults((prev) => prev.map((v) => ({ ...v, isUnlocked: false })));
      addLog("AUTH", `User [${user.username}] successfully verified MFA.`);
      setAuthState("AUTHENTICATED");
    }
  };

  const handleLogout = () => {
    addLog("AUTH", `User [${user.username}] logged out.`);
    setAuthState("LOGIN");
    setActiveTab("VAULTS");
    setIsProfileOpen(false);
    setVaults((prev) => prev.map((v) => ({ ...v, isUnlocked: false })));
    setOpenVaultModal(null);
    setActiveDoc(null);
    setLoginPassword("");
    setMfaCode("");
  };

  const formatPreviewContent = (text: string) => {
    if (!text) return "No content available.";
    if (text.length > 3000) {
      return text.slice(0, 3000) + "\n\n... [Preview truncated for display safety]";
    }
    return text;
  };

  // Create Vault
  const handleCreateVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName || !newVaultPin) return;

    const newVault: VaultItem = {
      id: `V-${vaults.length + 1}`,
      name: newVaultName,
      pin: newVaultPin,
      isUnlocked: false,
    };

    setVaults((prev) => [...prev, newVault]);
    addLog("VAULT", `Created vault "${newVaultName}".`);
    setNewVaultName("");
    setNewVaultPin("");
    setShowCreateVaultModal(false);
  };

  // Unlock Vault & Open Popup
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

  // Confirm Delete Vault
  const handleConfirmDeleteVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultToDelete) return;

    if (deletePinInput === vaultToDelete.pin) {
      setVaults((prev) => prev.filter((v) => v.id !== vaultToDelete.id));
      setDocuments((prev) => prev.filter((d) => d.vaultName !== vaultToDelete.name));
      addLog("VAULT", `Deleted vault "${vaultToDelete.name}" and associated files.`);

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

  // Lock Vault
  const lockVault = (vaultId: string) => {
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? { ...v, isUnlocked: false } : v)));
    if (openVaultModal?.id === vaultId) {
      setOpenVaultModal(null);
      setActiveDoc(null);
    }
  };

  // Process Real Selected or Dropped File
  const processUploadedFile = (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const reader = new FileReader();

    if (isPdf) {
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

  // Modal Upload Form Handler
  const handleModalUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUploadTitle || !openVaultModal) return;

    setModalIsUploading(true);
    addLog("ENCRYPT", `Saving '${modalUploadTitle}' to ${openVaultModal.name}...`);

    setTimeout(() => {
      const sizeBytes = modalUploadContent.length;
      const formattedSize = sizeBytes > 1024 * 1024 
        ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;

      const newDoc: DocumentItem = {
        id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        title: modalUploadTitle,
        vaultName: openVaultModal.name,
        size: formattedSize,
        hash: `0x${Math.random().toString(16).substring(2, 10)}...`,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        content: modalUploadContent || "Standard encrypted file content.",
        encrypted: true,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setModalIsUploading(false);
      setModalUploadTitle("");
      setModalUploadContent("");
      addLog("VAULT", `File '${newDoc.title}' saved in ${openVaultModal.name}.`);
    }, 400);
  };

  const triggerInspect = (doc: DocumentItem) => {
    setActiveDoc(doc);
    addLog("VAULT", `Opened '${doc.title}' for viewing.`);
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-[#00ff41] font-mono flex flex-col justify-between selection:bg-[#00ff41] selection:text-black">
      
      {/* Hidden Profile Picture Input */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarChange} 
      />

      {/* DROPDOWN OVERLAY DISMISSER */}
      {(activeDropdown || isProfileOpen) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setActiveDropdown(null);
            setIsProfileOpen(false);
          }} 
        />
      )}

      {/* 1. HEADER */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#0c1938]/90 border-b border-[#00ff41]/30 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("VAULTS")}>
            <ShieldAlert className="w-6 h-6 text-[#00ff41]" />
            <h1 className="text-lg font-bold tracking-widest text-[#00ff41]">
              CRYPTADOCS <span className="text-xs text-[#008f11]">v2.0</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 border-l border-[#00ff41]/30 pl-4 text-xs">
            <button onClick={() => setActiveTab("VAULTS")} className="flex items-center gap-1.5 text-[#008f11] hover:text-[#00ff41] transition-colors">
              <Home size={14} /> HOME
            </button>
            <button onClick={() => setShowHelpModal(true)} className="flex items-center gap-1.5 text-[#008f11] hover:text-[#00ff41] transition-colors">
              <HelpCircle size={14} /> HELP
            </button>
            <button onClick={() => setShowContactModal(true)} className="flex items-center gap-1.5 text-[#008f11] hover:text-[#00ff41] transition-colors">
              <Mail size={14} /> CONTACT
            </button>
          </div>
        </div>

        {/* TOP RIGHT USER PROFILE BUTTON & DROPDOWN */}
        {authState === "AUTHENTICATED" ? (
          <div className="relative z-40">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 bg-[#070d1e] border border-[#00ff41]/50 hover:border-[#00ff41] px-3 py-1.5 rounded-full transition-all group"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#00ff41] bg-[#0b132b] flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-[#00ff41]" />
                )}
              </div>
              <span className="text-xs font-bold text-[#00ff41] group-hover:text-white transition-colors">
                {user.username}
              </span>
            </button>

            {/* PROFILE DROPDOWN MENU */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-[#070d1e] border-2 border-[#00ff41] shadow-[0_10px_30px_rgba(0,255,65,0.2)] p-5 rounded z-50 text-xs"
                >
                  {/* CIRCULAR PROFILE PICTURE FRAME & USERNAME */}
                  <div className="flex flex-col items-center border-b border-[#00ff41]/30 pb-4 mb-4">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full border-2 border-[#00ff41] p-1 bg-[#0b132b] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={40} className="text-[#00ff41]" />
                        )}
                      </div>
                      
                      {/* Upload Picture Button */}
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-[#00ff41] text-black p-1.5 rounded-full hover:bg-white transition-all shadow"
                        title="Upload Profile Picture"
                      >
                        <Camera size={13} />
                      </button>
                    </div>

                    {/* Username right below image */}
                    <h3 className="text-sm font-bold text-[#00ff41] mt-3 tracking-wider">{user.username}</h3>
                    <span className="text-[10px] text-[#008f11]">VERIFIED CRYPTADOCS AGENT</span>
                  </div>

                  {/* USER DETAILS GRID */}
                  <div className="space-y-2.5 text-[11px] mb-5 bg-[#0b132b] p-3 border border-[#00ff41]/20 rounded">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail size={13} className="text-[#00ff41]" />
                      <span className="text-[#008f11] font-bold">Email:</span>
                      <span className="text-[#00ff41] truncate">{user.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone size={13} className="text-[#00ff41]" />
                      <span className="text-[#008f11] font-bold">Phone:</span>
                      <span className="text-[#00ff41]">{user.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar size={13} className="text-[#00ff41]" />
                      <span className="text-[#008f11] font-bold">DOB:</span>
                      <span className="text-[#00ff41]">{user.dob}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300 border-t border-[#00ff41]/10 pt-2 mt-2">
                      <CheckCircle2 size={13} className="text-[#00ff41]" />
                      <span className="text-[#008f11] font-bold">Created:</span>
                      <span className="text-[#00ff41]">{user.createdAt}</span>
                    </div>
                  </div>

                  {/* ACCOUNT ACTIONS */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        setAuthState("LOGIN");
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-[#00ff41]/50 hover:border-[#00ff41] bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] py-2 transition-all font-bold"
                    >
                      <RefreshCw size={13} /> SWITCH ACCOUNT
                    </button>

                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsRegistering(true);
                        setAuthState("LOGIN");
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-[#00ff41]/50 hover:border-[#00ff41] bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] py-2 transition-all font-bold"
                    >
                      <UserPlus size={13} /> ADD ACCOUNT
                    </button>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 border border-red-800 hover:border-red-500 bg-red-950/40 text-red-400 py-2 transition-all font-bold mt-2"
                    >
                      <LogOut size={13} /> LOG OUT
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <span className="text-xs text-[#008f11] border border-[#00ff41]/20 px-2 py-1 bg-[#070d1e]">
            AUTHENTICATION REQUIRED
          </span>
        )}
      </header>

      {/* 2. LOGIN / SIGNUP / MFA */}
      {authState !== "AUTHENTICATED" && (
        <main className="flex-1 flex items-center justify-center p-4 mt-16">
          <AnimatePresence mode="wait">
            {authState === "LOGIN" && !isRegistering && (
              <motion.div key="login" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="w-full max-w-md">
                <form onSubmit={handleLoginSubmit} className="border border-[#00ff41]/40 bg-[#070d1e] p-8 shadow-[0_0_30px_rgba(0,255,65,0.08)]">
                  <h2 className="text-sm font-bold mb-6 border-b border-[#00ff41]/20 pb-3 flex items-center gap-2 text-[#00ff41]">
                    <Lock size={18} /> USER SIGN IN
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#008f11] mb-1">USERNAME OR EMAIL</label>
                      <input 
                        type="text" 
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="agent@cryptadocs.local"
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2.5 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#008f11] mb-1">PASSWORD</label>
                      <input 
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2.5 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>

                    <button type="submit" className="w-full mt-2 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41] py-2.5 text-xs font-bold tracking-wider transition-all">
                      SIGN IN
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(true)}
                    className="w-full mt-5 text-[11px] text-[#008f11] hover:text-[#00ff41] transition-colors text-center"
                  >
                    [ Need an account? Create one here ]
                  </button>
                </form>
              </motion.div>
            )}

            {authState === "LOGIN" && isRegistering && (
              <motion.div key="signup" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="w-full max-w-md">
                <form onSubmit={handleSignupSubmit} className="border border-[#00ff41]/40 bg-[#070d1e] p-8 shadow-[0_0_30px_rgba(0,255,65,0.08)]">
                  <h2 className="text-sm font-bold mb-6 border-b border-[#00ff41]/20 pb-3 flex items-center gap-2 text-[#00ff41]">
                    <UserPlus size={18} /> CREATE AN ACCOUNT
                  </h2>
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] text-[#008f11] mb-1">USERNAME</label>
                      <input 
                        type="text" 
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Agent_Cyber"
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#008f11] mb-1">EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="agent@cryptadocs.local"
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#008f11] mb-1">MOBILE NUMBER</label>
                      <input 
                        type="tel" 
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 (555) 019-2831"
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#008f11] mb-1">DATE OF BIRTH</label>
                      <input 
                        type="date" 
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#008f11] mb-1">PASSWORD</label>
                      <input 
                        type="password" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#0b132b] border border-[#00ff41]/30 focus:border-[#00ff41] p-2 text-xs text-[#00ff41] outline-none"
                        required 
                      />
                    </div>

                    <button type="submit" className="w-full mt-2 bg-[#00ff41]/20 hover:bg-[#00ff41]/30 text-[#00ff41] border border-[#00ff41] py-2.5 text-xs font-bold tracking-wider transition-all">
                      REGISTER ACCOUNT
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(false)}
                    className="w-full mt-4 text-[11px] text-[#008f11] hover:text-[#00ff41] transition-colors text-center"
                  >
                    [ Already have an account? Sign in ]
                  </button>
                </form>
              </motion.div>
            )}

            {authState === "MFA" && (
              <motion.div key="mfa" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md">
                <form onSubmit={handleMfaSubmit} className="border border-[#00ff41]/60 bg-[#070d1e] p-8 text-center shadow-[0_0_30px_rgba(0,255,65,0.1)]">
                  <ShieldAlert size={36} className="mx-auto mb-3 text-[#00ff41] animate-bounce" />
                  <h2 className="text-sm font-bold text-[#00ff41] mb-1">TWO-FACTOR AUTHENTICATION</h2>
                  <p className="text-xs text-[#008f11] mb-6">Enter any 6-digit code (e.g. 123456).</p>

                  <input 
                    type="text" 
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#0b132b] border border-[#00ff41] p-3 mb-6 text-center text-xl tracking-[0.5em] text-[#00ff41] outline-none"
                    required
                    autoFocus
                  />

                  <button type="submit" className="w-full bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] py-2.5 text-xs font-bold transition-all">
                    VERIFY & CONTINUE
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* 3. MAIN DASHBOARD */}
      {authState === "AUTHENTICATED" && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 mt-20 mb-8 flex flex-col gap-6">
          
          <nav className="flex items-center gap-2 border-b border-[#00ff41]/20 pb-2">
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
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border ${
                    isActive 
                      ? "border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]" 
                      : "border-transparent text-[#008f11] hover:text-[#00ff41] hover:border-[#00ff41]/30"
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </nav>

          {/* TAB 1: VAULTS LIST */}
          {activeTab === "VAULTS" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-[#00ff41]/30 bg-[#070d1e] p-3 text-center">
                  <div className="text-[10px] text-[#008f11]">TOTAL VAULTS</div>
                  <div className="text-xl font-bold text-[#00ff41]">{vaults.length}</div>
                </div>
                <div className="border border-[#00ff41]/30 bg-[#070d1e] p-3 text-center">
                  <div className="text-[10px] text-[#008f11]">TOTAL FILES</div>
                  <div className="text-xl font-bold text-[#00ff41]">{documents.length}</div>
                </div>
                <div className="border border-[#00ff41]/30 bg-[#070d1e] p-3 text-center">
                  <div className="text-[10px] text-[#008f11]">UNLOCKED VAULTS</div>
                  <div className="text-xl font-bold text-[#00ff41]">{vaults.filter(v => v.isUnlocked).length}</div>
                </div>
                <div className="border border-[#00ff41]/30 bg-[#070d1e] p-3 text-center">
                  <div className="text-[10px] text-[#008f11]">ACTIVE AGENT</div>
                  <div className="text-xs font-bold text-[#00ff41] truncate mt-1">{user.username}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#008f11]">EXISTING VAULTS</span>
                  <button
                    onClick={() => setShowCreateVaultModal(true)}
                    className="flex items-center gap-1.5 bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] px-3 py-1.5 text-xs font-bold transition-all"
                  >
                    <Plus size={14} /> ADD NEW VAULT
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vaults.map((vault) => {
                    const vaultFilesCount = documents.filter((doc) => doc.vaultName === vault.name).length;

                    return (
                      <div 
                        key={vault.id} 
                        className={`border p-4 transition-all bg-[#070d1e] flex flex-col justify-between relative ${
                          vault.isUnlocked ? "border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.08)]" : "border-[#00ff41]/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-[#00ff41]/20 pb-2">
                            <span className="text-xs font-bold tracking-wider text-[#00ff41]">{vault.name.toUpperCase()}</span>
                            
                            <div className="flex items-center gap-2">
                              {vault.isUnlocked ? <Unlock size={16} className="text-[#00ff41]" /> : <Lock size={16} className="text-[#008f11]" />}
                              
                              {/* THREE DOTS MENU BUTTON */}
                              <div className="relative z-30">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === vault.id ? null : vault.id);
                                  }}
                                  className="text-[#008f11] hover:text-[#00ff41] p-1 rounded transition-colors"
                                  title="Vault Actions"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {/* DROPDOWN MENU */}
                                {activeDropdown === vault.id && (
                                  <div className="absolute right-0 top-6 w-48 bg-[#070d1e] border border-[#00ff41] shadow-[0_4px_20px_rgba(0,0,0,0.8)] py-1 rounded z-40">
                                    <div className="px-3 py-2 text-[11px] text-[#008f11] border-b border-[#00ff41]/20 flex justify-between items-center">
                                      <span>STORED FILES:</span>
                                      <span className="font-bold text-[#00ff41]">{vaultFilesCount}</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdown(null);
                                        setVaultToDelete(vault);
                                        setDeletePinInput("");
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors flex items-center gap-2 font-bold"
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
                              <div className="flex items-center justify-between bg-[#00ff41]/10 p-2 border border-[#00ff41]/30 text-[11px]">
                                <span className="text-[#00ff41] font-bold">UNLOCKED ({vaultFilesCount} FILES)</span>
                                <button 
                                  onClick={() => lockVault(vault.id)}
                                  className="text-red-400 border border-red-800 hover:border-red-500 bg-red-950/40 px-2 py-0.5 text-[10px] transition-colors"
                                >
                                  LOCK
                                </button>
                              </div>

                              <button
                                onClick={() => setOpenVaultModal(vault)}
                                className="w-full flex items-center justify-center gap-2 bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] py-2.5 text-xs font-bold transition-all"
                              >
                                <FolderOpen size={15} /> OPEN VAULT BOX
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 py-2">
                              <p className="text-[11px] text-[#008f11]">Enter passcode to unlock vault box.</p>
                              <input 
                                type="password"
                                placeholder="Enter Secret Code / PIN"
                                value={pinInputs[vault.id] || ""}
                                onChange={(e) => setPinInputs({ ...pinInputs, [vault.id]: e.target.value })}
                                className="w-full bg-[#0b132b] border border-[#00ff41]/30 p-2 text-xs text-[#00ff41] outline-none focus:border-[#00ff41]"
                              />
                              <button 
                                onClick={() => unlockVault(vault.id)}
                                className="w-full bg-[#00ff41]/10 hover:bg-[#00ff41]/20 border border-[#00ff41]/50 text-[#00ff41] py-2 text-xs font-bold tracking-wider transition-all"
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
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS & UPDATES */}
          {activeTab === "NOTIFICATIONS" && (
            <div className="border border-[#00ff41]/30 bg-[#070d1e] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-[#00ff41]" />
                  <span className="text-xs font-bold tracking-wider">SYSTEM NOTIFICATIONS & UPDATES</span>
                </div>
                <span className="text-[10px] text-[#008f11] bg-[#00ff41]/10 px-2 py-1 border border-[#00ff41]/30">
                  {notifications.length} RECENT ANNOUNCEMENTS
                </span>
              </div>

              <div className="space-y-3">
                {notifications.map((item) => (
                  <div key={item.id} className="border border-[#00ff41]/20 bg-[#0b132b] p-4 hover:border-[#00ff41]/60 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 border ${
                          item.category === "SECURITY" ? "bg-red-950/60 border-red-500 text-red-400" :
                          item.category === "UPDATE" ? "bg-[#00ff41]/10 border-[#00ff41] text-[#00ff41]" :
                          "bg-blue-950/60 border-blue-500 text-blue-400"
                        }`}>
                          [{item.category}]
                        </span>
                        <h4 className="text-xs font-bold text-gray-100">{item.title}</h4>
                      </div>
                      <span className="text-[10px] text-gray-400">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#008f11] leading-relaxed">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === "LOGS" && (
            <div className="border border-[#00ff41]/30 bg-[#070d1e] p-6 h-[500px] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-[#00ff41]" />
                  <span className="text-xs font-bold">PERSONAL LOGS ({user.username})</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 border-b border-[#00ff41]/5 pb-1">
                    <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
                    <span className="text-blue-400 font-bold text-[10px]">[{log.user}]</span>
                    <span className={`text-[10px] font-bold px-1 rounded ${
                      log.type === "AUTH" ? "bg-blue-950 text-blue-400" :
                      log.type === "VAULT" ? "bg-green-950 text-[#00ff41]" : "bg-purple-950 text-purple-400"
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="text-[#00ff41]/90">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      )}

      {/* 4. INCORRECT PASSCODE POPUP MODAL */}
      <AnimatePresence>
        {showIncorrectPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-[#070d1e] border-2 border-red-500 p-6 max-w-xs w-full text-center space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
            >
              <AlertTriangle size={38} className="mx-auto text-red-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-red-400 tracking-wider">INCORRECT PASSCODE</h3>
                <p className="text-[11px] text-gray-400 mt-1">Access denied. Please check your passcode and try again.</p>
              </div>
              <button 
                onClick={() => setShowIncorrectPinModal(false)}
                className="w-full bg-red-950/60 hover:bg-red-900/80 border border-red-500 text-red-200 py-2 text-xs font-bold transition-all"
              >
                DISMISS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DELETE VAULT CONFIRMATION MODAL */}
      <AnimatePresence>
        {vaultToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-[#070d1e] border border-red-500 p-6 max-w-md w-full space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            >
              <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                  <Trash2 size={16} /> DELETE VAULT: {vaultToDelete.name.toUpperCase()}
                </div>
                <button onClick={() => setVaultToDelete(null)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to delete <strong className="text-[#00ff41]">{vaultToDelete.name}</strong>? 
                This will permanently delete all files inside this vault box.
              </p>

              <form onSubmit={handleConfirmDeleteVault} className="space-y-4 text-xs">
                <div>
                  <label className="block text-red-400 mb-1 font-bold">ENTER VAULT PASSCODE TO CONFIRM</label>
                  <input 
                    type="password"
                    placeholder="Enter secret code / PIN"
                    value={deletePinInput}
                    onChange={(e) => setDeletePinInput(e.target.value)}
                    className="w-full bg-[#0b132b] border border-red-500/50 p-2.5 text-xs text-[#00ff41] outline-none focus:border-red-500"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-red-950 hover:bg-red-900 border border-red-500 text-red-200 py-2.5 font-bold transition-all"
                  >
                    CONFIRM DELETION
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVaultToDelete(null)}
                    className="border border-gray-700 hover:border-gray-500 text-gray-400 px-4 py-2.5"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. FULL POPUP MODAL: OPEN VAULT BOX */}
      <AnimatePresence>
        {openVaultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              className="bg-[#070d1e] border-2 border-[#00ff41] p-6 max-w-4xl w-full my-8 space-y-6 shadow-[0_0_50px_rgba(0,255,65,0.15)]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#00ff41]/30 pb-4">
                <div className="flex items-center gap-3">
                  <FolderOpen size={22} className="text-[#00ff41]" />
                  <div>
                    <h2 className="font-bold text-base text-[#00ff41]">{openVaultModal.name.toUpperCase()}</h2>
                    <p className="text-[10px] text-[#008f11]">UNLOCKED SESSION ACTIVE</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => lockVault(openVaultModal.id)}
                    className="text-red-400 border border-red-800 hover:border-red-500 bg-red-950/40 px-3 py-1 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Lock size={13} /> LOCK & CLOSE
                  </button>
                  <button 
                    onClick={() => {
                      setOpenVaultModal(null);
                      setActiveDoc(null);
                    }}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* IN-MODAL FILE INSPECTOR / DOCUMENT VIEWER PANEL */}
              <AnimatePresence>
                {activeDoc && activeDoc.vaultName === openVaultModal.name && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="border-2 border-[#00ff41] bg-[#0b132b] p-4 rounded space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#00ff41]/30 pb-2">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-[#00ff41]" />
                        <span className="font-bold text-xs text-[#00ff41] truncate max-w-[280px]">
                          INSPECTING: {activeDoc.title}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => setActiveDoc(null)}
                        className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-0.5 border border-red-800/60 bg-red-950/30 transition-colors"
                      >
                        CLOSE [X]
                      </button>
                    </div>

                    <div className="p-2 bg-[#070d1e] border border-dashed border-[#00ff41]/40 text-xs">
                      {activeDoc.title.toLowerCase().endsWith(".pdf") || activeDoc.content.startsWith("data:application/pdf") ? (
                        <iframe 
                          src={activeDoc.content} 
                          className="w-full h-[450px] bg-white rounded border-0" 
                          title={activeDoc.title}
                        />
                      ) : (
                        <div className="max-h-60 overflow-y-auto p-2">
                          <pre className="text-[#00ff41] font-mono whitespace-pre-wrap break-words font-normal">
                            {formatPreviewContent(activeDoc.content)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid: Stored Files vs Upload Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* STORED FILES LIST */}
                <div className="space-y-4 border border-[#00ff41]/20 p-4 bg-[#0b132b]/60">
                  <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-2">
                    <span className="text-xs font-bold text-[#00ff41] flex items-center gap-1.5">
                      <FileText size={14} /> FILES IN THIS VAULT
                    </span>
                    <span className="text-[10px] text-[#008f11]">
                      {documents.filter(d => d.vaultName === openVaultModal.name).length} TOTAL
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {documents.filter(d => d.vaultName === openVaultModal.name).length === 0 ? (
                      <div className="text-xs text-gray-500 italic p-6 border border-dashed border-[#00ff41]/20 text-center">
                        Vault is empty. Drag and drop files on the right to upload.
                      </div>
                    ) : (
                      documents
                        .filter(d => d.vaultName === openVaultModal.name)
                        .map((doc) => (
                          <div key={doc.id} className="border border-[#00ff41]/30 p-3 bg-[#070d1e] hover:border-[#00ff41] transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-gray-100 truncate max-w-[180px]">{doc.title}</span>
                              
                              <button
                                onClick={() => triggerInspect(doc)}
                                className="text-[10px] border border-[#00ff41] hover:bg-[#00ff41]/20 text-[#00ff41] px-2 py-0.5 font-bold transition-all flex items-center gap-1"
                              >
                                <Eye size={11} /> VIEW
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#008f11]">
                              <span>SIZE: {doc.size}</span>
                              <span>{doc.createdAt}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* UPLOAD FILE FORM IN MODAL */}
                <div className="space-y-4 border border-[#00ff41]/20 p-4 bg-[#0b132b]/60">
                  <span className="text-xs font-bold text-[#00ff41] flex items-center gap-1.5 border-b border-[#00ff41]/20 pb-2">
                    <Upload size={14} /> UPLOAD FILE TO THIS VAULT
                  </span>

                  <input 
                    type="file" 
                    ref={modalFileInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processUploadedFile(e.target.files[0]);
                      }
                    }}
                  />

                  <form onSubmit={handleModalUploadSubmit} className="space-y-3">
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
                      className={`border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                        modalDragActive ? "border-[#00ff41] bg-[#00ff41]/10" : "border-[#00ff41]/30 hover:border-[#00ff41]/60"
                      }`}
                    >
                      <Upload size={24} className="mx-auto mb-1 text-[#008f11]" />
                      <p className="text-[11px] text-[#00ff41] font-bold">Click to choose or drop real file here</p>
                      <p className="text-[9px] text-[#008f11]">Supports PDF and Text formats</p>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#008f11] mb-1">FILE NAME</label>
                      <input 
                        type="text"
                        placeholder="e.g. Passcodes.txt"
                        value={modalUploadTitle}
                        onChange={(e) => setModalUploadTitle(e.target.value)}
                        className="w-full bg-[#070d1e] border border-[#00ff41]/30 p-2 text-xs text-[#00ff41] outline-none focus:border-[#00ff41]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#008f11] mb-1">FILE CONTENT / DATA</label>
                      <textarea 
                        rows={3}
                        placeholder="File data payload..."
                        value={modalUploadContent}
                        onChange={(e) => setModalUploadContent(e.target.value)}
                        className="w-full bg-[#070d1e] border border-[#00ff41]/30 p-2 text-xs text-[#00ff41] outline-none focus:border-[#00ff41]"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={modalIsUploading}
                      className="w-full bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] py-2 text-xs font-bold transition-all"
                    >
                      {modalIsUploading ? "ENCRYPTING..." : `SAVE TO ${openVaultModal.name.toUpperCase()}`}
                    </button>
                  </form>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL: CREATE NEW VAULT */}
      <AnimatePresence>
        {showCreateVaultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#070d1e] border border-[#00ff41] p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-[#00ff41]/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <FolderPlus size={16} /> CREATE A NEW VAULT
                </div>
                <button onClick={() => setShowCreateVaultModal(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateVaultSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#008f11] mb-1">VAULT NAME</label>
                  <input 
                    type="text"
                    placeholder="e.g. Personal Documents"
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                    className="w-full bg-[#0b132b] border border-[#00ff41]/30 p-2.5 text-xs text-[#00ff41] outline-none focus:border-[#00ff41]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#008f11] mb-1">SET SECRET PIN / ACCESS CODE</label>
                  <input 
                    type="password"
                    placeholder="Set secret code (e.g. 9999)"
                    value={newVaultPin}
                    onChange={(e) => setNewVaultPin(e.target.value)}
                    className="w-full bg-[#0b132b] border border-[#00ff41]/30 p-2.5 text-xs text-[#00ff41] outline-none focus:border-[#00ff41]"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] py-2.5 font-bold transition-all"
                  >
                    CREATE VAULT
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCreateVaultModal(false)}
                    className="border border-gray-700 hover:border-gray-500 text-gray-400 px-4 py-2.5"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. HELP MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#070d1e] border border-[#00ff41] p-6 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between border-b border-[#00ff41]/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Info size={16} /> HELP
                </div>
                <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs space-y-3 text-gray-300 leading-relaxed">
                <p><strong className="text-[#00ff41]">1. Profile Setup:</strong> Click the profile icon in the top right to upload your avatar image and manage your profile details.</p>
                <p><strong className="text-[#00ff41]">2. Unlock Vault:</strong> Enter passcode to open standard or custom vaults.</p>
                <p><strong className="text-[#00ff41]">3. File Upload:</strong> Click or drag & drop files directly into an opened vault box.</p>
              </div>

              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] py-2 text-xs font-bold"
              >
                GOT IT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. CONTACT MODAL */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#070d1e] border border-[#00ff41] p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-[#00ff41]/30 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Mail size={16} /> CONTACT SUPPORT
                </div>
                <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs space-y-3 text-gray-300">
                <div className="bg-[#0b132b] p-3 border border-[#00ff41]/30 space-y-2 text-[11px]">
                  <div><span className="text-[#008f11]">SUPPORT EMAIL:</span> support@cryptadocs.local</div>
                  <div><span className="text-[#008f11]">ADMIN EMAIL:</span> admin@cryptadocs.local</div>
                </div>
              </div>

              <button 
                onClick={() => setShowContactModal(false)}
                className="w-full bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] py-2 text-xs font-bold"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. FOOTER */}
      <footer className="border-t border-[#00ff41]/20 bg-[#0c1938] px-6 py-2 text-[10px] text-[#008f11] flex justify-between items-center">
        <div>CONNECTED TO SECURE LOCAL SERVER</div>
        <div>ENCRYPTION ACTIVE</div>
      </footer>

    </div>
  );
}