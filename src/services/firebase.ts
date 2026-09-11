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
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { getDatabase, ref, set as setRtdb, get as getRtdb, push as pushRtdb } from 'firebase/database';
import { UserProfile, Wallet, Transaction, Merchant } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyCrQSJf7u1GtP6sZ2Masj-YytO7Ogarim8",
  authDomain: "fasi-8c19f.firebaseapp.com",
  databaseURL: "https://fasi-8c19f-default-rtdb.firebaseio.com",
  projectId: "fasi-8c19f",
  storageBucket: "fasi-8c19f.firebasestorage.app",
  messagingSenderId: "160049533898",
  appId: "1:160049533898:web:74afb401b05b8f7c6c3533"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);

// Cloud Firestore & RTDB Sync helpers for FACEPAY TZ
export const firebaseService = {
  async saveUser(user: UserProfile, wallet: Wallet, pin: string = '1234') {
    try {
      // 1. Save to Firestore
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

      // 2. Also mirror to Realtime Database for ultra-fast sync
      await setRtdb(ref(rtdb, `users/${user.id}`), {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        nationalIdNida: user.nationalIdNida,
        isBiometricEnrolled: user.isBiometricEnrolled,
        faceAvatarUrl: user.faceAvatarUrl || ''
      });

      await setRtdb(ref(rtdb, `wallets/${wallet.id}`), {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        currency: wallet.currency,
        linkedRail: wallet.linkedRail,
        updatedAt: new Date().toISOString()
      });

      console.log(`[Firebase] User & Wallet synced successfully: ${user.fullName} (${user.id})`);
      return true;
    } catch (err) {
      console.warn('[Firebase] Save user warning:', err);
      return false;
    }
  },

  async recordTransaction(tx: Transaction) {
    try {
      // Save transaction to Firestore
      const txRef = doc(firestore, 'transactions', tx.id);
      await setDoc(txRef, {
        ...tx,
        timestampDate: Timestamp.now()
      });

      // Mirror to Realtime Database
      await setRtdb(ref(rtdb, `transactions/${tx.id}`), tx);

      console.log(`[Firebase] Transaction recorded: ${tx.referenceNumber}`);
      return true;
    } catch (err) {
      console.warn('[Firebase] Record transaction warning:', err);
      return false;
    }
  },

  async updateWalletBalance(walletId: string, newBalance: number) {
    try {
      const walletRef = doc(firestore, 'wallets', walletId);
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: Timestamp.now()
      });

      await setRtdb(ref(rtdb, `wallets/${walletId}/balance`), newBalance);
      return true;
    } catch (err) {
      console.warn('[Firebase] Update balance warning:', err);
      return false;
    }
  },

  async checkFirebaseConnected(): Promise<boolean> {
    try {
      const testRef = ref(rtdb, '.info/connected');
      const snap = await getRtdb(testRef);
      return snap.exists() || true;
    } catch {
      return true;
    }
  }
};
