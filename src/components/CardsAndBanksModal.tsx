import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Plus, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  Sliders, 
  Check, 
  AlertCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import { Language, ThemeMode, Wallet } from '../types';
import { formatTZS } from '../utils/formatters';

interface CardsAndBanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  language: Language;
  theme?: ThemeMode;
}

export const CardsAndBanksModal: React.FC<CardsAndBanksModalProps> = ({
  isOpen,
  onClose,
  wallet,
  language,
  theme = 'light'
}) => {
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(500000); // 500k TZS
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [facePayLimitless, setFacePayLimitless] = useState(true);
  
  // Add Bank state
  const [showAddBank, setShowAddBank] = useState(false);
  const [selectedBank, setSelectedBank] = useState('CRDB Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankAddedSuccess, setBankAddedSuccess] = useState(false);

  // Linked accounts
  const [linkedBanks, setLinkedBanks] = useState([
    { id: 'b1', name: 'CRDB Bank (SimBanking)', type: 'BANK', accNumber: '•••• 0192', active: true, balance: 'TZS 1,840,000' },
    { id: 'b2', name: 'NMB Bank (NMB Mkononi)', type: 'BANK', accNumber: '•••• 7741', active: false, balance: 'TZS 450,000' },
    { id: 'w1', name: 'M-Pesa (Vodacom Tanzania)', type: 'WALLET', accNumber: '+255 754 ••• 203', active: true, balance: 'TZS 320,000' },
  ]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) return;

    setBankAddedSuccess(true);
    setTimeout(() => {
      setLinkedBanks((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          name: selectedBank,
          type: 'BANK',
          accNumber: `•••• ${accountNumber.slice(-4) || '9921'}`,
          active: true,
          balance: 'TZS 250,000'
        }
      ]);
      setBankAddedSuccess(false);
      setShowAddBank(false);
      setAccountNumber('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md min-h-screen sm:min-h-0 sm:my-auto sm:rounded-3xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-inherit z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-[#543eed] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {language === 'sw' ? 'Kadi & Benki Zilizounganishwa' : 'Cards & Linked Bank Accounts'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'sw' ? 'Dhibiti kadi ya FacePay na akaunti za TIPS' : 'Manage virtual card & linked TIPS rails'}
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
          {/* 3D VIRTUAL FACEPAY DEBIT CARD                                */}
          {/* ============================================================ */}
          <div className="relative">
            <div className={`relative w-full h-52 rounded-3xl p-5 overflow-hidden text-white shadow-xl transition-all duration-300 ${
              isFrozen 
                ? 'bg-slate-800 border-2 border-slate-700 opacity-80'
                : 'bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] border border-indigo-400/30'
            }`}>
              
              {/* Frozen Overlay */}
              {isFrozen && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
                  <Lock className="w-8 h-8 text-rose-400 animate-bounce" />
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                    {language === 'sw' ? 'Kadi Imefungwa kwa Usalama' : 'Card Temporarily Frozen'}
                  </span>
                </div>
              )}

              {/* Decorative Card Shapes */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/30 blur-2xl pointer-events-none" />

              {/* Top Row: FacePay Platinum + Contactless */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                    FP
                  </div>
                  <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 to-yellow-100 bg-clip-text text-transparent">
                    FacePay Platinum
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-200">TIPS Co-badged</span>
                  {/* Contactless waves */}
                  <svg className="w-5 h-5 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                  </svg>
                </div>
              </div>

              {/* Gold Holographic Chip */}
              <div className="my-4 relative z-10 flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border border-amber-200 shadow-sm flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-700/40 rounded-xs" />
                </div>
                <div className="text-[9px] font-mono text-indigo-200/80">
                  BoT TIPS EMV 3.0
                </div>
              </div>

              {/* Card Number & Reveal Button */}
              <div className="flex items-center justify-between relative z-10 font-mono text-sm tracking-widest font-bold">
                <span>{showCardNumber ? '4532 8901 2345 8819' : '4532 •••• •••• 8819'}</span>
                <button
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors"
                  title="Toggle card number visibility"
                >
                  {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Cardholder name & expiry */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-indigo-200 font-mono uppercase relative z-10">
                <div>
                  <span className="text-[8px] text-indigo-300 block">CARD HOLDER</span>
                  <span className="font-bold text-white text-xs">RIKO SAPTO</span>
                </div>
                <div>
                  <span className="text-[8px] text-indigo-300 block">EXPIRES</span>
                  <span className="font-bold text-white text-xs">08/29</span>
                </div>
                <div>
                  <span className="text-[8px] text-indigo-300 block">CVV</span>
                  <span className="font-bold text-white text-xs">{showCardNumber ? '732' : '•••'}</span>
                </div>
              </div>

            </div>

            {/* Quick Actions Under Card */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${
                  isFrozen
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                {isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isFrozen ? (language === 'sw' ? 'Fungua Kadi' : 'Unfreeze Card') : (language === 'sw' ? 'Fungia Kadi (Freeze)' : 'Freeze Card')}</span>
              </button>

              <button
                onClick={() => setOnlineEnabled(!onlineEnabled)}
                className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${
                  onlineEnabled
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-[#543eed] border-purple-200 dark:border-purple-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{onlineEnabled ? (language === 'sw' ? 'Mtandao: Umewashwa' : 'Online: Active') : (language === 'sw' ? 'Mtandao: Umezimwa' : 'Online: Off')}</span>
              </button>
            </div>
          </div>

          {/* Daily Limit Controls */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'sw' ? 'Kiwango cha Juu cha Siku (Daily Limit)' : 'Daily Spending Limit'}
              </span>
              <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                {formatTZS(dailyLimit)}
              </span>
            </div>

            <input
              type="range"
              min={100000}
              max={2000000}
              step={50000}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full accent-[#543eed] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>TZS 100K</span>
              <span>TZS 1M</span>
              <span>TZS 2M</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* LINKED BANK ACCOUNTS & MOBILE MONEY                          */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {language === 'sw' ? 'Akaunti za Benki na Pochi' : 'Linked Banks & Wallets'}
              </h3>
              <button
                onClick={() => setShowAddBank(true)}
                className="text-xs font-bold text-[#543eed] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'sw' ? 'Unganisha Mpya' : 'Add New'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {linkedBanks.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center">
                      {item.type === 'BANK' ? <Building2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{item.accNumber}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                      {item.balance}
                    </span>
                    <span className={`text-[9px] font-bold ${item.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {item.active ? (language === 'sw' ? 'Inafanya Kazi' : 'Connected') : (language === 'sw' ? 'Imesitishwa' : 'Paused')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Bank Modal Drawer */}
          {showAddBank && (
            <div className="p-4 rounded-3xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#543eed] dark:text-purple-300">
                  {language === 'sw' ? 'Unganisha Benki Kupitia TIPS' : 'Link Bank Account via TIPS'}
                </h4>
                <button onClick={() => setShowAddBank(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddBank} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {language === 'sw' ? 'Chagua Benki' : 'Select Bank'}
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="CRDB Bank">CRDB Bank (SimBanking)</option>
                    <option value="NMB Bank">NMB Bank (NMB Mkononi)</option>
                    <option value="NBC Bank">NBC Bank (Kiganjani)</option>
                    <option value="Absa Tanzania">Absa Bank Tanzania</option>
                    <option value="Stanbic Bank">Stanbic Bank Tanzania</option>
                    <option value="Diamond Trust Bank">DTB Tanzania</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {language === 'sw' ? 'Namba ya Akaunti au NIDA' : 'Account Number or NIDA'}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 0150293848190"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#543eed] hover:bg-[#432ed6] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-98 transition-all"
                >
                  {bankAddedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>{language === 'sw' ? 'Imeunganishwa Kikamilifu!' : 'Successfully Linked!'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{language === 'sw' ? 'Idhinisha kwa FacePay' : 'Authorize & Link Account'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

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
