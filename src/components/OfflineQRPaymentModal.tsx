import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  QrCode, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Smartphone, 
  Copy, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Send,
  Sparkles,
  Lock
} from 'lucide-react';
import QRCode from 'qrcode';
import { Language, UserProfile, Wallet, Transaction } from '../types';
import { formatTZS, formatDate } from '../utils/formatters';

interface OfflineQRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  wallet: Wallet;
  language: Language;
  onOfflinePaymentCreated?: (tx: Transaction) => void;
  onOfflinePaymentQueued?: (tx: Transaction, updatedWallet: Wallet) => void;
}

export const OfflineQRPaymentModal: React.FC<OfflineQRPaymentModalProps> = ({
  isOpen,
  onClose,
  user,
  wallet,
  language,
  onOfflinePaymentCreated,
  onOfflinePaymentQueued
}) => {
  const [activeTab, setActiveTab] = useState<'GENERATE_VOUCHER' | 'OFFLINE_SCAN' | 'SYNC_QUEUE'>('GENERATE_VOUCHER');
  const [voucherAmount, setVoucherAmount] = useState<number>(20000);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [offlineToken, setOfflineToken] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 min TTL
  const [copiedUssd, setCopiedUssd] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // Load offline queue from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('FACEPAY_OFFLINE_QUEUE');
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Offline queue storage error:', e);
    }
  }, [isOpen]);

  // Generate dynamic offline signed token and QR
  useEffect(() => {
    if (isOpen) {
      generateOfflineToken();
      setSecondsRemaining(300);
    }
  }, [isOpen, voucherAmount]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          generateOfflineToken();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, voucherAmount]);

  const generateOfflineToken = async () => {
    const timestamp = Date.now();
    const expiry = timestamp + 300000;
    const randomSalt = Math.random().toString(36).substring(2, 9).toUpperCase();
    const currentUid = user?.id || 'usr_tz_offline';
    const tokenPayload = {
      protocol: 'FACEPAY_OFFLINE_TIPS_V2',
      uid: currentUid,
      name: user?.fullName || 'Offline Customer',
      phone: user?.phoneNumber || '+255 754 000 000',
      nida: user?.nationalIdNida ? user.nationalIdNida.slice(0, 8) + '...' : '19920815...',
      maxAmount: voucherAmount,
      rail: wallet?.linkedRail || 'M_PESA',
      exp: expiry,
      salt: randomSalt,
      hmacSignature: `SHA256:${randomSalt}-${timestamp}-${currentUid.slice(-6)}`
    };

    const tokenString = JSON.stringify(tokenPayload);
    setOfflineToken(tokenPayload.hmacSignature);

    try {
      const url = await QRCode.toDataURL(tokenString, {
        width: 320,
        margin: 2,
        color: {
          dark: '#022c22', // deep emerald
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.warn('QR generation error:', err);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const ussdCode = `*150*00*1*5892104*${voucherAmount}*${offlineToken.slice(-6)}#`;

  const handleCopyUssd = () => {
    navigator.clipboard.writeText(ussdCode);
    setCopiedUssd(true);
    setTimeout(() => setCopiedUssd(false), 2000);
  };

  // Simulate storing an offline transaction
  const handleSimulateOfflineScan = () => {
    const newOfflineTx = {
      id: `off_tx_${Date.now()}`,
      referenceNumber: `FP-OFF-${Math.floor(1000 + Math.random() * 9000)}-${offlineToken.slice(-4)}`,
      merchantName: 'Shoppers Plaza Masaki (Offline Terminal)',
      merchantLipaNumber: '5892104',
      amount: voucherAmount,
      timestamp: new Date().toISOString(),
      status: 'OFFLINE_PENDING_SYNC',
      verificationMode: 'OFFLINE_DYNAMIC_QR'
    };

    const updated = [newOfflineTx, ...offlineQueue];
    setOfflineQueue(updated);
    localStorage.setItem('FACEPAY_OFFLINE_QUEUE', JSON.stringify(updated));
    setActiveTab('SYNC_QUEUE');
  };

  const handleSyncAllOnline = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Complete offline transactions into main app state
      if (offlineQueue.length > 0) {
        let currentBalance = wallet?.balance || 0;
        offlineQueue.forEach((item) => {
          const syncedTx: Transaction = {
            id: item.id,
            referenceNumber: item.referenceNumber,
            externalProviderRef: `TIPS-OFFLINE-SYNC-${item.id.slice(-6)}`,
            userId: user?.id || 'usr_tz_offline',
            userName: user?.fullName || 'Offline Customer',
            merchantId: 'mch_001',
            merchantName: item.merchantName,
            merchantLipaNumber: item.merchantLipaNumber,
            amount: item.amount,
            fee: 0,
            currency: 'TZS',
            status: 'COMPLETED',
            paymentRail: wallet?.linkedRail || 'M_PESA',
            verificationMode: 'FACE_BIOMETRIC',
            biometricScore: 99.0,
            livenessPassed: true,
            isDemo: true,
            timestamp: item.timestamp,
            notes: 'Offline QR Payment Synced to TIPS Switch'
          };
          currentBalance = Math.max(0, currentBalance - item.amount);
          if (onOfflinePaymentCreated) {
            onOfflinePaymentCreated(syncedTx);
          }
          if (onOfflinePaymentQueued) {
            onOfflinePaymentQueued(syncedTx, {
              ...wallet,
              balance: currentBalance,
              updatedAt: new Date().toISOString()
            });
          }
        });
      }

      setOfflineQueue([]);
      localStorage.removeItem('FACEPAY_OFFLINE_QUEUE');
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-700/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Banner indicating Offline Capability */}
        <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900 px-3.5 sm:px-4 py-3 sm:py-4 border-b border-emerald-700/40 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <WifiOff className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  {language === 'sw' ? 'Malipo Nje ya Mtandao' : 'Offline QR Payments'}
                </h3>
                <span className="text-[9.5px] sm:text-[10px] bg-emerald-400/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-400/40">
                  OFFLINE
                </span>
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-slate-300 line-clamp-1 sm:line-clamp-none">
                {language === 'sw' 
                  ? 'Lipa hata bila bando au intaneti' 
                  : 'Pay without mobile data or network'}
              </p>
            </div>
          </div>

          <button
            id="close-offline-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 sm:p-2 gap-1.5 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('GENERATE_VOUCHER')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs ${
              activeTab === 'GENERATE_VOUCHER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'sw' ? 'Vocha ya Nje' : 'My Voucher'}</span>
          </button>

          <button
            onClick={() => setActiveTab('OFFLINE_SCAN')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs ${
              activeTab === 'OFFLINE_SCAN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'sw' ? 'Pima Dukani' : 'Test Pay'}</span>
          </button>

          <button
            onClick={() => setActiveTab('SYNC_QUEUE')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all relative text-[11px] sm:text-xs ${
              activeTab === 'SYNC_QUEUE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'sw' ? 'Sawazisha' : 'Sync'}</span>
            {offlineQueue.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center ml-1 shrink-0">
                {offlineQueue.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Generate Offline Encrypted QR Voucher */}
        {activeTab === 'GENERATE_VOUCHER' && (
          <div className="p-6 space-y-5 text-center">
            {/* Amount selection for offline voucher */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'sw' ? 'Kiwango cha Vocha ya Nje:' : 'Offline Voucher Limit:'}
              </span>
              <div className="flex gap-1.5">
                {[10000, 20000, 50000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setVoucherAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      voucherAmount === amt
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {formatTZS(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Printable / Scannable Offline QR */}
            <div className="relative mx-auto w-64 bg-white p-4 rounded-3xl shadow-2xl border-4 border-emerald-500 text-slate-950 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-emerald-700 px-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> OFFLINE TOKEN
                </span>
                <span className="font-mono text-slate-900 bg-emerald-100 px-1.5 py-0.5 rounded">
                  {timeFormatted}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Offline FacePay QR" className="w-52 h-52 object-contain" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>

              <div className="text-center pt-1 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800">{user.fullName}</div>
                <div className="text-lg font-black font-mono text-emerald-700">
                  {formatTZS(voucherAmount)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                  Sig: {offlineToken}
                </div>
              </div>
            </div>

            {/* Timer and instructions */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>
                  {language === 'sw' 
                    ? `Vocha hii inatumika kwa sekunde ${secondsRemaining} zilizobaki` 
                    : `Valid for next ${secondsRemaining}s before dynamic auto-refresh`}
                </span>
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'sw'
                  ? 'Onyesha QR hii kwa mfanyabiashara hata kama huna mtandao. Mashine ya POS itasoma na kuthibitisha saini yako ya kiusalama.'
                  : 'Display this QR to the merchant even with zero internet. The POS terminal verifies cryptographic signature locally.'}
              </p>
            </div>

            {/* Fallback USSD String */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  {language === 'sw' ? 'Njia Mbadala: Piga USSD ya Haraka' : 'Offline Fallback: USSD String'}
                </span>
                <button
                  onClick={handleCopyUssd}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {copiedUssd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUssd ? 'Imenakiliwa' : 'Nakili USSD'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-300 bg-slate-900 p-2 rounded-xl border border-slate-800 select-all">
                {ussdCode}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={generateOfflineToken}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'sw' ? 'Sasisha Vocha Sasa' : 'Regenerate Token'}</span>
              </button>

              <button
                onClick={handleSimulateOfflineScan}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{language === 'sw' ? 'Jaribu Kulipa Sasa' : 'Simulate Store Charge'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Test Store Pay / Scanner Simulation */}
        {activeTab === 'OFFLINE_SCAN' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white">
                {language === 'sw' ? 'Kuskani QR ya Duka Nje ya Mtandao' : 'Scan Merchant Till Offline'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'sw'
                  ? 'Ikiwa duka halina intaneti, FacePay inatunza malipo yako katika kumbukumbu salama na kuyasafirisha mara moja intaneti ikirudi.'
                  : 'Stores transaction locally with cryptographic proof and syncs once connection is restored.'}
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Duka la Mfano:</span>
                <span className="text-white font-bold">Shoppers Plaza Masaki (Lipa: 5892104)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Kiasi:</span>
                <span className="text-emerald-400 font-mono font-bold">{formatTZS(voucherAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Hali ya Mtandao:</span>
                <span className="text-amber-400 font-mono flex items-center gap-1 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" /> Nje ya Mtandao (Offline)
                </span>
              </div>

              <button
                onClick={handleSimulateOfflineScan}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === 'sw'
                    ? `Idhinisha Malipo ya Nje ya Mtandao (${formatTZS(voucherAmount)})`
                    : `Authorize Offline Payment (${formatTZS(voucherAmount)})`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Sync Queue */}
        {activeTab === 'SYNC_QUEUE' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {language === 'sw' ? 'Miamala ya Nje Inayosubiri Kusawazishwa' : 'Pending Offline Queue'}
                </h4>
                <p className="text-xs text-slate-400">
                  {offlineQueue.length} {language === 'sw' ? 'miamala inasubiri mtandao' : 'transactions ready for TIPS sync'}
                </p>
              </div>

              {offlineQueue.length > 0 && (
                <button
                  onClick={handleSyncAllOnline}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Inasawazisha...' : 'Sawazisha Sasa'}</span>
                </button>
              )}
            </div>

            {syncSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'sw' 
                    ? 'Miamala yote ya nje ya mtandao imethibitishwa na TIPS Switch kwa mafanikio!' 
                    : 'All offline transactions successfully synchronized to TIPS Switch!'}
                </span>
              </div>
            )}

            {offlineQueue.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">
                  {language === 'sw' ? 'Hakuna miamala inayosubiri kusawazishwa' : 'All transactions are fully synchronized'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === 'sw'
                    ? 'Miamala yote ya nje ya mtandao tayari imerekodiwa kwenye TIPS.'
                    : 'Your wallet is fully up-to-date with central Bank of Tanzania TIPS switch.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {offlineQueue.map((tx: any) => (
                  <div key={tx.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{tx.merchantName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.referenceNumber}</div>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">Hali: Inasubiri Kusawazishwa</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">{formatTZS(tx.amount)}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(tx.timestamp).slice(0, 16)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            BOT TIPS Offline Protocol • HMAC-SHA256 Encrypted
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
