import React, { useState } from 'react';
import { 
  X, 
  Gift, 
  Crown, 
  Sparkles, 
  Ticket, 
  Check, 
  Copy, 
  QrCode, 
  ChevronRight, 
  Train, 
  Wifi, 
  Coffee, 
  Film, 
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Language, ThemeMode, UserProfile } from '../types';

interface RewardsLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  language: Language;
  theme?: ThemeMode;
}

interface RewardItem {
  id: string;
  title: string;
  category: string;
  pointsCost: number;
  discount: string;
  partner: string;
  icon: 'TRAIN' | 'WIFI' | 'COFFEE' | 'CINEMA' | 'FOOD';
}

const REWARDS_CATALOG: RewardItem[] = [
  {
    id: 'rew-sgr',
    title: 'Tiketi ya Treni ya Umeme ya SGR (Dar - Dodoma)',
    category: 'Usafiri & Safari',
    pointsCost: 800,
    discount: 'Punguzo la 30%',
    partner: 'TRC SGR Electric Train',
    icon: 'TRAIN'
  },
  {
    id: 'rew-bundle',
    title: 'Kifurushi cha Intaneti cha 10GB Bila Kikomo',
    category: 'Mawasiliano',
    pointsCost: 500,
    discount: 'GB 10 Bure',
    partner: 'Vodacom / Airtel 5G',
    icon: 'WIFI'
  },
  {
    id: 'rew-coffee',
    title: 'Kahawa & Kitafunwa Kimoja Bure Orely Café',
    category: 'Chakula & Vinywaji',
    pointsCost: 600,
    discount: '1 Free Drink',
    partner: 'Orely Café & Bakery',
    icon: 'COFFEE'
  },
  {
    id: 'rew-cinema',
    title: 'Tiketi ya Sinema 1 Bure Century Cinemax',
    category: 'Burudani',
    pointsCost: 1000,
    discount: '1 Free Movie',
    partner: 'Century Cinemax Mlimani',
    icon: 'CINEMA'
  },
];

export const RewardsLoyaltyModal: React.FC<RewardsLoyaltyModalProps> = ({
  isOpen,
  onClose,
  user,
  language,
  theme = 'light'
}) => {
  const [points, setPoints] = useState(2450);
  const [redeemedReward, setRedeemedReward] = useState<{ item: RewardItem; voucherCode: string } | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleRedeem = (item: RewardItem) => {
    if (points >= item.pointsCost) {
      setPoints((prev) => prev - item.pointsCost);
      setRedeemedReward({
        item,
        voucherCode: `FP-GOLD-${Math.floor(100000 + Math.random() * 900000)}`
      });
    } else {
      alert(language === 'sw' ? 'Pointi hazitoshi kukomboa zawadi hii.' : 'Not enough points for this reward.');
    }
  };

  const handleCopyCode = () => {
    if (redeemedReward) {
      navigator.clipboard?.writeText(redeemedReward.voucherCode);
      setCopiedVoucher(true);
      setTimeout(() => setCopiedVoucher(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md min-h-screen sm:min-h-0 sm:my-auto sm:rounded-3xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-inherit z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {language === 'sw' ? 'Zawadi & Pointi za FacePay' : 'FacePay Loyalty & Rewards'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'sw' ? 'Komboa pointi kwa huduma na vocha za kipekee' : 'Redeem points for exclusive vouchers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* ============================================================ */}
          {/* GOLD MEMBERSHIP TIER CARD WITH 3D HEXAGON BADGE              */}
          {/* ============================================================ */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-xl relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/15 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 bg-slate-950/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                <Crown className="w-4 h-4 text-slate-950" />
                <span className="text-[11px] font-black uppercase tracking-wider">Gold Member</span>
              </div>
              <span className="text-[10px] font-bold text-slate-900/80 uppercase">
                TIPS Tier 2
              </span>
            </div>

            {/* Current Points Balance */}
            <div className="my-3 relative z-10">
              <span className="text-[11px] font-bold text-slate-800 block">
                {language === 'sw' ? 'Pointi Zinazopatikana' : 'Available Balance'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight">{points.toLocaleString()}</span>
                <span className="text-xs font-extrabold uppercase">Pts</span>
              </div>
            </div>

            {/* Progress to Platinum Tier */}
            <div className="space-y-1.5 relative z-10 pt-2 border-t border-slate-950/10">
              <div className="flex justify-between text-[10px] font-bold text-slate-900">
                <span>{language === 'sw' ? 'Kuelekea Platinum Member' : 'Progress to Platinum'}</span>
                <span>{points} / 3,000 Pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950/15 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-slate-950 transition-all duration-500"
                  style={{ width: `${Math.min(100, (points / 3000) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-800">
                {language === 'sw' 
                  ? `Zimebaki pointi ${Math.max(0, 3000 - points)} kufikia hadhi ya Platinum!`
                  : `${Math.max(0, 3000 - points)} more points needed to unlock Platinum!`}
              </p>
            </div>
          </div>

          {/* Member Privileges Pills */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60">
              <span className="text-[10px] font-bold text-[#543eed] uppercase block">Privilege 1</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">0% Ada ya FacePay</p>
              <span className="text-[9px] text-slate-400">No transaction fee at merchants</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">Privilege 2</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">2x Pointi za Chakula</p>
              <span className="text-[9px] text-slate-400">Double points at restaurants</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* REWARDS CATALOG                                              */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {language === 'sw' ? 'Katalogi ya Vocha & Zawadi' : 'Redeemable Rewards Catalog'}
            </h3>

            <div className="space-y-3">
              {REWARDS_CATALOG.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center shrink-0">
                      {item.icon === 'TRAIN' && <Train className="w-5 h-5" />}
                      {item.icon === 'WIFI' && <Wifi className="w-5 h-5" />}
                      {item.icon === 'COFFEE' && <Coffee className="w-5 h-5" />}
                      {item.icon === 'CINEMA' && <Film className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[9px] font-extrabold">
                          {item.discount}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{item.partner}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                        {item.pointsCost} Pts
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={points < item.pointsCost}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 active:scale-95 transition-all ${
                      points >= item.pointsCost
                        ? 'bg-[#543eed] hover:bg-[#432ed6] text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {language === 'sw' ? 'Komboa' : 'Redeem'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Redeemed Voucher Success Modal */}
        {redeemedReward && (
          <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Hongera! Vocha Imetolewa' : 'Reward Successfully Redeemed!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {redeemedReward.item.title} ({redeemedReward.item.discount})
                </p>
              </div>

              {/* Voucher Code Box */}
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[#543eed] tracking-wider">
                  {redeemedReward.voucherCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-[#543eed] text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  {copiedVoucher ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVoucher ? 'Imenakiliwa' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                {language === 'sw' 
                  ? 'Onyesha msimbo huu wakati wa kulipa kupitia FacePay au kwenye kaunta ya huduma.'
                  : 'Present this voucher code at checkout or scan via FacePay at partner counter.'}
              </p>

              <button
                onClick={() => setRedeemedReward(null)}
                className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
              >
                {language === 'sw' ? 'Funga' : 'Done'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 active:scale-98 transition-all"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
