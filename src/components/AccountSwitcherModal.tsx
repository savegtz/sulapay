import React from 'react';
import { 
  Users, 
  X, 
  Check, 
  ShieldCheck, 
  Wallet as WalletIcon, 
  ScanFace, 
  ArrowRight,
  Sparkles,
  MapPin
} from 'lucide-react';
import { Language, UserProfile, Wallet } from '../types';
import { DEMO_ACCOUNTS, DemoAccount } from '../data/mockAccounts';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  currentUserId?: string;
  currentWallet?: Wallet;
  language: Language;
  onSelectAccount?: (selectedAccount: DemoAccount) => void;
  onSelectPersona?: (selectedAccount: DemoAccount) => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentUserId,
  currentWallet,
  language,
  onSelectAccount,
  onSelectPersona
}) => {
  if (!isOpen) return null;

  const activeId = currentUser?.id || currentUserId;
  const activeName = currentUser?.fullName;

  const handleSelectAccount = (acc: DemoAccount) => {
    if (onSelectAccount) onSelectAccount(acc);
    if (onSelectPersona) onSelectPersona(acc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-700/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === 'sw' ? 'Badili Akaunti ya Majaribio (Multi-Account Switcher)' : 'Switch Demo Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'sw' 
                  ? 'Chagua akaunti yenye mtandao tofauti (M-Pesa, Tigo, Airtel, Benki) kwa kubofya mara 1' 
                  : 'Instant 1-click test accounts across Tanzanian mobile money & banks'}
              </p>
            </div>
          </div>

          <button
            id="close-account-switcher-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="text-xs text-slate-400 font-medium px-1">
            {language === 'sw' ? 'Akaunti 5 za Kujaribu Zilizopo:' : 'Available Demo Tanzanian Personas:'}
          </div>

          {DEMO_ACCOUNTS.map((acc) => {
            const isActive = 
              (activeId && (activeId === acc.user.id || activeId === acc.id)) ||
              (activeName && activeName === acc.user.fullName);

            return (
              <div
                key={acc.id}
                onClick={() => handleSelectAccount(acc)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={acc.user.faceAvatarUrl}
                      alt={acc.user.fullName}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    {acc.user.isBiometricEnrolled ? (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full border border-slate-950" title="Biometrics Enrolled">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full border border-slate-950" title="Pending Enrollment">
                        <ScanFace className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{acc.user.fullName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-semibold border border-slate-700">
                        {acc.roleBadge}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{acc.user.phoneNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {acc.region}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                      "{acc.tagline}"
                    </p>
                  </div>
                </div>

                {/* Balance pill & action */}
                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80 shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                  <div className="font-mono text-xs text-slate-400">Salio Lililopo</div>
                  <div className="font-mono font-bold text-sm text-emerald-400">
                    {formatTZS(acc.wallet.balance)}
                  </div>
                  <button
                    type="button"
                    className={`mt-1 text-[11px] px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    <span>{isActive ? 'Inatumika Sasa' : 'Tumia Huyu'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            Tanzania TIPS Multi-Tenant Switch Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
