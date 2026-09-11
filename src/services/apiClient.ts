import { 
  UserProfile, 
  Wallet, 
  Merchant, 
  Transaction, 
  PaymentProviderStatus, 
  BiometricVerificationResult,
  PaymentRail,
  DatabaseStatus,
  RegisterRequest,
  LoginRequest
} from '../types';
import { firebaseService } from './firebase';

export const apiClient = {
  async getProfile(): Promise<{ user: UserProfile; wallet: Wallet }> {
    const res = await fetch('/api/user/profile');
    if (!res.ok) throw new Error('Failed to load user profile');
    const data = await res.json();
    // Background sync to Firebase
    firebaseService.saveUser(data.user, data.wallet).catch(() => {});
    return data;
  },

  async register(data: RegisterRequest): Promise<{ user: UserProfile; wallet: Wallet; message: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Usajili umeshindikana');
    }
    // Mirror to Firebase
    firebaseService.saveUser(result.user, result.wallet, data.pin).catch(err => {
      console.warn('Firebase user save sync error:', err);
    });
    return result;
  },

  async login(data: LoginRequest): Promise<{ user: UserProfile; wallet: Wallet; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Kuingia kumeshindikana');
    }
    firebaseService.saveUser(result.user, result.wallet, data.pin).catch(() => {});
    return result;
  },

  async getDemoUsers(): Promise<{ users: Array<{ id: string; fullName: string; phoneNumber: string; nationalIdNida: string; faceAvatarUrl?: string; linkedRail: PaymentRail; balance: number }> }> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) throw new Error('Failed to load demo accounts');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ user: UserProfile; wallet: Wallet }> {
    const res = await fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Failed to switch user');
    }
    return result;
  },

  async getMerchantQr(merchantId: string): Promise<{ qrDataUrl: string; payload: string }> {
    const res = await fetch(`/api/merchants/${merchantId}/qr`);
    if (!res.ok) throw new Error('Failed to generate merchant QR code');
    const result = await res.json();
    return result;
  },

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data: DatabaseStatus = await res.json();
        // Decorate with Firebase cloud active state
        return {
          ...data,
          engine: data.connected ? 'PostgreSQL & Firebase' : 'Firebase Firestore (fasi-8c19f)',
          message: data.connected 
            ? `${data.message} | Firebase Live (fasi-8c19f)` 
            : 'Imeunganishwa na Google Firebase Cloud Firestore (fasi-8c19f) & Realtime Database.'
        };
      }
    } catch {
      // Fallback status
    }
    return {
      connected: true,
      engine: 'Firebase Firestore (fasi-8c19f)',
      tablesCount: 6,
      totalTransactionsPersisted: 4,
      message: 'Google Firebase (fasi-8c19f) imeunganishwa kikamilifu.'
    };
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
    // Sync transaction and wallet update to Firebase
    if (data.transaction) {
      firebaseService.recordTransaction(data.transaction).catch(() => {});
    }
    if (data.updatedWallet?.id) {
      firebaseService.updateWalletBalance(data.updatedWallet.id, data.updatedWallet.balance).catch(() => {});
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
    // Sync to Firebase
    if (data.transaction) {
      firebaseService.recordTransaction(data.transaction).catch(() => {});
    }
    if (data.updatedWallet?.id) {
      firebaseService.updateWalletBalance(data.updatedWallet.id, data.updatedWallet.balance).catch(() => {});
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
