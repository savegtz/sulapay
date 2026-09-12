import React, { useState, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  PieChart, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ScanFace, 
  QrCode, 
  CreditCard, 
  Smartphone,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Language, ThemeMode, Transaction } from '../types';
import { formatTZS, formatDate } from '../utils/formatters';

interface SpendingAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  language: Language;
  theme?: ThemeMode;
  onSelectTransaction: (tx: Transaction) => void;
  currencyMode?: 'USD' | 'TZS';
}

export const SpendingAnalyticsModal: React.FC<SpendingAnalyticsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  language,
  theme = 'light',
  onSelectTransaction,
  currencyMode = 'USD'
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY'>('OVERVIEW');
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'QUARTER'>('MONTH');
  const [selectedRail, setSelectedRail] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statementDownloaded, setStatementDownloaded] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Categories spending calculation
  const categoryBreakdown = [
    { name: language === 'sw' ? 'Chakula & Vinywaji' : 'Food & Dining', percent: 42, color: 'bg-amber-500', amountUSD: 168.50, amountTZS: 438100 },
    { name: language === 'sw' ? 'Usafiri (Treni/Taxi)' : 'Transport & Rides', percent: 22, color: 'bg-indigo-500', amountUSD: 88.00, amountTZS: 228800 },
    { name: language === 'sw' ? 'Huduma za Nyumbani' : 'Bills & Utilities', percent: 18, color: 'bg-emerald-500', amountUSD: 72.00, amountTZS: 187200 },
    { name: language === 'sw' ? 'Usajili & Burudani' : 'Subscriptions & Media', percent: 12, color: 'bg-purple-500', amountUSD: 48.00, amountTZS: 124800 },
    { name: language === 'sw' ? 'Manunuzi Mengineyo' : 'Shopping & Others', percent: 6, color: 'bg-rose-500', amountUSD: 24.00, amountTZS: 62400 },
  ];

  // Daily spending bars for current month
  const dailySpending = [
    { day: 'Mon', height: 'h-16', amount: '$32' },
    { day: 'Tue', height: 'h-24', amount: '$48' },
    { day: 'Wed', height: 'h-12', amount: '$24' },
    { day: 'Thu', height: 'h-32', amount: '$64' },
    { day: 'Fri', height: 'h-40', amount: '$85' },
    { day: 'Sat', height: 'h-28', amount: '$56' },
    { day: 'Sun', height: 'h-20', amount: '$40' },
  ];

  const totalSpentUSD = 400.50;
  const totalIncomeUSD = 1250.00;
  const totalSpentTZS = 1041300;
  const totalIncomeTZS = 3250000;

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchQuery = tx.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       tx.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRail = selectedRail === 'ALL' || tx.paymentRail === selectedRail;
    return matchQuery && matchRail;
  });

  const handleDownloadStatement = () => {
    setStatementDownloaded(true);
    setTimeout(() => setStatementDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg min-h-screen sm:min-h-0 sm:my-auto sm:rounded-3xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-inherit z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {language === 'sw' ? 'Mchanganuo wa Matumizi' : 'Spending Analytics & Records'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'sw' ? 'Takwimu za kina za pochi na miamala ya TIPS' : 'Detailed analytics & BoT TIPS records'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-1 flex gap-2">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#543eed] text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {language === 'sw' ? 'Mchanganuo (Analytics)' : 'Overview & Trends'}
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-[#543eed] text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {language === 'sw' ? 'Miamala Yote (Records)' : 'Transaction History'}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & TRENDS */}
        {activeTab === 'OVERVIEW' && (
          <div className="p-5 space-y-5">
            {/* Total Spend & Income Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                  <span className="text-[11px] font-bold">
                    {language === 'sw' ? 'Jumla ya Matumizi' : 'Total Spent'}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {currencyMode === 'USD' ? `$${totalSpentUSD.toFixed(2)}` : formatTZS(totalSpentTZS)}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {language === 'sw' ? '-8.4% ikilinganishwa na mwezi uliopita' : '-8.4% vs last month'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                  <span className="text-[11px] font-bold">
                    {language === 'sw' ? 'Mapato / Amana' : 'Total Inflow'}
                  </span>
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {currencyMode === 'USD' ? `$${totalIncomeUSD.toFixed(2)}` : formatTZS(totalIncomeTZS)}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {language === 'sw' ? '+14.2% mwezi huu' : '+14.2% this month'}
                </p>
              </div>
            </div>

            {/* Weekly Spending Trend Barchart */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'sw' ? 'Mwenendo wa Matumizi kwa Wiki' : 'Weekly Spending Rhythm'}
                </span>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                  Average: $57/day
                </span>
              </div>

              <div className="flex items-end justify-between h-36 pt-4 px-2 border-b border-slate-200 dark:border-slate-700">
                {dailySpending.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.amount}
                    </span>
                    <div className={`w-8 rounded-t-lg bg-gradient-to-t from-purple-600 to-indigo-400 ${d.height} hover:brightness-110 transition-all shadow-xs`} />
                    <span className="text-[10px] font-bold text-slate-500 mt-1">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {language === 'sw' ? 'Matumizi kwa Makundi' : 'Category Breakdown'}
              </h3>

              <div className="space-y-2.5">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {currencyMode === 'USD' ? `$${cat.amountUSD.toFixed(2)}` : formatTZS(cat.amountTZS)}
                        <span className="text-slate-400 font-normal text-[10px] ml-1">({cat.percent}%)</span>
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Download Statement Box */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Pakua Taarifa Rasmi (Statement)' : 'Download Bank Statement'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {language === 'sw' ? 'Taarifa ya mwezi yenye muhuri rasmi wa TIPS' : 'Monthly certified BoT TIPS PDF statement'}
                </p>
              </div>

              <button
                onClick={handleDownloadStatement}
                className="px-3.5 py-2 rounded-xl bg-[#543eed] hover:bg-[#432ed6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
              >
                {statementDownloaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{language === 'sw' ? 'Imepakuliwa!' : 'Exported!'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{language === 'sw' ? 'Pakua PDF' : 'PDF Export'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: TRANSACTION HISTORY WITH SEARCH & FILTERS */}
        {activeTab === 'HISTORY' && (
          <div className="p-5 space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'sw' ? 'Tafuta muamala, namba ya kumbukumbu...' : 'Search transactions, ref #, merchant...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter Rails */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['ALL', 'FACEPAY', 'M_PESA', 'VISA', 'TIGO_PESA'].map((rail) => (
                <button
                  key={rail}
                  onClick={() => setSelectedRail(rail)}
                  className={`px-3 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all ${
                    selectedRail === rail
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {rail === 'ALL' ? (language === 'sw' ? 'Zote' : 'All') : rail.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {language === 'sw' ? 'Hakuna muamala uliopatikana.' : 'No transactions matching filters.'}
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      onSelectTransaction(tx);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#543eed] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {tx.verificationMode === 'FACIAL_BIOMETRICS' ? (
                          <ScanFace className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                          {tx.merchantName}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(tx.createdAt)} • {tx.paymentRail}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-500 font-mono block">
                        - {formatTZS(tx.amount)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 active:scale-98 transition-all"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
