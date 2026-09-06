import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Phone,
  Mail,
  Upload,
  Check,
  Trophy,
  X,
  Calendar,
  CircleAlert,
  IdCard,
  Briefcase
} from "lucide-react";
import { db, handleFirestoreError, OperationType, auth, isFirestoreQuotaExhausted, isQuotaError, recordFirestoreQuotaExhaustion } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { ConfettiCanvas } from "./ConfettiCanvas";

export interface CricketPlayer {
  id?: string;
  fullName: string;
  dob: string;
  gender: string;
  photo: string; // Base64 profile photo (rescaled/resized)
  email: string;
  mobile: string;
  emergencyContact: string;
  idDocument: string; // Base64 govt ID or descriptor
  role: "Batter" | "Bowler" | "All-Rounder" | "Wicket-keeper";
  battingStyle: "Right-hand" | "Left-hand";
  bowlingStyle: string;
  matchesPlayed: number;
  totalRuns: number;
  highestScore: number;
  wicketsTaken: number;
  economyRate: number;
  bestBowling: string;
  peakAuctionPrice: number;
  isVerified?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  createdAt?: string;
}

interface PlayerRegistrationFormProps {
  onClose: () => void;
}

// Function to handle image loading, resizing on a canvas, and compressing
const resizeImage = (file: File): Promise<{ base64: string; name: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while resizing
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert canvas image to heavy compressed JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve({ base64: dataUrl, name: file.name });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({ onClose }) => {
  // Personal Details state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profilePhotoName, setProfilePhotoName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [govtId, setGovtId] = useState<string>("");
  const [govtIdName, setGovtIdName] = useState("");

  // Cricket specifics state
  const [role, setRole] = useState<"Batter" | "Bowler" | "All-Rounder" | "Wicket-keeper">("Batter");
  const [battingStyle, setBattingStyle] = useState<"Right-hand" | "Left-hand">("Right-hand");
  const [bowlingStyle, setBowlingStyle] = useState("Right-arm off-spin");

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // OTP Verification system state
  const [countryCode, setCountryCode] = useState("+91");
  const [otpGenerated, setOtpGenerated] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [showOtpAlert, setShowOtpAlert] = useState(false);

  // Real Firebase Phone Auth confirmation result & state
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [otpMode, setOtpMode] = useState<"real" | "simulated">("real");

  // General state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    let draftStr = null;
    try {
      draftStr = localStorage.getItem("cricket_player_registration_draft");
    } catch (e) {
      console.warn("Blocked reading registration draft from localStorage:", e);
    }
    if (draftStr) {
      try {
        const parsed = JSON.parse(draftStr);
        if (parsed.fullName !== undefined) setFullName(parsed.fullName);
        if (parsed.dob !== undefined) setDob(parsed.dob);
        if (parsed.gender !== undefined) setGender(parsed.gender);
        if (parsed.email !== undefined) setEmail(parsed.email);
        if (parsed.mobile !== undefined) setMobile(parsed.mobile);
        if (parsed.emergencyContact !== undefined) setEmergencyContact(parsed.emergencyContact);
        if (parsed.role !== undefined) setRole(parsed.role);
        if (parsed.battingStyle !== undefined) setBattingStyle(parsed.battingStyle);
        if (parsed.bowlingStyle !== undefined) setBowlingStyle(parsed.bowlingStyle);
        if (parsed.profilePhoto !== undefined) setProfilePhoto(parsed.profilePhoto);
        if (parsed.profilePhotoName !== undefined) setProfilePhotoName(parsed.profilePhotoName);
        if (parsed.govtId !== undefined) setGovtId(parsed.govtId);
        if (parsed.govtIdName !== undefined) setGovtIdName(parsed.govtIdName);
      } catch (e) {
        console.warn("Failed to load registration form draft from localStorage:", e);
      }
    }
  }, []);

  // Sync to localStorage on field update
  useEffect(() => {
    if (successMessage) {
      try {
        localStorage.removeItem("cricket_player_registration_draft");
      } catch (e) {
        console.warn("Blocked clearing registration draft from localStorage:", e);
      }
      return;
    }
    const draft = {
      fullName,
      dob,
      gender,
      email,
      mobile,
      emergencyContact,
      role,
      battingStyle,
      bowlingStyle,
      profilePhoto,
      profilePhotoName,
      govtId,
      govtIdName
    };
    try {
      localStorage.setItem("cricket_player_registration_draft", JSON.stringify(draft));
    } catch (e) {
      console.warn("Blocked saving registration draft to localStorage:", e);
    }
  }, [
    fullName,
    dob,
    gender,
    email,
    mobile,
    emergencyContact,
    role,
    battingStyle,
    bowlingStyle,
    profilePhoto,
    profilePhotoName,
    govtId,
    govtIdName,
    successMessage
  ]);

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file for your profile photo.");
        return;
      }
      try {
        const resized = await resizeImage(file);
        setProfilePhoto(resized.base64);
        setProfilePhotoName(resized.name);
      } catch (err) {
        console.error("Error processing photo:", err);
        alert("Error loading photo profile.");
      }
    }
  };

  // Profile Photo file select helper
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file for your profile photo.");
      return;
    }

    try {
      const resized = await resizeImage(file);
      setProfilePhoto(resized.base64);
      setProfilePhotoName(resized.name);
    } catch (err) {
      console.error(err);
      alert("Error resizing profile picture.");
    }
  };

  // Government ID upload (not resized)
  const handleGovtIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("ID document is too large. Max allowed size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setGovtId(reader.result);
        setGovtIdName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // OPT sequence trigger (Real Firebase Auth / Simulated fallback)
  const handleSendOtp = async () => {
    if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setValidationErrors((prev) => ({ ...prev, mobile: "Valid 10-digit mobile number required to send OTP" }));
      return;
    }
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy.mobile;
      return copy;
    });

    setIsOtpSending(true);
    setOtpError("");
    setSubmitError(null);

    const fullPhoneNumber = `${countryCode}${mobile}`;

    if (otpMode === "simulated") {
      setTimeout(() => {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpGenerated(randomOtp);
        setConfirmationResult(null);
        setEnteredOtp("");
        setIsOtpSending(false);
        setShowOtpAlert(true);
      }, 800);
      return;
    }

    try {
      // Clear any previous widget container to prevent multiple recaptcha render attempts
      const oldElement = document.getElementById("recaptcha-widget");
      if (oldElement) {
        oldElement.remove();
      }
      const container = document.getElementById("recaptcha-container");
      if (container) {
        const div = document.createElement("div");
        div.id = "recaptcha-widget";
        container.appendChild(div);
      }

      const verifier = new RecaptchaVerifier(auth, "recaptcha-widget", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          setOtpError("reCAPTCHA validation expired. Please re-send OTP PIN.");
        }
      });

      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      setConfirmationResult(result);
      setOtpGenerated(null);
      setEnteredOtp("");
      setIsOtpSending(false);
      setShowOtpAlert(true);
    } catch (error: any) {
      console.error("Firebase Phone Send Error:", error);
      setIsOtpSending(false);
      let errMsg = error.message || String(error);
      
      // Auto-fallback and warning
      if (error.code === "auth/operation-not-allowed") {
        setOtpError("Real Phone Auth not enabled in Firebase Console (Authentication > Sign-in method). Falling back to simulated verification pin.");
      } else if (error.code === "auth/unauthorized-domain" || error.code === "auth/invalid-app-credential") {
        setOtpError("This domain is unauthorized or lacks key validation in Firebase. Falling back to simulated test pin.");
      } else {
        setOtpError(`Auth Error: ${errMsg}. Falling back to simulated verification pin.`);
      }
      setOtpMode("simulated");
      
      // Trigger fallback pin sending instantly for seamless UX
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpGenerated(randomOtp);
      setConfirmationResult(null);
      setEnteredOtp("");
      setShowOtpAlert(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!enteredOtp || enteredOtp.length !== 6) {
      setOtpError("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsOtpVerifying(true);
    setOtpError("");

    if (otpMode === "simulated") {
      if (enteredOtp === otpGenerated) {
        setIsMobileVerified(true);
        setOtpError("");
        setShowOtpAlert(false);
      } else {
        setOtpError("Incorrect simulated PIN. Please try again or re-send.");
      }
      setIsOtpVerifying(false);
      return;
    }

    if (!confirmationResult) {
      setOtpError("No active verification session. Please re-send OTP code.");
      setIsOtpVerifying(false);
      return;
    }

    try {
      const userCredential = await confirmationResult.confirm(enteredOtp);
      if (userCredential.user) {
        setIsMobileVerified(true);
        setOtpError("");
        setShowOtpAlert(false);
      } else {
        setOtpError("Verification failed. Please try again.");
      }
      setIsOtpVerifying(false);
    } catch (error: any) {
      console.error("Firebase Phone Code Verification Error:", error);
      setIsOtpVerifying(false);
      setOtpError(`Incorrect or expired OTP verification code: ${error.message || error}`);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // 1. Full name validation
    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters long";
    }

    // 2. DOB & Age validation
    if (!dob) {
      errors.dob = "Date of birth is required";
    } else {
      const dobDate = new Date(dob);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.dob = "Invalid date format";
      } else if (dobDate > today) {
        errors.dob = "Date of birth cannot be in the future";
      } else {
        let calculatedAge = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 5) {
          errors.dob = `Age is only ${calculatedAge}. Minimal age requirement for player enlistment is 5 years.`;
        } else if (calculatedAge > 100) {
          errors.dob = "Age cannot be more than 100 years.";
        }
      }
    }

    // 3. Gender validation
    if (!gender) {
      errors.gender = "Gender selection is required";
    }

    // 4. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Invalid email format (e.g. name@domain.com)";
    }

    // 5. Mobile format check
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d+$/.test(mobile.trim())) {
      errors.mobile = "Mobile number must contain digits only";
    } else if (mobile.trim().length !== 10) {
      errors.mobile = "Mobile number must be exactly 10-digit format";
    } else if (!mobileRegex.test(mobile.trim())) {
      errors.mobile = "Invalid mobile number (must start with 6-9)";
    }

    // 6. Mobile OTP verification
    if (!isMobileVerified) {
      errors.otp = "Mobile number must be verified via Send/Verify OTP process before submitting";
    }

    // 7. Profile Photo validation
    if (!profilePhoto) {
      errors.profilePhoto = "Profile portrait photo is required";
    }

    // 8. Identity document validation
    if (!govtId) {
      errors.govtId = "Government identity document (such as Aadhar or Passport) is required";
    }

    // 9. Emergency relationship validation
    if (!emergencyContact.trim()) {
      errors.emergencyContact = "Emergency contact relationship and details are required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    setValidationErrors({});
    setSubmitError(null);

    try {
      const payload: CricketPlayer = {
        fullName: fullName.trim(),
        dob,
        gender,
        photo: profilePhoto || "",
        email: email.trim(),
        mobile,
        emergencyContact: emergencyContact.trim(),
        idDocument: govtId || "",
        role,
        battingStyle,
        bowlingStyle,
        // Stats start recording at zero
        matchesPlayed: 0,
        totalRuns: 0,
        highestScore: 0,
        wicketsTaken: 0,
        economyRate: 0.0,
        bestBowling: "0/0",
        peakAuctionPrice: 100000, // Starts with base auction price pool appraisal of 1 Lakh INR
        isVerified: false, // Default is false, requires admin approval
        approvalStatus: "pending",
        createdAt: new Date().toISOString()
      };

      if (isFirestoreQuotaExhausted()) {
        try {
          const existing = JSON.parse(localStorage.getItem("cricket_players_local_pending") || "[]");
          existing.push({ ...payload, id: `local-player-${Date.now()}` });
          localStorage.setItem("cricket_players_local_pending", JSON.stringify(existing));
        } catch (e) {}
      } else {
        try {
          await addDoc(collection(db, "cricket_players"), payload);
        } catch (dbErr: any) {
          if (isQuotaError(dbErr)) {
            recordFirestoreQuotaExhaustion(60);
            const existing = JSON.parse(localStorage.getItem("cricket_players_local_pending") || "[]");
            existing.push({ ...payload, id: `local-player-${Date.now()}` });
            localStorage.setItem("cricket_players_local_pending", JSON.stringify(existing));
          } else {
            throw dbErr;
          }
        }
      }

      setIsSaving(false);
      setShowConfetti(true);
      setSuccessMessage(`Congratulations! ${fullName} registration forms submitted successfully. Awaiting portfolio review!`);

      // Reset
      setFullName("");
      setDob("");
      setGender("");
      setProfilePhoto("");
      setProfilePhotoName("");
      setEmail("");
      setMobile("");
      setEmergencyContact("");
      setGovtId("");
      setGovtIdName("");
      setRole("Batter");
      setBattingStyle("Right-hand");
      setBowlingStyle("Right-arm off-spin");
      setIsMobileVerified(false);
      setOtpGenerated(null);

      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } catch (err: any) {
      setIsSaving(false);
      console.error(err);
      let errMsg = err instanceof Error ? err.message : String(err);
      setSubmitError(errMsg);
      try {
        handleFirestoreError(err, OperationType.WRITE, "cricket_players");
      } catch (logErr) {
        // logged
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[120] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <ConfettiCanvas active={showConfetti} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        className="w-full max-w-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Global Loading Spinner Overlay */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative flex items-center justify-center mb-5">
                {/* Outer halo */}
                <div className="absolute w-24 h-24 border-2 border-emerald-500/20 rounded-full animate-ping duration-[1800ms]" />
                {/* Loader ring */}
                <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-850 border-t-emerald-500 border-b-emerald-600 rounded-full animate-spin" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Validating & Syncing Bio
              </h3>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                Analyzing form coefficients and packing assets. Linking player secure database portfolio...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Block bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-905 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Trophy size={18} className="animate-pulse" />
              </span>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Player Registration
              </h3>
            </div>
            <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold max-w-md">
              Awaiting portfolio board review. Fill the form to enlist in players pool. Matches / Runs / Wkts stats will record automatically as matches conclude.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-350 transition-colors border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Container Form contents */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 p-6 rounded-[2rem] text-center space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-500/15 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check size={24} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-450">
                Application Transferred!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-305 font-medium max-w-md mx-auto leading-relaxed">
                {successMessage}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-700 border-none transition"
                >
                  Register Another Player
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-855 p-4 rounded-2xl flex items-start gap-3">
                  <span className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg shrink-0 mt-0.5">
                    <CircleAlert size={14} className="animate-bounce" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-rose-700 dark:text-rose-450 tracking-wider">
                      Submission Error
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-355 font-semibold leading-relaxed">
                      {submitError.includes("remixed-project-id") || submitError.includes("remixed-api-key") ? (
                        "The application configuration is currently using placeholder credentials (remixed-project-id). Please run the Firebase Provisioning Setup from the cockpit/console to link a valid cloud database."
                      ) : (
                        `Details: ${submitError}`
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Profile details */}
              <div className="space-y-4 bg-slate-55/35 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-900">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-2 border-b border-white/50 dark:border-slate-800">
                  <User size={14} className="text-emerald-500" />
                  1. Profile, Photos & Identity Docs
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Shubman Gill"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                    {validationErrors.fullName && (
                      <p className="text-[9px] text-rose-500 font-bold">{validationErrors.fullName}</p>
                    )}
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                    {validationErrors.dob && (
                      <p className="text-[9px] text-rose-500 font-bold">{validationErrors.dob}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Gender *
                    </label>
                    <select
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {validationErrors.gender && (
                      <p className="text-[9px] text-rose-500 font-bold">{validationErrors.gender}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. shubman@league.com"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                    {validationErrors.email && (
                      <p className="text-[9px] text-rose-500 font-bold">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                 {/* Profile Photo - Drag and drop block with image compression and resize */}
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                     Profile Portrait Photo (Drag & Drop or Upload) *
                   </label>
                   <div
                     id="player-photo-upload-container"
                     onDragEnter={handleDrag}
                     onDragOver={handleDrag}
                     onDragLeave={handleDrag}
                     onDrop={handleDrop}
                     className={`border-2 border-dashed rounded-3xl p-5 flex flex-col md:flex-row items-center gap-5 transition-all ${
                       dragActive
                         ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10"
                         : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                     }`}
                   >
                     {/* Circular high-quality instant thumbnail preview indicator */}
                     <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 shadow-inner overflow-hidden relative group shrink-0 flex items-center justify-center transition-all duration-250 hover:ring-2 hover:ring-emerald-500">
                       {profilePhoto ? (
                         <>
                           <img
                             src={profilePhoto}
                             alt="Profile snapshot preview"
                             referrerPolicy="no-referrer"
                             className="w-full h-full object-cover transition transform duration-350 group-hover:scale-105 animate-fade-in"
                           />
                           <button
                             type="button"
                             onClick={() => {
                               setProfilePhoto("");
                               setProfilePhotoName("");
                             }}
                             className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-150 flex flex-col items-center justify-center text-white border-none cursor-pointer text-[8px] font-bold uppercase tracking-wider"
                           >
                             <X size={14} className="mb-0.5 text-white" />
                             Remove
                           </button>
                         </>
                       ) : (
                         <div className="flex flex-col items-center justify-center text-slate-350 dark:text-slate-600">
                           <User size={30} className="stroke-1 animate-pulse" />
                           <span className="text-[6.5px] font-black tracking-widest uppercase mt-1">NO PHOTO</span>
                         </div>
                       )}
                     </div>

                     <div className="flex-1 text-center md:text-left space-y-1">
                       <div className="text-slate-400 dark:text-slate-350">
                         <Upload size={16} className="inline mr-1 text-emerald-500 align-middle -mt-0.5" />
                         <span className="text-[10px] font-black uppercase tracking-wider">
                           Drag and Drop photo here
                         </span>
                         <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-400 block pt-0.5 leading-relaxed">
                           Automatic canvas-based sizing compression rescales to highly performance-optimized 300x300 specs.
                         </span>
                       </div>

                       <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start items-center">
                         <label className="inline-block px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer transition border border-transparent">
                           Choose Portrait
                           <input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             onChange={handlePhotoSelect}
                           />
                         </label>
                         {profilePhotoName ? (
                           <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-mono border-none max-w-[170px] truncate">
                             💾 {profilePhotoName}
                           </span>
                         ) : (
                           <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide">
                             ⚠️ Photo Required for Enlistment
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   {validationErrors.profilePhoto && (
                     <p className="text-[9px] text-rose-500 font-bold block pt-1">{validationErrors.profilePhoto}</p>
                   )}
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Government ID file input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Identity Document (Aadhar or Passport) *
                    </label>
                    <div className="flex gap-2 items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-2 rounded-xl">
                      <IdCard size={14} className="text-slate-400 shrink-0" />
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleGovtIdChange}
                        className="text-[10px] cursor-pointer flex-1 text-slate-500"
                      />
                      {govtId && <Check size={14} className="text-emerald-500 shrink-0" />}
                    </div>
                    {validationErrors.govtId && (
                      <p className="text-[9px] text-rose-500 font-bold">{validationErrors.govtId}</p>
                    )}
                  </div>

                  {/* Emergency relationship */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Emergency Contact Relationship *
                    </label>
                    <input
                      type="text"
                      required
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Papa / Spouse phone"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                    {validationErrors.emergencyContact && (
                      <p className="text-[9px] text-rose-500 font-bold">{validationErrors.emergencyContact}</p>
                    )}
                  </div>
                </div>

                {/* Real Firebase Mobile verification with Country Code input & Simulator options */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Mobile Number Verification *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400">Mode:</span>
                      <select
                        value={otpMode}
                        onChange={(e) => {
                          setOtpMode(e.target.value as any);
                          setIsMobileVerified(false);
                          setShowOtpAlert(false);
                          setOtpError("");
                        }}
                        className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 border-none rounded p-1 px-2 cursor-pointer text-slate-600 dark:text-slate-300"
                      >
                        <option value="real">⚡ Real SMS OTP</option>
                        <option value="simulated">🧪 Sandbox Test PIN</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Country Code dropdown/input */}
                    <input
                      type="text"
                      required
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setIsMobileVerified(false);
                      }}
                      placeholder="+91"
                      className="w-16 px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-center focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />

                    {/* Number input */}
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, ""));
                        setIsMobileVerified(false);
                      }}
                      placeholder="10-digit phone"
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={mobile.length !== 10 || isMobileVerified || isOtpSending}
                      className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl border-none cursor-pointer transition ${
                        isMobileVerified
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-slate-900 text-white disabled:bg-slate-100 disabled:text-slate-400 hover:bg-slate-800 flex items-center gap-1"
                      }`}
                    >
                      {isOtpSending && (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                      )}
                      {isMobileVerified ? "✓ Verified" : isOtpSending ? "Sending..." : "Send OTP"}
                    </button>
                  </div>

                  {/* Hidden Firebase Recaptcha mount point */}
                  <div id="recaptcha-container" className="h-0 overflow-hidden" />

                  {validationErrors.mobile && (
                    <p className="text-[9px] text-rose-500 font-bold">{validationErrors.mobile}</p>
                  )}
                  {validationErrors.otp && !isMobileVerified && (
                    <p className="text-[9px] text-rose-500 font-bold">{validationErrors.otp}</p>
                  )}

                  {/* Pin validation / text notification */}
                  <AnimatePresence>
                    {showOtpAlert && (otpGenerated || confirmationResult) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3 space-y-2 overflow-hidden"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-500">
                            {otpMode === "simulated" ? "Simulated Test PIN" : "Firebase SMS OTP Session"}
                          </span>
                          {otpMode === "simulated" && (
                            <span className="font-mono text-xs font-black text-amber-800 bg-amber-100 p-1 px-2 rounded">
                              PIN: {otpGenerated}
                            </span>
                          )}
                          {otpMode === "real" && (
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              SMS Sent to {countryCode} {mobile}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="6-digit PIN"
                            className="flex-1 text-center py-1.5 focus:outline-none text-xs rounded-lg border border-amber-300 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={enteredOtp.length !== 6 || isOtpVerifying}
                            className="px-3 bg-[#d97706] text-white border-none text-[9px] font-black uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1"
                          >
                            {isOtpVerifying && (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Submit
                          </button>
                        </div>
                        {otpError && (
                          <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                            <p className="text-[9px] text-rose-500 dark:text-rose-450 font-bold leading-relaxed">{otpError}</p>
                            {otpMode === "real" && (
                              <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-1">
                                Note: To use Real OTP, please ensure <strong>Phone Auth</strong> is enabled in your Firebase Console, and the current domain is added to authorization domains. Or simply switch to "Sandbox Test PIN" above.
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Cricket information details */}
              <div className="space-y-4 bg-slate-55/35 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-900">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-2 border-b border-white/50 dark:border-slate-800">
                  <Briefcase size={14} className="text-emerald-500" />
                  2. Cricket Role & Style Coordinates
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Playing Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Playing Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-200 outline-none"
                    >
                      <option value="Batter">Batter</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-Rounder">All-Rounder</option>
                      <option value="Wicket-keeper">Wicket-keeper</option>
                    </select>
                  </div>

                  {/* Batting Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                      Batting Hand *
                    </label>
                    <div className="flex gap-4 py-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="battingStyle"
                          value="Right-hand"
                          checked={battingStyle === "Right-hand"}
                          onChange={() => setBattingStyle("Right-hand")}
                          className="accent-emerald-500"
                        />
                        <span>Right Hand</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="battingStyle"
                          value="Left-hand"
                          checked={battingStyle === "Left-hand"}
                          onChange={() => setBattingStyle("Left-hand")}
                          className="accent-emerald-500"
                        />
                        <span>Left Hand</span>
                      </label>
                    </div>
                  </div>

                  {/* Bowling Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Bowling Type Style *
                    </label>
                    <select
                      value={bowlingStyle}
                      onChange={(e) => setBowlingStyle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-200 outline-none"
                    >
                      <option value="None">None (Does not bowl)</option>
                      <option value="Right-arm fast">Right-arm fast</option>
                      <option value="Right-arm medium">Right-arm medium</option>
                      <option value="Right-arm off-spin">Right-arm off-spin</option>
                      <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                      <option value="Left-arm fast">Left-arm fast</option>
                      <option value="Left-arm medium">Left-arm medium</option>
                      <option value="Left-arm off-spin">Left-arm off-spin</option>
                      <option value="Left-arm leg-spin">Left-arm leg-spin</option>
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-450/40 p-3 rounded-2xl">
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 leading-normal">
                    💡 <strong>Auto-Recording Engine:</strong> Players once registered start with zero stats. As soon as games list their name and conclude in creator dashboard, matches played, total runs, wickets taken, economy rates and best figures calculations are written to Firestore automatically!
                  </p>
                </div>
              </div>

              {/* Form Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-250 dark:bg-slate-900 text-slate-655 dark:text-slate-200 text-xs font-black uppercase rounded-xl cursor-pointer border-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer border-none shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Register & Enlist"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
