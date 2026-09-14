import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Smartphone, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  RefreshCw, 
  Camera, 
  ScanFace, 
  Upload, 
  AlertTriangle, 
  RotateCcw,
  Search,
  BadgeCheck,
  Check,
  LogIn
} from 'lucide-react';
import { Language, PaymentRail, UserProfile, Wallet, UserRecognitionResult, NidaCitizenRecord, TipsAccountRecord } from '../types';
import { apiClient } from '../services/apiClient';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';
import { FaceMeshOverlay } from './FaceMeshOverlay';
import { 
  checkUserAlreadyRegistered, 
  lookupNidaGateway, 
  lookupTipsSwitch, 
  recognizeFaceFromCandidates,
  getAllKnownAccounts,
  formatNida,
  normalizeNida,
  normalizePhone
} from '../utils/nidaTipsRecognition';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  currentWallet?: Wallet;
  language: Language;
  initialTab?: 'LOGIN' | 'REGISTER' | 'SWITCH' | 'FACE_RECOGNIZE';
  isAuthenticated?: boolean;
  onAuthSuccess: (user: UserProfile, wallet: Wallet) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentWallet,
  language,
  initialTab = 'LOGIN',
  isAuthenticated = false,
  onAuthSuccess
}) => {
  const [tab, setTab] = useState<'FACE_RECOGNIZE' | 'LOGIN' | 'REGISTER' | 'SWITCH'>(
    initialTab === 'REGISTER' ? 'REGISTER' : (initialTab === 'SWITCH' && !isAuthenticated ? 'FACE_RECOGNIZE' : (initialTab as any || 'FACE_RECOGNIZE'))
  );
  
  // Login fields (supports phone or NIDA)
  const [loginPhoneOrNida, setLoginPhoneOrNida] = useState(
    isAuthenticated && currentUser?.phoneNumber ? currentUser.phoneNumber : ''
  );
  const [loginPin, setLoginPin] = useState('');
  const [recognizedLoginUser, setRecognizedLoginUser] = useState<UserRecognitionResult | null>(null);
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+255 7');
  const [regNida, setRegNida] = useState('');
  const [regRail, setRegRail] = useState<PaymentRail>('M_PESA');
  const [regPin, setRegPin] = useState('1234');
  
  // Real-time recognition alert during registration
  const [existingDetectedUser, setExistingDetectedUser] = useState<UserRecognitionResult | null>(null);
  const [nidaVerifyStatus, setNidaVerifyStatus] = useState<{
    loading: boolean;
    checked: boolean;
    record?: NidaCitizenRecord;
    tipsRecord?: TipsAccountRecord;
  }>({ loading: false, checked: false });

  // Biometric Face Enrollment state in registration
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedFaceUrl, setCapturedFaceUrl] = useState<string | null>(null);
  const [faceEnrolledSuccess, setFaceEnrolledSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Face Recognition Login state (Tambua kwa Uso)
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceRecognitionResult, setFaceRecognitionResult] = useState<UserRecognitionResult | null>(null);
  const [scanCandidateIndex, setScanCandidateIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Demo users
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        setTab(initialTab === 'REGISTER' ? 'REGISTER' : 'FACE_RECOGNIZE');
        setLoginPhoneOrNida('');
        setLoginPin('');
      } else {
        setTab(initialTab === 'SWITCH' ? 'SWITCH' : (initialTab as any || 'FACE_RECOGNIZE'));
        if (currentUser?.phoneNumber) {
          setLoginPhoneOrNida(currentUser.phoneNumber);
        }
      }
      loadDemoAccounts();
      setErrorMsg(null);
      setSuccessMsg(null);
      setExistingDetectedUser(null);
      setFaceRecognitionResult(null);
    } else {
      stopCamera();
    }
  }, [isOpen, initialTab, currentUser, isAuthenticated]);

  // Connect camera stream to video whenever isCameraActive or streamRef changes
  useEffect(() => {
    if (isCameraActive && !isSimulatedCamera && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn('Video play in effect caught:', e));
      }
    }
  }, [isCameraActive, isSimulatedCamera]);

  // When switching to FACE_RECOGNIZE tab, automatically start camera and run recognition
  useEffect(() => {
    if (isOpen && tab === 'FACE_RECOGNIZE') {
      startCamera();
      triggerBiometricScan();
    } else if (isOpen && tab === 'REGISTER' && !capturedFaceUrl) {
      startCamera();
    }
  }, [tab, isOpen]);

  // Live recognition as user types NIDA or Phone during registration
  useEffect(() => {
    if (tab === 'REGISTER') {
      const ninDigits = normalizeNida(regNida);
      const phoneDigits = normalizePhone(regPhone);

      if (ninDigits.length >= 8 || (phoneDigits.length >= 9 && phoneDigits !== '2557')) {
        const check = checkUserAlreadyRegistered({ nin: regNida, phone: regPhone });
        if (check.recognized && check.user) {
          setExistingDetectedUser(check);
        } else {
          setExistingDetectedUser(null);
        }
      } else {
        setExistingDetectedUser(null);
      }
    }
  }, [regNida, regPhone, tab]);

  // Live recognition in login tab as user types phone or NIDA
  useEffect(() => {
    if (tab === 'LOGIN') {
      const clean = loginPhoneOrNida.replace(/[^0-9]/g, '');
      if (clean.length >= 8) {
        const check = checkUserAlreadyRegistered({ nin: loginPhoneOrNida, phone: loginPhoneOrNida });
        if (check.recognized && check.user) {
          setRecognizedLoginUser(check);
        } else {
          setRecognizedLoginUser(null);
        }
      } else {
        setRecognizedLoginUser(null);
      }
    }
  }, [loginPhoneOrNida, tab]);

  const loadDemoAccounts = async () => {
    try {
      const res = await apiClient.getDemoUsers();
      if (res.users) {
        setDemoAccounts(res.users);
      } else {
        setDemoAccounts(getAllKnownAccounts());
      }
    } catch {
      setDemoAccounts(getAllKnownAccounts());
    }
  };

  // Camera Management for Face Recognition / Registration
  const startCamera = async (overrideFacing?: 'user' | 'environment') => {
    setCameraError(null);
    const targetFacing = overrideFacing || facingMode;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: targetFacing, 
            width: { ideal: 640 }, 
            height: { ideal: 480 } 
          }
        });
        streamRef.current = stream;
        setIsSimulatedCamera(false);
        setIsCameraActive(true);
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Direct video play caught:', e));
        }
      } else {
        throw new Error('Kamera haipatikani kwenye kifaa hiki');
      }
    } catch (err: any) {
      console.warn('Camera failed or denied, activating simulated camera:', err);
      setIsSimulatedCamera(true);
      setIsCameraActive(true);
    }
  };

  const toggleFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (!isSimulatedCamera) {
      await startCamera(nextMode);
    }
  };

  const toggleSimulatedCamera = async () => {
    if (isSimulatedCamera) {
      await startCamera();
    } else {
      stopCamera();
      setIsSimulatedCamera(true);
      setIsCameraActive(true);
      setCameraError(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Trigger Biometric Scan in "Tambua kwa Uso" tab
  const triggerBiometricScan = (candidateOverrideIndex?: number) => {
    setIsFaceScanning(true);
    setFaceRecognitionResult(null);

    setTimeout(() => {
      const known = getAllKnownAccounts();
      const enrolled = known.filter(a => a.user.isBiometricEnrolled);
      const targetIndex = typeof candidateOverrideIndex === 'number' 
        ? candidateOverrideIndex % enrolled.length 
        : scanCandidateIndex % enrolled.length;

      const candidate = enrolled[targetIndex] || enrolled[0];
      
      if (candidate) {
        const nidaRec = lookupNidaGateway(candidate.user.nationalIdNida);
        const tipsRec = lookupTipsSwitch(candidate.user.phoneNumber);
        
        setFaceRecognitionResult({
          recognized: true,
          matchType: 'FACE_BIOMETRIC',
          user: candidate.user,
          wallet: candidate.wallet,
          nidaRecord: nidaRec || undefined,
          tipsRecord: tipsRec || undefined,
          confidenceScore: 99.4,
          message: language === 'sw' 
            ? `Uso umetambuliwa kikamilifu! Mfumo umemtambua ${candidate.user.fullName} kupitia NIDA na TIPS.`
            : `Face recognized! Identified ${candidate.user.fullName} via NIDA & TIPS.`
        });
      }
      setIsFaceScanning(false);
    }, 1200);
  };

  // Switch demo face candidate to test recognizing different citizens
  const handleNextCandidate = () => {
    const known = getAllKnownAccounts();
    const enrolled = known.filter(a => a.user.isBiometricEnrolled);
    const nextIdx = (scanCandidateIndex + 1) % enrolled.length;
    setScanCandidateIndex(nextIdx);
    triggerBiometricScan(nextIdx);
  };

  // Capture face snapshot in registration
  const handleCaptureFace = () => {
    let base64 = '';
    if (isCameraActive && !isSimulatedCamera && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.9);
      }
    } else {
      base64 = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80';
    }

    setCapturedFaceUrl(base64);
    setFaceEnrolledSuccess(true);
    stopCamera();

    // Check if this captured face matches someone already registered
    const faceCheck = recognizeFaceFromCandidates({ faceImage: base64 });
    if (faceCheck.recognized && faceCheck.user) {
      setExistingDetectedUser(faceCheck);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setCapturedFaceUrl(result);
          setFaceEnrolledSuccess(true);
          // Check if matches known
          const faceCheck = recognizeFaceFromCandidates({ faceImage: result });
          if (faceCheck.recognized && faceCheck.user) {
            setExistingDetectedUser(faceCheck);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetFace = () => {
    setCapturedFaceUrl(null);
    setFaceEnrolledSuccess(false);
    startCamera();
  };

  // Verify NIDA with National Registry
  const handleVerifyNidaGateway = async () => {
    if (!regNida || regNida.length < 8) {
      setErrorMsg(language === 'sw' ? 'Tafadhali weka namba ya NIDA yenye tarakimu 20.' : 'Please enter valid 20-digit NIDA NIN.');
      return;
    }

    setNidaVerifyStatus({ loading: true, checked: false });
    setErrorMsg(null);

    try {
      const res = await apiClient.verifyNida(regNida, regPhone);
      setNidaVerifyStatus({
        loading: false,
        checked: true,
        record: res.nidaRecord,
        tipsRecord: res.tipsRecord
      });

      if (res.registeredInFacePay && res.user && res.wallet) {
        setExistingDetectedUser({
          recognized: true,
          matchType: 'NIDA_NIN',
          user: res.user,
          wallet: res.wallet,
          nidaRecord: res.nidaRecord,
          tipsRecord: res.tipsRecord,
          confidenceScore: 99.8,
          message: `Mtumiaji mwenye NIDA hii (${res.user.fullName}) tayari amesajiliwa kwenye FacePay!`
        });
      } else if (res.nidaRecord && !regName) {
        // Autofill name from NIDA registry
        if (res.nidaRecord.fullName && !res.nidaRecord.fullName.includes('Live Query')) {
          setRegName(res.nidaRecord.fullName);
        }
      }
    } catch {
      setNidaVerifyStatus({ loading: false, checked: true });
    }
  };

  // Direct login for recognized user
  const handleLoginAsRecognized = async (targetUser: UserProfile, targetWallet: Wallet) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.login({
        phoneNumber: targetUser.phoneNumber,
        pin: '1234'
      });
      setSuccessMsg(
        language === 'sw' 
          ? `Umetambuliwa na kuingia kikamilifu kama ${res.user.fullName}!` 
          : `Authenticated as ${res.user.fullName}!`
      );
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 500);
    } catch {
      // Direct success with recognized user
      setSuccessMsg(language === 'sw' ? `Umeingia kama ${targetUser.fullName}` : `Logged in as ${targetUser.fullName}`);
      setTimeout(() => {
        onAuthSuccess(targetUser, targetWallet);
        onClose();
      }, 400);
    } finally {
      setLoading(false);
    }
  };

  // Handle standard Login (phone or NIDA + PIN)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let phoneToUse = loginPhoneOrNida.trim();
      
      // If user typed NIDA number, resolve to phone number
      const match = checkUserAlreadyRegistered({ nin: loginPhoneOrNida, phone: loginPhoneOrNida });
      if (match.recognized && match.user) {
        phoneToUse = match.user.phoneNumber;
      }

      const res = await apiClient.login({
        phoneNumber: phoneToUse,
        pin: loginPin || '1234'
      });

      setSuccessMsg(
        language === 'sw' 
          ? `Karibu tena, ${res.user.fullName}! Akaunti yako ya TIPS ipo tayari.` 
          : `Welcome back, ${res.user.fullName}!`
      );
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya kuingia. Hakikisha namba ya simu/NIDA na PIN ni sahihi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Uniqueness check before submitting:
    const check = checkUserAlreadyRegistered({
      nin: regNida,
      phone: regPhone,
      fullName: regName
    });

    if (check.recognized && check.user && check.wallet) {
      setExistingDetectedUser(check);
      setErrorMsg(
        language === 'sw'
          ? `Mtumiaji mwenye NIDA au namba hii ya simu tayari amesajiliwa kama ${check.user.fullName}! Bofya hapa chini kuingia moja kwa moja.`
          : `User with this NIDA or phone is already registered as ${check.user.fullName}! Click below to log in directly.`
      );
      return;
    }

    if (!capturedFaceUrl) {
      const proceedWithoutFace = window.confirm(
        language === 'sw'
          ? 'Hujaweka picha au skani ya uso! Bila kusajili uso, hutaweza kutumia FacePay kulipa madukani mpaka utakapoweka uso. Je, unataka kuendelea?'
          : 'You have not captured your face! FacePay payments require an enrolled face. Continue anyway?'
      );
      if (!proceedWithoutFace) return;
    }

    setLoading(true);
    try {
      const res = await apiClient.register({
        fullName: regName.trim(),
        phoneNumber: regPhone.trim(),
        nationalIdNida: regNida.trim(),
        linkedRail: regRail,
        pin: regPin || '1234',
        faceAvatarUrl: capturedFaceUrl || undefined
      });

      setSuccessMsg(
        language === 'sw' 
          ? (capturedFaceUrl ? 'Usajili na Biometria ya Uso imekamilika kikamilifu!' : 'Akaunti imesajiliwa! (Kumbuka kusajili uso)') 
          : 'Registration completed successfully!'
      );

      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 700);
    } catch (err: any) {
      if (err.alreadyRegistered && err.existingUser && err.existingWallet) {
        setExistingDetectedUser({
          recognized: true,
          matchType: 'NIDA_NIN',
          user: err.existingUser,
          wallet: err.existingWallet,
          nidaRecord: err.nidaRecord,
          tipsRecord: err.tipsRecord,
          confidenceScore: 99.8,
          message: err.message
        });
      }
      setErrorMsg(err.message || 'Hitilafu ya kusajili');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.switchUser(userId);
      setSuccessMsg(language === 'sw' ? `Umeingia kama ${res.user.fullName}` : `Logged in as ${res.user.fullName}`);
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-700/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Hidden Canvas for Face Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {language === 'sw' ? 'Akaunti ya FacePay TZ' : 'FacePay TZ Account'}
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  NIDA & TIPS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {language === 'sw' ? 'Mifumo ya NIDA, TIPS & Usajili wa Uso' : 'National ID (NIDA), TIPS & Face Enrollment'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tabs: TAMBUA KWA USO | INGIA | JISAJILI */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-2 sm:px-4 shrink-0 overflow-x-auto scrollbar-none">
          <button
            id="auth-tab-face-recognize"
            type="button"
            onClick={() => {
              setTab('FACE_RECOGNIZE');
              startCamera();
              triggerBiometricScan();
            }}
            className={`py-3 px-3 sm:px-4 text-xs font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'FACE_RECOGNIZE'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Tambua kwa Uso' : 'Face ID Login'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="auth-tab-login"
            type="button"
            onClick={() => {
              stopCamera();
              setTab('LOGIN');
            }}
            className={`py-3 px-3 sm:px-4 text-xs font-bold transition-all relative whitespace-nowrap ${
              tab === 'LOGIN'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Ingia (PIN/Simu)' : 'Sign In'}
          </button>

          <button
            id="auth-tab-register"
            type="button"
            onClick={() => {
              setTab('REGISTER');
              startCamera();
            }}
            className={`py-3 px-3 sm:px-4 text-xs font-bold transition-all relative whitespace-nowrap ${
              tab === 'REGISTER'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Jisajili + Weka Uso' : 'Register + Enroll Face'}
          </button>

          {isAuthenticated && (
            <button
              id="auth-tab-switch"
              type="button"
              onClick={() => {
                stopCamera();
                setTab('SWITCH');
              }}
              className={`py-3 px-3 sm:px-4 text-xs font-bold transition-all relative whitespace-nowrap ${
                tab === 'SWITCH'
                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'sw' ? 'Badili Mtumiaji' : 'Switch'}
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: TAMBUA KWA USO (BIOMETRIC FACE RECOGNITION LOGIN) */}
          {/* ======================================================== */}
          {tab === 'FACE_RECOGNIZE' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ScanFace className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'sw' ? 'Utambuzi wa Uso Halisi (Live Biometric Recognition)' : 'Live Biometric Face Recognition'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {language === 'sw'
                      ? 'Kama ulishajisajili kwenye FacePay au NIDA/TIPS, mfumo utakutambua papo hapo.'
                      : 'If already registered in FacePay or NIDA/TIPS, system recognizes you instantly.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextCandidate}
                  title="Jaribu mtumiaji mwingine wa demo"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Demo Sura</span>
                </button>
              </div>

              {/* Camera Scanner Container */}
              <div className="relative mx-auto w-full max-w-[300px] h-64 rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/60 shadow-2xl flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    {!isSimulatedCamera ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
                        <img
                          src={getAllKnownAccounts().filter(a => a.user.isBiometricEnrolled)[scanCandidateIndex % 5]?.user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'}
                          alt="Face Recognition Feed"
                          className="w-full h-full object-cover filter contrast-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <FaceMeshOverlay
                      status={isFaceScanning ? 'SCANNING' : (faceRecognitionResult ? 'SUCCESS' : 'SCANNING')}
                      showBoundingBox={true}
                      showScanLine={true}
                      showLandmarkNodes={true}
                      showWireframe={true}
                      videoRef={!isSimulatedCamera ? videoRef : undefined}
                      isMirrored={facingMode === 'user'}
                      enablePoseControls={false}
                    />

                    {/* Live Status Pill */}
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>{isFaceScanning ? 'INATAMBUA NIDA...' : '3D FACEMESH READY'}</span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 mb-2">Kamera haijawashwa</p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Washa Kamera
                    </button>
                  </div>
                )}
              </div>

              {/* RECOGNITION RESULT CARD */}
              {faceRecognitionResult && faceRecognitionResult.user && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-xl shadow-emerald-950/80 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        {language === 'sw' ? 'Mtumiaji Ametambuliwa Kikamilifu!' : 'Citizen Recognized!'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700">
                      Match: 99.4%
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={faceRecognitionResult.user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                        alt={faceRecognitionResult.user.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {faceRecognitionResult.user.fullName}
                      </h4>
                      <p className="text-[11px] text-emerald-300 font-mono mt-0.5">
                        NIDA: {formatNida(faceRecognitionResult.user.nationalIdNida)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
                          TIPS: {faceRecognitionResult.wallet?.linkedRail || 'M_PESA'}
                        </span>
                        <span className="text-slate-400">
                          {faceRecognitionResult.user.phoneNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Salio preview */}
                  <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{language === 'sw' ? 'Salio la FacePay:' : 'FacePay Wallet Balance:'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatTZS(faceRecognitionResult.wallet?.balance || 345000)}
                    </span>
                  </div>

                  {/* ONE-CLICK LOGIN BUTTON */}
                  <button
                    id="login-as-recognized-btn"
                    type="button"
                    disabled={loading}
                    onClick={() => handleLoginAsRecognized(faceRecognitionResult.user!, faceRecognitionResult.wallet!)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    <span>
                      {language === 'sw' 
                        ? `Ingia Moja kwa Moja kama ${faceRecognitionResult.user.fullName.split(' ')[0]}` 
                        : `Sign In as ${faceRecognitionResult.user.fullName.split(' ')[0]}`}
                    </span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => triggerBiometricScan()}
                  disabled={isFaceScanning}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFaceScanning ? 'animate-spin' : ''}`} />
                  <span>{language === 'sw' ? 'Skani Upya' : 'Re-scan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setTab('REGISTER');
                    startCamera();
                  }}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  {language === 'sw' ? 'Hujaandikishwa? Jisajili hapa' : 'Not registered? Enroll face here'}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LOGIN (PHONE OR NIDA + PIN) */}
          {/* ======================================================== */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'sw' ? 'Namba ya Simu au Namba ya NIDA' : 'Phone Number or NIDA NIN'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-phone-input"
                    type="text"
                    required
                    value={loginPhoneOrNida}
                    onChange={(e) => setLoginPhoneOrNida(e.target.value)}
                    placeholder="0754... au NIDA 19920815..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Citizen detected preview while typing */}
              {recognizedLoginUser && recognizedLoginUser.user && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={recognizedLoginUser.user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{recognizedLoginUser.user.fullName}</p>
                      <p className="text-[10px] text-emerald-300 font-mono">TIPS: {recognizedLoginUser.wallet?.linkedRail} • NIDA Verified</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-bold">
                    Imetambuliwa
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {language === 'sw' ? 'Nenosiri / PIN ya FacePay (Tarakimu 4)' : 'Security PIN (4 digits)'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Demo: 1234</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-pin-input"
                    type="password"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="•••• (1234)"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono tracking-widest focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{language === 'sw' ? 'Ingia Kwenye Akaunti' : 'Sign In to Account'}</span>
              </button>

              <div className="text-center pt-2 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTab('FACE_RECOGNIZE');
                    startCamera();
                  }}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Tumia Utambuzi wa Uso' : 'Use Face Recognition'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: REGISTER WITH BIOMETRICS, NIDA & TIPS RECOGNITION */}
          {/* ======================================================== */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* RECOGNITION BANNER: IF CITIZEN ALREADY EXISTS */}
              {existingDetectedUser && existingDetectedUser.user && existingDetectedUser.wallet && (
                <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 text-amber-200 space-y-2.5 shadow-xl animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{language === 'sw' ? 'Akaunti Tayari Ipo Kwenye Mifumo!' : 'User Already Registered!'}</span>
                  </div>
                  
                  <p className="text-xs text-white">
                    {language === 'sw' 
                      ? `Mtu mwenye taarifa hizi tayari amesajiliwa kama `
                      : `User with these credentials is registered as `}
                    <strong className="text-emerald-400">{existingDetectedUser.user.fullName}</strong>
                    {language === 'sw' ? ' na ana akaunti ya TIPS ya ' : ' with TIPS account '}
                    <strong className="text-amber-300">{existingDetectedUser.wallet.linkedRail}</strong>.
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLoginAsRecognized(existingDetectedUser.user!, existingDetectedUser.wallet!)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{language === 'sw' ? `Ingia kama ${existingDetectedUser.user.fullName.split(' ')[0]}` : `Log In Directly`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExistingDetectedUser(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {language === 'sw' ? 'Funga' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 1: BIOMETRIC FACE ENROLLMENT */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'sw' ? '1. Usajili wa Uso (Face Enrollment) *' : '1. Enroll Your Face *'}
                    </span>
                  </div>
                  {faceEnrolledSuccess ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{language === 'sw' ? 'USO UMEHIFADHIWA' : 'ENROLLED'}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      {language === 'sw' ? 'UTAMBUZI WA NIDA' : 'BIOMETRIC'}
                    </span>
                  )}
                </div>

                {!capturedFaceUrl ? (
                  <div className="space-y-3">
                    {/* Live Camera View with Real-Time FaceMeshOverlay */}
                    <div className="relative mx-auto w-full max-w-[280px] h-52 sm:h-60 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                      {isCameraActive ? (
                        <>
                          {!isSimulatedCamera ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
                              <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
                                alt="Simulated Face Feed"
                                className="w-full h-full object-cover filter contrast-105"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <FaceMeshOverlay
                            status="SCANNING"
                            showBoundingBox={true}
                            showScanLine={true}
                            showLandmarkNodes={true}
                            showWireframe={true}
                            videoRef={!isSimulatedCamera ? videoRef : undefined}
                            isMirrored={facingMode === 'user'}
                            enablePoseControls={false}
                          />

                          <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                            NIDA 3D MESH
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Camera className="w-10 h-10 text-slate-500 mb-2" />
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                          >
                            Washa Kamera Halisi
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {isCameraActive && (
                        <button
                          id="capture-face-reg-btn"
                          type="button"
                          onClick={handleCaptureFace}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <ScanFace className="w-4 h-4" />
                          <span>{language === 'sw' ? 'Piga Picha & Hakiki Uso' : 'Capture & Verify'}</span>
                        </button>
                      )}

                      <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{language === 'sw' ? 'Pakia Picha' : 'Upload'}</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      {isCameraActive && (
                        <button
                          type="button"
                          onClick={toggleSimulatedCamera}
                          className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[11px] text-amber-300 font-medium transition-all border border-slate-700"
                        >
                          {isSimulatedCamera ? 'Kamera Halisi' : 'Kamera ya Majaribio'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                    <img
                      src={capturedFaceUrl}
                      alt="Captured Face"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-white">
                        {language === 'sw' ? 'Alama za Uso Zimesajiliwa' : 'Face Biometrics Registered'}
                      </h5>
                      <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                        Alama za 3D Mesh: Imethibitishwa
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFace}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      title="Piga upya"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: CITIZEN NIDA & TIPS FIELDS */}
              <div className="space-y-3">
                {/* NIDA Input with Instant Verification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      {language === 'sw' ? 'Namba ya NIDA (Kitambulisho cha Taifa)' : 'NIDA NIN (20 Digits)'}
                    </label>
                    <button
                      type="button"
                      onClick={handleVerifyNidaGateway}
                      disabled={nidaVerifyStatus.loading}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      {nidaVerifyStatus.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      <span>{language === 'sw' ? 'Hakiki NIDA & TIPS' : 'Verify NIDA'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="reg-nida-input"
                      type="text"
                      required
                      value={regNida}
                      onChange={(e) => setRegNida(e.target.value)}
                      placeholder="19920815141020000324"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* NIDA Verification Pill */}
                  {nidaVerifyStatus.checked && nidaVerifyStatus.record && (
                    <div className="mt-1.5 p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                        <span>Imethibitishwa: {nidaVerifyStatus.record.fullName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{nidaVerifyStatus.record.nationality}</span>
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Jina Kamili' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-fullname-input"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Juma Selemani Mkwawa"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone & Rail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'sw' ? 'Namba ya Simu (TIPS)' : 'Phone (TIPS linked)'}
                    </label>
                    <input
                      id="reg-phone-input"
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+255 754 819 203"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'sw' ? 'Mtandao wa Malipo' : 'Payment Rail'}
                    </label>
                    <select
                      id="reg-rail-select"
                      value={regRail}
                      onChange={(e) => setRegRail(e.target.value as PaymentRail)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="M_PESA">Vodacom M-Pesa</option>
                      <option value="TIGO_PESA">Tigo Pesa</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                      <option value="HALOPESA">Halopesa</option>
                      <option value="CRDB_BANK">CRDB SimBanking</option>
                      <option value="NMB_BANK">NMB Mkononi</option>
                    </select>
                  </div>
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Weka PIN ya Usalama (Tarakimu 4)' : 'Security PIN (4 digits)'}
                  </label>
                  <input
                    id="reg-pin-input"
                    type="password"
                    maxLength={4}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono tracking-widest focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Starter balance bonus */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'sw' ? 'Salio la Kuanzia (Bonus Wallet):' : 'Starter wallet balance:'}</span>
                </div>
                <span className="font-mono font-bold text-white">TZS 250,000</span>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>
                  {language === 'sw' 
                    ? (capturedFaceUrl ? 'Kamilisha Usajili wa FacePay & NIDA' : 'Kamilisha Usajili (Bila Uso)') 
                    : 'Complete FacePay Registration'}
                </span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SWITCH DEMO ACCOUNTS */}
          {/* ======================================================== */}
          {isAuthenticated && tab === 'SWITCH' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {language === 'sw' 
                  ? 'Bofya mtumiaji yeyote hapa chini kuthibitisha utambuzi wa NIDA, TIPS na alama za uso:' 
                  : 'Click any user below to test biometric & NIDA recognition:'}
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {demoAccounts.map((acc) => {
                  const targetUser = acc.user || acc;
                  const isEnrolled = !!targetUser.faceAvatarUrl;
                  const isCurrent = currentUser?.id === targetUser.id;

                  return (
                    <button
                      key={targetUser.id}
                      type="button"
                      onClick={() => handleSwitchUser(targetUser.id)}
                      disabled={loading || isCurrent}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isCurrent
                          ? 'bg-emerald-950/60 border-emerald-500'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={targetUser.faceAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={targetUser.fullName}
                            className={`w-10 h-10 rounded-full object-cover border-2 ${
                              isEnrolled ? 'border-emerald-500' : 'border-amber-500'
                            }`}
                          />
                          {isEnrolled && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                              <Check className="w-2.5 h-2.5 text-slate-950" />
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{targetUser.fullName}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                                Wewe
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            NIDA: {formatNida(targetUser.nationalIdNida)}
                          </p>
                          <p className="text-[10px] text-emerald-400 mt-0.5">
                            {targetUser.phoneNumber} • {isEnrolled ? 'Uso Umesajiliwa' : 'Hajasajili Uso'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {acc.wallet?.currency || 'TZS'} {acc.wallet?.balance?.toLocaleString() || '345,000'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {acc.wallet?.linkedRail || 'TIPS'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
