import { Merchant, PaymentProviderStatus, PaymentRail, Transaction, UserProfile, Wallet } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_tz_9821a',
  fullName: 'Riko Sapto',
  phoneNumber: '+62 899-1234-6789',
  nationalIdNida: '19920815-14102-00003-24',
  email: 'riko.sapto@gmail.com',
  isBiometricEnrolled: true,
  biometricEnrolledAt: '2026-03-01T10:15:00Z',
  faceTemplateHash: 'sha256_e8f23b98c41d8e12a45bc839d201cba6',
  faceAvatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  securitySettings: {
    maxLimitWithoutPin: 100000, // 100,000 TZS can be paid with Face-only; higher requires 4-digit PIN
    livenessSensitivity: 'HIGH',
    requireSmileCheck: true,
    requireBlinkCheck: true,
  }
};

export const DEMO_UNREGISTERED_USER: UserProfile = {
  id: 'usr_tz_unregistered_baraka',
  fullName: 'Baraka Mrema',
  phoneNumber: '+255 754 888 222',
  nationalIdNida: '19920101-14101-00008-88',
  email: 'baraka.mrema@gmail.com',
  isBiometricEnrolled: false, // Hajasajili Uso Kwenye FacePay!
  biometricEnrolledAt: undefined,
  faceTemplateHash: undefined,
  faceAvatarUrl: undefined,
  securitySettings: {
    maxLimitWithoutPin: 50000,
    livenessSensitivity: 'STANDARD',
    requireSmileCheck: true,
    requireBlinkCheck: true,
  }
};

export const INITIAL_WALLET: Wallet = {
  id: 'wlt_tz_4481c',
  userId: 'usr_tz_9821a',
  currency: 'TZS',
  balance: 345000, // 345,000 TZS
  linkedRail: 'M_PESA',
  linkedAccountNumber: '+255 754 819 203',
  updatedAt: new Date().toISOString(),
};

export const MERCHANTS: Merchant[] = [
  {
    id: 'mch_001',
    name: 'Shoppers Plaza Masaki',
    businessType: 'Supermarket & Groceries',
    location: 'Haile Selassie Rd, Masaki, Dar es Salaam',
    lipaNumber: '5892104',
    category: 'SUPERMARKET',
    logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80',
    rating: 4.9,
    settlementRail: 'M_PESA'
  },
  {
    id: 'mch_002',
    name: 'TotalEnergies Bagamoyo Rd',
    businessType: 'Fuel Station & Convenience',
    location: 'Mwenge Bus Stand, Dar es Salaam',
    lipaNumber: '4109281',
    category: 'PETROL_STATION',
    logo: 'https://images.unsplash.com/photo-1527018607636-93092289c894?w=150&auto=format&fit=crop&q=80',
    rating: 4.8,
    settlementRail: 'CRDB_BANK'
  },
  {
    id: 'mch_003',
    name: 'Azam Marine & Ferry Ticketing',
    businessType: 'Zanzibar Ferry & Transport',
    location: 'Sokoine Drive, Waterfront, Posta',
    lipaNumber: '8201943',
    category: 'TRANSPORT',
    logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop&q=80',
    rating: 4.7,
    settlementRail: 'TIPS_CENTRAL'
  },
  {
    id: 'mch_004',
    name: 'Kariakoo Wholesalers Center',
    businessType: 'Electronics & General Goods',
    location: 'Msimbazi & Congo St, Kariakoo',
    lipaNumber: '7739102',
    category: 'RETAIL',
    logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=150&auto=format&fit=crop&q=80',
    rating: 4.6,
    settlementRail: 'TIGO_PESA'
  },
  {
    id: 'mch_005',
    name: 'Aga Khan Pharmacy Kisutu',
    businessType: 'Healthcare & Medicine',
    location: 'Ocean Rd, Kisutu, Dar es Salaam',
    lipaNumber: '3918204',
    category: 'PHARMACY',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80',
    rating: 4.9,
    settlementRail: 'AIRTEL_MONEY'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_tz_001',
    referenceNumber: 'FP-TZ-9104-8832',
    externalProviderRef: 'MPESA-TXN-9841289',
    userId: 'usr_tz_9821a',
    userName: 'Juma Selemani Mkwawa',
    merchantId: 'mch_001',
    merchantName: 'Shoppers Plaza Masaki',
    merchantLipaNumber: '5892104',
    amount: 48500,
    fee: 0,
    currency: 'TZS',
    status: 'SIMULATED_DEMO',
    paymentRail: 'M_PESA',
    verificationMode: 'FACE_BIOMETRIC',
    biometricScore: 98.7,
    livenessPassed: true,
    isDemo: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    notes: 'Grocery checkout via FacePay terminal'
  },
  {
    id: 'tx_tz_002',
    referenceNumber: 'FP-TZ-8841-3910',
    externalProviderRef: 'TIPS-BOT-4401928',
    userId: 'usr_tz_9821a',
    userName: 'Juma Selemani Mkwawa',
    merchantId: 'mch_002',
    merchantName: 'TotalEnergies Bagamoyo Rd',
    merchantLipaNumber: '4109281',
    amount: 35000,
    fee: 0,
    currency: 'TZS',
    status: 'SIMULATED_DEMO',
    paymentRail: 'CRDB_BANK',
    verificationMode: 'FACE_BIOMETRIC',
    biometricScore: 99.1,
    livenessPassed: true,
    isDemo: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    notes: 'Fuel V-Power 12.5L'
  },
  {
    id: 'tx_tz_003',
    referenceNumber: 'FP-TZ-7102-4521',
    externalProviderRef: 'TIGO-PESA-782190',
    userId: 'usr_tz_9821a',
    userName: 'Juma Selemani Mkwawa',
    merchantId: 'mch_004',
    merchantName: 'Kariakoo Wholesalers Center',
    merchantLipaNumber: '7739102',
    amount: 12000,
    fee: 0,
    currency: 'TZS',
    status: 'SIMULATED_DEMO',
    paymentRail: 'TIGO_PESA',
    verificationMode: 'FACE_BIOMETRIC',
    biometricScore: 97.5,
    livenessPassed: true,
    isDemo: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    notes: 'Office stationery'
  }
];

