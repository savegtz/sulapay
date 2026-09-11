import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  CheckCircle2, 
  Smartphone, 
  Building2, 
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Language, PaymentRail, Transaction, Wallet } from '../types';
import { translations } from '../utils/translations';
import { formatTZS } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  language: Language;
  onTopUpSuccess: (updatedWallet: Wallet, tx: Transaction) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  wallet,
  language,
  onTopUpSuccess
}) => {
  const t = translations[language];
  const [amount, setAmount] = useState('50000');
  const [sourceRail, setSourceRail] = useState<PaymentRail>('M_PESA');
  const [phoneNumber, setPhoneNumber] = useState('+255 754 819 203');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTopUp = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      setErrorMessage(language === 'sw' ? 'Weka kiasi halali' : 'Enter valid amount');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await apiClient.topUpWallet({
        amount: num,
        sourceRail,
        phoneNumber
      });

      onTopUpSuccess(result.updatedWallet, result.transaction);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Top-up failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 space-y-5 my-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {t.wallet.topUp} (Kuweka Salio)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          SANDBOX TESTBED: Pesa za majaribio zitaongezwa kwenye mkoba wako papo hapo.
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Kiasi cha Kuweka (TZS)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
          />

          <div className="flex gap-2 mt-2">
            {[20000, 50000, 100000, 250000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Chanzo cha Pesa (Channel)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'M_PESA', name: 'Vodacom M-Pesa' },
              { id: 'TIGO_PESA', name: 'Tigo Pesa' },
              { id: 'AIRTEL_MONEY', name: 'Airtel Money' },
              { id: 'CRDB_BANK', name: 'CRDB Bank' },
            ].map(rail => (
              <button
                key={rail.id}
                type="button"
                onClick={() => setSourceRail(rail.id as PaymentRail)}
                className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                  sourceRail === rail.id
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {rail.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Nambari ya Simu
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          id="confirm-topup-btn"
          onClick={handleTopUp}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{isProcessing ? 'Inaweka...' : `Weka ${formatTZS(Number(amount) || 0)}`}</span>
        </button>
      </div>
    </div>
  );
};
