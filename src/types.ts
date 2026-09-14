export type Language = 'sw' | 'en';
export type ThemeMode = 'light' | 'dark';

export type UserRole = 'LANDING' | 'CUSTOMER' | 'MERCHANT' | 'ARCHITECT';

export type PaymentRail = 
  | 'M_PESA' 
  | 'TIGO_PESA' 
  | 'AIRTEL_MONEY' 
  | 'HALOPESA' 
  | 'CRDB_BANK' 
  | 'NMB_BANK' 
  | 'TIPS_CENTRAL';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'SIMULATED_DEMO';

export type VerificationMode = 'FACE_BIOMETRIC' | 'PIN_FALLBACK' | 'DUAL_FACTOR';

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  nationalIdNida: string;
  email: string;
  pin?: string;
  isBiometricEnrolled: boolean;
  biometricEnrolledAt?: string;
  faceTemplateHash?: string;
  faceAvatarUrl?: string;
  securitySettings: {
    maxLimitWithoutPin: number; // in TZS
    dailySpendingLimit?: number; // in TZS (default 500,000)
    dailySpentAmount?: number; // spent today in TZS
    isAccountFrozen?: boolean; // emergency instant freeze on biometric payments
    livenessSensitivity: 'STANDARD' | 'HIGH' | 'MAXIMUM';
    requireSmileCheck: boolean;
    requireBlinkCheck: boolean;
    voicePromptsEnabled?: boolean;
    autoNightTorch?: boolean;
  };
}

export interface Wallet {
  id: string;
  userId: string;
  currency: 'TZS';
  balance: number;
  linkedRail: PaymentRail;
  linkedAccountNumber: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  name: string;
  businessType: string;
  location: string;
  lipaNumber: string; // Tanzanian Lipa Namba (e.g. 5849201)
  category: 'SUPERMARKET' | 'PETROL_STATION' | 'RESTAURANT' | 'PHARMACY' | 'TRANSPORT' | 'RETAIL';
  logo: string;
  rating: number;
  settlementRail: PaymentRail;
}

export interface Transaction {
  id: string;
  referenceNumber: string;
  externalProviderRef: string;
  userId: string;
  userName: string;
  merchantId: string;
  merchantName: string;
  merchantLipaNumber: string;
  amount: number;
  fee: number;
  currency: 'TZS';
  status: TransactionStatus;
  paymentRail: PaymentRail;
  verificationMode: VerificationMode;
  biometricScore?: number;
  livenessPassed: boolean;
  isDemo: boolean;
  timestamp: string;
  notes?: string;
}

export interface BiometricVerificationRequest {
  faceImageBase64?: string;
  landmarks?: {
    eyeDistanceRatio: number;
    jawWidthRatio: number;
    noseMouthRatio: number;
    smileConfidence: number;
    blinkConfidence: number;
  };
  livenessAction: 'BLINK' | 'SMILE' | 'HEAD_STATIONARY';
  clientDeviceId: string;
}

export interface BiometricVerificationResult {
  verified: boolean;
  confidenceScore: number; // 0 to 100
  livenessScore: number; // 0 to 100
  antiSpoofingPassed: boolean;
  matchThreshold: number;
  matchedUserId?: string;
  matchedUserName?: string;
  biometricToken?: string;
  analysisMessage: string;
  executionTimeMs: number;
}

export interface FaceVerificationResponse {
  success: boolean;
  stage: 'FACE_DETECTION' | 'LIVENESS' | 'FACE_MATCH' | 'VERIFIED';
  message: string;
  user?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    accountNumber: string;
    nationalIdNida?: string;
    faceAvatarUrl?: string;
    isBiometricEnrolled?: boolean;
  };
  verificationToken?: string;
  confidenceScore?: number;
  livenessScore?: number;
  notes?: string;
  detectedObject?: string;
}

export interface PaymentProviderStatus {
  id: PaymentRail;
  name: string;
  networkType: 'MNO' | 'BANK' | 'SWITCH';
  endpointStatus: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  latencyMs: number;
  successRate: number;
  apiProtocol: 'REST_OAUTH2' | 'SOAP_XML' | 'ISO_8583' | 'TIPS_JSON';
}

export interface DatabaseStatus {
  connected: boolean;
  engine: 'PostgreSQL' | 'In-Memory Relational Engine' | 'Firebase Firestore (fasi-8c19f)' | string;
  host?: string;
  database?: string;
  tablesCount: number;
  totalTransactionsPersisted: number;
  message: string;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  nationalIdNida: string;
  email?: string;
  linkedRail: PaymentRail;
  pin: string;
  faceAvatarUrl?: string;
}

export interface LoginRequest {
  phoneNumber: string;
  pin: string;
}
