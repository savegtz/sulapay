import React, { useState } from 'react';
import { 
  ScanFace, 
  PlusCircle, 
  ArrowUpRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Receipt,
  Smartphone,
  Sparkles,
  Building2,
  ChevronRight,
  Fingerprint,
  QrCode,
  UserCheck,
  WifiOff,
  Users
} from 'lucide-react';
import { Language, Merchant, ThemeMode, Transaction, UserProfile, Wallet } from '../types';
import { translations } from '../utils/translations';
import { formatTZS, formatDate, maskPhoneNumber } from '../utils/formatters';
import { MobileFintechHome } from './MobileFintechHome';
import { SplitBillFlow } from './SplitBillFlow';
import { ProfileScreen } from './ProfileScreen';

interface CustomerDashboardProps {
  user: UserProfile;
  wallet: Wallet;
  transactions: Transaction[];
  merchants: Merchant[];
  language: Language;
  theme?: ThemeMode;
  onInitiatePayment: (merchant?: Merchant) => void;
  onOpenTopUp: () => void;
  onOpenEnrollment: () => void;
  onOpenQR: () => void;
  onOpenOfflineQR?: () => void;
  onOpenAccountSwitcher?: () => void;
  onOpenAuth: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onToggleLanguage?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  wallet,
  transactions,
  merchants,
  language,
  theme = 'light',
  onInitiatePayment,
  onOpenTopUp,
  onOpenEnrollment,
  onOpenQR,
  onOpenOfflineQR,
  onOpenAccountSwitcher,
  onOpenAuth,
  onSelectTransaction,
  onToggleLanguage
}) => {
  const t = translations[language];
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isDesktopSplitBillOpen, setIsDesktopSplitBillOpen] = useState(false);
  const [isDesktopProfileOpen, setIsDesktopProfileOpen] = useState(false);

  const categories = [
    { id: 'ALL', name: language === 'sw' ? 'Zote' : 'All' },
    { id: 'SUPERMARKET', name: language === 'sw' ? 'Maduka' : 'Supermarkets' },
    { id: 'PETROL_STATION', name: language === 'sw' ? 'Mafuta' : 'Fuel' },
    { id: 'TRANSPORT', name: language === 'sw' ? 'Usafiri' : 'Transport' },
    { id: 'RETAIL', name: language === 'sw' ? 'Kariakoo' : 'Retail' },
    { id: 'PHARMACY', name: language === 'sw' ? 'Dawa' : 'Pharmacy' },
  ];

  const filteredMerchants = merchants.filter(m => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lipaNumber.includes(searchQuery) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Mobile Screen: Dedicated Modern Fintech Screen matching User's Image */}
      <div className="md:hidden -mx-3.5 sm:-mx-6 -mt-4 sm:-mt-6">
        <MobileFintechHome
          user={user}
          wallet={wallet}
          transactions={transactions}
          merchants={merchants}
          language={language}
          theme={theme}
          onInitiatePayment={onInitiatePayment}
          onOpenTopUp={onOpenTopUp}
          onOpenQR={onOpenQR}
          onOpenOfflineQR={onOpenOfflineQR}
          onSelectTransaction={onSelectTransaction}
          onOpenSettings={onOpenAccountSwitcher}
          onToggleLanguage={onToggleLanguage}
        />
      </div>

      {/* Desktop / Tablet Dashboard */}
      <div className="hidden md:block space-y-6 sm:space-y-8 pb-16">
        {/* Top Profile Summary */}
      <div 
        onClick={() => setIsDesktopProfileOpen(true)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/70 p-3.5 sm:p-5 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img 
              src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'} 
              alt={user.fullName}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-[#fbbf24] shadow-md shadow-amber-500/20"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 bg-amber-400 text-slate-950 p-0.5 sm:p-1 rounded-full border-2 border-slate-950">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors">
                {user.fullName || 'Riko Sapto'}
              </h2>
              <span className="text-[9.5px] sm:text-[10px] bg-amber-950/80 text-amber-300 font-black px-1.5 py-0.5 rounded border border-amber-800/60 shrink-0">
                Gold Member
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">
              {maskPhoneNumber(user.phoneNumber)} • NIDA: {(user.nationalIdNida || '').slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Biometric Status Pill & Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-1 sm:pt-0">
          {user.isBiometricEnrolled ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs shrink-0">
              <ScanFace className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
              <div>
                <span className="font-semibold block text-[11px] sm:text-xs leading-tight">{t.wallet.biometricStatus}: {t.wallet.enrolled}</span>
                <span className="text-[9.5px] sm:text-[10px] text-emerald-400/80">FacePay: ≤ {formatTZS(user.securitySettings?.maxLimitWithoutPin || 100000)}</span>
              </div>
            </div>
          ) : (
            <button
              id="enroll-face-warning-btn"
              onClick={onOpenEnrollment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all shrink-0"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{t.wallet.enrollNow}</span>
            </button>
          )}

          <button
            id="re-enroll-face-btn"
            onClick={onOpenEnrollment}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors whitespace-nowrap shrink-0"
          >
            {language === 'sw' ? 'Sura' : 'Face'}
          </button>

          <button
            id="open-auth-modal-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 rounded-xl border border-emerald-700/60 transition-colors whitespace-nowrap shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Akaunti' : 'Account'}</span>
          </button>
        </div>
      </div>

      {/* Main Tanzanian Fintech Wallet Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-4 sm:p-7 border border-emerald-700/40 shadow-2xl shadow-emerald-950/40">
        {/* Subtle decorative security background patterns */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-48 h-48 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-emerald-400">
                {t.wallet.balanceTitle}
              </span>
              <button
                id="toggle-balance-visibility-btn"
                onClick={() => setShowBalance(!showBalance)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-emerald-800/40 text-[11px] text-emerald-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[120px]">{(wallet.linkedRail || 'M_PESA').replace('_', ' ')}</span>
            </div>
          </div>

          <div>
            <div className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono">
              {showBalance ? formatTZS(wallet.balance) : 'TZS ••••••••'}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              {t.wallet.available} • BoT TIPS Switch & Firestore Live
            </p>
          </div>

          {/* Wallet Actions: Stacked for Mobile, Grid on Desktop */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-3">
            {/* Primary Action Button: Pay with Face */}
            <button
              id="wallet-pay-face-action-btn"
              onClick={() => onInitiatePayment()}
              className="w-full sm:flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all"
            >
              <ScanFace className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              <span>{t.actions.payFace}</span>
            </button>

            {/* Secondary Action Buttons in 4-column desktop/mobile grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <button
                id="wallet-pay-qr-action-btn"
                onClick={onOpenQR}
                className="flex items-center justify-center gap-1.5 px-2.5 py-3 rounded-2xl bg-teal-950/90 hover:bg-teal-900 text-teal-200 font-semibold text-xs border border-teal-700/60 active:scale-[0.98] transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{language === 'sw' ? 'QR' : 'Pay QR'}</span>
              </button>

              <button
                id="wallet-split-bill-desktop-btn"
                onClick={() => setIsDesktopSplitBillOpen(true)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-3 rounded-2xl bg-purple-950/90 hover:bg-purple-900 text-purple-200 font-semibold text-xs border border-purple-700/60 active:scale-[0.98] transition-all"
              >
                <Receipt className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{language === 'sw' ? 'Gawana' : 'Split Bill'}</span>
              </button>

              {onOpenOfflineQR && (
                <button
                  id="wallet-offline-qr-action-btn"
                  onClick={onOpenOfflineQR}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-3 rounded-2xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs border border-emerald-700/60 active:scale-[0.98] transition-all"
                >
                  <WifiOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Offline</span>
                </button>
              )}

              <button
                id="wallet-top-up-action-btn"
                onClick={onOpenTopUp}
                className="flex items-center justify-center gap-1.5 px-2.5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-100 font-semibold text-xs border border-slate-700/80 active:scale-[0.98] transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{t.wallet.topUp}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Merchants & Lipa Namba Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {language === 'sw' ? 'Lipa kwa Namba au Chagua Duka' : 'Pay by Lipa Namba or Select Merchant'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'sw' 
                ? 'Malipo ya bure bila kadi wala simu kwa maduka yote yanayotumia FacePay'
                : 'Zero-fee payments without phone or card at all FacePay partner locations'}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="merchant-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'sw' ? 'Tafuta duka au Lipa Namba...' : 'Search shop or Lipa Namba...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Merchant Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMerchants.map((merchant) => (
            <div
              key={merchant.id}
              id={`merchant-card-${merchant.id}`}
              onClick={() => onInitiatePayment(merchant)}
              className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800/80 hover:border-emerald-600/50 transition-all duration-200 flex items-center justify-between gap-3 shadow-sm hover:shadow-md hover:shadow-emerald-950/30"
            >
              <div className="flex items-center gap-3">
                <img
                  src={merchant.logo}
                  alt={merchant.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700/60 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {merchant.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {merchant.businessType}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-800">
                      Lipa: {merchant.lipaNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(merchant.settlementRail || 'M_PESA').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              {t.transactions.recentTitle}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {transactions.length} {language === 'sw' ? 'miamala' : 'records'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <p className="text-xs text-slate-400">{t.transactions.noTransactions}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                id={`transaction-row-${tx.id}`}
                onClick={() => onSelectTransaction(tx)}
                className="cursor-pointer bg-slate-900/70 hover:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700/60 shrink-0">
                    <ScanFace className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {tx.merchantName}
                      </span>
                      <span className="text-[9.5px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-mono shrink-0">
                        TIPS Live
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-slate-400 font-mono truncate">
                      <span>{formatDate(tx.timestamp)}</span>
                      <span>•</span>
                      <span className="truncate">{tx.referenceNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold font-mono text-white">
                    -{formatTZS(tx.amount)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] sm:text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{tx.biometricScore ? `${tx.biometricScore}%` : 'TIPS OK'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
      {/* Desktop Split Bill Flow */}
      <SplitBillFlow
        isOpen={isDesktopSplitBillOpen}
        onClose={() => setIsDesktopSplitBillOpen(false)}
        language={language}
        theme={theme}
      />

      {/* Desktop Profile Screen */}
      <ProfileScreen
        isOpen={isDesktopProfileOpen}
        onClose={() => setIsDesktopProfileOpen(false)}
        user={user}
        language={language}
        onToggleLanguage={onToggleLanguage || (() => {})}
        theme={theme}
        onOpenBiometrics={() => {
          setIsDesktopProfileOpen(false);
          onInitiatePayment();
        }}
      />
    </>
  );
};
