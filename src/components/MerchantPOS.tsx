import React, { useState, useRef, useEffect } from 'react';
import { 
  Store, 
  ScanFace, 
  CheckCircle2, 
  Delete, 
  Printer, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Language, Merchant, Transaction, UserProfile, Wallet } from '../types';
import { translations } from '../utils/translations';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

interface MerchantPOSProps {
  merchant: Merchant;
  user: UserProfile;
  language: Language;
  onPaymentCompleted: (transaction: Transaction, updatedWallet: Wallet) => void;
}

export const MerchantPOS: React.FC<MerchantPOSProps> = ({
  merchant,
  user,
  language,
  onPaymentCompleted
}) => {
  const t = translations[language];
  const [billAmount, setBillAmount] = useState<string>('15000');
  const [posState, setPosState] = useState<'ENTER_AMOUNT' | 'SCANNING_CUSTOMER' | 'CUSTOMER_FOUND' | 'PAID'>('ENTER_AMOUNT');
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (posState === 'SCANNING_CUSTOMER') {
      startCamera();
      // Simulate POS scanning customer face
      const timer = setTimeout(() => {
        setPosState('CUSTOMER_FOUND');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [posState]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('POS camera unavailable:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleKeyPress = (val: string) => {
    if (billAmount === '0') {
      setBillAmount(val);
    } else if (billAmount.length < 9) {
      setBillAmount(prev => prev + val);
    }
  };

  const handleDelete = () => {
    if (billAmount.length > 1) {
      setBillAmount(prev => prev.slice(0, -1));
    } else {
      setBillAmount('0');
    }
  };

  const handleStartScan = () => {
    const num = Number(billAmount);
    if (!num || num <= 0) {
      setErrorMessage(language === 'sw' ? 'Weka kiasi halali cha bili' : 'Enter valid bill amount');
      return;
    }
    setErrorMessage(null);
    setPosState('SCANNING_CUSTOMER');
  };

  const handleConfirmCustomerCharge = async () => {
    setIsProcessing(true);
    try {
      const result = await apiClient.authorizePayment({
        merchantId: merchant.id,
        lipaNumber: merchant.lipaNumber,
        merchantName: merchant.name,
        amount: Number(billAmount),
        paymentRail: merchant.settlementRail,
        verificationMode: 'FACE_BIOMETRIC',
        biometricScore: 99.2,
        notes: `POS Terminal checkout at ${merchant.name}`
      });

      setLastTx(result.transaction);
      setPosState('PAID');
      onPaymentCompleted(result.transaction, result.updatedWallet);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing error');
      setPosState('ENTER_AMOUNT');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Merchant POS Terminal Banner */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img 
            src={merchant.logo} 
            alt={merchant.name} 
            className="w-13 h-13 rounded-2xl object-cover border border-slate-700"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {merchant.name}
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800">
                POS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Lipa Namba: <span className="text-emerald-400 font-bold">{merchant.lipaNumber}</span> • {merchant.location}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Settlement Rail
          </span>
          <span className="text-xs font-semibold text-emerald-400 font-mono">
            {merchant.settlementRail.replace('_', ' ')}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STATE 1: AMOUNT NUMPAD */}
      {posState === 'ENTER_AMOUNT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl shadow-slate-950/60">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t.merchantPos.enterBillAmount}
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white mt-2 tracking-tight">
              {formatTZS(Number(billAmount))}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[5000, 10000, 25000, 50000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setBillAmount(val.toString())}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 font-semibold transition-colors"
              >
                +{val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* 3x4 Numpad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-xl font-bold font-mono text-white border border-slate-800/80 active:scale-95 transition-all shadow-sm"
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-slate-950 hover:bg-rose-950/40 hover:border-rose-700/50 text-rose-400 border border-slate-800/80 active:scale-95 transition-all flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Action: Ask customer to face terminal */}
          <button
            id="merchant-scan-face-btn"
            onClick={handleStartScan}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-3"
          >
            <ScanFace className="w-6 h-6" />
            <span>{t.merchantPos.readyToScan}</span>
          </button>
        </div>
      )}

      {/* STATE 2: SCANNING CUSTOMER */}
      {posState === 'SCANNING_CUSTOMER' && (
        <div className="bg-slate-900 border border-emerald-800/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
          <div className="relative mx-auto w-64 h-72 rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />
            {/* Fallback sample face image if video has no track */}
            <img
              src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
              alt="Customer Face"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-x-0 h-1 bg-emerald-400 animate-bounce shadow-[0_0_15px_#10b981] z-20" />
            <div className="absolute inset-5 rounded-[45%] border-2 border-dashed border-emerald-400 pointer-events-none" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <span>Inatambua Sura ya Mteja...</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bili ya <span className="text-white font-mono font-bold">{formatTZS(Number(billAmount))}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPosState('ENTER_AMOUNT')}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
          >
            {t.actions.cancel}
          </button>
        </div>
      )}

      {/* STATE 3: CUSTOMER IDENTIFIED */}
      {posState === 'CUSTOMER_FOUND' && (
        <div className="bg-slate-900 border border-emerald-600/70 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {t.merchantPos.customerDetected}
            </h3>
            <p className="text-xs text-emerald-400 font-mono">
              Biometric Token Match: 99.2% • Liveness Confirmed
            </p>
          </div>

          {/* Customer Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={user.fullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{user.fullName}</h4>
                <p className="text-xs text-slate-400 font-mono">{maskPhoneNumber(user.phoneNumber)}</p>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">
                  Wallet: {formatTZS(user.securitySettings.maxLimitWithoutPin)} Face Limit
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Kiasi cha Bili</span>
              <span className="text-lg font-mono font-bold text-white">{formatTZS(Number(billAmount))}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              id="confirm-customer-charge-btn"
              onClick={handleConfirmCustomerCharge}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isProcessing ? 'Inalipa...' : t.merchantPos.authorizePayment}</span>
            </button>

            <button
              type="button"
              onClick={() => setPosState('ENTER_AMOUNT')}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {t.actions.cancel}
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: TRANSACTION COMPLETED */}
      {posState === 'PAID' && lastTx && (
        <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {t.merchantPos.transactionCleared}
            </h3>
            <p className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
              {formatTZS(lastTx.amount)}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Ref: {lastTx.referenceNumber} • {lastTx.userName}
            </p>
          </div>

          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
            SANDBOX POS TRANSACTION: Pesa zimeingia kwenye akaunti ya duka kupitia TIPS Switch.
          </div>

          <div className="flex gap-3">
            <button
              id="new-sale-pos-btn"
              onClick={() => {
                setBillAmount('0');
                setPosState('ENTER_AMOUNT');
              }}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
            >
              Mauzo Mapya (New Sale)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
