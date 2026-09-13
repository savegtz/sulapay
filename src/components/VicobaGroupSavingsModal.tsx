import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  X, 
  ShieldCheck, 
  Calendar,
  Lock
} from 'lucide-react';
import { Language, ThemeMode, UserProfile, Wallet } from '../types';
import { formatTZS } from '../utils/formatters';

interface VicobaCircle {
  id: string;
  name: string;
  purpose: string;
  targetAmount: number;
  currentAmount: number;
  contributionAmount: number;
  cycle: 'WEEKLY' | 'MONTHLY';
  nextPayoutDate: string;
  nextRecipient: string;
  membersCount: number;
  myTotalContributed: number;
}

interface VicobaGroupSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: ThemeMode;
  user: UserProfile;
  wallet: Wallet;
}

export const VicobaGroupSavingsModal: React.FC<VicobaGroupSavingsModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  user,
  wallet
}) => {
  const isDark = theme === 'dark';
  const [selectedCircle, setSelectedCircle] = useState<VicobaCircle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contributeSuccess, setContributeSuccess] = useState(false);

  // New circle form state
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleTarget, setNewCircleTarget] = useState('2000000');
  const [newContribution, setNewContribution] = useState('50000');
  const [newCycle, setNewCycle] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');

  const [circles, setCircles] = useState<VicobaCircle[]>([
    {
      id: 'vicoba-fam-01',
      name: 'Vicoba ya Familia & Safari ya Arusha',
      purpose: 'Likizo ya Mwisho wa Mwaka',
      targetAmount: 5000000,
      currentAmount: 3450000,
      contributionAmount: 100000,
      cycle: 'MONTHLY',
      nextPayoutDate: '25 Sept 2026',
      nextRecipient: 'Riko Sapto (Wewe)',
      membersCount: 8,
      myTotalContributed: 400000
    },
    {
      id: 'vicoba-biz-02',
      name: 'Mtaji wa Biashara Kariakoo Friends',
      purpose: 'Uwekezaji wa Pamoja na Mzunguko wa Hisa',
      targetAmount: 12000000,
      currentAmount: 8200000,
      contributionAmount: 200000,
      cycle: 'MONTHLY',
      nextPayoutDate: '30 Sept 2026',
      nextRecipient: 'Mwl. Baraka M.',
      membersCount: 12,
      myTotalContributed: 800000
    },
    {
      id: 'vicoba-emer-03',
      name: 'Mfuko wa Dharura & Jamii (Emergency Fund)',
      purpose: 'Msaada wa Matibabu na Sherehe',
      targetAmount: 2000000,
      currentAmount: 1650000,
      contributionAmount: 25000,
      cycle: 'WEEKLY',
      nextPayoutDate: '18 Sept 2026',
      nextRecipient: 'Zuhura Abdallah',
      membersCount: 15,
      myTotalContributed: 150000
    }
  ]);

  if (!isOpen) return null;

  const handleCreateCircle = () => {
    if (!newCircleName.trim()) return;
    const newCircle: VicobaCircle = {
      id: `vicoba-${Date.now()}`,
      name: newCircleName,
      purpose: 'Kikundi cha Akiba Shirikishi',
      targetAmount: parseInt(newCircleTarget) || 1000000,
      currentAmount: parseInt(newContribution) || 50000,
      contributionAmount: parseInt(newContribution) || 50000,
      cycle: newCycle,
      nextPayoutDate: '15 Okt 2026',
      nextRecipient: `${user.fullName} (Mwanzilishi)`,
      membersCount: 1,
      myTotalContributed: parseInt(newContribution) || 50000
    };
    setCircles([newCircle, ...circles]);
    setShowCreateModal(false);
    setNewCircleName('');
  };

  const handleMakeContribution = (circle: VicobaCircle) => {
    setCircles(prev => prev.map(c => {
      if (c.id === circle.id) {
        return {
          ...c,
          currentAmount: c.currentAmount + c.contributionAmount,
          myTotalContributed: c.myTotalContributed + c.contributionAmount
        };
      }
      return c;
    }));
    setContributeSuccess(true);
    setTimeout(() => {
      setContributeSuccess(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold">
                  {language === 'sw' ? 'Vicoba & Vikundi vya Akiba' : 'Vicoba & Social Savings'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-600 text-white">
                  TIPS Group Escrow
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'sw' ? 'Akiba ya mzunguko yenye uwazi na ulinzi wa fedha wa 100%' : 'Rotational Savings & Transparent Escrow'}
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

        {/* Content */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1">
          
          {/* Action buttons bar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {language === 'sw' ? 'Vikundi vyako hai:' : 'Active Circles:'} <span className="font-bold text-slate-900 dark:text-white">{circles.length}</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#543eed] hover:bg-[#432ec7] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{language === 'sw' ? 'Unda Kikundi Kipya' : 'New Circle'}</span>
            </button>
          </div>

          {/* Contribution Success Notification Banner */}
          {contributeSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {language === 'sw' 
                  ? 'Mchango wako umetumwa kikamilifu kwenye akaunti ya Vicoba kwa FacePay!' 
                  : 'Contribution successfully credited to Vicoba Escrow via FacePay!'}
              </span>
            </div>
          )}

          {/* Circles list */}
          <div className="space-y-3">
            {circles.map((circle) => {
              const progressPct = Math.min(100, Math.round((circle.currentAmount / circle.targetAmount) * 100));

              return (
                <div
                  key={circle.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    isDark 
                      ? 'bg-slate-800/60 border-slate-700 hover:border-teal-500/40' 
                      : 'bg-white border-slate-200 hover:border-teal-500/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {circle.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {circle.purpose} • <span className="font-bold text-teal-600 dark:text-teal-400">{circle.membersCount} wanachama</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {circle.cycle === 'MONTHLY' ? (language === 'sw' ? 'Kila Mwezi' : 'Monthly') : (language === 'sw' ? 'Kila Wiki' : 'Weekly')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 font-mono">
                        {formatTZS(circle.currentAmount)}
                      </span>
                      <span className="text-slate-400 font-mono">
                        Lengo: {formatTZS(circle.targetAmount)} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Next payout & action */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {language === 'sw' ? 'Mpokeaji Anayefuata:' : 'Next Payout Recipient:'}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {circle.nextRecipient} ({circle.nextPayoutDate})
                      </span>
                    </div>

                    <button
                      onClick={() => handleMakeContribution(circle)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1 active:scale-95 transition-transform shadow-xs"
                    >
                      <span>{language === 'sw' ? 'Changa' : 'Contribute'}</span>
                      <span className="font-mono text-[11px]">({formatTZS(circle.contributionAmount)})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Circle Modal Embedded View */}
          {showCreateModal && (
            <div className="p-4 rounded-3xl border border-dashed border-[#543eed] bg-[#543eed]/5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#543eed]">
                  {language === 'sw' ? 'Fomu ya Kuunda Kikundi Kipya cha Vicoba' : 'Create New Vicoba Circle'}
                </h4>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {language === 'sw' ? 'Jina la Kikundi / Vicoba' : 'Circle Name'}
                </label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="Mfano: Marafiki wa Chuo 2026"
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {language === 'sw' ? 'Mchango (TZS)' : 'Contribution'}
                  </label>
                  <input
                    type="number"
                    value={newContribution}
                    onChange={(e) => setNewContribution(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {language === 'sw' ? 'Mzunguko' : 'Cycle'}
                  </label>
                  <select
                    value={newCycle}
                    onChange={(e) => setNewCycle(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="WEEKLY">{language === 'sw' ? 'Kila Wiki' : 'Weekly'}</option>
                    <option value="MONTHLY">{language === 'sw' ? 'Kila Mwezi' : 'Monthly'}</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateCircle}
                className="w-full py-2.5 rounded-xl bg-[#543eed] text-white text-xs font-bold active:scale-95 transition-transform"
              >
                {language === 'sw' ? 'Kamilisha na Fungua Vicoba' : 'Create Circle Escrow'}
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold active:scale-95 transition-transform"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
