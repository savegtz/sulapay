import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Download, 
  Share2, 
  ScanFace, 
  ShieldCheck, 
  Smartphone, 
  Copy, 
  Check, 
  Printer,
  AlertCircle
} from 'lucide-react';
import { Language, Transaction } from '../types';
import { translations } from '../utils/translations';
import { formatTZS, formatDate } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction | null;
  language: Language;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  language,
  onClose
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const [showSmsAlert, setShowSmsAlert] = useState(true);

  if (!transaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-700/50 rounded-3xl shadow-2xl shadow-emerald-950/90 overflow-hidden my-6">
        
        {/* Receipt Top Header */}
        <div className="relative p-6 text-center bg-gradient-to-b from-emerald-950/80 to-slate-900 border-b border-emerald-900/40">
          <button
            id="close-receipt-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black tracking-tight text-white uppercase font-sans">
            FACEPAY <span className="text-emerald-400">TZ</span> RISITI
          </h3>
          <p className="text-xs text-emerald-300/80 font-mono">
            {language === 'sw' ? 'Uthibitisho wa Malipo ya Uso' : 'Official FacePay Payment Receipt'}
          </p>

          <div className="mt-4">
            <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
              {t.payment.totalToPay}
            </span>
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatTZS(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Demo Warning Notice */}
        <div className="bg-amber-500/20 border-y border-amber-500/40 px-4 py-2.5 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-amber-300">
              {language === 'sw' ? 'TAARIFA YA MAJARIBIO (SANDBOX DEMO)' : 'SIMULATED DEMO NOTICE'}
            </span>
            <span className="text-[11px] leading-relaxed block text-amber-200/90">
              {language === 'sw' 
                ? 'Huu ni muamala wa majaribio ya kiteknolojia (TIPS Sandbox). Hakuna fedha halisi za M-Pesa, Tigo, Airtel au Benki zilizohusika au kukatwa.'
                : 'This is a simulated technology demonstration (TIPS Sandbox). No actual fiat currency, mobile money, or bank balances were debited.'}
            </span>
          </div>
        </div>

        {/* Receipt Line Items */}
        <div className="p-6 space-y-3.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.refNumber}</span>
            <div className="flex items-center gap-1.5 font-mono text-white font-bold">
              <span>{transaction.referenceNumber}</span>
              <button 
                onClick={handleCopyRef} 
                className="text-slate-400 hover:text-emerald-400 transition-colors"
                title="Copy Reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{language === 'sw' ? 'Ref ya MNO / TIPS' : 'TIPS / Switch Ref'}</span>
            <span className="font-mono text-slate-200">{transaction.externalProviderRef}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.merchant}</span>
            <span className="text-white font-semibold text-right">{transaction.merchantName}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">Lipa Namba (Till)</span>
            <span className="font-mono text-emerald-400 font-bold">{transaction.merchantLipaNumber}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.settlementRail}</span>
            <span className="text-slate-200">{transaction.paymentRail.replace('_', ' ')}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.date}</span>
            <span className="font-mono text-slate-200">{formatDate(transaction.timestamp)}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{language === 'sw' ? 'Njia ya Uthibitisho' : 'Verification Mode'}</span>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ScanFace className="w-3.5 h-3.5" />
              <span>{transaction.verificationMode} ({transaction.biometricScore || 98.7}%)</span>
            </div>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.serviceFee}</span>
            <span className="text-emerald-400 font-bold">{t.payment.freeFee}</span>
          </div>

          {/* Simulated SMS Notification Card */}
          {showSmsAlert && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ujumbe wa SMS (Vodacom M-Pesa TIPS)</span>
                </div>
                <span>Sasa Hivi</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                "{transaction.externalProviderRef} Imethibitishwa. Umetuma TZS {transaction.amount.toLocaleString()} kwa {transaction.merchantName} (Lipa Namba: {transaction.merchantLipaNumber}) tarehe {formatDate(transaction.timestamp).slice(0, 11)} kupitia FacePay Tanzania. Ada TZS 0. Salio lako jipya limehifadhiwa."
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2.5">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{language === 'sw' ? 'Chapa' : 'Print'}</span>
            </button>

            <button
              id="done-receipt-btn"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <span>{language === 'sw' ? 'Sawa / Nimemaliza' : 'Done'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