export const PAYMENT_PROVIDERS_STATUS: PaymentProviderStatus[] = [
  {
    id: 'M_PESA',
    name: 'Vodacom M-Pesa (Daraja API Gateway)',
    networkType: 'MNO',
    endpointStatus: 'OPERATIONAL',
    latencyMs: 142,
    successRate: 99.8,
    apiProtocol: 'REST_OAUTH2'
  },
  {
    id: 'TIGO_PESA',
    name: 'Tigo Pesa (Tigo Cash Gateway)',
    networkType: 'MNO',
    endpointStatus: 'OPERATIONAL',
    latencyMs: 168,
    successRate: 99.4,
    apiProtocol: 'REST_OAUTH2'
  },
  {
    id: 'AIRTEL_MONEY',
    name: 'Airtel Money (Airtel Pay Portal)',
    networkType: 'MNO',
    endpointStatus: 'OPERATIONAL',
    latencyMs: 185,
    successRate: 99.1,
    apiProtocol: 'REST_OAUTH2'
  },
  {
    id: 'TIPS_CENTRAL',
    name: 'Bank of Tanzania TIPS (National Switch)',
    networkType: 'SWITCH',
    endpointStatus: 'OPERATIONAL',
    latencyMs: 95,
    successRate: 99.9,
    apiProtocol: 'TIPS_JSON'
  },
  {
    id: 'CRDB_BANK',
    name: 'CRDB Bank SimBanking Gateway',
    networkType: 'BANK',
    endpointStatus: 'OPERATIONAL',
    latencyMs: 190,
    successRate: 98.9,
    apiProtocol: 'REST_OAUTH2'
  },
  {
    id: 'NMB_BANK',
    name: 'NMB Bank Mkononi Direct',
    networkType: 'BANK',
    endpointStatus: 'OPERATIONAL',
    latencyMs: 204,
    successRate: 98.7,
    apiProtocol: 'SOAP_XML'
  }
];
