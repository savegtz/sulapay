import React, { useState } from 'react';
import { 
  Home as HomeIcon,
  Receipt,
  Scan,
  Mail,
  Settings as SettingsIcon,
  Sparkles, 
  Wallet as WalletIcon, 
  ScanFace, 
  Store, 
  Database,
  X,
  Bell,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Language, ThemeMode, UserRole } from '../types';

interface MobileBottomNavProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  language: Language;
  isAuthenticated: boolean;
  theme?: ThemeMode;
  onOpenLogin: () => void;
  onOpenRegister?: () => void;
  onOpenFacePay: () => void;
  onOpenSettings?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRole,
  onSelectRole,
  language,
  isAuthenticated,
  theme = 'light',
  onOpenLogin,
  onOpenFacePay,
  onOpenSettings
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'HOME' | 'EXPENSES' | 'PAY' | 'INBOX' | 'SETTINGS'>('HOME');
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // When NOT authenticated, keep the simple guest navigation
  if (!isAuthenticated) {
    return (
      <nav 
        aria-label="Mobile Bottom Navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl border-t px-2 py-1.5 pb-safe transition-colors duration-200 ${
          isDark 
            ? 'bg-slate-950/95 border-slate-800/80 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]' 
            : 'bg-white/95 border-slate-200 shadow-[0_-10px_25px_rgba(0,0,0,0.08)]'
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            id="mobile-nav-landing-guest-btn"
            onClick={() => onSelectRole('LANDING')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              currentRole === 'LANDING'
                ? isDark ? 'text-indigo-400 font-bold scale-105' : 'text-indigo-600 font-bold scale-105'
                : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <HomeIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">
              {language === 'sw' ? 'Nyumbani' : 'Home'}
            </span>
          </button>

          {/* Center FacePay trigger */}
          <div className="relative -top-3 flex flex-col items-center">
            <button
              id="mobile-guest-facepay-btn"
              onClick={onOpenLogin}
              className="w-13 h-13 rounded-2xl bg-indigo-950 dark:bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-indigo-900/30 border-2 border-indigo-400/40 active:scale-95 transition-transform"
            >
              <Scan className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <span className="text-[9.5px] font-extrabold tracking-tight mt-0.5 text-indigo-600 dark:text-indigo-400">
              {language === 'sw' ? 'Lipa' : 'Pay'}
            </span>
          </div>

          <button
            id="mobile-nav-login-guest-btn"
            onClick={onOpenLogin}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">
              {language === 'sw' ? 'Ingia' : 'Login'}
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // When AUTHENTICATED: Exact 5-tab fintech navigation matching the user's uploaded image!
  return (
    <>
      <nav 
        aria-label="Mobile Bottom Navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl border-t px-3 py-1.5 pb-safe transition-colors duration-200 ${
          isDark 
            ? 'bg-slate-950/95 border-slate-850 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]' 
            : 'bg-white/95 border-slate-100 shadow-[0_-10px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-1">
          
          {/* TAB 1: Home */}
          <button
            id="mobile-nav-home-btn"
            onClick={() => {
              setActiveTab('HOME');
              onSelectRole('CUSTOMER');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all ${
              activeTab === 'HOME'
                ? isDark ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HomeIcon className={`w-5 h-5 mb-0.5 ${activeTab === 'HOME' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10.5px] tracking-tight">
              {language === 'sw' ? 'Nyumbani' : 'Home'}
            </span>
          </button>

          {/* TAB 2: Expenses */}
          <button
            id="mobile-nav-expenses-btn"
            onClick={() => {
              setActiveTab('EXPENSES');
              onSelectRole('CUSTOMER');
              // Scroll to recent transactions section
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all ${
              activeTab === 'EXPENSES'
                ? isDark ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt className={`w-5 h-5 mb-0.5 ${activeTab === 'EXPENSES' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10.5px] tracking-tight">
              {language === 'sw' ? 'Matumizi' : 'Expenses'}
            </span>
          </button>

          {/* CENTER TAB 3: Pay (Dark Rounded Square Floating Button Matching Image) */}
          <div className="relative -top-3 flex flex-col items-center">
            <button
              id="mobile-nav-pay-center-btn"
              onClick={() => {
                setActiveTab('PAY');
                onOpenFacePay();
              }}
              className="w-13 h-13 rounded-2xl bg-[#1e144f] hover:bg-[#281a6d] dark:bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-indigo-950/40 border-2 border-indigo-400/40 active:scale-95 transition-transform"
              aria-label="Pay"
            >
              <Scan className="w-6 h-6 text-white stroke-[2.4]" />
            </button>
            <span className="text-[10.5px] font-bold tracking-tight mt-0.5 text-indigo-700 dark:text-indigo-400">
              {language === 'sw' ? 'Lipa' : 'Pay'}
            </span>
          </div>

          {/* TAB 4: Inbox with Notification Badge */}
          <button
            id="mobile-nav-inbox-btn"
            onClick={() => {
              setActiveTab('INBOX');
              setIsInboxOpen(true);
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition-all ${
              activeTab === 'INBOX'
                ? isDark ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <Mail className={`w-5 h-5 mb-0.5 ${activeTab === 'INBOX' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-slate-900" />
            </div>
            <span className="text-[10.5px] tracking-tight">
              {language === 'sw' ? 'Ujumbe' : 'Inbox'}
            </span>
          </button>

          {/* TAB 5: Settings */}
          <button
            id="mobile-nav-settings-btn"
            onClick={() => {
              setActiveTab('SETTINGS');
              if (onOpenSettings) {
                onOpenSettings();
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all ${
              activeTab === 'SETTINGS'
                ? isDark ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <SettingsIcon className={`w-5 h-5 mb-0.5 ${activeTab === 'SETTINGS' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10.5px] tracking-tight">
              {language === 'sw' ? 'Mipangilio' : 'Settings'}
            </span>
          </button>

        </div>
      </nav>

      {/* INBOX DRAWER / MODAL */}
      {isInboxOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'sw' ? 'Ujumbe na Arifa' : 'Inbox & Alerts'}
                  </h3>
                  <p className="text-[10px] text-slate-400">BoT TIPS Direct Notifications</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInboxOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Malipo Yamethibitishwa' : 'Payment Confirmed'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {language === 'sw' 
                    ? 'Malipo yako ya TZS 14,500 kwa Shoppers Supermarket yamethibitishwa kwa Sura kupitia BoT TIPS.' 
                    : 'Your TZS 14,500 payment to Shoppers Supermarket was verified via FacePay on BoT TIPS.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Ulinzi wa NIDA na Sura' : 'Biometric Security Active'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {language === 'sw'
                    ? 'Kitambulisho chako cha NIDA kimeunganishwa kikamilifu na benki na pochi yako ya simu.'
                    : 'Your NIDA ID is securely linked with your banking and mobile money switch.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsInboxOpen(false)}
              className="w-full py-2.5 mt-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
            >
              {language === 'sw' ? 'Funga' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
