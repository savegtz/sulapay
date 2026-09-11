import React from 'react';
import { 
  ScanFace, 
  Store, 
  Database, 
  Globe, 
  ShieldCheck, 
  AlertCircle,
  Wifi
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  language: Language;
  onToggleLanguage: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  language,
  onToggleLanguage,
  isOnline = true
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-emerald-950/40">
      {/* Sandbox Demo Notification Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
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
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
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

        {/* Navigation Tabs (Customer, Merchant POS, Architecture) */}
        <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
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

        {/* Language Switcher & Network Status */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <Wifi className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span>{isOnline ? 'BOT TIPS Switch Connected' : 'Offline'}</span>
          </div>

          <button
            id="language-toggle-btn"
            onClick={onToggleLanguage}
            title="Toggle Kiswahili / English"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold uppercase">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
