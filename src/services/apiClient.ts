import { 
  UserProfile, 
  Wallet, 
  Merchant, 
  Transaction, 
  PaymentProviderStatus, 
  BiometricVerificationResult,
  PaymentRail 
} from '../types';

export const apiClient = {
  async getProfile(): Promise<{ user: UserProfile; wallet: Wallet }> {
    const res = await fetch('/api/user/profile');
    if (!res.ok) throw new Error('Failed to load user profile');
    return res.json();
  },

  async updateSettings(settings: Partial<UserProfile['securitySettings']>): Promise<void> {
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
  },

  async getMerchants(): Promise<Merchant[]> {
    const res = await fetch('/api/merchants');
    if (!res.ok) throw new Error('Failed to load merchants');
    const data = await res.json();
    return data.merchants;
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error('Failed to load transactions');
    const data = await res.json();
    return data.transactions;
  },

  async verifyBiometrics(params: {
    faceImageBase64?: string;
    landmarks?: any;
    livenessAction: string;
  }): Promise<BiometricVerificationResult> {
    const res = await fetch('/api/biometrics/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Biometric verification failed on server');
    return res.json();
  },

  async enrollBiometrics(params: { faceAvatarUrl?: string }): Promise<UserProfile> {
    const res = await fetch('/api/biometrics/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Biometric enrollment failed');
    const data = await res.json();
    return data.user;
  },

  async authorizePayment(params: {
    merchantId?: string;
    lipaNumber: string;
    merchantName: string;
    amount: number;
    paymentRail: PaymentRail;
    verificationMode: 'FACE_BIOMETRIC' | 'PIN_FALLBACK';
    biometricScore: number;
    notes?: string;
  }): Promise<{ transaction: Transaction; updatedWallet: Wallet; disclaimer: string }> {
    const res = await fetch('/api/payments/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, isDemo: true })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Payment authorization failed');
    }
    return data;
  },

  async topUpWallet(params: {
    amount: number;
    sourceRail: PaymentRail;
    phoneNumber?: string;
  }): Promise<{ updatedWallet: Wallet; transaction: Transaction }> {
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Top-up failed');
    }
    return data;
  },

  async getProvidersStatus(): Promise<PaymentProviderStatus[]> {
    const res = await fetch('/api/providers/status');
    if (!res.ok) throw new Error('Failed to load provider status');
    const data = await res.json();
    return data.providers;
  },

  async getDatabaseSchema(): Promise<{ schemaSql: string; tables: string[]; database: string; compliance: string }> {
    const res = await fetch('/api/db/schema');
    if (!res.ok) throw new Error('Failed to load schema');
    return res.json();
  }
};
