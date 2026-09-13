import React, { useState } from 'react';
import { 
  Store, 
  ScanFace, 
  DollarSign, 
  Volume2, 
  CheckCircle2, 
  X, 
  Receipt, 
  ArrowRight,
  Sparkles,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { Language, ThemeMode, UserProfile } from '../types';
import { formatTZS } from '../utils/formatters';

interface MerchantPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: ThemeMode;
  user: UserProfile;
}

export const MerchantPosModal: React.FC<MerchantPosModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  user
}) => {
  const isDark = theme === 'dark';
  const [billAmount, setBillAmount] = useState('24500');
  const [customerDescription, setCustomerDescription] = useState('Chakula cha Mchana & Vinywaji');
  const [posState, setPosState] = useState<'KEYPAD' | 'SCANNING_CUSTOMER' | 'SUCCESS'>('KEYPAD');
  const [recognizedCustomer, setRecognizedCustomer] = useState<{ name: string; score: number } | null>(null);

  if (!isOpen) return null;

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setBillAmount('0');
    } else if (val === 'DEL') {
      setBillAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setBillAmount(prev => prev === '0' ? val : prev + val);
    }
  };

  const handleStartScanning = () => {
    setPosState('SCANNING_CUSTOMER');
    setTimeout(() => {
      setRecognizedCustomer({
        name: 'Fatma J. Said (0754 *** 902)',
        score: 99.8
      });
      setTimeout(() => {
        setPosState('SUCCESS');
        // Play sound effect if supported
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          osc.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
      }, 1400);
    }, 1800);
  };

  const resetPos = () => {
    setPosState('KEYPAD');
    setBillAmount('0');
    setRecognizedCustomer(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[#543eed] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold">
                  {language === 'sw' ? 'Hali ya Muuzaji (Merchant POS)' : 'Merchant Counter POS'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#543eed] text-white">
                  FacePay Cashier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lipa Namba: <span className="font-mono font-bold text-slate-200">TIPS-POS-77491</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Body */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1">

          {posState === 'KEYPAD' && (
            <div className="space-y-4">
              {/* Screen Display of Bill */}
              <div className={`p-5 rounded-3xl border text-center relative ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'sw' ? 'Kiasi cha Kulipisha Mteja' : 'Customer Charge Amount'}
                </span>
                <div className="mt-2 text-3xl sm:text-4xl font-black text-[#543eed] dark:text-purple-400 tracking-tight font-mono">
                  {formatTZS(parseInt(billAmount || '0'))}
                </div>
                <input
                  type="text"
                  value={customerDescription}
                  onChange={(e) => setCustomerDescription(e.target.value)}
                  placeholder="Maelezo ya bili (mfano: Kahawa & Keki)"
                  className={`mt-3 w-full px-3 py-1.5 text-xs text-center rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                />
              </div>

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeypadPress(k)}
                    className={`py-3.5 rounded-2xl text-base font-black border transition-all active:scale-95 ${
                      k === 'C' || k === 'DEL'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                        : isDark 
                          ? 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700' 
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-xs'
                    }`}
                  >
                    {k === 'DEL' ? '⌫' : k}
                  </button>
                ))}
              </div>

              {/* Charge with Face Button */}
              <button
                onClick={handleStartScanning}
                disabled={parseInt(billAmount) <= 0}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                  parseInt(billAmount) > 0
                    ? 'bg-[#543eed] hover:bg-[#432ed6] text-white'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ScanFace className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {language === 'sw' 
                    ? `Lipisha ${formatTZS(parseInt(billAmount || '0'))} kwa Uso` 
                    : `Charge ${formatTZS(parseInt(billAmount || '0'))} with Face`}
                </span>
              </button>
            </div>
          )}

          {posState === 'SCANNING_CUSTOMER' && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="relative w-44 h-44 rounded-full bg-purple-500/10 border-4 border-dashed border-[#543eed] flex items-center justify-center animate-pulse">
                <ScanFace className="w-20 h-20 text-[#543eed]" />
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-30" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Mteja Anatazama Kamera ya POS...' : 'Customer Looking at POS Camera...'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {language === 'sw' 
                    ? 'Inatambua alama za uso na kuthibitisha utambulisho kwenye BoT TIPS' 
                    : 'Matching facial landmarks with Central TIPS Biometric Registry'}
                </p>
              </div>

              <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500">
                Kiasi cha Kulipwa: <span className="font-bold text-[#543eed]">{formatTZS(parseInt(billAmount))}</span>
              </div>
            </div>
          )}

          {posState === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {language === 'sw' ? 'MALIPO YAMEPOKELEWA KIKAMILIFU!' : 'PAYMENT RECEIVED SUCCESSFULLY!'}
                </h4>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                  {formatTZS(parseInt(billAmount))}
                </p>
              </div>

              {recognizedCustomer && (
                <div className={`w-full p-4 rounded-2xl border text-left text-xs space-y-1.5 ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'sw' ? 'Mteja:' : 'Customer:'}</span>
                    <span className="font-bold">{recognizedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'sw' ? 'Alama za Uso:' : 'Biometric Match:'}</span>
                    <span className="font-bold text-emerald-500">{recognizedCustomer.score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'sw' ? 'Ref ya TIPS:' : 'TIPS Ref:'}</span>
                    <span className="font-mono text-slate-400">TIPS-POS-TX-990218</span>
                  </div>
                </div>
              )}

              {/* Soundbox audio feedback indicator */}
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-4 py-1.5 rounded-full">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>{language === 'sw' ? 'Sauti ya "Umelipwa TZS ..." imetangazwa!' : 'Soundbox Announcement Dispatched!'}</span>
              </div>

              <div className="w-full flex gap-2 pt-2">
                <button
                  onClick={resetPos}
                  className="flex-1 py-3 rounded-2xl bg-[#543eed] hover:bg-[#4531cf] text-white text-xs font-bold active:scale-95 transition-all shadow-md"
                >
                  {language === 'sw' ? 'Bili Inayofuata' : 'Next Customer'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-3.5 border-t ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {language === 'sw' ? 'Ondoka kwenye Hali ya POS' : 'Exit Merchant POS'}
          </button>
        </div>

      </div>
    </div>
  );
};
