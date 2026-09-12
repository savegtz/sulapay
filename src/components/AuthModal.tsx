import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Smartphone, 
  ShieldCheck,
  UserCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Language, PaymentRail, UserProfile, Wallet } from '../types';
import { apiClient } from '../services/apiClient';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  currentWallet?: Wallet;
  language: Language;
  initialTab?: 'LOGIN' | 'REGISTER' | 'SWITCH';
  isAuthenticated?: boolean;
  onAuthSuccess: (user: UserProfile, wallet: Wallet) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentWallet,
  language,
  initialTab = 'LOGIN',
  isAuthenticated = false,
  onAuthSuccess
}) => {
  // If not authenticated, force tab to LOGIN or REGISTER
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'SWITCH'>(
    !isAuthenticated && initialTab === 'SWITCH' ? 'LOGIN' : initialTab
  );
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState(isAuthenticated && currentUser?.phoneNumber ? currentUser.phoneNumber : '');
  const [loginPin, setLoginPin] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+255 ');
  const [regNida, setRegNida] = useState('19940815');
  const [regRail, setRegRail] = useState<PaymentRail>('M_PESA');
  const [regPin, setRegPin] = useState('1234');
  const [regAvatar, setRegAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');

  // Demo users for quick switch
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        setTab(initialTab === 'REGISTER' ? 'REGISTER' : 'LOGIN');
        setLoginPhone('');
        setLoginPin('');
      } else {
        setTab(initialTab);
        if (currentUser?.phoneNumber) {
          setLoginPhone(currentUser.phoneNumber);
        }
      }
      loadDemoAccounts();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab, currentUser, isAuthenticated]);

  const loadDemoAccounts = async () => {
    try {
      const res = await apiClient.getDemoUsers();
      if (res.users) setDemoAccounts(res.users);
    } catch (err) {
      console.warn('Could not load accounts list:', err);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.login({
        phoneNumber: loginPhone,
        pin: loginPin || '1234'
      });
      setSuccessMsg(language === 'sw' ? 'Umefanikiwa kuingia!' : 'Login successful!');
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya kuingia');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.register({
        fullName: regName,
        phoneNumber: regPhone,
        nationalIdNida: regNida,
        linkedRail: regRail,
        pin: regPin || '1234',
        faceAvatarUrl: regAvatar
      });
      setSuccessMsg(language === 'sw' ? 'Usajili umekamilika kikamilifu!' : 'Registration successful!');
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya kusajili');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.switchUser(userId);
      setSuccessMsg(language === 'sw' ? `Umeingia kama ${res.user.fullName}` : `Logged in as ${res.user.fullName}`);
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-700/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <UserCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {language === 'sw' ? 'Akaunti ya FacePay TZ' : 'FacePay TZ Account'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {language === 'sw' ? 'Mifumo ya NIDA & TIPS Imeunganishwa' : 'National ID (NIDA) & TIPS Integrated'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5 shrink-0">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => { setTab('LOGIN'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              tab === 'LOGIN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {language === 'sw' ? 'Ingia' : 'Sign In'}
          </button>

          <button
            id="tab-register-btn"
            type="button"
            onClick={() => { setTab('REGISTER'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              tab === 'REGISTER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {language === 'sw' ? 'Jisajili Mpya' : 'Register New'}
          </button>

          {/* Badili Mtumiaji itaonekana TU ikiwa mtumiaji amekwisha ingia (isAuthenticated) */}
          {isAuthenticated && (
            <button
              id="tab-switch-btn"
              type="button"
              onClick={() => { setTab('SWITCH'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                tab === 'SWITCH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {language === 'sw' ? 'Badili Akaunti' : 'Switch Account'}
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-phone-input"
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="+255 754 123 456"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'sw' ? 'Namba ya Siri (PIN - chaguomsingi: 1234)' : 'Security PIN (Default: 1234)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-pin-input"
                    type="password"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono tracking-widest focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-300">
                  {language === 'sw' ? 'Taarifa ya Majaribio (Sandbox):' : 'Demo Sandbox Notice:'}
                </p>
                <p>
                  {language === 'sw'
                    ? 'Weka namba ya simu iliyosajiliwa na namba yako ya siri (PIN).'
                    : 'Enter your registered phone number and 4-digit security PIN.'}
                </p>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>{language === 'sw' ? 'Ingia Kwenye Akaunti' : 'Sign In to Account'}</span>
              </button>

              {/* Registered quick-fill options */}
              {demoAccounts.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400">
                      {language === 'sw' ? 'Akaunti za Mfumo (Bofya kuweka namba):' : 'System Accounts (Click to fill phone):'}
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px]">PIN: 1234</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {demoAccounts.slice(0, 4).map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setLoginPhone(acc.phoneNumber);
                          setLoginPin('1234');
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors group"
                      >
                        <img
                          src={acc.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                          alt={acc.fullName}
                          className="w-6 h-6 rounded-full object-cover border border-slate-700 group-hover:border-emerald-400 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-300">
                            {acc.fullName.split(' ')[0]}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {acc.linkedRail}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'sw' ? 'Jina Kamili (Kama lilivyo NIDA)' : 'Full Name (As on NIDA)'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-fullname-input"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Salum Said Mwinyi"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                  </label>
                  <input
                    id="reg-phone-input"
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+255 784 999 111"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Namba ya NIDA (Kitambulisho)' : 'NIDA NIN (20 digits)'}
                  </label>
                  <input
                    id="reg-nida-input"
                    type="text"
                    required
                    value={regNida}
                    onChange={(e) => setRegNida(e.target.value)}
                    placeholder="19940815141010000123"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Mtandao / Benki' : 'Linked Rail'}
                  </label>
                  <select
                    id="reg-rail-select"
                    value={regRail}
                    onChange={(e) => setRegRail(e.target.value as PaymentRail)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="M_PESA">Vodacom M-Pesa</option>
                    <option value="TIGO_PESA">Tigo Pesa</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="HALOPESA">Halopesa</option>
                    <option value="CRDB_BANK">CRDB SimBanking</option>
                    <option value="NMB_BANK">NMB Mkononi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Weka PIN (Tarakimu 4)' : 'Security PIN (4 digits)'}
                  </label>
                  <input
                    id="reg-pin-input"
                    type="password"
                    maxLength={4}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono tracking-widest focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Starter balance */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'sw' ? 'Salio la kuanzia kwenye pochi:' : 'Starter wallet balance:'}</span>
                </div>
                <span className="font-mono font-bold text-white">TZS 250,000</span>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{language === 'sw' ? 'Kamilisha Usajili wa FacePay' : 'Complete FacePay Registration'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: SWITCH DEMO ACCOUNTS (Inaonekana TU wakati mtumiaji ameingia) */}
          {isAuthenticated && tab === 'SWITCH' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {language === 'sw' 
                  ? 'Bofya mtumiaji hapa chini kubadili akaunti ya kujaribia mfumo papo hapo:' 
                  : 'Click any user below to instantly switch accounts for testing:'}
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {demoAccounts.map((acc) => {
                  const isCurrent = Boolean(isAuthenticated && currentUser?.id && acc?.id === currentUser.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSwitchUser(acc.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-emerald-950/60 border-emerald-500/70 shadow-sm shadow-emerald-950'
                          : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={acc.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'} 
                          alt={acc.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{acc.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {maskPhoneNumber(acc.phoneNumber)} • {acc.linkedRail}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-emerald-400 font-bold">
                        {formatTZS(acc.balance || 250000)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
