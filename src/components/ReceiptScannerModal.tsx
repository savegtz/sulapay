import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Receipt, 
  Scan, 
  RefreshCw, 
  FileText,
  DollarSign
} from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { SplitItem } from './SplitBillFlow';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: ThemeMode;
  onReceiptScanned: (data: {
    billName: string;
    category: string;
    items: SplitItem[];
    tax: number;
    subtotal: number;
  }) => void;
}

interface SampleReceipt {
  id: string;
  name: string;
  place: string;
  category: string;
  items: SplitItem[];
  tax: number;
  subtotal: number;
}

const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'orely',
    name: 'Orely Café',
    place: 'Orely Café & Bakery, Masaki',
    category: 'Food & Beverages',
    items: [
      { id: 'scan-1', name: 'Double Shot Espresso', price: 29.00, qty: 1 },
      { id: 'scan-2', name: 'Hot Latte with Oat Milk', price: 32.00, qty: 1 },
      { id: 'scan-3', name: 'Iced Cappuccino Caramel', price: 27.00, qty: 1 },
      { id: 'scan-4', name: 'Blueberry Cheesecake Pie', price: 31.00, qty: 1 },
    ],
    tax: 14.28,
    subtotal: 119.00
  },
  {
    id: 'kfc',
    name: 'KFC Mlimani City',
    place: 'KFC Drive-Thru, Dar es Salaam',
    category: 'Food & Beverages',
    items: [
      { id: 'scan-kfc-1', name: 'Zinger Burger Combo', price: 24.50, qty: 2 },
      { id: 'scan-kfc-2', name: '8pc Hot Wings Bucket', price: 34.00, qty: 1 },
      { id: 'scan-kfc-3', name: 'Large Peri Peri Fries', price: 12.00, qty: 2 },
      { id: 'scan-kfc-4', name: 'Krushers Oreo Blizzard', price: 16.50, qty: 1 },
    ],
    tax: 15.20,
    subtotal: 123.50
  },
  {
    id: 'serena',
    name: 'Serena Hotel Bistro',
    place: 'Kivukoni Bar & Grill',
    category: 'Dinner & Lounge',
    items: [
      { id: 'scan-srn-1', name: 'Grilled Red Snapper Fillet', price: 45.00, qty: 2 },
      { id: 'scan-srn-2', name: 'Tropical Mango Salad', price: 18.00, qty: 1 },
      { id: 'scan-srn-3', name: 'Sparkling Mineral Water', price: 9.00, qty: 2 },
      { id: 'scan-srn-4', name: 'Tiramisu Dolce', price: 22.00, qty: 2 },
    ],
    tax: 24.80,
    subtotal: 172.00
  }
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'light',
  onReceiptScanned
}) => {
  const [selectedSample, setSelectedSample] = useState<SampleReceipt>(SAMPLE_RECEIPTS[0]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedCount, setDetectedCount] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (scanning) {
      setScanProgress(0);
      setDetectedCount(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setScanning(false);
            // Complete scan
            onReceiptScanned({
              billName: selectedSample.name,
              category: selectedSample.category,
              items: selectedSample.items,
              tax: selectedSample.tax,
              subtotal: selectedSample.subtotal
            });
            onClose();
            return 100;
          }
          if (prev > 30 && prev < 60) setDetectedCount(2);
          if (prev >= 60 && prev < 90) setDetectedCount(3);
          if (prev >= 90) setDetectedCount(selectedSample.items.length);
          return prev + 12;
        });
      }, 180);
      return () => clearInterval(interval);
    }
  }, [scanning, selectedSample, onReceiptScanned, onClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleStartScan = () => {
    setScanning(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setScanning(true);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md rounded-3xl overflow-hidden border shadow-2xl flex flex-col max-h-[92vh] ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-[#543eed] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">
                {language === 'sw' ? 'Kichanganuzi Mahiri cha Risiti' : 'Smart AI Receipt Scanner'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'sw' ? 'Soma vyakula na bei kwa OCR papo hapo' : 'Auto-extract line items & prices with OCR'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Camera Surface */}
        <div className="relative p-4 flex flex-col items-center overflow-y-auto">
          
          {/* Simulated Camera Viewfinder */}
          <div className="relative w-full h-72 rounded-2xl bg-slate-950 overflow-hidden border-2 border-dashed border-purple-400/50 flex items-center justify-center shadow-inner">
            
            {/* Viewfinder Target Corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl-md pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-md pointer-events-none" />

            {/* Simulated Printed Paper Receipt Graphic */}
            <div className="relative w-52 bg-amber-50/95 text-slate-800 p-3.5 rounded shadow-lg font-mono text-[10px] space-y-1.5 transform rotate-[-1deg] border border-amber-200">
              <div className="text-center pb-1 border-b border-dashed border-slate-400">
                <p className="font-bold text-xs uppercase">{selectedSample.name}</p>
                <p className="text-[8px] text-slate-500">{selectedSample.place}</p>
                <p className="text-[8px] text-slate-400">Date: 2026-09-12 • TIPS TAX INVOICE</p>
              </div>

              <div className="space-y-1 pt-1">
                {selectedSample.items.map((it, idx) => (
                  <div key={it.id} className="flex justify-between items-center relative">
                    <span className="truncate max-w-[120px]">{it.qty}x {it.name}</span>
                    <span className="font-bold">${it.price.toFixed(2)}</span>
                    {/* Bounding box animation when detected */}
                    {scanning && detectedCount > idx && (
                      <div className="absolute inset-0 -m-0.5 border border-emerald-500 bg-emerald-400/20 rounded animate-pulse" />
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 pt-1 space-y-0.5 text-right">
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>SUBTOTAL:</span>
                  <span>${selectedSample.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>VAT / TIPS TAX:</span>
                  <span>${selectedSample.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-0.5">
                  <span>TOTAL:</span>
                  <span>${(selectedSample.subtotal + selectedSample.tax).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-1">
                <div className="inline-block px-2 py-0.5 bg-slate-200 rounded text-[7px] text-slate-600 font-bold">
                  ★ FACEPAY COMPATIBLE ★
                </div>
              </div>
            </div>

            {/* Scanning Laser Line (Green / Purple glow) */}
            {scanning && (
              <div 
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] transition-all duration-150 pointer-events-none"
                style={{ top: `${scanProgress}%` }}
              />
            )}

            {/* Scanning overlay status */}
            {scanning && (
              <div className="absolute bottom-3 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/60 text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {language === 'sw' 
                    ? `Inasoma risiti: vitu ${detectedCount} vimetambuliwa (${scanProgress}%)`
                    : `Analyzing OCR: ${detectedCount} items detected (${scanProgress}%)`}
                </span>
              </div>
            )}
          </div>

          {/* Sample Receipt Selector */}
          <div className="w-full mt-4 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'sw' ? 'Chagua Risiti ya Majaribio (Sample Receipts)' : 'Select Sample Receipt to Scan'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_RECEIPTS.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => setSelectedSample(rec)}
                  disabled={scanning}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedSample.id === rec.id
                      ? 'border-[#543eed] bg-purple-50 dark:bg-purple-950/40 text-[#543eed] font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{rec.name}</p>
                  <p className="text-[10px] text-slate-400">{rec.items.length} items</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Alternative */}
          <div className="w-full mt-3 flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>{language === 'sw' ? 'Au pakia picha ya risiti yako:' : 'Or upload receipt image:'}</span>
            </div>
            <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 active:scale-95 transition-all">
              <span>{language === 'sw' ? 'Chagua Picha' : 'Choose File'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={scanning}
            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            {language === 'sw' ? 'Ghairi' : 'Cancel'}
          </button>

          <button
            id="start-ocr-scan-btn"
            onClick={handleStartScan}
            disabled={scanning}
            className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-[#6246ea] to-[#543eed] hover:opacity-95 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === 'sw' ? 'Inasoma...' : 'Scanning OCR...'}</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>{language === 'sw' ? 'Changanua Risiti Sasa' : 'Scan & Extract Items'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
