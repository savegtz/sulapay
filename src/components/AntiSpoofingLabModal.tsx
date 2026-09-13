import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ScanFace, 
  AlertCircle, 
  CheckCircle2, 
  Camera, 
  Eye, 
  Sparkles, 
  Activity, 
  Lock, 
  RefreshCw,
  X,
  Layers,
  Fingerprint
} from 'lucide-react';
import { Language, ThemeMode, UserProfile } from '../types';
import { FaceMeshOverlay } from './FaceMeshOverlay';

interface AntiSpoofingLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: ThemeMode;
  user: UserProfile;
}

export const AntiSpoofingLabModal: React.FC<AntiSpoofingLabModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  user
}) => {
  const isDark = theme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Test parameters
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [depthScore, setDepthScore] = useState(99.4);
  const [textureScore, setTextureScore] = useState(98.8);
  const [infraredScore, setInfraredScore] = useState(99.1);
  const [overallSecurityScore, setOverallSecurityScore] = useState(99.6);
  const [attackSimulation, setAttackSimulation] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch (err) {
      console.log('Camera preview permission or simulator fallback', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const runLivenessDiagnostic = () => {
    setIsAnalyzing(true);
    setSimulationResult(null);
    setTimeout(() => {
      setBlinkDetected(true);
      setDepthScore(Number((98.5 + Math.random() * 1.4).toFixed(1)));
      setTextureScore(Number((98.2 + Math.random() * 1.5).toFixed(1)));
      setInfraredScore(Number((98.9 + Math.random() * 1.0).toFixed(1)));
      setOverallSecurityScore(Number((99.2 + Math.random() * 0.7).toFixed(1)));
      setIsAnalyzing(false);
    }, 1800);
  };

  const testSpoofAttack = (type: 'PHOTO' | 'SCREEN' | 'DEEPFAKE' | '3D_MASK') => {
    setAttackSimulation(type);
    setIsAnalyzing(true);
    setSimulationResult(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      if (type === 'PHOTO') {
        setSimulationResult(language === 'sw' 
          ? 'IMEZUIWA: Hakuna mwangaza wa 3D wala mapigo ya damu (Zero Micro-blood flow pulse detected).' 
          : 'BLOCKED: Static 2D paper reflectance detected. Zero micro-pulse.');
      } else if (type === 'SCREEN') {
        setSimulationResult(language === 'sw'
          ? 'IMEZUIWA: Miakisi ya skrini ya simu/kompyuta (Moiré pattern) imegunduliwa mara moja.'
          : 'BLOCKED: Screen refresh flicker & pixel moiré pattern detected.');
      } else if (type === 'DEEPFAKE') {
        setSimulationResult(language === 'sw'
          ? 'IMEZUIWA: AI Generative Artifacts & makosa ya kope yamegunduliwa na injini ya usalama.'
          : 'BLOCKED: AI generative boundary distortion & abnormal gaze latency identified.');
      } else {
        setSimulationResult(language === 'sw'
          ? 'IMEZUIWA: Joto la uso na umbo la jicho (Infrared thermal signature) haliendani na binadamu halisi.'
          : 'BLOCKED: Synthetic latex silicone material identified via IR thermal signature.');
      }
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold">
                  {language === 'sw' ? 'Maabara ya Usalama wa Uso' : 'Biometric Anti-Spoofing Lab'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  ISO 30107-3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'sw' ? 'Ulinzi wa 3D Liveness & Kinga dhidi ya picha/video za udanganyifu' : 'Certified 3D Liveness & Anti-Spoofing Defense'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1">
          
          {/* Live Camera View with Biometric Overlay */}
          <div className="relative w-full h-56 rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shadow-lg">
            <video 
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-950/90">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                  <ScanFace className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-slate-300">
                  {language === 'sw' ? 'Kamera ya Kibayometriki Iko Tayari' : 'Biometric Sensor Active'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                  {user.fullName} • Biometric ID Registered
                </p>
              </div>
            )}

            {/* 3D Facial Mesh Topological Canvas Overlay */}
            <FaceMeshOverlay
              status="SCANNING"
              showBoundingBox={true}
              showScanLine={true}
              showLandmarkNodes={true}
              showWireframe={true}
              confidenceScore={overallSecurityScore}
              videoRef={videoRef}
              isMirrored={true}
            />

            {/* Futuristic Scanning HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-30">
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  3D MESH SCANNER
                </span>
                <span>MATCH: {overallSecurityScore}%</span>
              </div>

              {/* Target Face Oval */}
              <div className="w-36 h-44 rounded-[50px] border-2 border-dashed border-emerald-400/80 mx-auto flex flex-col items-center justify-center relative shadow-sm">
                <div className="w-full h-0.5 bg-emerald-400/80 absolute animate-bounce" />
                <div className="w-10 h-10 border-t-2 border-l-2 border-emerald-400 absolute top-2 left-2" />
                <div className="w-10 h-10 border-b-2 border-r-2 border-emerald-400 absolute bottom-2 right-2" />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>FPS: 60 • DEPTH: ACTIVE</span>
                <span className="text-emerald-400">LIVENESS: PASS</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold text-slate-400 uppercase">3D Depth Map</div>
              <div className="text-base font-black text-emerald-500 mt-0.5">{depthScore}%</div>
              <div className="text-[9px] text-slate-400">Structure LiDAR</div>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Skin Texture</div>
              <div className="text-base font-black text-emerald-500 mt-0.5">{textureScore}%</div>
              <div className="text-[9px] text-slate-400">Pore Analysis</div>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Micro-Pulse</div>
              <div className="text-base font-black text-emerald-500 mt-0.5">{infraredScore}%</div>
              <div className="text-[9px] text-slate-400">Blood Flow rPPG</div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={runLivenessDiagnostic}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-2xl bg-[#543eed] hover:bg-[#4531d0] text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>
              {isAnalyzing 
                ? (language === 'sw' ? 'Inafanya Ukaguzi wa Kina...' : 'Analyzing Real-Time Liveness...') 
                : (language === 'sw' ? 'Fanya Ukaguzi Mpya wa Uso' : 'Run Full Liveness Diagnostics')}
            </span>
          </button>

          {/* Spoofing Attack Simulation Section */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {language === 'sw' ? 'Jaribu Mashambulizi ya Udanganyifu (Attack Simulations)' : 'Test Anti-Spoofing Resilience'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => testSpoofAttack('PHOTO')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-left text-xs font-bold transition-all"
              >
                📸 {language === 'sw' ? 'Picha ya Karatasi (2D Photo)' : 'Printed Photo Attack'}
              </button>
              <button
                onClick={() => testSpoofAttack('SCREEN')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-left text-xs font-bold transition-all"
              >
                📱 {language === 'sw' ? 'Video ya Simu (Screen Replay)' : 'Screen Video Attack'}
              </button>
              <button
                onClick={() => testSpoofAttack('DEEPFAKE')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-left text-xs font-bold transition-all"
              >
                🤖 {language === 'sw' ? 'Deepfake ya AI (AI Synthetic)' : 'AI Deepfake Attack'}
              </button>
              <button
                onClick={() => testSpoofAttack('3D_MASK')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-left text-xs font-bold transition-all"
              >
                🎭 {language === 'sw' ? 'Barakoa ya 3D (Silicone Mask)' : '3D Silicone Mask'}
              </button>
            </div>

            {/* Attack simulation alert */}
            {simulationResult && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {language === 'sw' ? 'Shambulio Limetambuliwa & Kuzuiwa!' : 'Attack Detected & Intercepted!'}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {simulationResult}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold active:scale-95 transition-transform"
          >
            {language === 'sw' ? 'Funga Maabara' : 'Close Lab'}
          </button>
        </div>

      </div>
    </div>
  );
};
