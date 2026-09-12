import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  FileText,
  FileImage,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Trigger celebratory confetti when receipt opens
  useEffect(() => {
    if (transaction) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#38bdf8', '#fbbf24', '#ffffff']
      });
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  /**
   * Generate and download official Tanzanian BOT TIPS PDF Receipt
   */
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 180] // Thermal / compact receipt format
      });

      // Header Colors
      doc.setFillColor(2, 44, 34); // deep emerald
      doc.rect(0, 0, 100, 28, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('FACEPAY TANZANIA', 50, 10, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Bank of Tanzania (BOT) TIPS Instant Payment', 50, 15, { align: 'center' });
      doc.text('OFFICIAL ELECTRONIC PAYMENT RECEIPT', 50, 19, { align: 'center' });

      // Amount Banner
      doc.setFillColor(241, 245, 249);
      doc.rect(8, 33, 84, 18, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(8, 33, 84, 18, 'S');

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.text('KIASI KILICHOLIPWA / TOTAL PAID', 50, 38, { align: 'center' });

      doc.setTextColor(5, 150, 105); // emerald
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`TZS ${transaction.amount.toLocaleString()}`, 50, 46, { align: 'center' });

      // Receipt details line items
      let y = 60;
      const addLine = (label: string, value: string, isBold: boolean = false) => {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 10, y);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(value, 90, y, { align: 'right' });

        // dotted separator line
        doc.setDrawColor(226, 232, 240);
        doc.line(10, y + 2, 90, y + 2);
        y += 7.5;
      };

      addLine('Nambari ya Risiti:', transaction.referenceNumber || '', true);
      addLine('Ref ya TIPS / MNO:', transaction.externalProviderRef || '');
      addLine('Mfanyabiashara:', (transaction.merchantName || '').slice(0, 22), true);
      addLine('Lipa Namba (Till):', transaction.merchantLipaNumber || '', true);
      addLine('Mlipaji (Customer):', (transaction.userName || '').slice(0, 22));
      addLine('Mtandao wa Malipo:', (transaction.paymentRail || 'M_PESA').replace('_', ' '));
      addLine('Uhakiki wa Uso:', `${transaction.verificationMode} (99%)`);
      addLine('Tarehe na Saa:', formatDate(transaction.timestamp).slice(0, 19));
      addLine('Gharama ya TIPS:', 'TZS 0.00 (BURE)', true);

      // Biometric Verification Security Stamp
      y += 3;
      doc.setFillColor(236, 253, 245); // light emerald
      doc.rect(10, y, 80, 14, 'F');
      doc.setDrawColor(52, 211, 153);
      doc.rect(10, y, 80, 14, 'S');

      doc.setTextColor(6, 95, 70);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('UTHIBITISHO WA BIOMETRIA (BOT TIPS VERIFIED)', 50, y + 5, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Liveness Confirmed • Face ID SHA-256 Token Verified', 50, y + 10, { align: 'center' });

      // Footer
      y += 20;
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6.5);
      doc.text('Asante kwa kutumia FacePay Tanzania. Malipo salama kwa uso.', 50, y, { align: 'center' });
      doc.text('www.facepay.co.tz • Simu: +255 754 000 111', 50, y + 4, { align: 'center' });

      // Save PDF
      doc.save(`FacePay_Risiti_${transaction.referenceNumber}.pdf`);
      setDownloadSuccess(language === 'sw' ? 'Risiti ya PDF imepakuliwa!' : 'PDF Receipt downloaded!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Share / Copy WhatsApp Receipt Text
   */
  const handleShareWhatsApp = () => {
    const text = `*FACEPAY TANZANIA RISITI YA MALIPO*\n\n` +
      `✅ Hali: Imelipwa Kikamilifu\n` +
      `💰 Kiasi: TZS ${transaction.amount.toLocaleString()}\n` +
      `🏪 Duka: ${transaction.merchantName}\n` +
      `🏷️ Lipa Namba: ${transaction.merchantLipaNumber}\n` +
      `📄 Namba ya Risiti: ${transaction.referenceNumber}\n` +
      `📱 TIPS Ref: ${transaction.externalProviderRef}\n` +
      `👤 Mlipaji: ${transaction.userName}\n` +
      `🕒 Tarehe: ${formatDate(transaction.timestamp)}\n` +
      `🛡️ Uhakiki: Sura ya Kibiometria (FacePay TIPS Switch)\n\n` +
      `_Imetolewa na Mfumo wa FacePay Tanzania._`;

    if (navigator.share) {
      navigator.share({
        title: `FacePay Risiti - ${transaction.referenceNumber}`,
        text: text
      }).catch(() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

        {downloadSuccess && (
          <div className="bg-emerald-950/90 border-y border-emerald-500/80 px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Demo Notice */}
        <div className="bg-amber-500/20 border-y border-amber-500/40 px-4 py-2.5 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-amber-300">
              {language === 'sw' ? 'TAARIFA YA MAJARIBIO (SANDBOX DEMO)' : 'SIMULATED DEMO NOTICE'}
            </span>
            <span className="text-[11px] leading-relaxed block text-amber-200/90">
              {language === 'sw' 
                ? 'Muamala huu umethibitishwa na switch ya BOT TIPS Sandbox. Pakua risiti ya PDF au chapa kwa mashine.'
                : 'Simulated technology demonstration (TIPS Sandbox). Download real PDF receipt or print thermal format.'}
            </span>
          </div>
        </div>

        {/* Receipt Line Items */}
        <div className="p-6 space-y-3 text-xs">
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
            <span className="text-slate-200">{(transaction.paymentRail || 'M_PESA').replace('_', ' ')}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.date}</span>
            <span className="font-mono text-slate-200">{formatDate(transaction.timestamp)}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{language === 'sw' ? 'Njia ya Uthibitisho' : 'Verification Mode'}</span>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ScanFace className="w-3.5 h-3.5" />
              <span>{transaction.verificationMode} ({transaction.biometricScore || 99.2}%)</span>
            </div>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">{t.payment.serviceFee}</span>
            <span className="text-emerald-400 font-bold">{t.payment.freeFee}</span>
          </div>

          {/* Simulated SMS Notification Card */}
          {showSmsAlert && (
            <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ujumbe wa SMS (Vodacom M-Pesa TIPS)</span>
                </div>
                <span>Sasa Hivi</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                "{transaction.externalProviderRef} Imethibitishwa. Umetuma TZS {transaction.amount.toLocaleString()} kwa {transaction.merchantName} (Lipa Namba: {transaction.merchantLipaNumber}) tarehe {formatDate(transaction.timestamp).slice(0, 11)} kupitia FacePay Tanzania. Ada TZS 0."
              </p>
            </div>
          )}

          {/* Action Buttons: Download PDF, Print, Share, Done */}
          <div className="pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Download PDF Button */}
              <button
                id="download-pdf-receipt-btn"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Inatengeneza...' : (language === 'sw' ? 'Pakua PDF' : 'Download PDF')}</span>
              </button>

              {/* Print Receipt Button */}
              <button
                id="print-receipt-btn"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>{language === 'sw' ? 'Chapa Risiti' : 'Print Receipt'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* WhatsApp Share Button */}
              <button
                id="share-receipt-btn"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700/80 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{copied ? 'Imenakiliwa!' : (language === 'sw' ? 'Shiriki / WhatsApp' : 'Share Receipt')}</span>
              </button>

              {/* Done Button */}
              <button
                id="done-receipt-btn"
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                <span>{language === 'sw' ? 'Nimemaliza' : 'Done'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
