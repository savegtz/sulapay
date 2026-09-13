import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Printer, 
  Share2, 
  Download, 
  Building2, 
  ShieldCheck, 
  QrCode, 
  X,
  Search,
  Check
} from 'lucide-react';
import { Language, ThemeMode, Transaction } from '../types';
import { formatTZS, formatDate } from '../utils/formatters';

interface TraReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: ThemeMode;
  transaction?: Transaction | null;
}

export const TraReceiptModal: React.FC<TraReceiptModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  transaction
}) => {
  const isDark = theme === 'dark';
  const [isValidatingWithTra, setIsValidatingWithTra] = useState(false);
  const [traVerified, setTraVerified] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentTx = transaction || {
    id: 'tx-tra-sample-01',
    userId: 'usr-001',
    userName: 'Riko Sapto',
    merchantId: 'merch-kfc-tz',
    merchantName: 'KFC Tanzania - Samora Mall',
    merchantLipaNumber: 'TIPS-KFC-9821',
    amount: 38500,
    status: 'COMPLETED',
    paymentRail: 'TIPS_INSTANT',
    referenceNumber: 'FP-TRA-2026-98124',
    externalProviderRef: 'TIPS-TRA-782190',
    verificationMode: 'FACIAL_BIOMETRICS',
    faceMatchScore: 99.7,
    createdAt: new Date().toISOString()
  };

  const tinNumber = '104-982-311';
  const vrnNumber = '40019283X';
  const zNumber = 'Z-2026-09-0012';
  const fiscalReceiptNumber = 'TZTRA-EFD-9982410';
  const verificationUrl = `https://efd.tra.go.tz/verify?rcpt=${fiscalReceiptNumber}&tin=${tinNumber}`;

  // Tax calculations (VAT 18% inclusive)
  const taxableAmount = Math.round(currentTx.amount / 1.18);
  const vatAmount = currentTx.amount - taxableAmount;

  const handleVerifyTraLive = () => {
    setIsValidatingWithTra(true);
    setTimeout(() => {
      setIsValidatingWithTra(false);
      setTraVerified(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold">
                  {language === 'sw' ? 'Stakabadhi ya TRA (EFD)' : 'TRA Fiscal EFD Receipt'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white">
                  TRA V2
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tanzania Revenue Authority Fiscal Electronic Receipt
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

        {/* Receipt Paper Simulation */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 font-sans text-xs">
          
          {/* Paper Container */}
          <div className={`p-5 rounded-2xl border border-dashed relative shadow-inner ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/20 border-slate-300'
          }`}>
            
            {/* TRA Header Crest & Details */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <p className="font-extrabold text-sm tracking-wider uppercase">
                TANZANIA REVENUE AUTHORITY
              </p>
              <p className="font-semibold text-[10px] text-slate-500">
                ELECTRONIC FISCAL DEVICE (EFD) RECEIPT
              </p>
              <p className="mt-1 font-bold text-xs uppercase text-[#543eed] dark:text-purple-400">
                {currentTx.merchantName}
              </p>
              <p className="text-[10px] text-slate-500">P.O. BOX 10294, DAR ES SALAAM, TANZANIA</p>
              <div className="mt-2 text-[10px] font-mono grid grid-cols-2 gap-1 text-slate-600 dark:text-slate-400">
                <p>TIN: <span className="font-bold text-slate-900 dark:text-slate-200">{tinNumber}</span></p>
                <p>VRN: <span className="font-bold text-slate-900 dark:text-slate-200">{vrnNumber}</span></p>
                <p>SERIAL: <span className="font-bold text-slate-900 dark:text-slate-200">FP-EFD-89102</span></p>
                <p>Z-NUM: <span className="font-bold text-slate-900 dark:text-slate-200">{zNumber}</span></p>
              </div>
            </div>

            {/* Transaction metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">RECEIPT NO:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fiscalReceiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CUSTOMER:</span>
                <span className="font-bold">{currentTx.userName} (FacePay Verified)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DATE & TIME:</span>
                <span>{formatDate(currentTx.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PAYMENT RAIL:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{currentTx.paymentRail}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1.5">
              <div className="flex justify-between font-bold text-slate-500 text-[10px]">
                <span>ITEM DESCRIPTION</span>
                <span>TOTAL (TZS)</span>
              </div>
              <div className="flex justify-between">
                <span>1x Smart Retail Order Items</span>
                <span className="font-mono">{formatTZS(currentTx.amount)}</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">TOTAL EXCL. TAX:</span>
                <span>{formatTZS(taxableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VAT (18% INCLUDED):</span>
                <span>{formatTZS(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 text-slate-900 dark:text-white">
                <span>TOTAL INCL. VAT:</span>
                <span className="text-[#543eed] dark:text-purple-400 text-sm font-black">
                  {formatTZS(currentTx.amount)}
                </span>
              </div>
            </div>

            {/* Biometrics & Verification QR */}
            <div className="pt-3 text-center flex flex-col items-center">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <div className="w-28 h-28 bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center relative">
                  {/* QR Pattern */}
                  <div className="w-full h-full grid grid-cols-6 gap-1 opacity-80">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-xs ${i % 2 === 0 || i % 3 === 0 ? 'bg-white' : 'bg-blue-400'}`} 
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 m-auto w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[8px]">
                    TRA
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[9px] font-mono text-slate-500">
                SCAN WITH TRA EFD APP TO VERIFY
              </div>

              {/* TRA Live status */}
              <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'sw' ? 'Imethibitishwa na Mfumo wa TRA' : 'TRA Fiscal Hash Verified Valid'}</span>
              </div>
            </div>

          </div>

          {/* Verification CTA button */}
          <div className="flex gap-2">
            <button
              onClick={handleVerifyTraLive}
              disabled={isValidatingWithTra}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Search className={`w-3.5 h-3.5 ${isValidatingWithTra ? 'animate-spin' : ''}`} />
              <span>
                {isValidatingWithTra 
                  ? (language === 'sw' ? 'Inathibitisha TRA...' : 'Validating TRA...') 
                  : (language === 'sw' ? 'Kagua kwenye TRA Portal' : 'Verify on TRA Portal')}
              </span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(verificationUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Copy TRA link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <ExternalLink className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-3.5 border-t flex items-center gap-2 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'sw' ? 'Chapa Risiti' : 'Print EFD'}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#543eed] text-white text-xs font-bold active:scale-95 transition-transform"
          >
            {language === 'sw' ? 'Imekamilika' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
