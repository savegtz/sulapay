import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Fingerprint, 
  Globe, 
  Users, 
  ChevronRight, 
  Camera, 
  ShieldCheck, 
  Check, 
  Share2, 
  Copy,
  Sparkles,
  ScanFace
} from 'lucide-react';
import { Language, ThemeMode, UserProfile } from '../types';
import { AntiSpoofingLabModal } from './AntiSpoofingLabModal';

interface ProfileScreenProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  language: Language;
  onToggleLanguage: () => void;
  theme?: ThemeMode;
  onOpenBiometrics?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  isOpen,
  onClose,
  user,
  language,
  onToggleLanguage,
  theme = 'light',
  onOpenBiometrics
}) => {
  const [activeSubModal, setActiveSubModal] = useState<'PERSONAL' | 'PIN' | 'BIOMETRICS' | 'REFERRAL' | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [facePayEnabled, setFacePayEnabled] = useState(true);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);

  if (!isOpen) return null;

  const [isAntiSpoofingLabOpen, setIsAntiSpoofingLabOpen] = useState(false);
  const isDark = theme === 'dark';

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText('FACEPAY-RIKO-2026');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md min-h-screen pb-20 flex flex-col ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f4f2fb] text-slate-900'
      }`}>

        {/* ============================================================ */}
        {/* TOP PROFILE HEADER WITH LILAC SKY & CITY SILHOUETTES         */}
        {/* ============================================================ */}
        <div className="relative w-full pt-4 pb-14 px-4 bg-gradient-to-b from-[#b8b3f8] via-[#cfcbfd] to-[#e4e2fd] overflow-hidden">
          {/* Decorative City Silhouettes backdrop */}
          <div className="absolute inset-0 pt-8 flex items-end pointer-events-none opacity-40">
            <svg viewBox="0 0 400 120" className="w-full h-full object-cover">
              {/* Modern curved skyscraper & bridge arch */}
              <path d="M0 120 L0 50 Q60 20 120 120 Z" fill="#9381ff" opacity="0.6" />
              <rect x="320" y="20" width="60" height="100" rx="6" fill="#a79ff5" />
              <rect x="330" y="30" width="15" height="15" rx="2" fill="#fff" opacity="0.7" />
              <rect x="355" y="30" width="15" height="15" rx="2" fill="#fff" opacity="0.7" />
              <rect x="330" y="55" width="15" height="15" rx="2" fill="#fff" opacity="0.7" />
              <rect x="355" y="55" width="15" height="15" rx="2" fill="#fff" opacity="0.7" />
              <path d="M280 120 L350 40 L400 120 Z" fill="#b8b8ff" opacity="0.4" />
            </svg>
          </div>

          {/* Navigation Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <button
              id="profile-back-btn"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-95 transition-all hover:bg-slate-50"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {language === 'sw' ? 'Wasifu' : 'Profile'}
            </h2>
            <div className="w-10" />
          </div>

          {/* Centered User Avatar with Camera Badge */}
          <div className="relative z-10 flex flex-col items-center mt-3">
            <div className="relative">
              {/* Yellow circular avatar backdrop matching image */}
              <div className="w-24 h-24 rounded-full p-1 bg-[#fbbf24] shadow-xl flex items-center justify-center overflow-hidden">
                <img
                  src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'}
                  alt="Riko Sapto"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Camera Badge in bottom right */}
              <button
                onClick={() => {
                  if (onOpenBiometrics) onOpenBiometrics();
                }}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-md border-2 border-slate-100 active:scale-95 transition-all"
                title="Update photo"
              >
                <Camera className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Name & Phone */}
            <h3 className="text-lg font-black text-slate-900 mt-2 tracking-tight">
              {user.fullName || 'Riko Sapto'}
            </h3>
            <p className="text-xs text-slate-600 font-mono font-bold mt-0.5">
              {user.phoneNumber || '+62 899-1234-6789'}
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MEMBERSHIP CARD (Gold Member with 3D Hexagon badge)          */}
        {/* ============================================================ */}
        <div className="relative -mt-6 px-4 z-20">
          <div className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center gap-3.5">
              {/* 3D Gold Hexagon Icon */}
              <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                  </defs>
                  {/* Outer hexagon */}
                  <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="url(#goldGrad)" stroke="#fef08a" strokeWidth="3" />
                  {/* Inner bevel */}
                  <polygon points="50,15 80,30 80,70 50,85 20,70 20,30" fill="#eab308" opacity="0.6" />
                  {/* Fast arrow / crown in center */}
                  <path d="M35 60 L50 35 L65 60 L50 50 Z" fill="#78350f" />
                </svg>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Gold Member
                </h4>
                <div className="mt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fde047] text-[#78350f] text-[10px] font-extrabold tracking-tight">
                    Your current account level
                  </span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: ACCOUNT & SECURITY                                */}
        {/* ============================================================ */}
        <div className="px-4 mt-6 space-y-3">
          <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'sw' ? 'Akaunti na Usalama' : 'Account & Security'}
          </h4>

          <div className={`rounded-3xl border divide-y overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800 divide-slate-800/80' : 'bg-white border-slate-100 divide-slate-100'
          }`}>
            {/* 1. Personal Information */}
            <button
              onClick={() => setActiveSubModal('PERSONAL')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sw' ? 'Taarifa Binafsi' : 'Personal Information'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* 2. Change Pin */}
            <button
              onClick={() => setActiveSubModal('PIN')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sw' ? 'Badili Namba ya Siri (PIN)' : 'Change Pin'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* 3. Biometric Settings */}
            <button
              onClick={() => setActiveSubModal('BIOMETRICS')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sw' ? 'Mipangilio ya Kibiolojia (Biometrics)' : 'Biometric Settings'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* 3.5 Biometric Anti-Spoofing & Liveness Lab */}
            <button
              onClick={() => setIsAntiSpoofingLabOpen(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'sw' ? 'Maabara ya Usalama wa Uso' : 'Anti-Spoofing Lab'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-500 text-slate-950">
                      3D AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {language === 'sw' ? 'Kagua uwezo wa kuzuia picha za bandia' : 'Test 3D Liveness & anti-deepfake defense'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* 4. Change Language */}
            <button
              onClick={onToggleLanguage}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sw' ? 'Badili Lugha (Swahili)' : 'Change Language (English)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {language}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: MORE INFORMATION                                  */}
        {/* ============================================================ */}
        <div className="px-4 mt-6 space-y-3">
          <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'sw' ? 'Taarifa Zaidi' : 'More Information'}
          </h4>

          <div className={`rounded-3xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <button
              onClick={() => setActiveSubModal('REFERRAL')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sw' ? 'Alika Marafiki / Namba ya Ushauri' : 'Invite Friends / Referral Code'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Sub Modals */}
        {activeSubModal === 'PERSONAL' && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Personal Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.fullName || 'Riko Sapto'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Phone Number</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{user.phoneNumber || '+62 899-1234-6789'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">National ID / NIDA</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{user.nationalIdNida || '19901234-56789-00001-22'}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveSubModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#543eed] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {activeSubModal === 'BIOMETRICS' && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#543eed]">
                <ScanFace className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Biometric Security Settings
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">FacePay Recognition</span>
                    <span className="text-[10.5px] text-slate-400">Pay using 3D facial biometrics</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={facePayEnabled}
                    onChange={(e) => setFacePayEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#543eed]"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Fingerprint Authorization</span>
                    <span className="text-[10.5px] text-slate-400">Fast sign-in on compatible devices</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fingerprintEnabled}
                    onChange={(e) => setFingerprintEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#543eed]"
                  />
                </div>
              </div>
              <button
                onClick={() => setActiveSubModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#543eed] text-white text-xs font-bold"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeSubModal === 'REFERRAL' && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Share & Earn Rewards
              </h3>
              <p className="text-xs text-slate-500">
                Give your friends $5 bonus on their first FacePay transaction.
              </p>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[#543eed]">FACEPAY-RIKO-2026</span>
                <button
                  onClick={handleCopyReferral}
                  className="px-3 py-1 rounded-xl bg-[#543eed] text-white text-xs font-bold flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <button
                onClick={() => setActiveSubModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {activeSubModal === 'PIN' && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Change 4-Digit PIN
              </h3>
              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Enter current PIN"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center font-mono tracking-widest"
                />
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center font-mono tracking-widest"
                />
              </div>
              <button
                onClick={() => {
                  alert(language === 'sw' ? 'PIN imebadilishwa kikamilifu!' : 'PIN successfully changed!');
                  setActiveSubModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#543eed] text-white text-xs font-bold"
              >
                Update PIN
              </button>
            </div>
          </div>
        )}

        {/* Anti-Spoofing Lab Modal */}
        <AntiSpoofingLabModal
          isOpen={isAntiSpoofingLabOpen}
          onClose={() => setIsAntiSpoofingLabOpen(false)}
          language={language}
          theme={theme}
          user={user}
        />

      </div>
    </div>
  );
};
