import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CustomerDashboard } from './components/CustomerDashboard';
import { FacePaymentModal } from './components/FacePaymentModal';
import { BiometricEnrollmentModal } from './components/BiometricEnrollmentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { MerchantPOS } from './components/MerchantPOS';
import { ArchitectureInspector } from './components/ArchitectureInspector';
import { TopUpModal } from './components/TopUpModal';
import { AuthModal } from './components/AuthModal';
import { QRPaymentModal } from './components/QRPaymentModal';
import { OfflineQRPaymentModal } from './components/OfflineQRPaymentModal';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { ModernLandingPage } from './components/ModernLandingPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { 
  Language, 
  Merchant, 
  ThemeMode,
  Transaction, 
  UserProfile, 
  UserRole, 
  Wallet 
} from './types';
import { 
  INITIAL_USER, 
  INITIAL_WALLET, 
  MERCHANTS, 
  INITIAL_TRANSACTIONS 
} from './data/mockData';
import { apiClient } from './services/apiClient';
import { firebaseService } from './services/firebase';
import { Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('LANDING');
  const [language, setLanguage] = useState<Language>('sw');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('facepay_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  // Sync dark class on html root for Tailwind and background styling
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('facepay_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  // Authentication State (Gated: Guests cannot view internal portals until logged in or registered)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'LOGIN' | 'REGISTER' | 'SWITCH'>('LOGIN');

  // Data State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [wallet, setWallet] = useState<Wallet>(INITIAL_WALLET);
  const [merchants, setMerchants] = useState<Merchant[]>(MERCHANTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isOfflineQROpen, setIsOfflineQROpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  // Initialize data from server
  useEffect(() => {
    async function initData() {
      try {
        const profile = await apiClient.getProfile();
        if (profile?.user) {
          setUser(profile.user);
        }
        if (profile?.wallet) {
          setWallet(profile.wallet);
        }

        const merchantsData = await apiClient.getMerchants();
        if (merchantsData && merchantsData.length > 0) {
          setMerchants(merchantsData);
        }

        const txsData = await apiClient.getTransactions();
        if (txsData && txsData.length > 0) {
          setTransactions(txsData);
        }
      } catch (err) {
        console.warn('API sync warning, using local fallback state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
    firebaseService.ensureAuth().catch(() => {});
  }, []);

  // Real-time Firebase Cloud Firestore balance & transactions listener
  useEffect(() => {
    if (!wallet?.id) return;
    const unsubWallet = firebaseService.subscribeToWallet(wallet.id, (updated) => {
      if (updated.balance !== undefined) {
        setWallet(prev => (prev.balance !== updated.balance ? { ...prev, balance: updated.balance } : prev));
      }
    });
    const unsubTx = firebaseService.subscribeToTransactions((liveTxs) => {
      if (liveTxs && liveTxs.length > 0) {
        setTransactions(liveTxs);
      }
    });
    return () => {
      if (unsubWallet) unsubWallet();
      if (unsubTx) unsubTx();
    };
  }, [wallet?.id]);

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'sw' ? 'en' : 'sw'));
  };

  const handleOpenLogin = () => {
    setAuthInitialTab('LOGIN');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthInitialTab('REGISTER');
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentRole('LANDING');
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser(prev => ({
      ...prev,
      ...updated,
      securitySettings: {
        ...(prev.securitySettings || {}),
        ...(updated.securitySettings || {})
      }
    }));
  };

  const handleInitiatePayment = (merchant?: Merchant) => {
    if (!isAuthenticated) {
      handleOpenLogin();
      return;
    }
    setSelectedMerchant(merchant || null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (newTx: Transaction, updatedWallet: Wallet) => {
    setTransactions(prev => [newTx, ...prev]);
    setWallet(updatedWallet);
    setIsPaymentModalOpen(false);
    setReceiptTx(newTx);
  };

  const handleTopUpSuccess = (updatedWallet: Wallet, newTx: Transaction) => {
    setWallet(updatedWallet);
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleEnrollmentSuccess = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setIsEnrollmentModalOpen(false);
  };

  const handleOfflinePaymentQueued = (pendingTx: Transaction, updatedWallet: Wallet) => {
    setTransactions(prev => [pendingTx, ...prev]);
    setWallet(updatedWallet);
    setReceiptTx(pendingTx);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-slate-950 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header with Role Navigation, Language Toggle, and TIPS Status */}
      <Header
        currentRole={currentRole}
        onSelectRole={(role) => {
          if (!isAuthenticated && role !== 'LANDING') {
            handleOpenLogin();
            return;
          }
          setCurrentRole(role);
        }}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isAuthenticated={isAuthenticated}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onLogout={handleLogout}
        onOpenAccountSwitcher={() => {
          if (!isAuthenticated) {
            handleOpenLogin();
            return;
          }
          setIsAccountSwitcherOpen(true);
        }}
        onOpenOfflineQR={() => {
          if (!isAuthenticated) {
            handleOpenLogin();
            return;
          }
          setIsOfflineQROpen(true);
        }}
        activeUserName={user?.fullName || 'Riko Sapto'}
        activeRail={wallet?.linkedRail || 'M_PESA'}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto ${
        isAuthenticated && currentRole === 'CUSTOMER' ? 'px-0 sm:px-6 pt-0 sm:pt-6' : 'px-3.5 sm:px-6 pt-4 sm:pt-6'
      } pb-24 md:pb-12`}>
        {/* If user is not authenticated, they can only see the Landing Page */}
        {(!isAuthenticated || currentRole === 'LANDING') && (
          <ModernLandingPage
            language={language}
            isAuthenticated={isAuthenticated}
            onNavigateRole={(role) => {
              if (!isAuthenticated) {
                handleOpenLogin();
                return;
              }
              setCurrentRole(role);
            }}
            onOpenOfflineQR={() => {
              if (!isAuthenticated) {
                handleOpenLogin();
                return;
              }
              setIsOfflineQROpen(true);
            }}
            onOpenAccountSwitcher={() => {
              if (!isAuthenticated) {
                handleOpenLogin();
                return;
              }
              setIsAccountSwitcherOpen(true);
            }}
            onOpenFacePay={() => {
              if (!isAuthenticated) {
                handleOpenLogin();
                return;
              }
              setCurrentRole('CUSTOMER');
              setIsPaymentModalOpen(true);
            }}
            onOpenLogin={handleOpenLogin}
            onOpenRegister={handleOpenRegister}
          />
        )}

        {/* Authenticated Customer App */}
        {isAuthenticated && currentRole === 'CUSTOMER' && (
          <CustomerDashboard
            user={user}
            wallet={wallet}
            transactions={transactions}
            merchants={merchants}
            language={language}
            theme={theme}
            onInitiatePayment={handleInitiatePayment}
            onOpenTopUp={() => setIsTopUpModalOpen(true)}
            onOpenEnrollment={() => setIsEnrollmentModalOpen(true)}
            onOpenQR={() => setIsQRModalOpen(true)}
            onOpenOfflineQR={() => setIsOfflineQROpen(true)}
            onOpenAccountSwitcher={() => setIsAccountSwitcherOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectTransaction={(tx) => setReceiptTx(tx)}
            onToggleLanguage={handleToggleLanguage}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {/* Authenticated Merchant POS */}
        {isAuthenticated && currentRole === 'MERCHANT' && (
          <MerchantPOS
            merchant={merchants[0] || MERCHANTS[0]}
            user={user}
            language={language}
            onPaymentCompleted={(tx, updatedWallet) => {
              setTransactions(prev => [tx, ...prev]);
              setWallet(updatedWallet);
            }}
          />
        )}

        {/* Authenticated Architecture Inspector */}
        {isAuthenticated && currentRole === 'ARCHITECT' && (
          <ArchitectureInspector language={language} />
        )}
      </main>

      {/* Modals */}
      <FacePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        user={user}
        wallet={wallet}
        initialMerchant={selectedMerchant}
        language={language}
        onPaymentSuccess={handlePaymentSuccess}
        onUserRegistered={(newUser, newWallet) => {
          setUser(newUser);
          setWallet(newWallet);
        }}
      />

      <BiometricEnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        user={user}
        language={language}
        onEnrollmentSuccess={handleEnrollmentSuccess}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        wallet={wallet}
        language={language}
        onTopUpSuccess={handleTopUpSuccess}
      />

      <QRPaymentModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        wallet={wallet}
        merchants={merchants}
        language={language}
        onProceedToFacePay={(merchant, amount) => {
          setSelectedMerchant(merchant);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Offline QR Payment Modal */}
      <OfflineQRPaymentModal
        isOpen={isOfflineQROpen}
        onClose={() => setIsOfflineQROpen(false)}
        user={user}
        wallet={wallet}
        language={language}
        onOfflinePaymentQueued={handleOfflinePaymentQueued}
      />

      {/* Multi-Account Switcher Modal */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen && isAuthenticated}
        onClose={() => setIsAccountSwitcherOpen(false)}
        currentUser={user}
        currentUserId={user?.id}
        currentWallet={wallet}
        language={language}
        onSelectAccount={(account) => {
          setUser(account.user);
          setWallet(account.wallet);
          setIsAuthenticated(true);
          setCurrentRole('CUSTOMER');
        }}
        onSelectPersona={(persona) => {
          setUser(persona.user);
          setWallet(persona.wallet);
          setIsAuthenticated(true);
          setCurrentRole('CUSTOMER');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={isAuthenticated ? user : undefined}
        currentWallet={isAuthenticated ? wallet : undefined}
        language={language}
        initialTab={!isAuthenticated && authInitialTab === 'SWITCH' ? 'LOGIN' : authInitialTab}
        isAuthenticated={isAuthenticated}
        onAuthSuccess={(updatedUser, updatedWallet) => {
          setUser(updatedUser);
          setWallet(updatedWallet);
          setIsAuthenticated(true);
          setCurrentRole('CUSTOMER');
          setIsAuthModalOpen(false);
        }}
      />

      {/* Official Receipt with PDF Download & Print */}
      <ReceiptModal
        transaction={receiptTx}
        language={language}
        onClose={() => setReceiptTx(null)}
      />

      {/* Tanzanian Flag Accent Ribbon & Footer */}
      <footer className={`border-t py-6 px-4 transition-colors duration-200 ${
        theme === 'dark' ? 'border-slate-900 bg-slate-950 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        {/* Tanzanian Flag Colored Stripe: Green, Yellow, Black, Yellow, Blue */}
        <div className="h-1.5 w-full flex mb-5 rounded-full overflow-hidden max-w-md mx-auto opacity-80">
          <div className="flex-1 bg-emerald-500" />
          <div className="w-4 bg-yellow-400" />
          <div className="w-12 bg-black" />
          <div className="w-4 bg-yellow-400" />
          <div className="flex-1 bg-sky-500" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
          <div className="space-y-1">
            <div className={`flex items-center justify-center sm:justify-start gap-1.5 font-bold ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>FACEPAY TZ • Bank of Tanzania (BOT) TIPS Compliance</span>
            </div>
            <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'sw' 
                ? 'Salama, haraka, rahisi. Malipo ya kielektroniki kwa utambuzi wa sura (Tanzania Instant Payment System).'
                : 'Safe, fast, simple. Biometric electronic payments via Tanzania Instant Payment System.'}
            </p>
          </div>

          <div className={`flex items-center gap-4 text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>M-Pesa • Tigo Pesa • Airtel • CRDB • NMB</span>
            <span className="text-emerald-500 font-mono font-semibold">BoT TIPS v2.4 Live</span>
          </div>
        </div>
      </footer>

      {/* Mobile-First Floating Thumb Bottom Navigation */}
      <MobileBottomNav
        currentRole={currentRole}
        onSelectRole={(role) => {
          if (!isAuthenticated && role !== 'LANDING') {
            handleOpenLogin();
            return;
          }
          setCurrentRole(role);
        }}
        language={language}
        isAuthenticated={isAuthenticated}
        theme={theme}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenSettings={() => {
          setIsAccountSwitcherOpen(true);
        }}
        onOpenFacePay={() => {
          if (!isAuthenticated) {
            handleOpenLogin();
            return;
          }
          handleInitiatePayment();
        }}
      />
    </div>
  );
}
