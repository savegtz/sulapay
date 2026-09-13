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
  CreditCard,
  UserCheck,
  AlertTriangle,
  UserPlus,
  Lock,
  Camera,
  RefreshCw
} from 'lucide-react';
import { Language, ThemeMode, UserProfile } from '../types';
import { formatTZS } from '../utils/formatters';
import { FaceMeshOverlay } from './FaceMeshOverlay';
import { soundbox } from '../utils/soundboxAudio';

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
  const [posState, setPosState] = useState<
    'KEYPAD' | 'SCANNING_CUSTOMER' | 'CUSTOMER_PIN' | 'UNREGISTERED_CUSTOMER' | 'REGISTER_CUSTOMER' | 'SUCCESS'
  >('KEYPAD');
  const [customerMode, setCustomerMode] = useState<'KNOWN' | 'UNKNOWN'>('KNOWN');
  const [recognizedCustomer, setRecognizedCustomer] = useState<{ name: string; score: number; avatarUrl?: string } | null>(null);
  const [customerPin, setCustomerPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Quick Registration State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');

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
    setCustomerPin('');
    setPinError(null);

    setTimeout(() => {
      if (customerMode === 'KNOWN') {
        setRecognizedCustomer({
          name: user.fullName || 'Juma Hamisi (0754 *** 892)',
          score: 99.8,
          avatarUrl: user.faceAvatarUrl
        });
        setPosState('CUSTOMER_PIN');
      } else {
        setPosState('UNREGISTERED_CUSTOMER');
      }
    }, 2200);
  };

  const handleAuthorizeWithPin = (pin: string) => {
    if (pin === '1234' || pin === regPin || pin.length === 4) {
      setPosState('SUCCESS');
      soundbox.announcePayment({
        amount: parseInt(billAmount || '0'),
        merchantName: 'Shoppers Plaza Masaki',
        payerName: recognizedCustomer?.name || 'Mteja',
        rail: 'M_PESA',
        language
      });
    } else {
      setPinError(language === 'sw' ? 'Nenosiri siyo sahihi! Jaribu tena.' : 'Incorrect PIN. Try again.');
      setCustomerPin('');
    }
  };

  const handleRegisterAndProceed = () => {
    if (!regName.trim() || !regPhone.trim() || regPin.length < 4) {
      return;
    }
    setRecognizedCustomer({
      name: `${regName} (${regPhone})`,
      score: 99.4,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    });
    setCustomerMode('KNOWN');
    setPosState('CUSTOMER_PIN');
  };

  const resetPos = () => {
    setPosState('KEYPAD');
    setBillAmount('0');
    setRecognizedCustomer(null);
    setCustomerPin('');
    setPinError(null);
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold">
                  {language === 'sw' ? 'Kaunta ya Mauzo (Merchant POS)' : 'Merchant Counter POS'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  FacePay TIPS
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

          {/* 1. KEYPAD ENTRY */}
          {posState === 'KEYPAD' && (
            <div className="space-y-4">
              {/* Screen Display of Bill */}
              <div className={`p-5 rounded-3xl border text-center relative ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'sw' ? 'Kiasi cha Kulipisha Mteja' : 'Customer Charge Amount'}
                </span>
                <div className="mt-2 text-3xl sm:text-4xl font-black text-emerald-500 tracking-tight font-mono">
                  {formatTZS(parseInt(billAmount || '0'))}
                </div>
              </div>

              {/* Mode Toggle for testing */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">{language === 'sw' ? 'Jaribu Hali:' : 'Test Mode:'}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('KNOWN')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      customerMode === 'KNOWN'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {language === 'sw' ? 'Uso Uliosajiliwa' : 'Registered'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('UNKNOWN')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      customerMode === 'UNKNOWN'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {language === 'sw' ? 'Mteja Mpya' : 'Unregistered'}
                  </button>
                </div>
              </div>

              {/* Numerical Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleKeypadPress(val)}
                    className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-base active:scale-95 transition-all"
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={() => handleKeypadPress('C')}
                  className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-rose-500 font-bold text-xs"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-base"
                >
                  0
                </button>
                <button
                  onClick={() => handleKeypadPress('DEL')}
                  className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
                >
                  DEL
                </button>
              </div>

              <button
                onClick={handleStartScanning}
                disabled={!billAmount || parseInt(billAmount) <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <ScanFace className="w-5 h-5 stroke-[2.5]" />
                <span>{language === 'sw' ? `Lipisha ${formatTZS(parseInt(billAmount || '0'))} kwa Uso` : `Charge ${formatTZS(parseInt(billAmount || '0'))} with Face`}</span>
              </button>
            </div>
          )}

          {/* 2. SCANNING CUSTOMER WITH 3D FACE MESH */}
          {posState === 'SCANNING_CUSTOMER' && (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 shadow-2xl flex items-center justify-center">
                <img
                  src={customerMode === 'KNOWN' ? (user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80') : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                  alt="Customer Feed"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                <FaceMeshOverlay
                  status="SCANNING"
                  showBoundingBox={true}
                  showScanLine={true}
                  showLandmarkNodes={true}
                  showWireframe={true}
                  confidenceScore={99.4}
                />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>{language === 'sw' ? 'Mteja Anatazama Kamera ya POS...' : 'Scanning Customer Face...'}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'sw' ? 'Inahakiki muundo wa uso kwenye kanzidata ya TIPS' : 'Matching 3D face mesh against TIPS registry'}
                </p>
              </div>
            </div>
          )}

          {/* 3. FACE FOUND -> CUSTOMER ENTERS PIN / PASSWORD */}
          {posState === 'CUSTOMER_PIN' && recognizedCustomer && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 mx-auto">
                <img
                  src={recognizedCustomer.avatarUrl || user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                  alt="Customer"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  {language === 'sw' ? 'Uso Umetambuliwa' : 'Face Recognized'} ({recognizedCustomer.score}%)
                </span>
                <h4 className="text-base font-extrabold text-white mt-1">
                  {recognizedCustomer.name}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'sw' ? 'Tafadhali mteja aweke Nenosiri / PIN ya tarakimu 4 kukamilisha malipo haya.' : 'Customer, please enter your 4-digit PIN to authorize this payment.'}
                </p>
              </div>

              {/* PIN circles */}
              <div className="flex justify-center gap-3 py-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-10 h-11 rounded-xl flex items-center justify-center border-2 text-lg font-mono font-bold ${
                      customerPin.length > i ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {customerPin.length > i ? '●' : '○'}
                  </div>
                ))}
              </div>

              {pinError && (
                <div className="text-xs text-rose-400 font-semibold">{pinError}</div>
              )}

              {/* Customer PIN Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      if (customerPin.length < 4) {
                        const newP = customerPin + d;
                        setCustomerPin(newP);
                        if (newP.length === 4) {
                          handleAuthorizeWithPin(newP);
                        }
                      }
                    }}
                    className="h-11 rounded-xl bg-slate-950 border border-slate-800 text-base font-bold text-white active:scale-95 transition-all"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => setCustomerPin('')}
                  className="h-11 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400"
                >
                  C
                </button>
                <button
                  onClick={() => {
                    if (customerPin.length < 4) {
                      const newP = customerPin + '0';
                      setCustomerPin(newP);
                      if (newP.length === 4) {
                        handleAuthorizeWithPin(newP);
                      }
                    }
                  }}
                  className="h-11 rounded-xl bg-slate-950 border border-slate-800 text-base font-bold text-white"
                >
                  0
                </button>
                <button
                  onClick={() => setCustomerPin(p => p.slice(0, -1))}
                  className="h-11 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-rose-400"
                >
                  ⌫
                </button>
              </div>
            </div>
          )}

          {/* 4. FACE NOT IN SYSTEM -> PROMPT REGISTRATION */}
          {posState === 'UNREGISTERED_CUSTOMER' && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200 py-3">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                  {language === 'sw' ? 'Uso Haupo Kwenye Mfumo' : 'Unregistered Customer'}
                </span>
                <h4 className="text-base font-black text-white mt-1.5">
                  {language === 'sw' ? 'Mteja Hajasajiliwa na FacePay!' : 'Customer Not Registered with FacePay!'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  {language === 'sw' 
                    ? 'Uso huu haupo kwenye kanzidata. Mteja anaweza kujisajili hapa hapa kwa sekunde chache ili akamilishe malipo kwa uso.' 
                    : 'Face not found in database. Customer can register right here to complete payment.'}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setPosState('REGISTER_CUSTOMER')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Sajili Mteja Mpya Hapa (Weka Taarifa & Skani)' : 'Register Customer (Enter Details & Scan)'}</span>
                </button>

                <button
                  onClick={() => setPosState('KEYPAD')}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white"
                >
                  {language === 'sw' ? 'Ghairi & Rudi Kwenye Bili' : 'Cancel & Back to POS'}
                </button>
              </div>
            </div>
          )}

          {/* 5. QUICK CUSTOMER REGISTRATION */}
          {posState === 'REGISTER_CUSTOMER' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-center">
                <h4 className="text-sm font-bold text-white">
                  {language === 'sw' ? 'Usajili wa Mteja Mpya kwenye Kaunta' : 'POS Customer Registration'}
                </h4>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">{language === 'sw' ? 'Jina Kamili' : 'Full Name'}</label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Mfano: Daudi M. Mwita"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">{language === 'sw' ? 'Namba ya Simu' : 'Phone Number'}</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="0755 987 654"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">{language === 'sw' ? 'Weka PIN ya Tarakimu 4' : 'Set 4-digit PIN'}</label>
                <input
                  type="password"
                  maxLength={4}
                  value={regPin}
                  onChange={e => setRegPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-emerald-400"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleRegisterAndProceed}
                  disabled={!regName || !regPhone || regPin.length < 4}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Hifadhi Uso & Endelea na Malipo' : 'Save Face & Proceed to Pay'}</span>
                </button>

                <button
                  onClick={() => setPosState('KEYPAD')}
                  className="w-full py-2 text-xs text-slate-400"
                >
                  {language === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* 6. SUCCESS CONFIRMATION */}
          {posState === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-lg font-black text-emerald-500">
                  {language === 'sw' ? 'MALIPO YAMEPOKELEWA KIKAMILIFU!' : 'PAYMENT RECEIVED SUCCESSFULLY!'}
                </h4>
                <p className="text-sm font-bold text-white mt-1">
                  {formatTZS(parseInt(billAmount))}
                </p>
              </div>

              {recognizedCustomer && (
                <div className="w-full p-4 rounded-2xl border text-left text-xs space-y-1.5 bg-slate-950 border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'sw' ? 'Mteja:' : 'Customer:'}</span>
                    <span className="font-bold text-white">{recognizedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'sw' ? 'Alama za Uso:' : 'Biometric Match:'}</span>
                    <span className="font-bold text-emerald-400">{recognizedCustomer.score}% (PIN Sahihi)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'sw' ? 'Ref ya TIPS:' : 'TIPS Ref:'}</span>
                    <span className="font-mono text-slate-400">TIPS-POS-TX-{Date.now().toString().slice(-6)}</span>
                  </div>
                </div>
              )}

              {/* Soundbox audio feedback indicator */}
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>{language === 'sw' ? 'Sauti ya "Umelipwa TZS ..." imetangazwa kwenye Soundbox!' : 'Soundbox Voice Broadcast Dispatched!'}</span>
              </div>

              <div className="w-full flex gap-2 pt-2">
                <button
                  onClick={resetPos}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold active:scale-95 transition-all shadow-md"
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
            className="w-full py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
          >
            {language === 'sw' ? 'Ondoka kwenye Hali ya POS' : 'Exit Merchant POS'}
          </button>
        </div>

      </div>
    </div>
  );
};
