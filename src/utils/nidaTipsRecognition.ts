import { NidaCitizenRecord, TipsAccountRecord, UserProfile, Wallet, UserRecognitionResult, PaymentRail } from '../types';
import { DEMO_ACCOUNTS } from '../data/mockAccounts';
import { INITIAL_USER, INITIAL_WALLET } from '../data/mockData';

// Mock National Identification Authority (NIDA) Tanzanian Citizen Database
export const NIDA_CITIZEN_REGISTRY: Record<string, NidaCitizenRecord> = {
  // Juma Selemani Mkwawa
  '19920815141020000324': {
    nin: '19920815-14102-00003-24',
    fullName: 'Juma Selemani Mkwawa',
    dateOfBirth: '15/08/1992',
    gender: 'ME',
    nationality: 'Mtanzania (Citizen by Birth)',
    biometricRegistered: true,
    status: 'VERIFIED_CITIZEN',
    fingerprintsEnrolled: true,
    facialMeshEnrolled: true,
    issueYear: '2016'
  },
  // Amina Said Bakari
  '19951104121010004918': {
    nin: '19951104-12101-00049-18',
    fullName: 'Amina Said Bakari',
    dateOfBirth: '04/11/1995',
    gender: 'KE',
    nationality: 'Mtanzania (Citizen by Birth)',
    biometricRegistered: true,
    status: 'VERIFIED_CITIZEN',
    fingerprintsEnrolled: true,
    facialMeshEnrolled: true,
    issueYear: '2018'
  },
  // Eng. Neema Emanuel Masawe
  '19890621221080001276': {
    nin: '19890621-22108-00012-76',
    fullName: 'Eng. Neema Emanuel Masawe',
    dateOfBirth: '21/06/1989',
    gender: 'KE',
    nationality: 'Mtanzania (Citizen by Birth)',
    biometricRegistered: true,
    status: 'VERIFIED_CITIZEN',
    fingerprintsEnrolled: true,
    facialMeshEnrolled: true,
    issueYear: '2014'
  },
  // Bi. Fatuma Ally Mwinyi
  '19841209111050003140': {
    nin: '19841209-11105-00031-40',
    fullName: 'Bi. Fatuma Ally Mwinyi',
    dateOfBirth: '09/12/1984',
    gender: 'KE',
    nationality: 'Mtanzania (Citizen by Birth)',
    biometricRegistered: true,
    status: 'VERIFIED_CITIZEN',
    fingerprintsEnrolled: true,
    facialMeshEnrolled: true,
    issueYear: '2013'
  },
  // Rashid Kassim Mwamba
  '19980312331040000855': {
    nin: '19980312-33104-00008-55',
    fullName: 'Rashid Kassim Mwamba',
    dateOfBirth: '12/03/1998',
    gender: 'ME',
    nationality: 'Mtanzania (Citizen by Birth)',
    biometricRegistered: true,
    status: 'VERIFIED_CITIZEN',
    fingerprintsEnrolled: true,
    facialMeshEnrolled: false, // Hajajisajili uso bado
    issueYear: '2020'
  },
  // Baraka Mrema
  '19920101141010000888': {
    nin: '19920101-14101-00008-88',
    fullName: 'Baraka Mrema',
    dateOfBirth: '01/01/1992',
    gender: 'ME',
    nationality: 'Mtanzania (Citizen by Birth)',
    biometricRegistered: true,
    status: 'VERIFIED_CITIZEN',
    fingerprintsEnrolled: true,
    facialMeshEnrolled: false,
    issueYear: '2019'
  }
};

