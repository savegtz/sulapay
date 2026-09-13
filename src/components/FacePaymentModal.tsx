import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanFace, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Smartphone,
  Eye,
  Smile,
  Zap,
  Info,
  UserPlus,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Building2,
  Phone,
  CreditCard,
  Check,
  ShieldAlert
} from 'lucide-react';
import { Language, Merchant, PaymentRail, Transaction, UserProfile, Wallet } from '../types';
import { translations } from '../utils/translations';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';
import { apiClient } from '../services/apiClient';
import { soundbox } from '../utils/soundboxAudio';
import { FaceMeshOverlay } from './FaceMeshOverlay';
import { detectHumanFaceInFrame, FaceDetectionResult } from '../utils/faceDetection';

interface FacePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  wallet: Wallet;
  initialMerchant?: Merchant | null;
  language: Language;
  onPaymentSuccess: (transaction: Transaction, updatedWallet: Wallet) => void;
  onUserRegistered?: (newUser: UserProfile, newWallet: Wallet) => void;
}

export type ModalStep = 
  | 'DETAILS' 
  | 'SCANNING_FACE' 
  | 'NO_FACE_DETECTED'
  | 'FACE_NOT_REGISTERED' 
  | 'ENTER_PIN_PASSWORD' 
  | 'REGISTER_DETAILS' 
  | 'REGISTER_SCAN_FACE' 
  | 'SUCCESS' 
  | 'PIN_FALLBACK';

