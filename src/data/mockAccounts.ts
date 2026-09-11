import { PaymentRail, UserProfile, Wallet } from '../types';

export interface DemoAccount {
  id: string;
  user: UserProfile;
  wallet: Wallet;
  region: string;
  roleBadge: string;
  tagline: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'acc_01',
    user: {
      id: 'usr_tz_9821a',
      fullName: 'Juma Selemani Mkwawa',
      phoneNumber: '+255 754 819 203',
      nationalIdNida: '19920815-14102-00003-24',
      email: 'juma.mkwawa@gmail.com',
      isBiometricEnrolled: true,
      biometricEnrolledAt: '2026-03-01T10:15:00Z',
      faceTemplateHash: 'sha256_e8f23b98c41d8e12a45bc839d201cba6',
      faceAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      securitySettings: {
        maxLimitWithoutPin: 100000,
        livenessSensitivity: 'HIGH',
        requireSmileCheck: true,
        requireBlinkCheck: true,
      }
    },
    wallet: {
      id: 'wlt_tz_4481c',
      userId: 'usr_tz_9821a',
      currency: 'TZS',
      balance: 345000,
      linkedRail: 'M_PESA',
      linkedAccountNumber: '+255 754 819 203',
      updatedAt: new Date().toISOString(),
    },
    region: 'Dar es Salaam (Kariakoo)',
    roleBadge: 'Vodacom M-Pesa',
    tagline: 'Mfanyabiashara mdogo, mnunuzi wa mara kwa mara wa madukani'
  },
  {
    id: 'acc_02',
    user: {
      id: 'usr_tz_8819b',
      fullName: 'Amina Said Bakari',
      phoneNumber: '+255 784 552 119',
      nationalIdNida: '19951104-12101-00049-18',
      email: 'amina.bakari@zanlink.co.tz',
      isBiometricEnrolled: true,
      biometricEnrolledAt: '2026-02-14T08:30:00Z',
      faceTemplateHash: 'sha256_91bf88231cda28e93240a1b659c2b4d1',
      faceAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      securitySettings: {
        maxLimitWithoutPin: 250000,
        livenessSensitivity: 'MAXIMUM',
        requireSmileCheck: true,
        requireBlinkCheck: true,
      }
    },
    wallet: {
      id: 'wlt_tz_9912b',
      userId: 'usr_tz_8819b',
      currency: 'TZS',
      balance: 820000,
      linkedRail: 'AIRTEL_MONEY',
      linkedAccountNumber: '+255 784 552 119',
      updatedAt: new Date().toISOString(),
    },
    region: 'Zanzibar (Stone Town)',
    roleBadge: 'Airtel Money VIP',
    tagline: 'Mjasiriamali wa utalii na usafiri wa baharini'
  },
  {
    id: 'acc_03',
    user: {
      id: 'usr_tz_7714c',
      fullName: 'Eng. Neema Emanuel Masawe',
      phoneNumber: '+255 713 902 441',
      nationalIdNida: '19890621-22108-00012-76',
      email: 'neema.masawe@crdb.co.tz',
      isBiometricEnrolled: true,
      biometricEnrolledAt: '2026-01-20T14:40:00Z',
      faceTemplateHash: 'sha256_48a1c9003bf2d4e8791550cfa00318e2',
      faceAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      securitySettings: {
        maxLimitWithoutPin: 500000,
        livenessSensitivity: 'HIGH',
        requireSmileCheck: true,
        requireBlinkCheck: true,
      }
    },
    wallet: {
      id: 'wlt_tz_2209c',
      userId: 'usr_tz_7714c',
      currency: 'TZS',
      balance: 1450000,
      linkedRail: 'CRDB_BANK',
      linkedAccountNumber: '0150294819200',
      updatedAt: new Date().toISOString(),
    },
    region: 'Arusha (Clock Tower)',
    roleBadge: 'CRDB SimBanking',
    tagline: 'Mhandisi wa IT, uhamisho wa benki na manunuzi makubwa'
  },
  {
    id: 'acc_04',
    user: {
      id: 'usr_tz_6630d',
      fullName: 'Rashid Kassim Mwamba',
      phoneNumber: '+255 715 338 901',
      nationalIdNida: '19980312-33104-00008-55',
      email: 'rashid.mwamba@outlook.com',
      isBiometricEnrolled: false, // Not enrolled yet, test enrollment flow!
      faceTemplateHash: undefined,
      faceAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      securitySettings: {
        maxLimitWithoutPin: 50000,
        livenessSensitivity: 'STANDARD',
        requireSmileCheck: true,
        requireBlinkCheck: false,
      }
    },
    wallet: {
      id: 'wlt_tz_8820d',
      userId: 'usr_tz_6630d',
      currency: 'TZS',
      balance: 95000,
      linkedRail: 'TIGO_PESA',
      linkedAccountNumber: '+255 715 338 901',
      updatedAt: new Date().toISOString(),
    },
    region: 'Mwanza (Rock City)',
    roleBadge: 'Tigo Pesa (Hajajisajili)',
    tagline: 'Mteja mpya - tayari kujaribu usajili wa sura kwa mara ya kwanza'
  },
  {
    id: 'acc_05',
    user: {
      id: 'usr_tz_5512e',
      fullName: 'Bi. Fatuma Ally Mwinyi',
      phoneNumber: '+255 768 440 922',
      nationalIdNida: '19841209-11105-00031-40',
      email: 'fatuma.mwinyi@dodoma.go.tz',
      isBiometricEnrolled: true,
      biometricEnrolledAt: '2026-03-05T11:00:00Z',
      faceTemplateHash: 'sha256_b39417efda309c488219ae034091522f',
      faceAvatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80',
      securitySettings: {
        maxLimitWithoutPin: 1000000,
        livenessSensitivity: 'MAXIMUM',
        requireSmileCheck: true,
        requireBlinkCheck: true,
      }
    },
    wallet: {
      id: 'wlt_tz_7731e',
      userId: 'usr_tz_5512e',
      currency: 'TZS',
      balance: 2100000,
      linkedRail: 'NMB_BANK',
      linkedAccountNumber: '22810094812',
      updatedAt: new Date().toISOString(),
    },
    region: 'Dodoma (Mji wa Serikali)',
    roleBadge: 'NMB Mkononi Direct',
    tagline: 'Afisa mwandamizi wa serikali, ununuzi wa kadi & TIPS'
  }
];
