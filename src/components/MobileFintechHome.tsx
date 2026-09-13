import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Send as SendIcon,
  ArrowUpRight,
  ArrowDownToLine,
  Wallet as WalletIcon,
  Receipt,
  Zap,
  TrendingUp,
  Tv,
  BookOpen,
  HeartHandshake,
  Gamepad2,
  Smartphone,
  LayoutGrid,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  CreditCard,
  ScanFace,
  QrCode,
  Sparkles,
  ArrowDownRight,
  Check,
  Building2,
  DollarSign,
  ArrowRight,
  Sparkles as SparklesIcon,
  Tag,
  Search,
  Bell,
  WifiOff,
  Store,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Language, Merchant, ThemeMode, Transaction, UserProfile, Wallet } from '../types';
import { formatTZS, formatDate } from '../utils/formatters';
import { SplitBillFlow } from './SplitBillFlow';
import { ProfileScreen } from './ProfileScreen';
import { SpendingAnalyticsModal } from './SpendingAnalyticsModal';
import { CardsAndBanksModal } from './CardsAndBanksModal';
import { NotificationsSoundboxModal } from './NotificationsSoundboxModal';
import { RewardsLoyaltyModal } from './RewardsLoyaltyModal';
import { OfflineMeshPaymentModal } from './OfflineMeshPaymentModal';
import { TraReceiptModal } from './TraReceiptModal';
import { MerchantPosModal } from './MerchantPosModal';
import { VicobaGroupSavingsModal } from './VicobaGroupSavingsModal';

interface MobileFintechHomeProps {
  user: UserProfile;
  wallet: Wallet;
  transactions: Transaction[];
  merchants: Merchant[];
  language: Language;
  theme?: ThemeMode;
  onInitiatePayment: (merchant?: Merchant) => void;
  onOpenTopUp: () => void;
  onOpenQR: () => void;
  onOpenOfflineQR?: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSettings?: () => void;
  onToggleLanguage?: () => void;
}

interface ServiceModalState {
  isOpen: boolean;
  serviceName: string;
  serviceCategory: string;
  icon: React.ReactNode;
  placeholder: string;
  label: string;
}