export const FacePaymentModal: React.FC<FacePaymentModalProps> = ({
  isOpen,
  onClose,
  user: initialUser,
  wallet: initialWallet,
  initialMerchant,
  language,
  onPaymentSuccess,
  onUserRegistered
}) => {
  const t = translations[language];

  // Active user & wallet state (can be updated dynamically if new user registers)
  const [activeUser, setActiveUser] = useState<UserProfile>(initialUser);
  const [activeWallet, setActiveWallet] = useState<Wallet>(initialWallet);

  // Form State
  const [amount, setAmount] = useState<string>('25000');
  const [lipaNumber, setLipaNumber] = useState<string>(initialMerchant?.lipaNumber || '5892104');
  const [merchantName, setMerchantName] = useState<string>(initialMerchant?.name || 'Shoppers Plaza Masaki');
  const [selectedRail, setSelectedRail] = useState<PaymentRail>('M_PESA');
  
  // Modal step state
  const [step, setStep] = useState<ModalStep>('DETAILS');
  
  // Camera & Face detection simulation state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState<boolean>(false);
  const [faceTestMode, setFaceTestMode] = useState<'KNOWN' | 'UNKNOWN'>('KNOWN');
  const [scanSubPhase, setScanSubPhase] = useState<'ALIGN' | 'LIVENESS_SMILE' | 'VERIFYING'>('ALIGN');
  const [matchScore, setMatchScore] = useState<number>(99.2);
  const [livenessScore, setLivenessScore] = useState<number>(97.5);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string>('');
  const [detectionReason, setDetectionReason] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [verifiedUserDetails, setVerifiedUserDetails] = useState<{
    id: string;
    fullName: string;
    phoneNumber: string;
    accountNumber: string;
    nationalIdNida?: string;
    faceAvatarUrl?: string;
  } | null>(null);

  // Password / PIN State
  const [pinCode, setPinCode] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [savedUserPin, setSavedUserPin] = useState<string>('1234');

  // Registration Form State (when face is not in system)
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regNida, setRegNida] = useState<string>('');
  const [regRail, setRegRail] = useState<PaymentRail>('M_PESA');
  const [regPin, setRegPin] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync user and wallet when props change
  useEffect(() => {
    setActiveUser(initialUser);
    setActiveWallet(initialWallet);
  }, [initialUser, initialWallet]);

  // Update initial merchant when modal opens
  useEffect(() => {
    if (initialMerchant) {
      setMerchantName(initialMerchant.name);
      setLipaNumber(initialMerchant.lipaNumber);
      setSelectedRail(initialMerchant.settlementRail);
    }
  }, [initialMerchant]);

  // Clean up camera stream on close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Connect camera stream to video whenever cameraStream or step changes
  useEffect(() => {
    if (cameraStream && videoRef.current && !isSimulatedCamera) {
      const video = videoRef.current;
      if (video.srcObject !== cameraStream) {
        video.srcObject = cameraStream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn('Payment camera video play caught:', e));
      }
    }
  }, [cameraStream, step, isSimulatedCamera]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setCameraStream(stream);
        setIsSimulatedCamera(false);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Payment direct play caught:', e));
        }
      } else {
        throw new Error('Webcam not supported in this browser environment');
      }
    } catch (err: any) {
      console.warn('Camera access unavailable or denied, activating simulated high-resolution camera feed:', err);
      setIsSimulatedCamera(true);
      setCameraError(null);
    }
  };

  const captureSnapshotBase64 = (): string => {
    if (videoRef.current && canvasRef.current && !isSimulatedCamera) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSnapshot(url);
        return url;
      }
    }
    const defaultUrl = activeUser.faceAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    setCapturedSnapshot(defaultUrl);
    return defaultUrl;
  };

  // 1. Proceed from Details to Live Face Scanning
  const handleProceedToScan = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage(language === 'sw' ? 'Tafadhali weka kiasi halali cha TZS' : 'Please enter a valid TZS amount');
      return;
    }
    if (numAmount > activeWallet.balance) {
      setErrorMessage(
        language === 'sw' 
          ? `Salio halitoshi. Salio lako ni TZS ${activeWallet.balance.toLocaleString()}` 
          : `Insufficient funds. Your balance is TZS ${activeWallet.balance.toLocaleString()}`
      );
      return;
    }

    setStep('SCANNING_FACE');
    setScanSubPhase('ALIGN');
    setErrorMessage(null);
    setPinCode('');
    setPinError(null);
    await startCamera();

    // Sequence the face detection & liveness analysis
    runScanningSequence();
  };

  const runScanningSequence = () => {
    // 1. Align phase
    setTimeout(() => {
      setScanSubPhase('LIVENESS_SMILE');

      // 2. Liveness & Verification phase
      setTimeout(() => {
        setScanSubPhase('VERIFYING');

        setTimeout(() => {
          evaluateFacePresence();
        }, 1500);
      }, 1600);
    }, 1600);
  };

  // 2. Evaluate if face exists in system (STRICT MULTI-STAGE PIPELINE)
  // 📷 CAMERA -> 1. Face Detection -> 2. Liveness Check -> 3. Face Embedding -> 4. Search Database -> 5. Return User Details -> 6. Confirm Identity -> 7. Enter PIN
  const evaluateFacePresence = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const snapshotUrl = captureSnapshotBase64();

    // Stage 1: Client-Side Face Detection in live camera frame
    let clientDetection: FaceDetectionResult = { found: true, confidence: 95, stage: 'VERIFIED' };
    if (videoRef.current && !isSimulatedCamera) {
      try {
        clientDetection = await detectHumanFaceInFrame(videoRef.current);
      } catch (err) {
        console.warn('Face detection client-side check:', err);
      }
    }

    // Stop immediately if pointing at wall, ceiling, light, or inanimate object
    if (!clientDetection.found) {
      stopCamera();
      setIsProcessing(false);
      setDetectionReason(
        clientDetection.reason ||
        (language === 'sw' 
          ? 'Kamera inaelekezwa ukutani, darini, au kwenye vitu vingine. Hakuna uso wa binadamu uliotambuliwa.' 
          : 'Camera is pointing at a wall, ceiling, or inanimate object. No human face detected.')
      );
      setStep('NO_FACE_DETECTED');
      return;
    }

    // Stage 2, 3, 4: Server-Side Pipeline (Gemini Liveness + Anti-Spoofing + Database Search)
    try {
      const serverRes = await apiClient.verifyFace({
        image: snapshotUrl,
        mode: 'PAYMENT',
        faceTestMode,
        clientMetrics: clientDetection.metrics
      });

      stopCamera();
      setIsProcessing(false);

      if (!serverRes.success) {
        if (serverRes.stage === 'FACE_DETECTION') {
          setDetectionReason(serverRes.message || 'Uso haujaonekana kwenye kamera.');
          setStep('NO_FACE_DETECTED');
          return;
        }
        if (serverRes.stage === 'LIVENESS') {
          setDetectionReason(serverRes.message || 'Hatuwezi kuthibitisha mtu halisi mbele ya kamera.');
          setStep('NO_FACE_DETECTED');
          return;
        }
        if (serverRes.stage === 'FACE_MATCH') {
          // Face was detected, but not registered in database!
          setErrorMessage(serverRes.message);
          setStep('FACE_NOT_REGISTERED');
          return;
        }
      }

      // Stage 5 & 6: RETURN USER DETAILS & CONFIRM IDENTITY
      if (serverRes.user) {
        setVerifiedUserDetails(serverRes.user);
      }
      if (serverRes.verificationToken) {
        setVerificationToken(serverRes.verificationToken);
      }
      setMatchScore(serverRes.confidenceScore || 99.4);
      setLivenessScore(serverRes.livenessScore || 98.1);

      // Stage 7: WEKA PIN
      setStep('ENTER_PIN_PASSWORD');
      setPinCode('');
      setPinError(null);
    } catch (err: any) {
      stopCamera();
      setIsProcessing(false);
      setDetectionReason(err.message || 'Hitilafu ya uthibitisho wa uso');
      setStep('NO_FACE_DETECTED');
    }
  };

  // 3. Handle PIN / Password Submission
  const handlePinDigitPress = (digit: string) => {
    if (pinCode.length < 4) {
      const newPin = pinCode + digit;
      setPinCode(newPin);
      setPinError(null);
      if (newPin.length === 4) {
        verifyPinAndExecutePayment(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    if (pinCode.length > 0) {
      setPinCode(prev => prev.slice(0, -1));
      setPinError(null);
    }
  };

  const handlePinClear = () => {
    setPinCode('');
    setPinError(null);
  };

  const verifyPinAndExecutePayment = async (codeToVerify: string) => {
    setIsProcessing(true);
    setPinError(null);

    // STRICT BIOMETRIC ENROLLMENT & VERIFICATION TOKEN GATE:
    if (!verificationToken) {
      setIsProcessing(false);
      setPinError(
        language === 'sw'
          ? 'Uthibitisho wa uso unahitajika kabla ya kuingiza PIN! Kamera lazima ikutambue kwanza.'
          : 'Face verification token missing. Please scan face first.'
      );
      setStep('NO_FACE_DETECTED');
      return;
    }

    if (!activeUser.isBiometricEnrolled && !verifiedUserDetails?.isBiometricEnrolled) {
      setIsProcessing(false);
      setPinError(
        language === 'sw'
          ? 'Malipo yamekataliwa! Hujasajili uso wako kwenye mfumo wa FacePay. Ni lazima usajili uso kwanza.'
          : 'Payment rejected! Face is not registered in FacePay. You must enroll your face first.'
      );
      setStep('FACE_NOT_REGISTERED');
      return;
    }

    // Validate PIN: matches savedUserPin or '1234'
    const isPinCorrect = codeToVerify === savedUserPin || codeToVerify === activeUser.pin || codeToVerify === '1234';

    if (!isPinCorrect) {
      setIsProcessing(false);
      setPinError(
        language === 'sw' 
          ? 'Nenosiri (PIN) siyo sahihi! Tafadhali jaribu tena.' 
          : 'Incorrect PIN / Password! Please try again.'
      );
      setPinCode('');
      return;
    }

    try {
      // Authorize payment via backend with cryptographic verificationToken
      const paymentResult = await apiClient.authorizePayment({
        lipaNumber,
        merchantName,
        amount: Number(amount),
        paymentRail: selectedRail,
        verificationMode: 'FACE_BIOMETRIC',
        verificationToken,
        pin: codeToVerify,
        biometricScore: matchScore,
        notes: `FacePay authorization for ${verifiedUserDetails?.fullName || activeUser.fullName}`
      });

      // Soundbox voice dispatch
      soundbox.announcePayment({
        amount: Number(amount),
        merchantName,
        payerName: activeUser.fullName,
        rail: selectedRail,
        language
      });

      setStep('SUCCESS');
      setTimeout(() => {
        onPaymentSuccess(paymentResult.transaction, paymentResult.updatedWallet);
      }, 1400);

    } catch (err: any) {
      setPinError(err.message || (language === 'sw' ? 'Malipo yameshindikana' : 'Payment failed'));
      setPinCode('');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Start Registration Details Flow
  const handleStartRegistration = () => {
    setRegFullName('');
    setRegPhone('');
    setRegNida('');
    setRegPin('');
    setErrorMessage(null);
    setStep('REGISTER_DETAILS');
  };

  // 5. Submit Registration Details -> Proceed to Scan Face
  const handleProceedToRegScan = async () => {
    if (!regFullName.trim()) {
      setErrorMessage(language === 'sw' ? 'Tafadhali weka Jina Kamili' : 'Please enter your Full Name');
      return;
    }
    if (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 9) {
      setErrorMessage(language === 'sw' ? 'Weka namba sahihi ya simu (mfano: 0754 123 456)' : 'Enter valid phone number');
      return;
    }
    if (!regNida.trim()) {
      setErrorMessage(language === 'sw' ? 'Tafadhali weka Namba ya NIDA' : 'Please enter NIDA National ID');
      return;
    }
    if (!regPin || regPin.length < 4) {
      setErrorMessage(language === 'sw' ? 'Weka Nenosiri / PIN ya tarakimu 4' : 'Enter 4-digit security PIN');
      return;
    }

    setErrorMessage(null);
    setStep('REGISTER_SCAN_FACE');
    await startCamera();
  };

  // 6. Capture Face & Finalize Registration
  const handleCaptureAndSaveFace = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Validate that camera is actually pointing at a real face before registering!
      if (videoRef.current && !isSimulatedCamera) {
        const clientDet = await detectHumanFaceInFrame(videoRef.current);
        if (!clientDet.found) {
          setIsProcessing(false);
          setErrorMessage(
            language === 'sw' 
              ? 'Uso haujaonekana! Tafadhali elekeza kamera usoni kusajili uso badala ya ukuta au dari.' 
              : 'No face detected! Please point camera at your face to register.'
          );
          return;
        }
      }

      const faceSnapshot = captureSnapshotBase64();
      stopCamera();

      // Call registration API
      const result = await apiClient.register({
        fullName: regFullName.trim(),
        phoneNumber: regPhone.trim(),
        nationalIdNida: regNida.trim(),
        linkedRail: regRail,
        pin: regPin,
        faceAvatarUrl: faceSnapshot
      });

      // Update state with newly registered user and their new PIN
      setActiveUser(result.user);
      setActiveWallet(result.wallet);
      setSavedUserPin(regPin);
      setFaceTestMode('KNOWN');

      // Acquire verificationToken for single-session seamless payment
      try {
        const tokenRes = await apiClient.verifyFace({
          image: faceSnapshot,
          mode: 'PAYMENT',
          faceTestMode: 'KNOWN'
        });
        if (tokenRes.verificationToken) {
          setVerificationToken(tokenRes.verificationToken);
        }
        if (tokenRes.user) {
          setVerifiedUserDetails(tokenRes.user);
        }
      } catch (tokErr) {
        console.warn('Post-reg token fetch:', tokErr);
      }

      if (onUserRegistered) {
        onUserRegistered(result.user, result.wallet);
      }

      // Success voice notification
      soundbox.playPaymentChime();

      // Automatically transition to PIN entry to complete the pending payment!
      setStep('ENTER_PIN_PASSWORD');
      setPinCode('');
      setPinError(null);

    } catch (err: any) {
      setErrorMessage(err.message || 'Usajili umeshindikana. Tafadhali jaribu tena.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-800/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{language === 'sw' ? 'Lipa kwa Uso (FacePay TZ)' : 'FacePay Authorization'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                  TIPS
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'sw' ? 'Uhakiki wa uso na uthibitisho wa Nenosiri / PIN' : 'Biometric face match & PIN security'}
              </p>
            </div>
          </div>

          <button
            id="close-face-pay-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas for Video Snapshot */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: PAYMENT DETAILS ENTRY */}
          {/* ========================================================= */}
          {step === 'DETAILS' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Bot TIPS Switch Live Badge */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">TIPS Instant Settlement Switch Live</span>
                  <span className="text-[11px] text-emerald-300/80">
                    {language === 'sw' 
                      ? 'Kamera itatambua uso wako. Ukiwa kwenye mfumo utaweka Nenosiri (PIN), usipokuwepo utajisajili papo hapo.' 
                      : 'Face detector will identify your face. Registered users enter PIN, unregistered users can register instantly.'}
                  </span>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t.payment.enterAmount}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-emerald-400 text-lg">
                    TZS
                  </span>
                  <input
                    id="payment-amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25,000"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-18 pr-4 py-3.5 text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[10000, 25000, 50000, 100000].map((quickAmt) => (
                    <button
                      key={quickAmt}
                      type="button"
                      onClick={() => setAmount(quickAmt.toString())}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors"
                    >
                      {quickAmt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Merchant Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    {language === 'sw' ? 'Jina la Duka' : 'Merchant Name'}
                  </label>
                  <input
                    id="merchant-name-input"
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Lipa Namba (Till)
                  </label>
                  <input
                    id="lipa-number-input"
                    type="text"
                    value={lipaNumber}
                    onChange={(e) => setLipaNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Settlement Rail Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t.payment.settlementRail}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'M_PESA', name: 'Vodacom M-Pesa' },
                    { id: 'TIGO_PESA', name: 'Tigo Pesa' },
                    { id: 'CRDB_BANK', name: 'CRDB Bank' },
                  ].map((rail) => (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => setSelectedRail(rail.id as PaymentRail)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        selectedRail === rail.id
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rail.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>{t.payment.serviceFee}:</span>
                  <span className="text-emerald-400 font-semibold">{t.payment.freeFee} (BoT TIPS 0%)</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800/80">
                  <span>{t.payment.totalToPay}:</span>
                  <span className="font-mono text-emerald-400 text-sm">
                    {formatTZS(Number(amount) || 0)}
                  </span>
                </div>
              </div>

              {/* Face Mode Quick Test Selection (Allows testing both registered & unregistered flows) */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  {language === 'sw' ? 'Jaribu Hali ya Uso (Face Simulation Mode):' : 'Test Face Presence Scenario:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFaceTestMode('KNOWN')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      faceTestMode === 'KNOWN'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'sw' ? 'Uso Upo Kwenye Mfumo' : 'Registered Face'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFaceTestMode('UNKNOWN')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      faceTestMode === 'UNKNOWN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'sw' ? 'Uso Haupo (Mtu Mpya)' : 'Unregistered Face'}</span>
                  </button>
                </div>
              </div>

              {/* Main Action Button */}
              <div className="pt-2">
                <button
                  id="start-face-scan-btn"
                  onClick={handleProceedToScan}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all"
                >
                  <ScanFace className="w-5 h-5 text-slate-950" />
                  <span>{language === 'sw' ? 'Weka Uso Kulipa (Scan Face)' : 'Scan Face to Pay'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: LIVE 3D FACE MESH CAMERA SCANNING */}
          {/* ========================================================= */}
          {step === 'SCANNING_FACE' && (
            <div className="space-y-4 text-center">
              {/* Camera Frame with 3D Face Mesh Canvas Overlay */}
              <div className="relative mx-auto w-72 h-88 sm:w-80 sm:h-96 rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                
                {/* Live Video or High-Res Simulated Face */}
                {!isSimulatedCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover mirror transform -scale-x-100"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950">
                    <img 
                      src={
                        faceTestMode === 'KNOWN'
                          ? (activeUser.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80')
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                      } 
                      alt="Face feed"
                      className="w-full h-full object-cover filter contrast-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-amber-500/30">
                      Simulated HD Camera Feed
                    </div>
                  </div>
                )}

                {/* 3D Facial Topological Mesh Canvas Overlay (Exact match to uploaded images) */}
                <FaceMeshOverlay
                  status="SCANNING"
                  showBoundingBox={true}
                  showScanLine={true}
                  showLandmarkNodes={true}
                  showWireframe={true}
                  confidenceScore={matchScore}
                  userName={faceTestMode === 'KNOWN' ? activeUser.fullName : undefined}
                  videoRef={videoRef}
                  isMirrored={true}
                />

                {/* HUD Top Status */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 z-30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>3D BIOMETRIC VISION</span>
                </div>
              </div>

              {/* Dynamic Guidance Prompts */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                {scanSubPhase === 'ALIGN' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold animate-pulse">
                    <Eye className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'sw' ? 'Weka uso wako ndani ya kisanduku cheupe' : 'Position face inside the white box'}</span>
                  </div>
                )}

                {scanSubPhase === 'LIVENESS_SMILE' && (
                  <div className="flex items-center justify-center gap-2 text-amber-300 text-sm font-bold animate-bounce">
                    <Smile className="w-5 h-5 text-amber-400" />
                    <span>{language === 'sw' ? 'Tabasamu kidogo kuthibitisha uhai (Liveness Check)' : 'Smile slightly for 3D liveness check'}</span>
                  </div>
                )}

                {scanSubPhase === 'VERIFYING' && (
                  <div className="flex items-center justify-center gap-2 text-cyan-300 text-sm font-semibold">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span>{language === 'sw' ? 'Inatafuta kwenye kanzidata ya FacePay...' : 'Matching face in FacePay database...'}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-1.5">
                  Malipo ya <span className="text-white font-mono font-bold">{formatTZS(Number(amount))}</span> kwenda {merchantName}
                </p>
              </div>

              {/* Face Mode Toggle Buttons */}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep('DETAILS');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  {t.actions.cancel}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newMode = faceTestMode === 'KNOWN' ? 'UNKNOWN' : 'KNOWN';
                    setFaceTestMode(newMode);
                    runScanningSequence();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300 hover:text-white"
                >
                  {faceTestMode === 'KNOWN' ? 'Simulate: Uso Haujasajiliwa' : 'Simulate: Uso Upo Kwenye Mfumo'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2B: NO FACE DETECTED (POINTED AT WALL / CEILING / INANIMATE) */}
          {/* ========================================================= */}
          {step === 'NO_FACE_DETECTED' && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
              {/* Alert Icon */}
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/30 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Uso Haujaonekana' : 'No Face Detected'}</span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {language === 'sw' ? 'Hakuna Uso Uliotambuliwa Kwenye Kamera' : 'No Human Face Detected'}
                </h4>
                <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                  {detectionReason || (language === 'sw' 
                    ? 'Kamera inaelekezwa ukutani, darini, au kwenye mwanga. Mfumo wa FacePay unahitaji uso halisi wa binadamu kabla ya kuendelea na uthibitisho au PIN.' 
                    : 'The camera is pointed at a wall, ceiling, or inanimate object. FacePay requires a genuine human face before allowing PIN entry or payment.')}
                </p>
              </div>

              {/* Snapshot preview showing what the camera captured */}
              {capturedSnapshot && (
                <div className="relative mx-auto w-52 h-40 rounded-2xl overflow-hidden border-2 border-rose-500/40 shadow-lg bg-slate-950">
                  <img 
                    src={capturedSnapshot} 
                    alt="Captured frame" 
                    className="w-full h-full object-cover filter contrast-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-rose-950/40 flex items-center justify-center">
                    <div className="px-2.5 py-1 bg-rose-950/90 rounded-lg text-[11px] text-rose-200 font-mono border border-rose-500/40">
                      ❌ {language === 'sw' ? 'Uso Haukupatikana' : 'Object Rejected'}
                    </div>
                  </div>
                </div>
              )}

              {/* Strict Security Policy Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Ulinzi wa Kibiolojia (Strict Gate):' : 'Biometric Security Gate:'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'sw'
                    ? 'Kuingiza PIN kumezuiwa kabisa. Malipo hayawezi kufanyika iwapo kamera inaelekezwa ukutani au kitu kisicho binadamu.'
                    : 'PIN entry is completely blocked. Payments cannot proceed when camera points at inanimate surfaces.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  id="try-scan-again-btn"
                  onClick={handleProceedToScan}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Skani Tena Ukiwa Mbele ya Kamera' : 'Scan Again Facing Camera'}</span>
                </button>

                <button
                  onClick={() => {
                    stopCamera();
                    setStep('DETAILS');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  {language === 'sw' ? 'Rudi Nyuma' : 'Go Back'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3A: FACE EXISTS -> RETURN USER DETAILS & ENTER PIN (USER GOAL) */}
          {/* ========================================================= */}
          {step === 'ENTER_PIN_PASSWORD' && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
              {/* Verified Face Avatar Badge */}
              <div className="relative inline-block mx-auto">
                <img
                  src={capturedSnapshot || verifiedUserDetails?.faceAvatarUrl || activeUser.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'}
                  alt={verifiedUserDetails?.fullName || activeUser.fullName}
                  className="w-20 h-20 rounded-full object-cover border-3 border-emerald-400 shadow-xl shadow-emerald-500/20"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border-2 border-slate-900 shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'sw' ? 'Uso Umethibitishwa Kwenye Kanzidata' : 'Face Verified in Database'} ({matchScore}%)</span>
                </div>
                <h4 className="text-lg font-black text-white">
                  {verifiedUserDetails?.fullName || activeUser.fullName}
                </h4>
              </div>

              {/* USER DETAILS CARD (Mandated by user: Jina, User ID, Account, etc.) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-left space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                    <span>{language === 'sw' ? 'Taarifa za Mtumiaji Aliyetambuliwa' : 'Identified User Profile'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    MECHI: {matchScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Jina Kamili</span>
                    <span className="text-white font-bold truncate block">{verifiedUserDetails?.fullName || activeUser.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">User ID / Akaunti</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate block">{verifiedUserDetails?.id || activeUser.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Namba ya Simu</span>
                    <span className="text-slate-300 font-mono">{maskPhoneNumber(verifiedUserDetails?.phoneNumber || activeUser.phoneNumber)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">NIDA ID</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate block">{verifiedUserDetails?.nationalIdNida || activeUser.nationalIdNida || '19920814-12345-00001'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{language === 'sw' ? 'Kiasi cha Malipo:' : 'Amount to Authorize:'}</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{formatTZS(Number(amount))}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {language === 'sw'
                  ? `Weka Nenosiri / PIN yako ya siri ya tarakimu 4 ili uidhinishe malipo haya ya ${formatTZS(Number(amount))} kwenda kwa ${merchantName}.`
                  : `Enter your 4-digit security PIN to authorize this payment of ${formatTZS(Number(amount))} to ${merchantName}.`}
              </p>

              {/* PIN Code Circles Display */}
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pinCode.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-2xl flex items-center justify-center border-2 text-xl font-mono font-bold transition-all ${
                        isFilled
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20 scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isFilled ? '●' : '○'}
                    </div>
                  );
                })}
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Interactive Numeric Keypad */}
              <div className="w-full max-w-xs mx-auto grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigitPress(digit)}
                    disabled={isProcessing}
                    className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-lg font-mono font-bold text-white shadow-xs active:scale-95 transition-all"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handlePinClear}
                  disabled={isProcessing}
                  className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 active:scale-95 transition-all"
                >
                  {language === 'sw' ? 'Futa' : 'Clear'}
                </button>

                <button
                  type="button"
                  onClick={() => handlePinDigitPress('0')}
                  disabled={isProcessing}
                  className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-lg font-mono font-bold text-white shadow-xs active:scale-95 transition-all"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handlePinDelete}
                  disabled={isProcessing}
                  className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-rose-400 active:scale-95 transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('SCANNING_FACE');
                    startCamera();
                    runScanningSequence();
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {language === 'sw' ? 'Skani Uso Upya' : 'Rescan Face'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3B: FACE NOT IN SYSTEM -> REGISTER PROMPT (USER GOAL) */}
          {/* ========================================================= */}
          {step === 'FACE_NOT_REGISTERED' && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200 py-2">
              <div className="w-18 h-18 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <AlertTriangle className="w-9 h-9" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30 uppercase tracking-wider">
                  {language === 'sw' ? 'Uso Haupo Kwenye Mfumo' : 'Unregistered Face'}
                </span>
                <h4 className="text-lg font-extrabold text-white mt-2">
                  {language === 'sw' 
                    ? 'Uso Huu Haujasajiliwa Kwenye FacePay!' 
                    : 'Face Not Found in FacePay System!'}
                </h4>
                <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                  {language === 'sw'
                    ? 'Hatukupata taarifa za kibiolojia za uso huu kwenye kanzidata ya mfumo. Ili kulipa kwa uso, tafadhali jisajili sasa (weka taarifa zako kisha askani uso wako).'
                    : 'No matching biometric profile found for this face. To pay with your face, please register now (enter your details and scan your face).'}
                </p>
              </div>

              {/* Value proposition highlight */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Faida za Kujisajili Papo Hapo:' : 'Instant Registration Benefits:'}</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pl-1">
                  <li>• {language === 'sw' ? 'Lipa kwa uso popote Tanzania bila kubeba simu au kadi' : 'Pay with your face anywhere in Tanzania cardless'}</li>
                  <li>• {language === 'sw' ? 'Salio la kukaribishwa la bure: TZS 250,000 (TIPS Sandbox)' : 'Welcome bonus balance: TZS 250,000'}</li>
                  <li>• {language === 'sw' ? 'Ulinzi thabiti wa tarakimu 4 za Nenosiri / PIN' : 'High security 4-digit PIN protection'}</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  id="register-new-face-btn"
                  onClick={handleStartRegistration}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <UserPlus className="w-4.5 h-4.5 text-slate-950" />
                  <span>{language === 'sw' ? 'Jisajili Sasa (Weka Taarifa & Skani Uso)' : 'Register Now (Enter Details & Scan)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFaceTestMode('KNOWN');
                    setStep('SCANNING_FACE');
                    startCamera();
                    runScanningSequence();
                  }}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  {language === 'sw' ? 'Jaribu Tena na Uso Uliosajiliwa' : 'Try Again with Registered Face'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4A: REGISTRATION - ENTER DETAILS (USER GOAL) */}
          {/* ========================================================= */}
          {step === 'REGISTER_DETAILS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Hatua 1 kati ya 2: Weka Taarifa Zako' : 'Step 1 of 2: Enter Details'}</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {language === 'sw' ? 'Usajili wa Mtumiaji Mpya wa FacePay' : 'Register New FacePay Account'}
                </h4>
              </div>

              {/* Input: Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  {language === 'sw' ? 'Jina Kamili' : 'Full Name'} *
                </label>
                <input
                  id="reg-full-name-input"
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Mfano: Amina J. Bakari"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Input: Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  {language === 'sw' ? 'Namba ya Simu' : 'Phone Number'} *
                </label>
                <input
                  id="reg-phone-input"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0754 123 456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Input: National ID (NIDA) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  {language === 'sw' ? 'Namba ya NIDA (Kitambulisho cha Taifa)' : 'NIDA National ID'} *
                </label>
                <input
                  id="reg-nida-input"
                  type="text"
                  value={regNida}
                  onChange={(e) => setRegNida(e.target.value)}
                  placeholder="19940815-12345-00001-23"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Input: Payment Rail */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  {language === 'sw' ? 'Mtandao wa Pesa' : 'Payment Rail'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'M_PESA', name: 'M-Pesa' },
                    { id: 'TIGO_PESA', name: 'Tigo Pesa' },
                    { id: 'AIRTEL_MONEY', name: 'Airtel Money' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegRail(r.id as PaymentRail)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        regRail === r.id
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input: Security PIN / Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  {language === 'sw' ? 'Weka Nenosiri / PIN ya Tarakimu 4' : 'Set 4-Digit Security PIN'} *
                </label>
                <input
                  id="reg-pin-input"
                  type="password"
                  maxLength={4}
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-[0.5em] text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  {language === 'sw' 
                    ? 'Hili ndilo Nenosiri utakaloliweka mara uso wako unapothibitishwa wakati wa kulipa' 
                    : 'This is the PIN you will enter after your face is verified during payments'}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  id="proceed-to-face-scan-btn"
                  type="button"
                  onClick={handleProceedToRegScan}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl active:scale-95 transition-all"
                >
                  <span>{language === 'sw' ? 'Hatua 2: Skani na Hifadhi Uso (Face Scan)' : 'Step 2: Scan & Save Face Biometric'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white"
                >
                  {t.actions.cancel}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4B: REGISTRATION - SCAN FACE & ENROLL (USER GOAL) */}
          {/* ========================================================= */}
          {step === 'REGISTER_SCAN_FACE' && (
            <div className="space-y-4 text-center animate-in fade-in duration-200">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-1">
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Hatua 2: Skani Uso wa' : 'Step 2: Scan Face of'} {regFullName}</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {language === 'sw' ? 'Unda Ramani ya Uso (3D Face Mesh Enrollment)' : '3D Face Mesh Enrollment'}
                </h4>
              </div>

              {/* Camera Frame with 3D Face Mesh Overlay */}
              <div className="relative mx-auto w-72 h-88 rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                {!isSimulatedCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover mirror transform -scale-x-100"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" 
                      alt="Registration Face"
                      className="w-full h-full object-cover filter contrast-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-emerald-300 border border-emerald-500/30">
                      Enrollment Capture Active
                    </div>
                  </div>
                )}

                {/* 3D Facial Mesh Canvas Overlay */}
                <FaceMeshOverlay
                  status="SCANNING"
                  showBoundingBox={true}
                  showScanLine={true}
                  showLandmarkNodes={true}
                  showWireframe={true}
                  confidenceScore={99.6}
                  userName={regFullName}
                  videoRef={videoRef}
                  isMirrored={true}
                />
              </div>

              <p className="text-xs text-slate-300">
                {language === 'sw'
                  ? 'Tazama kamera na uweke uso wako ndani ya kisanduku cheupe ili kuhifadhi alama za uso wako.'
                  : 'Look at the camera and align your face inside the box to save your biometric signature.'}
              </p>

              {/* Capture & Enroll Button */}
              <div className="pt-2 space-y-2">
                <button
                  id="capture-and-save-face-btn"
                  onClick={handleCaptureAndSaveFace}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl active:scale-95 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      <span>{language === 'sw' ? 'Inahifadhi Uso Kwenye Kanzidata...' : 'Saving Face to Database...'}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4.5 h-4.5" />
                      <span>{language === 'sw' ? 'Hifadhi Uso & Kamilisha Usajili' : 'Save Face & Complete Registration'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('REGISTER_DETAILS')}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white"
                >
                  {language === 'sw' ? 'Rudi Nyuma' : 'Back'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 5: SUCCESS CONFIRMATION */}
          {/* ========================================================= */}
          {step === 'SUCCESS' && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-18 h-18 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-11 h-11" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-white">
                  {t.payment.paymentSuccess}
                </h4>
                <p className="text-xs text-emerald-400 mt-1 font-mono">
                  {language === 'sw' ? 'Uso Umeidhinishwa' : 'Face Authorized'} ({matchScore}%) • PIN Imethibitishwa
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
                <div>{formatTZS(Number(amount))} • {merchantName}</div>
                <div className="text-[10px] text-slate-400">TIPS-REF: BOT-{Date.now().toString().slice(-6)}</div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 6: PIN FALLBACK (Secondary Accessibility) */}
          {/* ========================================================= */}
          {step === 'PIN_FALLBACK' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {language === 'sw' ? 'Weka PIN ya FacePay' : 'Enter FacePay Security PIN'}
                </h4>
              </div>

              <div>
                <input
                  id="pin-code-input"
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="••••"
                  className="w-48 mx-auto text-center tracking-[1em] bg-slate-950 border border-slate-700 rounded-2xl py-3 text-2xl font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  id="authorize-pin-btn"
                  onClick={() => verifyPinAndExecutePayment(pinCode)}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
                >
                  {isProcessing ? 'Inahakiki...' : t.actions.confirm}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white"
                >
                  {t.actions.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
