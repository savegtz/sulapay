import React, { useState } from 'react';
import { 
  QrCode, 
  X, 
  Camera, 
  Store, 
  ArrowRight, 
  ScanFace, 
  Sparkles, 
  Check, 
  AlertCircle,
  FileImage
} from 'lucide-react';
import { Language, Merchant, Wallet } from '../types';
import { formatTZS } from '../utils/formatters';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  merchants: Merchant[];
  language: Language;
  onProceedToFacePay: (merchant: Merchant, amount: number) => void;
}

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  isOpen,
  onClose,
  wallet,
  merchants,
  language,
  onProceedToFacePay
}) => {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant>(merchants[0] || {} as Merchant);
  const [lipaInput, setLipaInput] = useState<string>(merchants[0]?.lipaNumber || '5892104');
  const [amount, setAmount] = useState<string>('15000');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectMerchant = (m: Merchant) => {
    setSelectedMerchant(m);
    setLipaInput(m.lipaNumber);
    setErrorMessage(null);
  };

  const handleConfirmQR = () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage(language === 'sw' ? 'Weka kiasi halali cha TZS' : 'Enter a valid amount');
      return;
    }
    if (numericAmount > wallet.balance) {
      setErrorMessage(language === 'sw' ? `Salio halitoshi (${formatTZS(wallet.balance)})` : `Insufficient balance (${formatTZS(wallet.balance)})`);
      return;
    }

    onProceedToFacePay(selectedMerchant, numericAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-700/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === 'sw' ? 'Lipa kwa QR (TIPS QR Payment)' : 'TIPS QR Payment'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'sw' ? 'Skani Lipa Namba ya duka au chagua muuzaji' : 'Scan merchant Lipa Namba QR or select store'}
              </p>
            </div>
          </div>

          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Simulated Live QR Viewfinder */}
          <div className="relative h-48 rounded-2xl bg-slate-950 border-2 border-dashed border-teal-500/50 overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Corner crosshairs */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-teal-400" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-teal-400" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-teal-400" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-teal-400" />

            {/* Laser Scanning Animation */}
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-bounce duration-1000 pointer-events-none" />

            <div className="text-center space-y-2 z-10">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900/80 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <QrCode className="w-7 h-7 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-teal-300">
                {language === 'sw' ? 'Kamera inasoma Lipa Namba QR' : 'Scanner reading Lipa Namba QR'}
              </p>
              <p className="text-[11px] text-slate-400">
                {selectedMerchant?.name ? `${selectedMerchant.name} (${selectedMerchant.lipaNumber})` : 'Elekeza kwenye QR ya mfanyabiashara'}
              </p>
            </div>
          </div>

          {/* Quick Select Tanzanian Merchant QR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {language === 'sw' ? 'Au Chagua Duka la Mfano (Quick Select)' : 'Or Quick Select Merchant QR'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {merchants.slice(0, 4).map((m) => {
                const isSelected = selectedMerchant?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMerchant(m)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-teal-950/60 border-teal-500/80 text-white shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <img 
                      src={m.logo} 
                      alt={m.name} 
                      className="w-8 h-8 rounded-lg object-cover border border-slate-700" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{m.name}</div>
                      <div className="text-[10px] font-mono text-teal-400">{m.lipaNumber}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {language === 'sw' ? 'Kiasi cha Kulipa (TZS)' : 'Payment Amount (TZS)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-teal-400">
                TZS
              </span>
              <input
                id="qr-amount-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-16 pr-4 py-2.5 text-lg font-bold font-mono text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[5000, 15000, 30000, 50000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setAmount(quick.toString())}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300"
                >
                  {quick.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            id="proceed-face-pay-from-qr-btn"
            type="button"
            onClick={handleConfirmQR}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 transition-all active:scale-[0.99]"
          >
            <ScanFace className="w-5 h-5 text-slate-950" />
            <span>
              {language === 'sw' 
                ? `Lipa ${formatTZS(Number(amount) || 0)} kwa Uso` 
                : `Pay ${formatTZS(Number(amount) || 0)} with Face`}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