export const MobileFintechHome: React.FC<MobileFintechHomeProps> = ({
  user,
  wallet,
  transactions,
  merchants,
  language,
  theme = 'light',
  onInitiatePayment,
  onOpenTopUp,
  onOpenQR,
  onOpenOfflineQR,
  onSelectTransaction,
  onOpenSettings,
  onToggleLanguage
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [currencyMode, setCurrencyMode] = useState<'TZS' | 'USD'>('USD');
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);
  const [promoModal, setPromoModal] = useState<{ title: string; desc: string; code: string; discount: string } | null>(null);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCardsAndBanksOpen, setIsCardsAndBanksOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isOfflineMeshOpen, setIsOfflineMeshOpen] = useState(false);
  const [isMerchantPosOpen, setIsMerchantPosOpen] = useState(false);
  const [isVicobaOpen, setIsVicobaOpen] = useState(false);
  const [selectedTraTx, setSelectedTraTx] = useState<Transaction | null>(null);
  const isDark = theme === 'dark';

  // Quick service bill payment modal
  const [serviceModal, setServiceModal] = useState<ServiceModalState>({
    isOpen: false,
    serviceName: '',
    serviceCategory: '',
    icon: null,
    placeholder: '',
    label: ''
  });
  const [serviceAccountInput, setServiceAccountInput] = useState('');
  const [serviceAmountInput, setServiceAmountInput] = useState('10000');
  const [serviceSuccess, setServiceSuccess] = useState(false);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'sw') {
      if (hour < 12) return 'Habari za Asubuhi,';
      if (hour < 16) return 'Habari za Mchana,';
      return 'Habari za Jioni,';
    } else {
      if (hour < 12) return 'Good Morning,';
      if (hour < 16) return 'Good Afternoon,';
      return 'Good Evening,';
    }
  };

  const handleOpenService = (
    serviceName: string, 
    serviceCategory: string, 
    icon: React.ReactNode, 
    placeholder: string, 
    label: string
  ) => {
    setServiceModal({
      isOpen: true,
      serviceName,
      serviceCategory,
      icon,
      placeholder,
      label
    });
    setServiceAccountInput('');
    setServiceAmountInput('10000');
    setServiceSuccess(false);
  };

  const handlePayService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceAccountInput) return;
    setServiceSuccess(true);
    setTimeout(() => {
      setServiceModal(prev => ({ ...prev, isOpen: false }));
      setServiceSuccess(false);
      // Trigger payment dialog
      onInitiatePayment();
    }, 900);
  };

  // Convert wallet balance if USD mode is active (approx $1 = TZS 2,600)
  const formattedBalance = currencyMode === 'USD' 
    ? `$${(wallet.balance / 2600).toFixed(2)}`
    : formatTZS(wallet.balance);

  return (
    <div className={`w-full max-w-md mx-auto transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f4f2fb] text-slate-900'
    } min-h-screen pb-28 select-none font-sans`}>
      
      {/* TOP HEADER & HERO SECTION (Soft Violet / Indigo Backdrop) */}
      <div className={`relative pt-4 pb-12 px-4 rounded-b-[2.5rem] overflow-hidden transition-colors ${
        isDark 
          ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-b from-[#e3e2fd] via-[#eceaff] to-[#f4f2fb]'
      }`}>
        {/* Soft atmospheric background lights */}
        <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -left-12 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

        {/* Top Profile Bar */}
        <div className="relative z-10 flex items-center justify-between">
          {/* User Profile Info - Clickable to open Profile */}
          <button
            id="mobile-user-profile-header-btn"
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 text-left group active:scale-98 transition-transform cursor-pointer"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-0.5 bg-[#fbbf24] shadow-md shadow-amber-500/20 flex items-center justify-center overflow-hidden">
                <img 
                  src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'} 
                  alt={user.fullName || 'Riko Sapto'}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Gold Badge Pill */}
              <span className="absolute -bottom-1 -left-1 flex items-center gap-0.5 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm border border-white">
                <span>🪙</span>
                <span>Gold</span>
              </span>
            </div>

            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-indigo-200' : 'text-slate-600'}`}>
                {getGreeting()}
              </p>
              <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-[#543eed] transition-colors`}>
                {user.fullName || 'Riko Sapto'}
              </h2>
            </div>
          </button>

          {/* Action Icons: Offline Mesh, Merchant POS, Notifications Bell & Rewards Voucher */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Offline Mesh Mode Toggle */}
            <button 
              id="mobile-offline-mesh-btn"
              onClick={() => setIsOfflineMeshOpen(true)}
              title={language === 'sw' ? 'Malipo Bila Mtandao (Offline Mesh)' : 'Offline Mesh Pay'}
              className="relative p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-sm border border-emerald-300 dark:border-emerald-800/60 active:scale-95 transition-transform"
            >
              <WifiOff className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </button>

            {/* Merchant POS Mode */}
            <button 
              id="mobile-merchant-pos-btn"
              onClick={() => setIsMerchantPosOpen(true)}
              title={language === 'sw' ? 'Hali ya Muuzaji (POS)' : 'Merchant POS Counter'}
              className="relative p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-sm border border-purple-200 dark:border-slate-700 active:scale-95 transition-transform"
            >
              <Store className="w-4.5 h-4.5 text-[#543eed] dark:text-purple-400" />
            </button>

            {/* 1. Notifications & Soundbox Bell */}
            <div className="relative">
              <button 
                id="mobile-notifications-btn"
                onClick={() => setIsNotificationsOpen(true)}
                title={language === 'sw' ? 'Arifa & Soundbox' : 'Notifications & Soundbox'}
                className="relative p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-sm border border-purple-200 dark:border-slate-700 active:scale-95 transition-transform"
              >
                <Bell className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              </button>
              {/* Unread badge 4 */}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#543eed] text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
                4
              </span>
            </div>

            {/* 2. Floating Bill / Reward Voucher Badge */}
            <div className="relative">
              <button 
                id="mobile-rewards-voucher-btn"
                onClick={() => setIsRewardsOpen(true)}
                title={language === 'sw' ? 'Vocha na Zawadi za Gold Member' : 'Gold Member Rewards & Vouchers'}
                className="relative p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-sm border border-purple-200 dark:border-slate-700 active:scale-95 transition-transform"
              >
                {/* Stylized floating receipt icon with coin badge */}
                <div className="relative">
                  <Receipt className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-500 text-slate-950 font-bold text-[7px] flex items-center justify-center border border-white dark:border-slate-900 shadow-xs">
                    $
                  </span>
                </div>
              </button>
              {/* Promo badge */}
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
            </div>
          </div>
        </div>

        {/* Hero Artwork: Cheerful Character with Phone, Couch & Floating Coins */}
        <div className="relative mt-2 px-2 flex items-center justify-center">
          <div className="relative w-full max-w-[340px] h-[190px] rounded-2xl overflow-hidden flex items-center justify-center">
            {/* Background couch & tech lifestyle graphic */}
            <img 
              src="/src/assets/images/fintech_mobile_hero_1789252755146.jpg" 
              alt="Fintech Lifestyle"
              className="w-full h-full object-cover rounded-2xl drop-shadow-sm transition-transform duration-500 hover:scale-105"
            />
            {/* Floating ambient badge 1: Green Profit Coin */}
            <div className="absolute top-4 left-6 bg-white/95 dark:bg-slate-900/95 px-2 py-1 rounded-full shadow-md flex items-center gap-1 border border-emerald-200/80 animate-bounce text-[10.5px] font-bold text-emerald-600">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black">$</span>
              <span>+TIPS</span>
            </div>
            {/* Floating ambient badge 2: Digital Wallet */}
            <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 border border-purple-200/80 text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
              <ScanFace className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>FacePay</span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING CARD 1: CURRENT BALANCE & QUICK ACCESS */}
      <div className="relative -mt-10 px-4 z-20 space-y-3">
        {/* Unregistered Biometrics Warning Banner */}
        {!user.isBiometricEnrolled && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-3 text-left shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-500 dark:text-amber-400">
                  {language === 'sw' ? 'Hujasajili Uso Wako!' : 'Face Not Enrolled!'}
                </p>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400 truncate">
                  {language === 'sw' ? 'Sajili uso sasa ili kuwezesha malipo ya FacePay.' : 'Enroll face to enable FacePay checkouts.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0 shadow-sm transition-all active:scale-95"
            >
              {language === 'sw' ? 'Sajili Sasa' : 'Enroll Now'}
            </button>
          </div>
        )}

        <div className={`rounded-3xl p-5 shadow-xl transition-all duration-200 ${
          isDark 
            ? 'bg-slate-900/95 border border-slate-800 shadow-slate-950/60' 
            : 'bg-white border border-slate-100/90 shadow-indigo-900/5'
        }`}>
          {/* Balance Row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {language === 'sw' ? 'Salio Lililopo' : 'Current Balance'}
              </p>
              <div className="flex items-center gap-2.5 mt-1">
                <span className={`text-2xl xs:text-3xl font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {showBalance ? formattedBalance : '••••••••'}
                </span>
                <button
                  id="mobile-toggle-balance-btn"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 p-1 transition-colors"
                  title={showBalance ? "Hide Balance" : "Show Balance"}
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Currency Mode Switcher Pill & Cards/Banks Button */}
            <div className="flex items-center gap-1.5">
              <button
                id="manage-cards-banks-btn"
                onClick={() => setIsCardsAndBanksOpen(true)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 transition-colors ${
                  isDark 
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800 hover:bg-purple-900/40' 
                    : 'bg-purple-50 text-[#543eed] border-purple-200 hover:bg-purple-100'
                }`}
                title={language === 'sw' ? 'Dhibiti Kadi & Benki' : 'Manage Cards & Banks'}
              >
                <CreditCard className="w-3 h-3" />
                <span>{language === 'sw' ? 'Kadi' : 'Cards'}</span>
              </button>

              <button
                id="currency-toggle-pill"
                onClick={() => setCurrencyMode(prev => prev === 'TZS' ? 'USD' : 'TZS')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  isDark 
                    ? 'bg-slate-800 text-indigo-300 border-slate-700' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}
              >
                {currencyMode}
              </button>
            </div>
          </div>

          {/* Quick Access Section Heading */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
              {language === 'sw' ? 'Upatikanaji wa Haraka' : 'Quick Access'}
            </h3>

            {/* 4 Circular Action Buttons Matching Image */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* 1. SEND (Tuma) */}
              <button
                id="quick-access-send-btn"
                onClick={() => onInitiatePayment()}
                className="flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center shadow-xs group-hover:bg-emerald-100 transition-colors">
                  <div className="relative">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                      $
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute -top-1 -right-1.5 stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">
                  {language === 'sw' ? 'Tuma' : 'Send'}
                </span>
              </button>

              {/* 2. WITHDRAW (Toa) */}
              <button
                id="quick-access-withdraw-btn"
                onClick={() => {
                  handleOpenService(
                    language === 'sw' ? 'Kutoa Fedha kwa Wakala' : 'Agent Cash Withdrawal',
                    'CASH_OUT',
                    <ArrowDownToLine className="w-6 h-6 text-sky-500" />,
                    'Weka Namba ya Wakala (e.g. 19283)',
                    language === 'sw' ? 'Namba ya Wakala au ATM' : 'Agent or ATM Number'
                  );
                }}
                className="flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center shadow-xs group-hover:bg-indigo-100 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">
                  {language === 'sw' ? 'Toa' : 'Withdraw'}
                </span>
              </button>

              {/* 3. TOPUP (Weka) */}
              <button
                id="quick-access-topup-btn"
                onClick={onOpenTopUp}
                className="flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center shadow-xs group-hover:bg-amber-100 transition-colors">
                  <div className="relative">
                    <WalletIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
                    <span className="absolute -top-1 -right-1.5 w-3 h-3 rounded-full bg-indigo-600 text-white font-black text-[9px] flex items-center justify-center">
                      +
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">
                  {language === 'sw' ? 'Weka' : 'Topup'}
                </span>
              </button>

              {/* 4. SPLIT BILL (Gawana) */}
              <button
                id="quick-access-split-btn"
                onClick={() => setIsSplitBillOpen(true)}
                className="flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center shadow-xs group-hover:bg-purple-100 transition-colors">
                  <div className="relative">
                    <Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400 stroke-[2.2]" />
                    <span className="absolute -top-1 -right-1.5 w-3 h-3 rounded-full bg-emerald-500 text-white font-black text-[9px] flex items-center justify-center">
                      +
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">
                  {language === 'sw' ? 'Gawana' : 'Split Bill'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE GRID SECTION (Bottom Sheet Appearance with rounded grab bar) */}
      <div className={`mt-5 mx-4 rounded-3xl p-4.5 sm:p-5 transition-colors ${
        isDark ? 'bg-slate-900/80 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
      }`}>
        {/* Pull handle bar */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4.5" />

        {/* 8 Soft Purple Circle Services Grid matching the screenshot (2 rows x 4 cols) */}
        <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
          
          {/* 1. Electricity (LUKU) */}
          <button
            id="service-electricity-btn"
            onClick={() => {
              handleOpenService(
                language === 'sw' ? 'LUKU / Tanesco (Umeme)' : 'Electricity (LUKU)',
                'UTILITIES',
                <Zap className="w-6 h-6 text-amber-500" />,
                '0428-9102-3921',
                language === 'sw' ? 'Namba ya Mita ya LUKU' : 'LUKU Meter Number'
              );
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="relative">
                <Zap className="w-7 h-7 text-amber-500 fill-amber-400 stroke-[1.8]" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Umeme' : 'Electricity'}
            </span>
          </button>

          {/* 2. Investment (Uwekezaji / UTT AMIS) */}
          <button
            id="service-investment-btn"
            onClick={() => {
              handleOpenService(
                language === 'sw' ? 'Uwekezaji UTT AMIS / Hati Fungani' : 'UTT AMIS Investment',
                'INVESTMENT',
                <TrendingUp className="w-6 h-6 text-indigo-500" />,
                'UTT-782910-TZ',
                language === 'sw' ? 'Namba ya Akaunti ya UTT' : 'UTT Account ID'
              );
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TrendingUp className="w-7 h-7 text-indigo-600 stroke-[2.4]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Uwekezaji' : 'Investment'}
            </span>
          </button>

          {/* 3. Internet (Vifurushi) */}
          <button
            id="service-internet-btn"
            onClick={() => {
              handleOpenService(
                language === 'sw' ? 'Vifurushi vya Mtandao' : 'Internet Bundles',
                'DATA',
                <Tv className="w-6 h-6 text-pink-500" />,
                '0754 123 456',
                language === 'sw' ? 'Namba ya Simu ya Kifurushi' : 'Target Phone Number'
              );
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Tv className="w-7 h-7 text-fuchsia-600 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Mtandao' : 'Internet'}
            </span>
          </button>

          {/* 4. Education (Ada za Shule & Vyuo) */}
          <button
            id="service-education-btn"
            onClick={() => {
              handleOpenService(
                language === 'sw' ? 'Ada za Shule na Vyuo' : 'School & College Fees',
                'EDUCATION',
                <BookOpen className="w-6 h-6 text-orange-500" />,
                '99120019230',
                language === 'sw' ? 'Control Number ya Ada' : 'Tuition Control Number'
              );
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7 text-amber-600 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Ada' : 'Education'}
            </span>
          </button>

          {/* 5. Vicoba (Vikundi vya Akiba Shirikishi & Escrow) */}
          <button
            id="service-vicoba-btn"
            onClick={() => setIsVicobaOpen(true)}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="relative flex flex-col items-center justify-center">
                <Users className="w-7 h-7 text-teal-600 stroke-[2.2]" />
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full bg-teal-600 text-white text-[8px] font-black">
                  TIPS
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Vicoba' : 'Vicoba'}
            </span>
          </button>

          {/* 6. Games (Michezo & Burudani) - Exact image style: Pink Gamepad */}
          <button
            id="service-games-btn"
            onClick={() => {
              handleOpenService(
                language === 'sw' ? 'Michezo na Burudani' : 'Gaming & Entertainment',
                'GAMING',
                <Gamepad2 className="w-6 h-6 text-rose-500" />,
                'USER-ID-9182',
                language === 'sw' ? 'Kitambulisho cha Mchezaji' : 'Player ID'
              );
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-[#f43f77]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 6h-15C3.12 6 2 7.12 2 8.5v7C2 16.88 3.12 18 4.5 18c.95 0 1.83-.54 2.24-1.39l.86-1.78c.2-.42.63-.69 1.1-.69h6.6c.47 0 .9.27 1.1.69l.86 1.78c.41.85 1.29 1.39 2.24 1.39 1.38 0 2.5-1.12 2.5-2.5v-7c0-1.38-1.12-2.5-2.5-2.5zM7.5 13h-1v1c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-1h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1v-1c0-.28.22-.5.5-.5s.5.22.5.5v1h1c.28 0 .5.22.5.5s-.22.5-.5.5zm8.5-1.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Michezo' : 'Games'}
            </span>
          </button>

          {/* 7. E-Money (Pochi za Simu & Kadi) */}
          <button
            id="service-emoney-btn"
            onClick={() => setIsCardsAndBanksOpen(true)}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="relative">
                {/* Purple phone */}
                <div className="w-6 h-9 rounded-[5px] bg-[#673ab7] p-0.5 flex flex-col justify-center items-center shadow-xs">
                  {/* Orange contactless card badge */}
                  <div className="w-5 h-3.5 rounded-[3px] bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full border border-white/80" />
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Pochi' : 'E-Money'}
            </span>
          </button>

          {/* 8. More (Zaidi) - Exact image style: 4 Colorful Round Petals */}
          <button
            id="service-more-btn"
            onClick={onOpenQR}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#f2e7fe] dark:bg-purple-950/40 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="grid grid-cols-2 gap-1 p-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7c4dff]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#00bcd4]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5722]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#e91e63]" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
              {language === 'sw' ? 'Zaidi' : 'More'}
            </span>
          </button>
        </div>
      </div>

      {/* TRANSACTIONS SECTION - EXACT MATCH TO USER IMAGE */}
      <div className="mt-6 mx-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'sw' ? 'Miamala' : 'Transactions'}
          </h3>
          <button
            id="see-all-transactions-btn"
            onClick={() => setShowAllTransactionsModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-[#6246ea] dark:text-indigo-400 hover:text-[#5235db] transition-colors"
          >
            <span>{language === 'sw' ? 'Tazama yote' : 'See all'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* 3 Transaction Cards with exact styling from uploaded image */}
        <div className="space-y-3">
          
          {/* 1. Netflix Card */}
          <div
            onClick={() => {
              onSelectTransaction({
                id: 'tx-netflix-sub',
                userId: user.id,
                userName: user.fullName,
                merchantId: 'merch-netflix',
                merchantName: 'Netflix',
                merchantLipaNumber: 'NETFLIX-GLOBAL',
                amount: currencyMode === 'USD' ? 22.99 : 59500,
                status: 'COMPLETED',
                paymentRail: 'VISA',
                referenceNumber: 'FP-NTFX-9921',
                externalProviderRef: 'TIPS-VISA-882190',
                verificationMode: 'FACIAL_BIOMETRICS',
                faceMatchScore: 99.4,
                createdAt: new Date().toISOString()
              });
            }}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer active:scale-[0.99] transition-all ${
              isDark 
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Solid black circle with red Netflix N */}
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M5 2h3.8l6.4 13.5V2H19v20h-3.8L8.8 8.5V22H5V2z" fill="#E50914" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Netflix
                </h4>
                <p className="text-xs text-slate-400 font-normal">
                  Subscription
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-sm sm:text-base font-bold text-red-500 font-sans block">
                {currencyMode === 'USD' ? '-$22,99' : '-TZS 59,500'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400 font-normal">
                  12.36 PM
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTraTx({
                      id: 'tx-netflix-sub',
                      userId: user.id,
                      userName: user.fullName,
                      merchantId: 'merch-netflix',
                      merchantName: 'Netflix',
                      merchantLipaNumber: 'NETFLIX-GLOBAL',
                      amount: 59500,
                      status: 'COMPLETED',
                      paymentRail: 'VISA',
                      referenceNumber: 'FP-NTFX-9921',
                      externalProviderRef: 'TIPS-VISA-882190',
                      verificationMode: 'FACIAL_BIOMETRICS',
                      faceMatchScore: 99.4,
                      createdAt: new Date().toISOString()
                    });
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all"
                  title="Stakabadhi ya TRA EFD"
                >
                  TRA
                </button>
              </div>
            </div>
          </div>

          {/* 2. Spotify Card */}
          <div
            onClick={() => {
              onSelectTransaction({
                id: 'tx-spotify-sub',
                userId: user.id,
                userName: user.fullName,
                merchantId: 'merch-spotify',
                merchantName: 'Spotify',
                merchantLipaNumber: 'SPOTIFY-PREMIUM',
                amount: currencyMode === 'USD' ? 15.99 : 41500,
                status: 'COMPLETED',
                paymentRail: 'M_PESA',
                referenceNumber: 'FP-SPOT-7712',
                externalProviderRef: 'TIPS-M-PESA-449102',
                verificationMode: 'FACIAL_BIOMETRICS',
                faceMatchScore: 99.6,
                createdAt: new Date().toISOString()
              });
            }}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer active:scale-[0.99] transition-all ${
              isDark 
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Solid black circle with neon green Spotify arcs */}
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#1ed760" />
                  <path d="M7 9.5c3.2-0.8 7-0.5 10 1.2" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7.5 12.5c2.6-0.6 5.8-0.3 8.3 1.1" stroke="#000" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M8 15.5c2-0.5 4.5-0.2 6.5 0.9" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Spotify
                </h4>
                <p className="text-xs text-slate-400 font-normal">
                  Subscription
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-sm sm:text-base font-bold text-red-500 font-sans block">
                {currencyMode === 'USD' ? '-$15,99' : '-TZS 41,500'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400 font-normal">
                  10.12 AM
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTraTx({
                      id: 'tx-spotify-sub',
                      userId: user.id,
                      userName: user.fullName,
                      merchantId: 'merch-spotify',
                      merchantName: 'Spotify Premium',
                      merchantLipaNumber: 'SPOTIFY-PREMIUM',
                      amount: 41500,
                      status: 'COMPLETED',
                      paymentRail: 'M_PESA',
                      referenceNumber: 'FP-SPOT-7712',
                      externalProviderRef: 'TIPS-M-PESA-449102',
                      verificationMode: 'FACIAL_BIOMETRICS',
                      faceMatchScore: 99.6,
                      createdAt: new Date().toISOString()
                    });
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all"
                  title="Stakabadhi ya TRA EFD"
                >
                  TRA
                </button>
              </div>
            </div>
          </div>

          {/* 3. ChatGPT Card */}
          <div
            onClick={() => {
              onSelectTransaction({
                id: 'tx-chatgpt-sub',
                userId: user.id,
                userName: user.fullName,
                merchantId: 'merch-openai',
                merchantName: 'ChatGPT',
                merchantLipaNumber: 'OPENAI-PLUS',
                amount: currencyMode === 'USD' ? 20.00 : 52000,
                status: 'COMPLETED',
                paymentRail: 'TIGO_PESA',
                referenceNumber: 'FP-GPT-5541',
                externalProviderRef: 'TIPS-TIGO-718290',
                verificationMode: 'FACIAL_BIOMETRICS',
                faceMatchScore: 99.2,
                createdAt: new Date().toISOString()
              });
            }}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer active:scale-[0.99] transition-all ${
              isDark 
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Solid black circle with white OpenAI knot rosette */}
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76c.24-.14.4-.4.4-.68v-6.74l2.02 1.17c.02.01.03.03.04.05v5.58a4.5 4.5 0 0 1-4.5 4.5zm-9.66-4.12a4.47 4.47 0 0 1-.54-3.01l.14.08 4.79 2.76c.24.14.54.14.78 0l5.84-3.37v2.33c0 .03-.01.05-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97v5.67c0 .28.15.53.39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0L4 14.01A4.5 4.5 0 0 1 2.34 7.9zm16.6 3.85-5.84-3.37 2.02-1.17a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.67a.8.8 0 0 0-.4-.68zm2.01-3.02-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.7 5.46a.8.8 0 0 0-.4.68v6.72zm1.14-2.03 2.55-1.47 2.55 1.47v2.94L12 15.23l-2.55-1.47v-2.93z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  ChatGPT
                </h4>
                <p className="text-xs text-slate-400 font-normal">
                  Subscription
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm sm:text-base font-bold text-red-500 font-sans block">
                {currencyMode === 'USD' ? '-$20,00' : '-TZS 52,000'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                09.00 AM
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* PROMO FOR YOU! SECTION - EXACT MATCH TO USER IMAGE */}
      <div className="mt-7 mx-4">
        <div className="mb-3 px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'sw' ? 'Ofa na Punguzo Kwako!' : 'Promo for you!'}
          </h3>
        </div>

        {/* Horizontal Snap Scroll Cards matching Whoosh and GoFood */}
        <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-none snap-x -mx-4 px-4">
          
          {/* PROMO 1: Whoosh Tickets 50% Off (Deep Purple with 3D Pedestal & Coupons) */}
          <div 
            onClick={() => {
              setPromoModal({
                title: 'Whoosh High-Speed Rail 50% Off',
                desc: 'Enjoy half price on all executive and standard coach tickets booked through FacePay BoT TIPS.',
                code: 'WHOOSH50',
                discount: '50% OFF'
              });
            }}
            className="min-w-[290px] sm:min-w-[320px] rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#160a36] via-[#241052] to-[#45168e] text-white relative overflow-hidden shadow-lg snap-start flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
          >
            {/* Ambient sparkles */}
            <div className="absolute top-2 right-2 text-white/40">
              <SparklesIcon className="w-4 h-4" />
            </div>

            {/* Left Content */}
            <div className="relative z-10 max-w-[145px] sm:max-w-[160px]">
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight tracking-tight">
                Get up to 50% off for Whoosh tickets!
              </h4>
              <button
                type="button"
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white backdrop-blur-md transition-colors"
              >
                <span>Grab it now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Visual: 3D Stage Pedestal with Red Coupons and % Coins */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              {/* Glowing back aura */}
              <div className="absolute w-20 h-20 rounded-full bg-pink-500/30 blur-md" />
              
              {/* White arch halo */}
              <div className="absolute top-1 w-22 h-22 rounded-full border border-white/30 border-dashed" />

              {/* 3D Round Pedestal Stage in Magenta */}
              <div className="absolute bottom-1 w-20 h-7 rounded-[100%] bg-gradient-to-t from-[#c026d3] to-[#e879f9] border-t-2 border-white/40 shadow-md">
                <div className="w-full h-3 rounded-[100%] bg-[#d946ef] opacity-90" />
              </div>

              {/* Red Discount Coupon Tickets with % */}
              <div className="absolute top-4 rotate-12 z-10">
                <div className="w-14 h-9 rounded-md bg-gradient-to-br from-[#ef4444] to-[#b91c1c] border border-white/40 shadow-lg p-1 flex items-center justify-between">
                  <div className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="text-white font-extrabold text-[11px] tracking-tighter">%</span>
                  <div className="w-1 h-3 border-r border-dashed border-white/60" />
                </div>
              </div>

              <div className="absolute top-7 -rotate-6 z-10">
                <div className="w-13 h-8 rounded-md bg-gradient-to-br from-[#dc2626] to-[#991b1b] border border-white/30 shadow-md p-1 flex items-center justify-between">
                  <span className="text-white font-extrabold text-[10px]">%</span>
                </div>
              </div>

              {/* Floating Yellow % Coins */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-600/40 flex items-center justify-center text-[9.5px] font-black text-amber-950 shadow-md z-20">
                %
              </div>
              <div className="absolute top-5 -left-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-600/40 flex items-center justify-center text-[8.5px] font-black text-amber-950 shadow-md z-20">
                %
              </div>

              {/* Star sparkles */}
              <div className="absolute top-0 right-3 text-white text-[12px] font-bold animate-pulse">✦</div>
              <div className="absolute bottom-6 left-1 text-white text-[10px] font-bold animate-pulse">✦</div>
            </div>
          </div>

          {/* PROMO 2: GoFood 20% discount (Dark Forest Green with Food Delivery) */}
          <div 
            onClick={() => {
              setPromoModal({
                title: 'GoFood 20% Discount with Zenith Payment',
                desc: 'Save 20% on all restaurant deliveries and takeaway orders using BoT TIPS FacePay settlement.',
                code: 'ZENITHFOOD',
                discount: '20% OFF'
              });
            }}
            className="min-w-[290px] sm:min-w-[320px] rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#061f14] via-[#0b301f] to-[#12422c] text-white relative overflow-hidden shadow-lg snap-start flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
          >
            {/* Left Content */}
            <div className="relative z-10 max-w-[150px] sm:max-w-[165px]">
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight tracking-tight">
                GoFood 20% discount with Zenith payment
              </h4>
              <button
                type="button"
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white backdrop-blur-md transition-colors"
              >
                <span>Claim discount</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Visual: Food Delivery Package with 20% Badge */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 blur-md" />
              
              {/* Meal bowl container */}
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#047857] border border-emerald-400/40 shadow-lg p-2.5 flex flex-col items-center justify-center relative">
                <span className="text-2xl">🍲</span>
                <div className="mt-1 px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[9px] tracking-tight">
                  20% OFF
                </div>
              </div>

              {/* Floating golden coin */}
              <div className="absolute bottom-2 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-600/40 flex items-center justify-center text-[9.5px] font-black text-amber-950 shadow-md">
                $
              </div>
            </div>
          </div>

          {/* PROMO 3: SGR Express Train & Air Tanzania */}
          <div 
            onClick={() => {
              setPromoModal({
                title: 'Tanzania SGR & ATCL FacePay 30% Off',
                desc: 'Pata punguzo la 30% unaponunua tiketi za treni ya kisasa ya mwendokasi (SGR Dar - Moro - Dodoma) na safari za ndege za Air Tanzania kwa kutumia sura yako.',
                code: 'SGRFACEPAY30',
                discount: '30% OFF'
              });
            }}
            className="min-w-[290px] sm:min-w-[320px] rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#312e81] text-white relative overflow-hidden shadow-lg snap-start flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
          >
            <div className="relative z-10 max-w-[155px]">
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight tracking-tight">
                {language === 'sw' ? 'Tiketi za SGR & ATCL Punguzo 30%!' : 'SGR Train & ATCL Flights 30% Off!'}
              </h4>
              <button
                type="button"
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white backdrop-blur-md transition-colors"
              >
                <span>{language === 'sw' ? 'Chukua sasa' : 'Grab it now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 border border-indigo-300/30 shadow-lg flex flex-col items-center justify-center p-2 text-center">
                <span className="text-2xl">🚄</span>
                <span className="text-[9px] font-bold text-indigo-100 mt-1">BoT TIPS</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: COMPREHENSIVE SPENDING ANALYTICS & STATEMENTS */}
      <SpendingAnalyticsModal
        isOpen={showAllTransactionsModal}
        onClose={() => setShowAllTransactionsModal(false)}
        transactions={transactions}
        language={language}
        theme={theme}
        onSelectTransaction={onSelectTransaction}
        currencyMode={currencyMode}
      />

      {/* MODAL: PROMO VOUCHER DETAILS */}
      {promoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative">
            <button
              onClick={() => setPromoModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
              <Tag className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs mb-2">
              {promoModal.discount}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {promoModal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {promoModal.desc}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 mb-4 font-mono font-bold text-sm tracking-wider text-indigo-600 dark:text-indigo-400">
              {promoModal.code}
            </div>

            <button
              onClick={() => {
                setPromoModal(null);
                onInitiatePayment();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <ScanFace className="w-4 h-4" />
              <span>{language === 'sw' ? 'Tumia Vocha kwa Sura' : 'Apply with FacePay'}</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK SERVICE PAYMENT MODAL */}
      {serviceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setServiceModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50">
                {serviceModal.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {serviceModal.serviceName}
                </h3>
                <p className="text-[10.5px] text-slate-500">
                  BoT TIPS Instant Settlement
                </p>
              </div>
            </div>

            {serviceSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Ombi Limethibitishwa!' : 'Request Verified!'}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'sw' ? 'Inafungua uthibitisho wa Sura...' : 'Opening FacePay biometrics...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePayService} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {serviceModal.label}
                  </label>
                  <input 
                    type="text"
                    required
                    value={serviceAccountInput}
                    onChange={(e) => setServiceAccountInput(e.target.value)}
                    placeholder={serviceModal.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'sw' ? 'Kiasi (TZS)' : 'Amount (TZS)'}
                  </label>
                  <input 
                    type="number"
                    required
                    min="500"
                    step="500"
                    value={serviceAmountInput}
                    onChange={(e) => setServiceAmountInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>{language === 'sw' ? 'Thibitisha na Lipa kwa Uso' : 'Confirm & Pay with Face'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Split Bill Flow Modal */}
      <SplitBillFlow
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
        language={language}
        theme={theme}
      />

      {/* User Profile Screen */}
      <ProfileScreen
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        language={language}
        onToggleLanguage={onToggleLanguage || (() => {})}
        theme={theme}
        onOpenBiometrics={() => {
          setIsProfileOpen(false);
          onInitiatePayment();
        }}
      />

      {/* Cards and Banks Management Modal */}
      <CardsAndBanksModal
        isOpen={isCardsAndBanksOpen}
        onClose={() => setIsCardsAndBanksOpen(false)}
        language={language}
        theme={theme}
        user={user}
        wallet={wallet}
      />

      {/* Notifications & Audio Soundbox Modal */}
      <NotificationsSoundboxModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        language={language}
        theme={theme}
      />

      {/* Rewards & Gold Loyalty Modal */}
      <RewardsLoyaltyModal
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        language={language}
        theme={theme}
        user={user}
        onRedeemSuccess={(code) => {
          setPromoModal({
            title: language === 'sw' ? 'Vocha Imekombolewa Kikamilifu!' : 'Voucher Successfully Redeemed!',
            desc: language === 'sw' ? 'Tumia msimbo huu kupata punguzo la kipekee kwenye malipo yako yajayo.' : 'Use this promo code for an exclusive instant discount on your next transaction.',
            code,
            discount: '15%'
          });
        }}
      />

      {/* Offline Mesh P2P Bluetooth / BLE Biometric Payments Modal */}
      <OfflineMeshPaymentModal
        isOpen={isOfflineMeshOpen}
        onClose={() => setIsOfflineMeshOpen(false)}
        language={language}
        theme={theme}
        user={user}
        wallet={wallet}
      />

      {/* TRA Electronic Fiscal Device (EFD) Digital Tax Receipt Modal */}
      <TraReceiptModal
        isOpen={!!selectedTraTx}
        onClose={() => setSelectedTraTx(null)}
        language={language}
        theme={theme}
        transaction={selectedTraTx}
      />

      {/* Merchant POS Counter Mode Modal */}
      <MerchantPosModal
        isOpen={isMerchantPosOpen}
        onClose={() => setIsMerchantPosOpen(false)}
        language={language}
        theme={theme}
        user={user}
      />

      {/* Vicoba & Community Group Savings Modal */}
      <VicobaGroupSavingsModal
        isOpen={isVicobaOpen}
        onClose={() => setIsVicobaOpen(false)}
        language={language}
        theme={theme}
        user={user}
        wallet={wallet}
      />

    </div>
  );
};
