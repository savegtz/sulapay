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
  LogOut
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  language: Language;
  onToggleLanguage: () => void;
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

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-emerald-950/40">
      {/* Sandbox Demo Notification Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-mono tracking-wide truncate">
            {t.demoBanner}
          </span>
          <span className="hidden sm:inline-block ml-auto text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider">
            TIPS Sandbox v2.4
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onSelectRole('LANDING')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/30 group-hover:scale-105 transition-transform">
            <ScanFace className="w-6 h-6 text-emerald-100" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-sans">
                FACEPAY <span className="text-emerald-400">TZ</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                Tanzania
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Tabs - ONLY visible when user has logged in / registered */}
        {isAuthenticated ? (
          <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-landing-btn"
              onClick={() => onSelectRole('LANDING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'LANDING'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden md:inline">{t.nav.landing || 'Nyumbani 3D'}</span>
              <span className="md:hidden">3D</span>
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
              <span className="hidden md:inline">{t.nav.customer}</span>
              <span className="md:hidden">App</span>
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
              <span className="hidden md:inline">{t.nav.merchant}</span>
              <span className="md:hidden">POS</span>
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
              <span className="hidden md:inline">{t.nav.architecture}</span>
              <span className="md:hidden">Schema</span>
            </button>
          </nav>
        ) : (
          /* Unauthenticated badge - explains guest status */
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{language === 'sw' ? 'Mgeni • Ingia au Jisajili ili kuona menyu' : 'Guest • Login to access portals'}</span>
          </div>
        )}

        {/* Quick Action Tools, Auth Buttons & Language Switcher */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Quick Offline QR Trigger Button - Only when authenticated */}
              {onOpenOfflineQR && (
                <button
                  id="header-offline-qr-btn"
                  onClick={onOpenOfflineQR}
                  title={language === 'sw' ? 'Malipo Nje ya Mtandao' : 'Offline QR Payment'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-emerald-400 border border-emerald-800/50 transition-colors"
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
                  title={language === 'sw' ? 'Badili Akaunti (5 Personas)' : 'Switch Account'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline truncate max-w-[100px]">{activeUserName.split(' ')[0]}</span>
                  <span className="text-[10px] text-emerald-400 font-mono hidden md:inline">({activeRail.replace('_', ' ')})</span>
                </button>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title={language === 'sw' ? 'Ondoka kwenye akaunti' : 'Log out'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-red-950/50 text-slate-400 hover:text-red-300 text-xs font-semibold border border-slate-800 hover:border-red-800/60 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.nav.logout || 'Ondoka'}</span>
                </button>
              )}
            </>
          ) : (
            /* Unauthenticated state: prominent Login and Register buttons */
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.nav.login || 'Ingia'}</span>
              </button>

              <button
                id="header-register-btn"
                onClick={onOpenRegister}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.nav.register || 'Jisajili'}</span>
              </button>
            </div>
          )}

          {/* Language Toggle */}
          <button
            id="language-toggle-btn"
            onClick={onToggleLanguage}
            title="Toggle Kiswahili / English"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
