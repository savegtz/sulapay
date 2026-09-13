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
  UserCheck,
  QrCode,
  TrendingUp,
  Download,
  Calendar,
  Share2,
  ChevronDown,
  Radio,
  WifiOff
} from 'lucide-react';
import { Language, Merchant, Transaction, UserProfile, Wallet } from '../types';
import { translations } from '../utils/translations';
import { formatTZS, maskPhoneNumber, formatDate } from '../utils/formatters';
import { apiClient } from '../services/apiClient';
import { MERCHANTS } from '../data/mockData';
import { soundbox } from '../utils/soundboxAudio';
import { SoundboxSpeaker } from './SoundboxSpeaker';
import { FaceMeshOverlay } from './FaceMeshOverlay';

interface MerchantPOSProps {
  merchant: Merchant;
  user: UserProfile;
  language: Language;
  onPaymentCompleted: (transaction: Transaction, updatedWallet: Wallet) => void;
}

export const MerchantPOS: React.FC<MerchantPOSProps> = ({
  merchant: initialMerchant,
  user,
  language,
  onPaymentCompleted
}) => {
  const t = translations[language];
  const [activeMerchant, setActiveMerchant] = useState<Merchant>(initialMerchant);
  const [activeView, setActiveView] = useState<'POS' | 'SOUNDBOX' | 'QR' | 'LEDGER'>('POS');

  // POS State
  const [billAmount, setBillAmount] = useState<string>('15000');
  const [posState, setPosState] = useState<'ENTER_AMOUNT' | 'SCANNING_CUSTOMER' | 'CUSTOMER_FOUND' | 'PAID'>('ENTER_AMOUNT');
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // QR Stand State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);

  // Merchant Sales Ledger State
  const [merchantSales, setMerchantSales] = useState<Transaction[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadMerchantQr(activeMerchant.id);
    loadMerchantSales();
  }, [activeMerchant]);

  useEffect(() => {
    if (posState === 'SCANNING_CUSTOMER') {
      startCamera();
      const timer = setTimeout(() => {
        setPosState('CUSTOMER_FOUND');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [posState]);

  const loadMerchantQr = async (merchantId: string) => {
    setQrLoading(true);
    try {
      const data = await apiClient.getMerchantQr(merchantId);
      if (data.qrDataUrl) {
        setQrCodeDataUrl(data.qrDataUrl);
      }
    } catch (err) {
      console.warn('QR API fallback:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const loadMerchantSales = async () => {
    try {
      const allTx = await apiClient.getTransactions();
      const filtered = allTx.filter(tx => 
        tx.merchantLipaNumber === activeMerchant.lipaNumber || 
        tx.merchantName === activeMerchant.name
      );
      setMerchantSales(filtered.length > 0 ? filtered : allTx.slice(0, 5));
    } catch (e) {
      console.warn('Failed to load merchant sales:', e);
    }
  };

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
        merchantId: activeMerchant.id,
        lipaNumber: activeMerchant.lipaNumber,
        merchantName: activeMerchant.name,
        amount: Number(billAmount),
        paymentRail: activeMerchant.settlementRail,
        verificationMode: 'FACE_BIOMETRIC',
        biometricScore: 99.2,
        notes: `POS Terminal checkout at ${activeMerchant.name}`
      });

      setLastTx(result.transaction);
      setPosState('PAID');
      setMerchantSales(prev => [result.transaction, ...prev]);
      onPaymentCompleted(result.transaction, result.updatedWallet);

      // Trigger Merchant Soundbox Voice Announcement!
      soundbox.announcePayment({
        amount: Number(billAmount),
        payerName: user.fullName,
        rail: activeMerchant.settlementRail,
        language: language
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing error');
      setPosState('ENTER_AMOUNT');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCollectedToday = merchantSales.reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Merchant Dashboard Header Card */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img 
              src={activeMerchant.logo} 
              alt={activeMerchant.name} 
              className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {activeMerchant.name}
                </h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800">
                  POS ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Lipa Namba: <span className="text-emerald-400 font-bold">{activeMerchant.lipaNumber}</span> • {activeMerchant.location}
              </p>
            </div>
          </div>

          {/* Quick Switch Merchant Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="select-active-merchant"
              value={activeMerchant.id}
              onChange={(e) => {
                const found = MERCHANTS.find(m => m.id === e.target.value);
                if (found) setActiveMerchant(found);
              }}
              className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              {MERCHANTS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-t border-slate-800 pt-3 gap-2">
          <button
            id="tab-pos-terminal"
            onClick={() => setActiveView('POS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'POS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            <span>{language === 'sw' ? 'Kituo cha Mauzo (POS)' : 'POS Terminal'}</span>
          </button>

          <button
            id="tab-pos-soundbox"
            onClick={() => setActiveView('SOUNDBOX')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'SOUNDBOX'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{language === 'sw' ? 'Soundbox ya Sauti' : 'Soundbox Voice'}</span>
          </button>

          <button
            id="tab-pos-qr"
            onClick={() => setActiveView('QR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'QR'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{language === 'sw' ? 'Bango la QR (Lipa Namba)' : 'QR Stand'}</span>
          </button>

          <button
            id="tab-pos-ledger"
            onClick={() => setActiveView('LEDGER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'LEDGER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{language === 'sw' ? 'Daftari la Mauzo' : 'Sales Ledger'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VIEW 1: POS TERMINAL */}
      {activeView === 'POS' && (
        <>
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
                <img
                  src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                  alt="Customer Face"
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
                SANDBOX POS TRANSACTION: Pesa za mfano zimeingia kwenye akaunti ya duka kupitia TIPS Switch.
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
        </>
      )}

      {/* VIEW 2: SOUNDBOX VIEW */}
      {activeView === 'SOUNDBOX' && (
        <div className="space-y-6">
          <SoundboxSpeaker
            language={language}
            lastAmount={lastTx ? lastTx.amount : Number(billAmount) || 15000}
            lastPayer={lastTx ? lastTx.userName : user.fullName}
            lastRail={lastTx ? lastTx.paymentRail : activeMerchant.settlementRail}
          />

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{language === 'sw' ? 'Jinsi FacePay Soundbox Inavyofanya Kazi' : 'How FacePay Soundbox Works'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block font-mono">1. Hakuna Ulaghai wa SMS</span>
                <p className="text-[11px] text-slate-400">
                  {language === 'sw'
                    ? 'Spika inatamka kiasi papo hapo kwa sauti ya Kiswahili, hivyo mfanyabiashara hawezi kudanganywa na screenshot feki ya SMS.'
                    : 'Instant spoken broadcast in Swahili eliminates reliance on fraudulent SMS screenshots.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block font-mono">2. MNOs & TIPS Switch</span>
                <p className="text-[11px] text-slate-400">
                  {language === 'sw'
                    ? 'Inapokea taarifa kutoka Vodacom M-Pesa, Tigo Pesa, Airtel Money na Benki za CRDB na NMB kwa sekunde 0.8.'
                    : 'Accepts notifications from all Tanzanian networks and banks via TIPS in under 0.8s.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block font-mono">3. Ulinzi wa Biometria</span>
                <p className="text-[11px] text-slate-400">
                  {language === 'sw'
                    ? 'Mteja anapoidhinisha kwa uso, taarifa inathibitishwa na switch ya BOT na kutangazwa papo hapo.'
                    : 'When customer face biometric clears, TIPS switch broadcasts audio immediately.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MERCHANT LIPA NAMBA QR CODE STAND */}
      {activeView === 'QR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-center">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {language === 'sw' ? 'Bango Rasmi la Lipa Namba QR' : 'Official Lipa Namba QR Stand'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'sw' 
                ? 'Wateja wanaweza kuskani QR hii kwenye kaunta na kuidhinisha kwa uso papo hapo.' 
                : 'Customers can scan this counter QR code and authorize payment with their face instantly.'}
            </p>
          </div>

          {/* Printable QR Stand Card */}
          <div className="max-w-xs mx-auto bg-white p-6 rounded-3xl text-slate-950 shadow-2xl border-4 border-emerald-500 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <ScanFace className="w-5 h-5 text-emerald-600" />
              <span className="font-extrabold tracking-tight text-sm uppercase">FACEPAY TZ</span>
            </div>

            <div className="bg-slate-100 p-3 rounded-2xl flex items-center justify-center">
              {qrLoading ? (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Lipa Namba QR" 
                  className="w-48 h-48 rounded-xl"
                />
              ) : (
                <QrCode className="w-48 h-48 text-slate-900" />
              )}
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Lipa Namba</div>
              <div className="text-2xl font-black font-mono tracking-wider text-emerald-700">
                {activeMerchant.lipaNumber}
              </div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{activeMerchant.name}</div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 font-mono">
              Inapokea: M-Pesa • Tigo • Airtel • TIPS Switch
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              id="print-qr-stand-btn"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{language === 'sw' ? 'Chapa Bango (Print Stand)' : 'Print Stand'}</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: SALES LEDGER */}
      {activeView === 'LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'sw' ? 'Daftari la Mauzo ya Duka' : 'Merchant Settlement Ledger'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'sw' ? 'Mapato ya leo kupitia FacePay TIPS' : "Today's collections via FacePay TIPS"}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Jumla ya Mauzo</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatTZS(totalCollectedToday)}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {merchantSales.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{tx.userName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
                      {tx.verificationMode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ref: {tx.referenceNumber} • {formatDate(tx.timestamp)}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-emerald-400">+{formatTZS(tx.amount)}</span>
                  <span className="block text-[10px] text-slate-400">{(tx.paymentRail || 'M_PESA').replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
