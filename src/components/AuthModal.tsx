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
  RotateCcw
} from 'lucide-react';
import { Language, PaymentRail, UserProfile, Wallet } from '../types';
import { apiClient } from '../services/apiClient';
import { formatTZS, maskPhoneNumber } from '../utils/formatters';
import { FaceMeshOverlay } from './FaceMeshOverlay';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  currentWallet?: Wallet;
  language: Language;
  initialTab?: 'LOGIN' | 'REGISTER' | 'SWITCH';
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
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'SWITCH'>(
    !isAuthenticated && initialTab === 'SWITCH' ? 'LOGIN' : initialTab
  );
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState(isAuthenticated && currentUser?.phoneNumber ? currentUser.phoneNumber : '');
  const [loginPin, setLoginPin] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+255 7');
  const [regNida, setRegNida] = useState('');
  const [regRail, setRegRail] = useState<PaymentRail>('M_PESA');
  const [regPin, setRegPin] = useState('1234');
  
  // Biometric Face Enrollment state in registration
  const [enrollFaceMode, setEnrollFaceMode] = useState<'CAMERA' | 'UPLOAD' | 'NONE'>('CAMERA');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedFaceUrl, setCapturedFaceUrl] = useState<string | null>(null);
  const [faceEnrolledSuccess, setFaceEnrolledSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Demo users for quick switch
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        setTab(initialTab === 'REGISTER' ? 'REGISTER' : 'LOGIN');
        setLoginPhone('');
        setLoginPin('');
      } else {
        setTab(initialTab);
        if (currentUser?.phoneNumber) {
          setLoginPhone(currentUser.phoneNumber);
        }
      }
      loadDemoAccounts();
      setErrorMsg(null);
      setSuccessMsg(null);
    } else {
      stopCamera();
    }
  }, [isOpen, initialTab, currentUser, isAuthenticated]);

  const loadDemoAccounts = async () => {
    try {
      const res = await apiClient.getDemoUsers();
      if (res.users) setDemoAccounts(res.users);
    } catch (err) {
      console.warn('Could not load accounts list:', err);
    }
  };

  // Camera Management for Face Registration
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        throw new Error('Camera access not supported in this browser');
      }
    } catch (err: any) {
      console.warn('Camera failed:', err);
      setCameraError('Haikuweza kuwasha kamera. Unaweza kupakia picha au kuchagua picha ya majaribio.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture face snapshot from live video
  const handleCaptureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle mirror flip for realistic photo
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedFaceUrl(dataUrl);
        setFaceEnrolledSuccess(true);
        stopCamera();
      }
    } else {
      // Fallback sample face
      const sampleFace = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
      setCapturedFaceUrl(sampleFace);
      setFaceEnrolledSuccess(true);
      stopCamera();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.login({
        phoneNumber: loginPhone,
        pin: loginPin || '1234'
      });
      setSuccessMsg(language === 'sw' ? 'Umefanikiwa kuingia!' : 'Login successful!');
      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya kuingia');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // If user has not enrolled face, warn them explicitly
    if (!capturedFaceUrl) {
      const proceedWithoutFace = window.confirm(
        language === 'sw'
          ? 'Hujaweka picha/skani ya uso wako! Ukijisajili bila uso, HUTAWEZA kulipa kwa kutumia uso mpaka usajili uso. Je, unataka kuendelea?'
          : 'You have not scanned/uploaded your face! Without an enrolled face, you CANNOT use FacePay to pay until you register a face. Do you want to continue?'
      );
      if (!proceedWithoutFace) {
        return;
      }
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
          ? (capturedFaceUrl ? 'Usajili na Biometria ya Uso imekamilika kikamilifu!' : 'Akaunti imesajiliwa! (Kumbuka kusajili uso ili kulipa)') 
          : 'Registration completed successfully!'
      );

      setTimeout(() => {
        onAuthSuccess(res.user, res.wallet);
        onClose();
      }, 700);
    } catch (err: any) {
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
      }, 500);
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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <UserCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {language === 'sw' ? 'Akaunti ya FacePay TZ' : 'FacePay TZ Account'}
              </h3>
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

        {/* Top Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 shrink-0">
          <button
            id="auth-tab-login"
            type="button"
            onClick={() => {
              stopCamera();
              setTab('LOGIN');
            }}
            className={`py-3 px-4 text-xs font-bold transition-all relative ${
              tab === 'LOGIN'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Ingia (Login)' : 'Sign In'}
          </button>

          <button
            id="auth-tab-register"
            type="button"
            onClick={() => {
              setTab('REGISTER');
              startCamera();
            }}
            className={`py-3 px-4 text-xs font-bold transition-all relative ${
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
              className={`py-3 px-4 text-xs font-bold transition-all relative ${
                tab === 'SWITCH'
                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'sw' ? 'Badili Akaunti' : 'Switch User'}
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
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

          {/* TAB 1: LOGIN */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-phone-input"
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="+255 754 123 456"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'sw' ? 'Nenosiri / PIN ya FacePay (Tarakimu 4)' : 'Security PIN (4 digits)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-pin-input"
                    type="password"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="•••• (mfano: 1234)"
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('REGISTER');
                    startCamera();
                  }}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {language === 'sw' ? 'Huna akaunti? Jisajili na uweke uso hapa' : "Don't have an account? Register & enroll face here"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER WITH BIOMETRIC FACE ENROLLMENT */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* SECTION A: BIOMETRIC FACE ENROLLMENT (USER GOAL: "kwenye kujisajili naona hakuna optioni yakuweka uso") */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'sw' ? '1. Weka Uso Wako (Face Enrollment) *' : '1. Enroll Your Face *'}
                    </span>
                  </div>
                  {faceEnrolledSuccess ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{language === 'sw' ? 'USO UMEMALIZWA' : 'ENROLLED'}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      {language === 'sw' ? 'INAHITAJIKA KWA MALIPO' : 'REQUIRED FOR PAYMENT'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300">
                  {language === 'sw' 
                    ? 'Skani uso wako kwa kamera au pakia picha ili mfumo uhifadhi alama za kibiolojia (3D facial mesh) zitakazotumika kuthibitisha malipo yako.'
                    : 'Scan your face via camera or upload a photo to extract the 3D facial mesh signature for verifying payments.'}
                </p>

                {/* Face Capture Box */}
                {!capturedFaceUrl ? (
                  <div className="space-y-3">
                    {/* Live Camera View with Real-Time FaceMeshOverlay */}
                    <div className="relative mx-auto w-full max-w-[280px] h-52 sm:h-60 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                      {isCameraActive ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                          />
                          <FaceMeshOverlay
                            status="SCANNING"
                            showBoundingBox={true}
                            showScanLine={true}
                            showLandmarkNodes={true}
                            showWireframe={true}
                            videoRef={videoRef}
                            isMirrored={true}
                            enablePoseControls={false}
                          />
                          <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                            3D TRACKER ACTIVE
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Camera className="w-10 h-10 text-slate-500 mb-2" />
                          <p className="text-xs text-slate-400 mb-3">
                            {language === 'sw' ? 'Washa kamera kuskani uso kwa moja kwa moja' : 'Activate camera to scan face live'}
                          </p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{language === 'sw' ? 'Washa Kamera' : 'Turn On Camera'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Camera Capture & Upload Buttons */}
                    <div className="flex items-center justify-center gap-2">
                      {isCameraActive && (
                        <button
                          id="capture-face-reg-btn"
                          type="button"
                          onClick={handleCaptureFace}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <ScanFace className="w-4 h-4" />
                          <span>{language === 'sw' ? 'Piga Picha & Hifadhi Uso' : 'Capture & Save Face'}</span>
                        </button>
                      )}

                      <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{language === 'sw' ? 'Pakia Picha ya Uso' : 'Upload Face Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {cameraError && (
                      <p className="text-[11px] text-amber-400 text-center">{cameraError}</p>
                    )}
                  </div>
                ) : (
                  /* Captured Face Preview */
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                    <div className="relative">
                      <img
                        src={capturedFaceUrl}
                        alt="Captured Face"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5 shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-white">
                        {language === 'sw' ? 'Uso Umerekodiwa Kikamilifu' : 'Face Biometric Profile Ready'}
                      </h5>
                      <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                        Alama za 3D: 58 Nodes • Heatmap: OK
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'sw' ? 'Utaweza kulipa kwa uso mara moja ukimaliza kusajili.' : 'Ready for instant FacePay checkouts.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetFace}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                      title="Piga upya"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION B: USER DETAILS */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'sw' ? 'Jina Kamili (Kama lilivyo NIDA)' : 'Full Name (As on NIDA)'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-fullname-input"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Salum Said Mwinyi"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                    </label>
                    <input
                      id="reg-phone-input"
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+255 784 999 111"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'sw' ? 'Namba ya NIDA (Kitambulisho)' : 'NIDA NIN (20 digits)'}
                    </label>
                    <input
                      id="reg-nida-input"
                      type="text"
                      required
                      value={regNida}
                      onChange={(e) => setRegNida(e.target.value)}
                      placeholder="19940815141010000123"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'sw' ? 'Mtandao wa Malipo' : 'Linked Payment Rail'}
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'sw' ? 'Nenosiri / PIN (Tarakimu 4)' : 'Security PIN (4 digits)'}
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
              </div>

              {/* Starter balance notification */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'sw' ? 'Salio la kuanzia (Bonus Wallet):' : 'Starter wallet balance:'}</span>
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
                    ? (capturedFaceUrl ? 'Kamilisha Usajili wa FacePay' : 'Kamilisha Usajili (Bila Uso)') 
                    : 'Complete FacePay Registration'}
                </span>
              </button>
            </form>
          )}

          {/* TAB 3: SWITCH DEMO ACCOUNTS */}
          {isAuthenticated && tab === 'SWITCH' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {language === 'sw' 
                  ? 'Bofya mtumiaji hapa chini kujaribu tofauti kati ya mtumiaji aliyesajili uso na asiyesajili uso:' 
                  : 'Click any user below to test both registered and unregistered face scenarios:'}
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {demoAccounts.map((acc) => {
                  const isEnrolled = !!acc.faceAvatarUrl;
                  const isCurrent = currentUser?.id === acc.id;

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSwitchUser(acc.id)}
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
                            src={acc.faceAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={acc.fullName}
                            className={`w-10 h-10 rounded-full object-cover border-2 ${
                              isEnrolled ? 'border-emerald-500' : 'border-amber-500'
                            }`}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-slate-950 flex items-center justify-center ${
                            isEnrolled ? 'bg-emerald-400' : 'bg-amber-500'
                          }`} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{acc.fullName}</h4>
                            {isEnrolled ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                                USO UMESAJILIWA
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                                HAJASAJILI USO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{acc.phoneNumber}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">{acc.linkedRail}</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatTZS(acc.balance || 0)}
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
