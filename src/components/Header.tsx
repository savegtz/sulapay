import React from 'react';
import { 
  ScanFace, 
  Store, 
  Database, 
  Globe, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Users,
  WifiOff,
  LogIn,
  UserPlus,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { Language, ThemeMode, UserRole } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  language: Language;
  onToggleLanguage: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isAuthenticated?: boolean;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onLogout?: () => void;
  isOnline?: boolean;
  onOpenAccountSwitcher?: () => void;
  onOpenOfflineQR?: () => void;
  activeUserName?: string;
  activeRail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  isAuthenticated = false,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  isOnline = true,
  onOpenAccountSwitcher,
  onOpenOfflineQR,
  activeUserName = 'Juma Mkwawa',
  activeRail = 'M-Pesa'
}) => {
  const t = translations[language];
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 ${
      isDark ? 'bg-slate-950/95 border-emerald-950/40 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Live System Status Bar */}
      <div className={`border-b px-3 sm:px-4 py-1 text-[11px] sm:text-xs flex items-center justify-between transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-800/30 text-emerald-300' 
          : 'bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-100/90 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full overflow-hidden">
          <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          <span className={`font-mono tracking-tight truncate text-[10.5px] sm:text-xs ${isDark ? 'text-emerald-200' : 'text-emerald-900 font-medium'}`}>
            {t.demoBanner}
          </span>
          <span className={`hidden sm:inline-block ml-auto text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
            isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-200/70 text-emerald-900 border-emerald-300'
          }`}>
            BoT TIPS Live
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onSelectRole('LANDING')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30 group-hover:scale-105 transition-transform shrink-0">
            <ScanFace className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-emerald-100" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 ${isDark ? 'border-slate-950' : 'border-white'}`}></span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-base sm:text-lg font-black tracking-tight font-sans whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
              FACEPAY <span className="text-emerald-500">TZ</span>
            </span>
            <span className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${
              isDark ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              Tanzania
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on mobile phones, replaced by thumb-friendly Bottom Nav) */}
        {isAuthenticated ? (
          <nav className={`hidden md:flex items-center p-1 rounded-xl border transition-colors ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              id="nav-landing-btn"
              onClick={() => onSelectRole('LANDING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'LANDING'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t.nav.landing || 'Nyumbani'}</span>
            </button>

            <button
              id="nav-customer-btn"
              onClick={() => onSelectRole('CUSTOMER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'CUSTOMER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.nav.customer}</span>
            </button>

            <button
              id="nav-merchant-btn"
              onClick={() => onSelectRole('MERCHANT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'MERCHANT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>{t.nav.merchant}</span>
            </button>

            <button
              id="nav-architecture-btn"
              onClick={() => onSelectRole('ARCHITECT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'ARCHITECT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{t.nav.architecture}</span>
            </button>
          </nav>
        ) : (
          /* Unauthenticated badge - subtle on tablet/desktop */
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{language === 'sw' ? 'Mgeni • Ingia au Jisajili' : 'Guest • Login or Register'}</span>
          </div>
        )}

        {/* Quick Action Tools, Auth Buttons & Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Quick Offline QR Trigger Button - Only when authenticated */}
              {onOpenOfflineQR && (
                <button
                  id="header-offline-qr-btn"
                  onClick={onOpenOfflineQR}
                  title={language === 'sw' ? 'Malipo Nje ya Mtandao' : 'Offline QR Payment'}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-800/50'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Offline QR</span>
                </button>
              )}

              {/* Quick Account Switcher Trigger Button - Only when authenticated */}
              {onOpenAccountSwitcher && (
                <button
                  id="header-account-switcher-btn"
                  onClick={onOpenAccountSwitcher}
                  title={language === 'sw' ? 'Badili Akaunti' : 'Switch Account'}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline truncate max-w-[90px]">{activeUserName.split(' ')[0]}</span>
                </button>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title={language === 'sw' ? 'Ondoka kwenye akaunti' : 'Log out'}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border-slate-800 hover:border-red-800/60'
                      : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border-slate-200 hover:border-red-300'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.nav.logout || 'Ondoka'}</span>
                </button>
              )}
            </>
          ) : (
            /* Unauthenticated state: prominent Login and Register buttons */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="header-login-btn"
                onClick={onOpenLogin}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border active:scale-95 transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.nav.login || 'Ingia'}</span>
              </button>

              <button
                id="header-register-btn"
                onClick={onOpenRegister}
                className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[11px] sm:text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.nav.register || 'Jisajili'}</span>
              </button>
            </div>
          )}

          {/* Theme Mode Toggle Button (Light Mode & Dark Mode Icon) */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            title={
              isDark
                ? (language === 'sw' ? 'Badili kwenda Mwanga (Light Mode)' : 'Switch to Light Mode')
                : (language === 'sw' ? 'Badili kwenda Giza (Dark Mode)' : 'Switch to Dark Mode')
            }
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`flex items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all active:scale-95 shrink-0 ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800 hover:border-amber-500/40 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-indigo-500/40 shadow-sm'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="hidden sm:inline font-medium text-amber-200/90 text-[10.5px]">Mwanga</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="hidden sm:inline font-medium text-slate-700 text-[10.5px]">Giza</span>
              </>
            )}
          </button>

          {/* Language Toggle */}
          <button
            id="language-toggle-btn"
            onClick={onToggleLanguage}
            title="Toggle Kiswahili / English"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-colors shrink-0 ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span className="uppercase font-mono">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