// Mock Tanzania Instant Payment System (TIPS) Central Gateway Switch
export const TIPS_SWITCH_REGISTRY: Record<string, TipsAccountRecord> = {
  // Juma M-Pesa
  '255754819203': {
    tipsParticipantId: 'TZ.BOT.TIPS.VOD.0754819203',
    primaryRail: 'M_PESA',
    linkedPhone: '+255 754 819 203',
    linkedBanks: ['CRDB Bank (0150294819200)'],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  },
  // Amina Airtel Money
  '255784552119': {
    tipsParticipantId: 'TZ.BOT.TIPS.AIR.0784552119',
    primaryRail: 'AIRTEL_MONEY',
    linkedPhone: '+255 784 552 119',
    linkedBanks: ['PBZ Bank Zanzibar'],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  },
  // Neema CRDB
  '255713902441': {
    tipsParticipantId: 'TZ.BOT.TIPS.CRDB.01502948192',
    primaryRail: 'CRDB_BANK',
    linkedPhone: '+255 713 902 441',
    linkedBanks: ['CRDB Bank', 'Vodacom M-Pesa'],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  },
  // Fatuma NMB
  '255768440922': {
    tipsParticipantId: 'TZ.BOT.TIPS.NMB.22810094812',
    primaryRail: 'NMB_BANK',
    linkedPhone: '+255 768 440 922',
    linkedBanks: ['NMB Bank Mkononi', 'Tigo Pesa'],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  },
  // Rashid Tigo Pesa
  '255715338901': {
    tipsParticipantId: 'TZ.BOT.TIPS.TIG.0715338901',
    primaryRail: 'TIGO_PESA',
    linkedPhone: '+255 715 338 901',
    linkedBanks: [],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  },
  // Baraka
  '255754888222': {
    tipsParticipantId: 'TZ.BOT.TIPS.VOD.0754888222',
    primaryRail: 'TIGO_PESA',
    linkedPhone: '+255 754 888 222',
    linkedBanks: [],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  }
};

/**
 * Normalizes NIDA string by stripping hyphens and non-alphanumerics
 */
export function normalizeNida(nin: string): string {
  return (nin || '').replace(/[^0-9]/g, '');
}

/**
 * Formats clean digits into standard NIDA format (YYYYMMDD-GGNNN-XXXXX-CC)
 */
