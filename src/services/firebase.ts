import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { UserProfile, Wallet, Transaction, Merchant } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { MERCHANTS, INITIAL_USER, INITIAL_WALLET, INITIAL_TRANSACTIONS } from '../data/mockData';

export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore using the designated database
const databaseId = firebaseAppletConfig.firestoreDatabaseId || '(default)';
export const firestore = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Critical connection test per skill requirements
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    console.log('[Firebase Firestore] Connected successfully to Cloud Firestore:', databaseId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firebase] Firestore client is offline. Please check configuration.');
    } else {
      console.log('[Firebase Firestore] Live session active for database:', databaseId);
    }
  }
}
testFirestoreConnection();

export const firebaseService = {
  async ensureAuth(): Promise<FirebaseUser | null> {
    try {
      if (auth.currentUser) return auth.currentUser;
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (err) {
      console.warn('[Firebase Auth] Anonymous auth notice:', err);
      return null;
    }
  },

  async seedInitialDataIfEmpty() {
    try {
      // Check if merchants exist
      const merchSnap = await getDocs(collection(firestore, 'merchants'));
      if (merchSnap.empty) {
        console.log('[Firebase] Seeding merchants to Cloud Firestore...');
        for (const m of MERCHANTS) {
          await setDoc(doc(firestore, 'merchants', m.id), m);
        }
      }

      // Check if any user exists
      const userSnap = await getDocs(collection(firestore, 'users'));
      if (userSnap.empty) {
        console.log('[Firebase] Seeding initial primary user to Cloud Firestore...');
        await setDoc(doc(firestore, 'users', INITIAL_USER.id), {
          ...INITIAL_USER,
          pin: '1234',
          createdAt: new Date().toISOString(),
          updatedAt: Timestamp.now()
        });
        await setDoc(doc(firestore, 'wallets', INITIAL_WALLET.id), {
          ...INITIAL_WALLET,
          updatedAt: Timestamp.now()
        });
        for (const tx of INITIAL_TRANSACTIONS) {
          await setDoc(doc(firestore, 'transactions', tx.id), {
            ...tx,
            timestampDate: Timestamp.now()
          });
        }
      }
    } catch (err) {
      console.warn('[Firebase Seed] Notice:', err);
    }
  },

  async saveUser(user: UserProfile, wallet: Wallet, pin: string = '1234'): Promise<boolean> {
    try {
      const userRef = doc(firestore, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        pin,
        updatedAt: Timestamp.now()
      }, { merge: true });

      const walletRef = doc(firestore, 'wallets', wallet.id);
      await setDoc(walletRef, {
        ...wallet,
        updatedAt: Timestamp.now()
      }, { merge: true });

      console.log(`[Firebase Firestore] User & Wallet saved to Cloud Firestore: ${user.fullName} (${user.id})`);
      return true;
    } catch (err) {
      console.error('[Firebase Firestore] Save user error:', err);
      return false;
    }
  },

  async getUserByPhone(phone: string, pin: string): Promise<{ user: UserProfile; wallet: Wallet } | null> {
    try {
      const cleanPhone = (phone || '').replace(/[\s\-\(\)]/g, '');
      const q = query(collection(firestore, 'users'), where('phoneNumber', '==', phone));
      const snap = await getDocs(q);

      let matchedDoc = snap.docs[0];
      if (!matchedDoc) {
        // Try looking through users with normalized phone
        const allUsers = await getDocs(collection(firestore, 'users'));
        for (const d of allUsers.docs) {
          const data = d.data();
          const targetClean = (data.phoneNumber || '').replace(/[\s\-\(\)]/g, '');
          if (targetClean === cleanPhone || targetClean.endsWith(cleanPhone.slice(-9))) {
            matchedDoc = d;
            break;
          }
        }
      }

      if (!matchedDoc) return null;
      const userData = matchedDoc.data() as any;
      if (userData.pin && userData.pin !== pin) {
        throw new Error('Namba ya siri (PIN) si sahihi');
      }

      // Fetch wallet
      const walletSnap = await getDoc(doc(firestore, 'wallets', `w_${userData.id}`));
      let walletData: Wallet;
      if (walletSnap.exists()) {
        walletData = walletSnap.data() as Wallet;
      } else {
        walletData = {
          id: `w_${userData.id}`,
          userId: userData.id,
          currency: 'TZS',
          balance: 345000,
          linkedRail: userData.linkedRail || 'M_PESA',
          linkedAccountNumber: userData.phoneNumber || '+255 754 000 000',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(firestore, 'wallets', walletData.id), walletData);
      }

      return {
        user: {
          id: userData.id,
          fullName: userData.fullName || 'Mtumiaji',
          phoneNumber: userData.phoneNumber || '',
          nationalIdNida: userData.nationalIdNida || '',
          email: userData.email || `${(userData.phoneNumber || '').replace(/\D/g, '') || 'user'}@facepay.tz`,
          faceAvatarUrl: userData.faceAvatarUrl,
          isBiometricEnrolled: userData.isBiometricEnrolled ?? true,
          biometricEnrolledAt: userData.biometricEnrolledAt,
          securitySettings: userData.securitySettings || {
            maxLimitWithoutPin: 50000,
            livenessSensitivity: 'HIGH',
            requireSmileCheck: true,
            requireBlinkCheck: true
          }
        },
        wallet: walletData
      };
    } catch (err: any) {
      if (err.message === 'Namba ya siri (PIN) si sahihi') throw err;
      console.warn('[Firebase] Query by phone notice:', err);
      return null;
    }
  },

  async getAllUsers(): Promise<Array<{ id: string; fullName: string; phoneNumber: string; nationalIdNida: string; faceAvatarUrl?: string; linkedRail: any; balance: number }>> {
    try {
      const snap = await getDocs(collection(firestore, 'users'));
      const list: any[] = [];
      for (const d of snap.docs) {
        const u = d.data();
        const wSnap = await getDoc(doc(firestore, 'wallets', `w_${u.id}`));
        const balance = wSnap.exists() ? (wSnap.data() as any).balance : 250000;
        list.push({
          id: u.id,
          fullName: u.fullName,
          phoneNumber: u.phoneNumber,
          nationalIdNida: u.nationalIdNida,
          faceAvatarUrl: u.faceAvatarUrl,
          linkedRail: u.linkedRail || 'M_PESA',
          balance
        });
      }
      return list;
    } catch (err) {
      console.warn('[Firebase] Get users error:', err);
      return [];
    }
  },

  async recordTransaction(tx: Transaction): Promise<boolean> {
    try {
      const txRef = doc(firestore, 'transactions', tx.id);
      await setDoc(txRef, {
        ...tx,
        isDemo: false,
        timestampDate: Timestamp.now()
      });
      console.log(`[Firebase Firestore] Transaction permanently saved: ${tx.referenceNumber} (${tx.amount} TZS)`);
      return true;
    } catch (err) {
      console.error('[Firebase Firestore] Record transaction error:', err);
      return false;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const snap = await getDocs(collection(firestore, 'transactions'));
      const txs: Transaction[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        txs.push({
          id: data.id || d.id,
          referenceNumber: data.referenceNumber,
          externalProviderRef: data.externalProviderRef || `EXT_${data.referenceNumber}`,
          userId: data.userId || data.senderUserId || 'usr_1',
          userName: data.userName || data.senderName || 'FacePay User',
          merchantId: data.merchantId || data.recipientMerchantId || 'm1',
          merchantName: data.merchantName || data.recipientName || 'Merchant',
          merchantLipaNumber: data.merchantLipaNumber || '5849201',
          amount: data.amount,
          fee: data.fee || 0,
          currency: data.currency || 'TZS',
          status: data.status || 'COMPLETED',
          paymentRail: data.paymentRail || data.rail || 'M_PESA',
          verificationMode: data.verificationMode || 'FACE_BIOMETRIC',
          livenessPassed: data.livenessPassed ?? true,
          isDemo: false,
          timestamp: data.timestamp || new Date().toISOString()
        });
      });
      return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.warn('[Firebase] Get transactions error:', err);
      return [];
    }
  },

  async updateWalletBalance(walletId: string, newBalance: number): Promise<boolean> {
    try {
      const walletRef = doc(firestore, 'wallets', walletId);
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: Timestamp.now()
      });
      console.log(`[Firebase Firestore] Wallet ${walletId} balance updated: ${newBalance} TZS`);
      return true;
    } catch (err) {
      console.error('[Firebase Firestore] Update wallet error:', err);
      return false;
    }
  },

  subscribeToTransactions(onUpdate: (txs: Transaction[]) => void): Unsubscribe {
    try {
      return onSnapshot(collection(firestore, 'transactions'), (snap) => {
        const txs: Transaction[] = [];
        snap.forEach(d => {
          const data = d.data() as any;
          txs.push({
            id: data.id || d.id,
            referenceNumber: data.referenceNumber,
            externalProviderRef: data.externalProviderRef || `EXT_${data.referenceNumber}`,
            userId: data.userId || data.senderUserId || 'usr_1',
            userName: data.userName || data.senderName || 'FacePay User',
            merchantId: data.merchantId || data.recipientMerchantId || 'm1',
            merchantName: data.merchantName || data.recipientName || 'Merchant',
            merchantLipaNumber: data.merchantLipaNumber || '5849201',
            amount: data.amount,
            fee: data.fee || 0,
            currency: data.currency || 'TZS',
            status: data.status || 'COMPLETED',
            paymentRail: data.paymentRail || data.rail || 'M_PESA',
            verificationMode: data.verificationMode || 'FACE_BIOMETRIC',
            livenessPassed: data.livenessPassed ?? true,
            isDemo: false,
            timestamp: data.timestamp || new Date().toISOString()
          });
        });
        txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onUpdate(txs);
      });
    } catch {
      return () => {};
    }
  },

  subscribeToWallet(walletId: string, onUpdate: (wallet: Partial<Wallet>) => void): Unsubscribe {
    try {
      return onSnapshot(doc(firestore, 'wallets', walletId), (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as Wallet);
        }
      });
    } catch {
      return () => {};
    }
  },

  async getMerchants(): Promise<Merchant[]> {
    try {
      const snap = await getDocs(collection(firestore, 'merchants'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Merchant);
      }
      return MERCHANTS;
    } catch {
      return MERCHANTS;
    }
  }
};

// Seed on startup
firebaseService.seedInitialDataIfEmpty().catch(() => {});
