import React, { useState, useRef } from 'react';
import { 
  ScanFace, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Radio, 
  WifiOff, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  Smartphone, 
  Store, 
  Layers, 
  Play, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  QrCode,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { soundbox } from '../utils/soundboxAudio';
import { formatTZS } from '../utils/formatters';

interface ModernLandingPageProps {
  language: Language;
  isAuthenticated?: boolean;
  onNavigateRole: (role: UserRole) => void;
  onOpenOfflineQR: () => void;
  onOpenAccountSwitcher: () => void;
  onOpenFacePay: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const ModernLandingPage: React.FC<ModernLandingPageProps> = ({
  language,
  isAuthenticated = false,
  onNavigateRole,
  onOpenOfflineQR,
  onOpenAccountSwitcher,
  onOpenFacePay,
  onOpenLogin,
  onOpenRegister
}) => {
  // 3D Card Interactive Tilt State
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [soundboxTesting, setSoundboxTesting] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12; // tilt max 12 deg
    const rY = ((x - centerX) / centerX) * 12;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleTestSoundboxHero = async () => {
    setSoundboxTesting(true);
    await soundbox.announcePayment({
      amount: 25000,
      payerName: 'Juma Mkwawa',
      rail: 'Vodacom M-Pesa',
      language: language
    });
    setTimeout(() => {
      setSoundboxTesting(false);
    }, 3500);
  };

  const handleProtectedAction = (action: () => void) => {
    if (!isAuthenticated) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    action();
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION WITH INTERACTIVE 3D PERSPECTIVE CANVAS */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800/80 p-6 sm:p-10 lg:p-14 shadow-2xl shadow-emerald-950/30">
        {/* Ambient 3D Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Top Tagline Pill */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{language === 'sw' ? 'Mapinduzi ya Malipo Tanzania' : 'Next-Gen Fintech for Tanzania'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Bank of Tanzania TIPS Switch v2.4</span>
          </div>

          {!isAuthenticated && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{language === 'sw' ? 'Hali: Hujaingia (Ingia au Jisajili kuanza)' : 'Status: Guest (Login to access services)'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Hero Left Copy */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              {language === 'sw' ? (
                <>
                  Lipa Popote kwa <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">Sura Yako</span> Pekee.
                </>
              ) : (
                <>
                  Pay Everywhere with Just <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">Your Face</span>.
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {language === 'sw'
                ? 'Mfumo wa kwanza wa kielektroniki unaounganisha M-Pesa, Tigo Pesa, Airtel Money, CRDB na NMB kwa utambuzi wa uso, QR ya nje ya mtandao (Offline QR) na Soundbox ya sauti ya maduka.'
                : 'Tanzania’s unified biometric & interoperable TIPS switch connecting mobile money (M-Pesa, Tigo, Airtel) and banks (CRDB, NMB) with offline QR vouchers and real-time audio soundbox.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isAuthenticated ? (
                <>
                  <button
                    id="hero-try-facepay-btn"
                    onClick={onOpenFacePay}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 active:scale-98 transition-all"
                  >
                    <ScanFace className="w-5 h-5 text-slate-950" />
                    <span>{language === 'sw' ? 'Jaribu Malipo ya Uso Sasa' : 'Launch FacePay Checkout'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  <button
                    id="hero-offline-qr-btn"
                    onClick={onOpenOfflineQR}
                    className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <WifiOff className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'sw' ? 'Malipo Nje ya Mtandao (Offline QR)' : 'Offline QR Payments'}</span>
                  </button>

                  <button
                    id="hero-switch-account-btn"
                    onClick={onOpenAccountSwitcher}
                    className="px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>{language === 'sw' ? 'Badili Akaunti (5 Personas)' : 'Switch 5 Accounts'}</span>
                  </button>
                </>
              ) : (
                /* Unauthenticated View: CTA to Log in or Register first */
                <>
                  <button
                    id="hero-login-action-btn"
                    onClick={onOpenLogin}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 active:scale-98 transition-all"
                  >
                    <LogIn className="w-5 h-5 text-slate-950" />
                    <span>{language === 'sw' ? 'Ingia ili Kulipa kwa Uso' : 'Log In to Pay with Face'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  <button
                    id="hero-register-action-btn"
                    onClick={onOpenRegister}
                    className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-700/60 flex items-center gap-2 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'sw' ? 'Fungua Akaunti / Jisajili' : 'Register New Account'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Tanzanian Rails Acceptance Badges */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Inasaidia:</span>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Vodacom M-Pesa</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Tigo Pesa</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Airtel Money</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">CRDB</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">NMB</span>
              </div>
            </div>
          </div>

          {/* Hero Right: 3D Interactive Biometric Hologram Smart Card */}
          <div className="lg:col-span-5 flex justify-center perspective-[1000px]">
            <div
              ref={cardRef}
              onClick={() => {
                if (!isAuthenticated && onOpenLogin) {
                  onOpenLogin();
                } else if (isAuthenticated) {
                  onOpenFacePay();
                }
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.04 : 1}, ${isHovered ? 1.04 : 1}, 1)`,
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
              }}
              className="w-full max-w-sm aspect-[1.58/1] rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-[0_20px_50px_rgba(16,185,129,0.25)] select-none cursor-pointer group"
            >
              {/* Holographic iridescent sheen line */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Tanzanian Flag Colored Corner Ribbon */}
              <div className="absolute top-0 right-0 w-24 h-1.5 flex rounded-bl-lg overflow-hidden">
                <div className="flex-1 bg-emerald-500" />
                <div className="w-2 bg-yellow-400" />
                <div className="w-4 bg-black" />
                <div className="w-2 bg-yellow-400" />
                <div className="flex-1 bg-sky-500" />
              </div>

              {/* Card Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanFace className="w-6 h-6 text-emerald-400" />
                  <span className="text-sm font-black tracking-wider uppercase text-white font-sans">
                    FACEPAY <span className="text-emerald-400">TZ</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/40">
                  TIPS BIOMETRIC
                </span>
              </div>

              {/* Gold Chip & Contactless Waves */}
              <div className="mt-4 flex items-center justify-between">
                <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200/80 shadow-inner flex items-center justify-center">
                  <div className="w-6 h-5 border border-amber-700/60 rounded-sm grid grid-cols-2 gap-0.5">
                    <div className="border-r border-b border-amber-700/60" />
                    <div className="border-b border-amber-700/60" />
                    <div className="border-r border-amber-700/60" />
                    <div />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>NFC / 0.8s INSTANT</span>
                </div>
              </div>

              {/* Card Number / NIDA Mask */}
              <div className="mt-4 font-mono font-bold text-base tracking-widest text-slate-200">
                1992 •••• •••• 0024
              </div>

              {/* Cardholder & Liveness Status */}
              <div className="mt-3 flex items-end justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    {isAuthenticated ? 'Mwenye Akaunti' : 'Hali ya Akaunti'}
                  </div>
                  <div className="font-bold text-white tracking-wide">
                    {isAuthenticated ? 'JUMA S. MKWAWA' : (language === 'sw' ? 'BONYEZA KUINGIA' : 'CLICK TO LOG IN')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Uhakiki wa Uso</div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isAuthenticated ? '99.8% VERIFIED' : 'USAJILI SALAMA'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D FEATURE HIGHLIGHT CARDS (3 COLUMNS WITH 3D DEPTH) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Offline QR Payments */}
        <div 
          onClick={() => handleProtectedAction(onOpenOfflineQR)}
          className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 p-6 space-y-4 shadow-xl transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <WifiOff className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
              Nje ya Mtandao
            </span>
            <h3 className="text-lg font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
              {language === 'sw' ? 'Malipo ya Nje ya Mtandao (Offline QR)' : 'Offline QR Payments'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {language === 'sw'
                ? 'Lipa hata kama huna bando la intaneti au mnara umekatika. Vocha salama za kibiometria zinasawazishwa mara intaneti ikirudi.'
                : 'Generate cryptographic dynamic QR vouchers that work without cellular data, synchronizing instantly when online.'}
            </p>
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <span>
              {isAuthenticated 
                ? (language === 'sw' ? 'Fungua Vocha ya Nje' : 'Open Offline Voucher')
                : (language === 'sw' ? 'Ingia kutumia Vocha' : 'Log in to use Voucher')}
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 2: Merchant Soundbox */}
        <div 
          onClick={handleTestSoundboxHero}
          className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 p-6 space-y-4 shadow-xl transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Radio className={`w-6 h-6 ${soundboxTesting ? 'animate-pulse text-amber-400' : ''}`} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-teal-400 uppercase font-bold tracking-wider">
              Sauti ya Papo Hapo
            </span>
            <h3 className="text-lg font-bold text-white mt-1 group-hover:text-teal-300 transition-colors">
              {language === 'sw' ? 'Soundbox ya Mfanyabiashara' : 'Merchant Voice Soundbox'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {language === 'sw'
                ? 'Spika ya sauti inatamka malipo kwa Kiswahili mara mteja anapolipa, ikiondoa ulaghai wa screenshot feki za SMS madukani.'
                : 'Loud Swahili voice announcement broadcasts incoming payments instantly, eliminating SMS screenshot fraud.'}
            </p>
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-teal-400">
            <Play className="w-3.5 h-3.5 fill-teal-400" />
            <span>{soundboxTesting ? 'Inatamka Sasa...' : (language === 'sw' ? 'Pima Sauti ya Soundbox' : 'Test Soundbox')}</span>
          </div>
        </div>

        {/* CARD 3: Multi-Account Switcher */}
        <div 
          onClick={() => handleProtectedAction(onOpenAccountSwitcher)}
          className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 p-6 space-y-4 shadow-xl transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-sky-400 uppercase font-bold tracking-wider">
              Majaribio ya Haraka
            </span>
            <h3 className="text-lg font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">
              {language === 'sw' ? 'Akaunti Nyingi za Kujaribu' : 'Multi-Account Switcher'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {language === 'sw'
                ? 'Badili mara moja kati ya akaunti 5 za Tanzania (M-Pesa, Airtel, Tigo, CRDB, NMB) zenye masalio na sura tofauti.'
                : 'Instantly toggle between 5 distinct Tanzanian demo personas with unique balances, faces, and networks.'}
            </p>
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-sky-400">
            <span>
              {isAuthenticated
                ? (language === 'sw' ? 'Badili Akaunti Sasa' : 'Select Demo Account')
                : (language === 'sw' ? 'Ingia au Chagua Akaunti' : 'Log in to Select Account')}
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* INTERACTIVE SOUNDBOX & 3D TERMINAL DEMO BANNER */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Radio className="w-4 h-4" />
            <span>FACEPAY SOUNDBOX HARDWARE INTEGRATION</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            {language === 'sw' 
              ? 'Wauzaji hawahitaji tena kuangalia simu zao kuthibitisha malipo.' 
              : 'Merchants no longer need to manually inspect SMS messages.'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'sw'
              ? 'Sauti ya Kiswahili inasema wazi: "M-Pesa! Umepokea Shilingi Elfu Ishirini na Tano kutoka kwa Juma Mkwawa kupitia FacePay TIPS!"'
              : 'Crystal-clear synthesized announcements in Kiswahili and English ensure every payment is audibly confirmed in the shop.'}
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => handleProtectedAction(() => onNavigateRole('MERCHANT'))}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
          >
            <Store className="w-4 h-4" />
            <span>{language === 'sw' ? 'Fungua Kituo cha Duka (POS)' : 'Open Merchant POS'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