export function formatNida(nin: string): string {
  const clean = normalizeNida(nin);
  if (clean.length === 20) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 13)}-${clean.slice(13, 18)}-${clean.slice(18, 20)}`;
  }
  return nin;
}

/**
 * Normalizes phone number into international Tanzanian format (255XXXXXXXXX)
 */
export function normalizePhone(phone: string): string {
  let clean = (phone || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '255' + clean.slice(1);
  } else if (clean.length === 9) {
    clean = '255' + clean;
  }
  return clean;
}

/**
 * Look up official Citizen NIDA Record
 */
export function lookupNidaGateway(ninOrQuery: string): NidaCitizenRecord | null {
  const clean = normalizeNida(ninOrQuery);
  if (!clean) return null;

  // Direct match
  if (NIDA_CITIZEN_REGISTRY[clean]) {
    return NIDA_CITIZEN_REGISTRY[clean];
  }

  // Suffix/prefix match
  for (const [key, record] of Object.entries(NIDA_CITIZEN_REGISTRY)) {
    if (key.includes(clean) || clean.includes(key) || record.fullName.toLowerCase().includes(ninOrQuery.toLowerCase())) {
      return record;
    }
  }

  // Synthesize realistic Tanzanian citizen for any valid 20-digit NIN input
  if (clean.length >= 8) {
    const yyyy = clean.slice(0, 4);
    const mm = clean.slice(4, 6);
    const dd = clean.slice(6, 8);
    const birthYear = parseInt(yyyy, 10);
    const isValidYear = birthYear >= 1930 && birthYear <= 2008;

    return {
      nin: formatNida(clean.padEnd(20, '0')),
      fullName: 'Raia wa Tanzania (NIDA Live Query)',
      dateOfBirth: isValidYear ? `${dd}/${mm}/${yyyy}` : '15/06/1993',
      gender: 'ME',
      nationality: 'Mtanzania (Citizen by Birth)',
      biometricRegistered: true,
      status: 'VERIFIED_CITIZEN',
      fingerprintsEnrolled: true,
      facialMeshEnrolled: true,
      issueYear: '2021'
    };
  }

  return null;
}

/**
 * Look up TIPS Central Switch mapping for a phone number
 */
export function lookupTipsSwitch(phone: string): TipsAccountRecord | null {
  const clean = normalizePhone(phone);
  if (!clean) return null;

  if (TIPS_SWITCH_REGISTRY[clean]) {
    return TIPS_SWITCH_REGISTRY[clean];
  }

  // Infer carrier rail from Tanzanian carrier prefix
  // Vodacom: 074, 075, 076
  // Tigo: 071, 065, 067
  // Airtel: 078, 068, 069
  // Halotel: 062, 061
  let rail: PaymentRail = 'M_PESA';
  if (clean.startsWith('25571') || clean.startsWith('25565') || clean.startsWith('25567')) {
    rail = 'TIGO_PESA';
  } else if (clean.startsWith('25578') || clean.startsWith('25568') || clean.startsWith('25569')) {
    rail = 'AIRTEL_MONEY';
  } else if (clean.startsWith('25562') || clean.startsWith('25561')) {
    rail = 'HALOPESA';
  }

  return {
    tipsParticipantId: `TZ.BOT.TIPS.${rail.slice(0, 3)}.${clean.slice(-9)}`,
    primaryRail: rail,
    linkedPhone: `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`,
    linkedBanks: ['Tanzania Instant Payment System (TIPS)'],
    interoperabilityStatus: 'ACTIVE_LINKED',
    clearingEnabled: true
  };
}

/**
 * Get all candidate registered accounts from Demo & Local stores
 */
export function getAllKnownAccounts(): Array<{ user: UserProfile; wallet: Wallet; pin?: string }> {
  const accounts: Array<{ user: UserProfile; wallet: Wallet; pin?: string }> = [];

  // Default primary user
  accounts.push({
    user: INITIAL_USER,
    wallet: INITIAL_WALLET,
    pin: '1234'
  });

  // Demo accounts
  for (const demo of DEMO_ACCOUNTS) {
    if (!accounts.some(a => a.user.id === demo.user.id)) {
      accounts.push({
        user: demo.user,
        wallet: demo.wallet,
        pin: '1234'
      });
    }
  }

  return accounts;
}

/**
 * Check if a person has already registered in FacePay TZ, NIDA, or TIPS
 * Used during registration or identification
 */
export function checkUserAlreadyRegistered(params: {
  nin?: string;
  phone?: string;
  fullName?: string;
  accounts?: Array<{ user: UserProfile; wallet: Wallet }>;
}): UserRecognitionResult {
  const accounts = params.accounts && params.accounts.length > 0 
    ? params.accounts 
    : getAllKnownAccounts();

  const cleanInputNin = normalizeNida(params.nin || '');
  const cleanInputPhone = normalizePhone(params.phone || '');

  // 1. Check by NIDA NIN
  if (cleanInputNin && cleanInputNin.length >= 8) {
    for (const acc of accounts) {
      const accCleanNin = normalizeNida(acc.user.nationalIdNida || '');
      if (accCleanNin && (accCleanNin === cleanInputNin || accCleanNin.includes(cleanInputNin) || cleanInputNin.includes(accCleanNin))) {
        const nidaRec = lookupNidaGateway(acc.user.nationalIdNida);
        const tipsRec = lookupTipsSwitch(acc.user.phoneNumber);
        return {
          recognized: true,
          matchType: 'NIDA_NIN',
          user: acc.user,
          wallet: acc.wallet,
          nidaRecord: nidaRec || undefined,
          tipsRecord: tipsRec || undefined,
          confidenceScore: 99.8,
          message: `Mtumiaji ametambuliwa kupitia NIDA (${acc.user.fullName}). Akaunti tayari ipo kwenye mifumo ya NIDA & TIPS!`
        };
      }
    }
  }

  // 2. Check by Phone Number (TIPS Identifier)
  if (cleanInputPhone && cleanInputPhone.length >= 9) {
    for (const acc of accounts) {
      const accCleanPhone = normalizePhone(acc.user.phoneNumber || '');
      if (accCleanPhone && (accCleanPhone === cleanInputPhone || accCleanPhone.endsWith(cleanInputPhone.slice(-9)))) {
        const nidaRec = lookupNidaGateway(acc.user.nationalIdNida);
        const tipsRec = lookupTipsSwitch(acc.user.phoneNumber);
        return {
          recognized: true,
          matchType: 'PHONE_TIPS',
          user: acc.user,
          wallet: acc.wallet,
          nidaRecord: nidaRec || undefined,
          tipsRecord: tipsRec || undefined,
          confidenceScore: 99.5,
          message: `Namba hii ya simu tayari imesajiliwa kwenye TIPS & FacePay kwa jina la ${acc.user.fullName}!`
        };
      }
    }
  }

  // 3. Check by Full Name
  if (params.fullName && params.fullName.trim().length > 3) {
    const qName = params.fullName.toLowerCase().trim();
    for (const acc of accounts) {
      if (acc.user.fullName.toLowerCase().includes(qName) || qName.includes(acc.user.fullName.toLowerCase())) {
        const nidaRec = lookupNidaGateway(acc.user.nationalIdNida);
        const tipsRec = lookupTipsSwitch(acc.user.phoneNumber);
        return {
          recognized: true,
          matchType: 'NIDA_NIN',
          user: acc.user,
          wallet: acc.wallet,
          nidaRecord: nidaRec || undefined,
          tipsRecord: tipsRec || undefined,
          confidenceScore: 94.0,
          message: `Akaunti inayolingana na jina hili tayari ipo kwenye mfumo (${acc.user.fullName})!`
        };
      }
    }
  }

  return {
    recognized: false,
    message: 'Hakuna akaunti iliyopatikana na taarifa hizi. Unaweza kuendelea na usajili mpya.'
  };
}

/**
 * Biometric Face Recognition:
 * Matches an active camera frame or uploaded face against all registered face profiles!
 * If matched, returns the registered user profile, NIDA identity & TIPS rails.
 */
export function recognizeFaceFromCandidates(params: {
  faceImage: string;
  preferredUserId?: string;
  accounts?: Array<{ user: UserProfile; wallet: Wallet }>;
}): UserRecognitionResult {
  const accounts = params.accounts && params.accounts.length > 0 
    ? params.accounts 
    : getAllKnownAccounts();

  // Find users who have an enrolled biometric face
  const enrolledAccounts = accounts.filter(acc => acc.user.isBiometricEnrolled && (acc.user.faceAvatarUrl || acc.user.faceTemplateHash));

  if (enrolledAccounts.length === 0) {
    return {
      recognized: false,
      message: 'Hakuna nyuso zilizosajiliwa kwenye mfumo bado.'
    };
  }

  // 1. If image contains a specific avatar match or preferred user
  let matched = enrolledAccounts[0];

  if (params.preferredUserId) {
    const pref = enrolledAccounts.find(a => a.user.id === params.preferredUserId);
    if (pref) matched = pref;
  } else if (params.faceImage) {
    // Check if the image matches any user's face avatar URL
    const exactUrlMatch = enrolledAccounts.find(a => a.user.faceAvatarUrl && params.faceImage.includes(a.user.faceAvatarUrl));
    if (exactUrlMatch) {
      matched = exactUrlMatch;
    } else {
      // Default to Juma (primary demo user) or first enrolled user
      matched = enrolledAccounts[0];
    }
  }

  const nidaRec = lookupNidaGateway(matched.user.nationalIdNida);
  const tipsRec = lookupTipsSwitch(matched.user.phoneNumber);

  return {
    recognized: true,
    matchType: 'FACE_BIOMETRIC',
    user: matched.user,
    wallet: matched.wallet,
    nidaRecord: nidaRec || undefined,
    tipsRecord: tipsRec || undefined,
    confidenceScore: 99.4,
    message: `Uso umetambuliwa kikamilifu! Mfumo umemtambua ${matched.user.fullName} kupitia alama za NIDA na TIPS.`
  };
}
