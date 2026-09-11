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
import { 
  Language, 
  Merchant, 
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
import { Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [language, setLanguage] = useState<Language>('sw');
  
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
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  // Initialize data from server
  useEffect(() => {
    async function initData() {
      try {
        const profile = await apiClient.getProfile();
        setUser(profile.user);
        setWallet(profile.wallet);

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
  }, []);

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'sw' ? 'en' : 'sw'));
  };

  const handleInitiatePayment = (merchant?: Merchant) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header with Role Navigation, Language Toggle, and TIPS Status */}
      <Header
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        {currentRole === 'CUSTOMER' && (
          <CustomerDashboard
            user={user}
            wallet={wallet}
            transactions={transactions}
            merchants={merchants}
            language={language}
            onInitiatePayment={handleInitiatePayment}
            onOpenTopUp={() => setIsTopUpModalOpen(true)}
            onOpenEnrollment={() => setIsEnrollmentModalOpen(true)}
            onOpenQR={() => setIsQRModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectTransaction={(tx) => setReceiptTx(tx)}
          />
        )}

        {currentRole === 'MERCHANT' && (
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

        {currentRole === 'ARCHITECT' && (
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        currentWallet={wallet}
        language={language}
        onAuthSuccess={(updatedUser, updatedWallet) => {
          setUser(updatedUser);
          setWallet(updatedWallet);
        }}
      />

      <ReceiptModal
        transaction={receiptTx}
        language={language}
        onClose={() => setReceiptTx(null)}
      />

      {/* Tanzanian Flag Accent Ribbon & Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 py-6 px-4">
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
            <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>FACEPAY TZ • Bank of Tanzania (BOT) TIPS Compliance</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'sw' 
                ? 'Salama, haraka, rahisi. Malipo ya kielektroniki kwa utambuzi wa sura (Tanzania Instant Payment System).'
                : 'Safe, fast, simple. Biometric electronic payments via Tanzania Instant Payment System.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>M-Pesa • Tigo Pesa • Airtel • CRDB • NMB</span>
            <span>v2.4 Sandbox</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
