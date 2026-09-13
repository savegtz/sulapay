import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanFace, 
  X, 
  CheckCircle2, 
  Camera, 
  RefreshCw, 
  Smile, 
  ShieldCheck,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { translations } from '../utils/translations';
import { apiClient } from '../services/apiClient';
import { FaceMeshOverlay } from './FaceMeshOverlay';

interface BiometricEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  language: Language;
  onEnrollmentSuccess: (updatedUser: UserProfile) => void;
}

export const BiometricEnrollmentModal: React.FC<BiometricEnrollmentModalProps> = ({
  isOpen,
  onClose,
  user,
  language,
  onEnrollmentSuccess
}) => {
  const t = translations[language];
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [capturedFrames, setCapturedFrames] = useState<{ step1?: string; step2?: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [useSampleFaces, setUseSampleFaces] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && !isDone) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, isDone, useSampleFaces]);

  const startCamera = async () => {
    if (useSampleFaces) return;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera could not be started for enrollment, using sample capture:', err);
      setUseSampleFaces(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = () => {
    let base64 = '';
    if (videoRef.current && canvasRef.current && !useSampleFaces) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.85);
      }
    } else {
      base64 = user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
    }

    if (currentStep === 1) {
      setCapturedFrames(prev => ({ ...prev, step1: base64 }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCapturedFrames(prev => ({ ...prev, step2: base64 }));
      setCurrentStep(3);
      handleFinalizeEnrollment(base64);
    }
  };

  const handleFinalizeEnrollment = async (finalImage: string) => {
    setIsProcessing(true);
    try {
      const updatedUser = await apiClient.enrollBiometrics({
        faceAvatarUrl: finalImage
      });
      setIsDone(true);
      stopCamera();
      setTimeout(() => {
        onEnrollmentSuccess(updatedUser);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-800/40 rounded-3xl shadow-2xl shadow-emerald-950/90 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t.enrollment.title}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'sw' ? 'Mchakato wa Usajili wa NIDA & BOT' : 'NIDA & BOT Compliance Registration'}
              </p>
            </div>
          </div>

          <button
            id="close-enrollment-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Step Badges */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4">
            {[
              { step: 1, label: language === 'sw' ? '1. Mkao wa Mbele' : '1. Frontal' },
              { step: 2, label: language === 'sw' ? '2. Tabasamu' : '2. Smile' },
              { step: 3, label: language === 'sw' ? '3. Tokenization' : '3. Encrypt' },
            ].map(item => (
              <div
                key={item.step}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  currentStep === item.step
                    ? 'bg-emerald-500 text-slate-950'
                    : currentStep > item.step
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-950 text-slate-500'
                }`}
              >
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {!isDone ? (
            <div className="space-y-4 text-center">
              {/* Camera Preview Box */}
              <div className="relative mx-auto w-64 h-72 rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 flex items-center justify-center">
                {!useSampleFaces ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <img
                    src={user.faceAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                    alt="Sample Face"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* 3D Face Mesh Topological Overlay */}
                <FaceMeshOverlay
                  status="SCANNING"
                  showBoundingBox={true}
                  showScanLine={true}
                  showLandmarkNodes={true}
                  showWireframe={true}
                  confidenceScore={99.5}
                />

                <div className="absolute bottom-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono z-30">
                  {currentStep === 1 ? 'NEUTRAL POSE' : 'MICRO-SMILE LIVENESS'}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
                {currentStep === 1 && (
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.enrollment.step1Title}</h4>
                    <p className="text-slate-400 mt-1">{t.enrollment.step1Desc}</p>
                  </div>
                )}
                {currentStep === 2 && (
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm">{t.enrollment.step2Title}</h4>
                    <p className="text-slate-400 mt-1">{t.enrollment.step2Desc}</p>
                  </div>
                )}
                {currentStep === 3 && (
                  <div>
                    <h4 className="font-bold text-emerald-400 text-sm">{t.enrollment.step3Title}</h4>
                    <p className="text-slate-400 mt-1">{t.enrollment.step3Desc}</p>
                  </div>
                )}
              </div>

              {/* Capture Action */}
              <div className="flex gap-2.5">
                <button
                  id="capture-enrollment-step-btn"
                  onClick={captureFrame}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{currentStep === 1 ? t.enrollment.captureBtn : 'Nasa Tabasamu (Capture Smile)'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setUseSampleFaces(!useSampleFaces)}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {useSampleFaces ? 'Badili: Tumia Kamera Yangu' : 'Badili: Tumia Picha ya Mfano (Sample Image)'}
              </button>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {t.enrollment.enrollmentSuccess}
                </h4>
                <p className="text-xs text-emerald-400/80 font-mono mt-1">
                  NIDA ID: {user.nationalIdNida} • Biometric Token Generated
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
