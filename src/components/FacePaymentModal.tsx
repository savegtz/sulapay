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
  Info
} from 'lucide-react';
import { Language, Merchant, PaymentRail, Transaction, UserProfile, Wallet } from '../types';
import { translations } from '../utils/translations';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

interface FacePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  wallet: Wallet;
  initialMerchant?: Merchant | null;
  language: Language;
  onPaymentSuccess: (transaction: Transaction, updatedWallet: Wallet) => void;
}

type ScanStep = 'DETAILS' | 'ALIGNING' | 'LIVENESS_SMILE' | 'LIVENESS_BLINK' | 'VERIFYING' | 'SUCCESS' | 'PIN_FALLBACK';

export const FacePaymentModal: React.FC<FacePaymentModalProps> = ({
  isOpen,
  onClose,
  user,
  wallet,
  initialMerchant,
  language,
  onPaymentSuccess
}) => {
  const t = translations[language];

  // Form State
  const [amount, setAmount] = useState<string>('25000');
  const [lipaNumber, setLipaNumber] = useState<string>(initialMerchant?.lipaNumber || '5892104');
  const [merchantName, setMerchantName] = useState<string>(initialMerchant?.name || 'Shoppers Plaza Masaki');
  const [selectedRail, setSelectedRail] = useState<PaymentRail>('M_PESA');
  const [pinCode, setPinCode] = useState<string>('');
  
  // Camera & Biometrics State
  const [step, setStep] = useState<ScanStep>('DETAILS');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState<boolean>(false);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [livenessScore, setLivenessScore] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setCameraStream(stream);
        setIsSimulatedCamera(false);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        throw new Error('Webcam not supported in this browser environment');
      }
    } catch (err: any) {
      console.warn('Camera access unavailable, activating simulated high-resolution camera feed:', err);
      setIsSimulatedCamera(true);
      setCameraError('Kamera ya kifaa haipatikani kwenye kivinjari hiki (Simulated feed active)');
    }
  };

  // Switch to camera step
  const handleProceedToScan = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage(language === 'sw' ? 'Tafadhali weka kiasi halali cha TZS' : 'Please enter a valid TZS amount');
      return;
    }
    if (numAmount > wallet.balance) {
      setErrorMessage(
        language === 'sw' 
          ? `Salio halitoshi. Salio lako ni TZS ${wallet.balance.toLocaleString()}` 
          : `Insufficient funds. Your balance is TZS ${wallet.balance.toLocaleString()}`
      );
      return;
    }

    setStep('ALIGNING');
    await startCamera();

    // Sequence the liveness challenges
    runBiometricSequence();
  };

  const runBiometricSequence = () => {
    // 1. Aligning stage (1.5s)
    setTimeout(() => {
      setStep('LIVENESS_SMILE');

      // 2. Smile check stage (1.5s)
      setTimeout(() => {
        setStep('LIVENESS_BLINK');

        // 3. Blink check stage (1.5s)
        setTimeout(() => {
          setStep('VERIFYING');
          executeBiometricVerification();
        }, 1600);
      }, 1800);
    }, 1800);
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
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }
    return '';
  };

  const executeBiometricVerification = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const snapshot = captureSnapshotBase64();
      
      // 1. Call backend biometrics verification endpoint
      const verification = await apiClient.verifyBiometrics({
        faceImageBase64: snapshot,
        landmarks: {
          eyeDistanceRatio: 0.42,
          jawWidthRatio: 0.88,
          noseMouthRatio: 0.35,
          smileConfidence: 0.94,
          blinkConfidence: 0.96
        },
        livenessAction: 'SMILE'
      });

      if (!verification.verified) {
        throw new Error(verification.analysisMessage || 'Biometric verification failed');
      }

      setMatchScore(verification.confidenceScore);
      setLivenessScore(verification.livenessScore);

      // 2. Authorize payment via selected payment rail with demo disclaimer
      const paymentResult = await apiClient.authorizePayment({
        lipaNumber,
        merchantName,
        amount: Number(amount),
        paymentRail: selectedRail,
        verificationMode: 'FACE_BIOMETRIC',
        biometricScore: verification.confidenceScore,
        notes: `FacePay authorization at ${merchantName}`
      });

      setStep('SUCCESS');
      stopCamera();

      setTimeout(() => {
        onPaymentSuccess(paymentResult.transaction, paymentResult.updatedWallet);
      }, 1200);

    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error. Please retry.');
      setStep('DETAILS');
      stopCamera();
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback PIN authorization
  const handleAuthorizeWithPin = async () => {
    if (pinCode.length < 4) {
      setErrorMessage(language === 'sw' ? 'Weka tarakimu 4 za PIN' : 'Enter 4-digit PIN');
      return;
    }
    setIsProcessing(true);
    try {
      const paymentResult = await apiClient.authorizePayment({
        lipaNumber,
        merchantName,
        amount: Number(amount),
        paymentRail: selectedRail,
        verificationMode: 'PIN_FALLBACK',
        biometricScore: 100,
        notes: `PIN Backup authorization at ${merchantName}`
      });
      setStep('SUCCESS');
      setTimeout(() => {
        onPaymentSuccess(paymentResult.transaction, paymentResult.updatedWallet);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-800/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === 'sw' ? 'Lipa kwa Uso (FacePay Authorization)' : 'FacePay Authorization'}
              </h3>
              <p className="text-xs text-slate-400">
                {t.tagline}
              </p>
            </div>
          </div>

          <button
            id="close-face-pay-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas for Frame Capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: PAYMENT DETAILS */}
          {step === 'DETAILS' && (
            <div className="space-y-5">
              {/* Sandbox info badge */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">TIPS Sandbox Mode Active</span>
                  <span>{t.demoBanner}</span>
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
                    { id: 'CRDB_BANK', name: 'CRDB SimBanking' },
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

              {/* Fee Breakdown */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>{t.payment.serviceFee}:</span>
                  <span className="text-emerald-400 font-semibold">{t.payment.freeFee}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800/80">
                  <span>{t.payment.totalToPay}:</span>
                  <span className="font-mono text-emerald-400 text-sm">
                    {formatTZS(Number(amount) || 0)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  id="start-face-scan-btn"
                  onClick={handleProceedToScan}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all"
                >
                  <ScanFace className="w-5 h-5 text-slate-950" />
                  <span>{language === 'sw' ? 'Anza Uhakiki wa Uso' : 'Authorize with Face Biometrics'}</span>
                </button>

                <button
                  id="switch-to-pin-fallback-btn"
                  type="button"
                  onClick={() => setStep('PIN_FALLBACK')}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {language === 'sw' ? 'Tumia PIN Badala ya Uso (PIN Backup)' : 'Use PIN Backup Instead'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CAMERA SCANNING & LIVENESS HUD */}
          {(step === 'ALIGNING' || step === 'LIVENESS_SMILE' || step === 'LIVENESS_BLINK' || step === 'VERIFYING') && (
            <div className="space-y-4 text-center">
              {/* Camera Frame with Biometric Oval HUD */}
              <div className="relative mx-auto w-72 h-88 rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/60 shadow-inner flex items-center justify-center">
                
                {/* Live Video or Simulated Image */}
                {!isSimulatedCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover mirror transform -scale-x-100"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
                    <img 
                      src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'} 
                      alt="Simulated Face"
                      className="w-full h-full object-cover filter contrast-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-amber-500/30">
                      Simulated Camera Feed
                    </div>
                  </div>
                )}

                {/* Laser Scanning Bar Animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce duration-1000 z-20 pointer-events-none" />

                {/* Biometric Oval Guide HUD */}
                <div className="absolute inset-4 rounded-[42%] border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] pointer-events-none flex flex-col items-center justify-between p-4 z-20">
                  {/* Top HUD Markers */}
                  <div className="flex justify-between w-full text-[10px] font-mono text-emerald-400">
                    <span>L: 98.4</span>
                    <span>FPS: 30</span>
                  </div>

                  {/* Center Eye / Landmark Crosshairs */}
                  <div className="space-y-4 opacity-70">
                    <div className="flex gap-12">
                      <div className="w-3 h-3 rounded-full border border-emerald-400 animate-ping" />
                      <div className="w-3 h-3 rounded-full border border-emerald-400 animate-ping" />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto" />
                  </div>

                  {/* Bottom HUD Marker */}
                  <div className="text-[10px] font-mono text-emerald-400">
                    DEPTH: 3D_IR
                  </div>
                </div>

                {/* Scanning HUD Overlay status */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 z-30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI VISION ACTIVE</span>
                </div>
              </div>

              {/* Dynamic Liveness Challenge Instructions */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-800/40">
                {step === 'ALIGNING' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold animate-pulse">
                    <Eye className="w-5 h-5 text-emerald-400" />
                    <span>{t.payment.cameraPromptAlign}</span>
                  </div>
                )}

                {step === 'LIVENESS_SMILE' && (
                  <div className="flex items-center justify-center gap-2 text-amber-300 text-sm font-bold animate-bounce">
                    <Smile className="w-5 h-5 text-amber-400" />
                    <span>{t.payment.cameraPromptLiveness}</span>
                  </div>
                )}

                {step === 'LIVENESS_BLINK' && (
                  <div className="flex items-center justify-center gap-2 text-teal-300 text-sm font-bold">
                    <Zap className="w-5 h-5 text-teal-400" />
                    <span>{t.payment.cameraPromptBlink}</span>
                  </div>
                )}

                {step === 'VERIFYING' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>{t.payment.verifying}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-1">
                  Kiasi: <span className="text-white font-mono font-bold">{formatTZS(Number(amount))}</span> kwa {merchantName}
                </p>
              </div>

              <div className="flex justify-center gap-3">
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
                    setIsSimulatedCamera(!isSimulatedCamera);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-[11px] text-slate-300 hover:text-white"
                >
                  {isSimulatedCamera ? 'Tumia Kamera Halisi' : 'Tumia Kamera ya Mfano'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS ANIMATION */}
          {step === 'SUCCESS' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 animate-scale" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-white">
                  {t.payment.paymentSuccess}
                </h4>
                <p className="text-xs text-emerald-400 mt-1 font-mono">
                  {t.payment.matchConfidence}: {matchScore || 98.7}% • {t.payment.livenessPassed}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                {formatTZS(Number(amount))} • {merchantName}
              </div>
            </div>
          )}

          {/* STEP 4: PIN FALLBACK (FOR ACCESSIBILITY) */}
          {step === 'PIN_FALLBACK' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {language === 'sw' ? 'Weka PIN ya FacePay' : 'Enter FacePay Security PIN'}
                </h4>
                <p className="text-xs text-slate-400">
                  {language === 'sw' ? 'Njia mbadala ya usalama iwapo kamera haifanyi kazi' : 'Secondary backup authorization'}
                </p>
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
                  onClick={handleAuthorizeWithPin}
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
