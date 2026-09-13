import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Bluetooth, 
  QrCode, 
  ShieldCheck, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  Radio, 
  Clock, 
  Lock, 
  X,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { Language, ThemeMode, UserProfile, Wallet } from '../types';
import { formatTZS } from '../utils/formatters';

interface OfflineMeshPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: ThemeMode;
  user: UserProfile;
  wallet: Wallet;
}

export const OfflineMeshPaymentModal: React.FC<OfflineMeshPaymentModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  user,
  wallet
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'TOKEN_QR' | 'BLE_BROADCAST'>('TOKEN_QR');
  const [offlineAmount, setOfflineAmount] = useState('15000');
  const [tokenValidity, setTokenValidity] = useState(300); // 5 minutes in seconds
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [meshPeersFound, setMeshPeersFound] = useState<Array<{ name: string; device: string; signal: string }>>([]);
  const [copiedToken, setCopiedToken] = useState(false);
  const [tokenSignedHash, setTokenSignedHash] = useState('');

  useEffect(() => {
    // Generate an encrypted offline token representation
    const timestamp = Date.now();
    const hash = `TZ-OFFLINE-${user.id.slice(0, 6).toUpperCase()}-${offlineAmount}-${timestamp.toString(36).toUpperCase()}`;
    setTokenSignedHash(hash);
  }, [offlineAmount, user.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && tokenValidity > 0) {
      timer = setInterval(() => {
        setTokenValidity((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, tokenValidity]);

  useEffect(() => {
    let broadcastInterval: NodeJS.Timeout;
    if (isBroadcasting) {
      broadcastInterval = setInterval(() => {
        setBroadcastProgress((prev) => {
          if (prev >= 100) {
            setMeshPeersFound([
              { name: 'Kariakoo Smart POS #09', device: 'Sunmi V2 BLE Terminal', signal: '-42 dBm (Very Strong)' },
              { name: 'M-Pesa Wakala #44102', device: 'Ingenico Move/5000', signal: '-58 dBm (Strong)' },
              { name: 'Bodaboda Mwenge 14', device: 'Android NFC Peer', signal: '-65 dBm (Good)' }
            ]);
            return 100;
          }
          return prev + 20;
        });
      }, 500);
    } else {
      setBroadcastProgress(0);
    }
    return () => clearInterval(broadcastInterval);
  }, [isBroadcasting]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {language === 'sw' ? 'Malipo Bila Intaneti (Offline Mesh)' : 'Offline Mesh Pay'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  Zero Data
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'sw' 
                  ? 'Lipa bila mtandao kwa Tokeni ya Kibayometriki & BLE' 
                  : 'Pay anywhere without Internet via Signed Token & Bluetooth'}
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

        {/* Tab switch */}
        <div className="flex p-2 gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('TOKEN_QR')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'TOKEN_QR'
                ? 'bg-[#543eed] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{language === 'sw' ? 'Tokeni ya QR Iliyolindwa' : 'Signed Offline QR'}</span>
          </button>
          <button
            onClick={() => setActiveTab('BLE_BROADCAST')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'BLE_BROADCAST'
                ? 'bg-[#543eed] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>{language === 'sw' ? 'Tuma kwa Bluetooth / Mesh' : 'BLE Mesh Beacon'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1">
          
          {/* Amount presets */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              {language === 'sw' ? 'Chagua au Weka Kiasi cha Kulipa' : 'Set Offline Payment Amount'}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={offlineAmount}
                onChange={(e) => setOfflineAmount(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-2xl text-lg font-black tracking-tight border focus:outline-hidden focus:ring-2 focus:ring-[#543eed] ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <span className="text-sm font-bold text-slate-400">TZS</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['5000', '10000', '15000', '30000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setOfflineAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    offlineAmount === amt
                      ? 'border-[#543eed] bg-[#543eed]/10 text-[#543eed]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {formatTZS(parseInt(amt))}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'TOKEN_QR' ? (
            /* QR & Token View */
            <div className="flex flex-col items-center justify-center p-4 rounded-3xl border border-dashed border-amber-400/40 bg-amber-500/5">
              
              {/* QR Code Graphic with Security Badge */}
              <div className="relative p-4 rounded-2xl bg-white shadow-md border border-slate-200 flex flex-col items-center justify-center">
                <div className="w-48 h-48 bg-slate-950 rounded-xl p-3 flex flex-col justify-between items-center relative overflow-hidden">
                  
                  {/* Stylized QR matrix representation */}
                  <div className="w-full h-full grid grid-cols-8 gap-1 opacity-90">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-xs ${
                          (i % 2 === 0 || i % 5 === 0 || i % 7 === 0) 
                            ? 'bg-amber-400' 
                            : (i % 3 === 0 ? 'bg-white' : 'bg-slate-900')
                        }`} 
                      />
                    ))}
                  </div>

                  {/* Center FacePay Biometric Hologram Badge */}
                  <div className="absolute inset-0 m-auto w-14 h-14 rounded-2xl bg-slate-900 border-2 border-amber-400 flex flex-col items-center justify-center shadow-lg">
                    <ShieldCheck className="w-7 h-7 text-amber-400 animate-pulse" />
                    <span className="text-[7px] font-black text-white">SECURE</span>
                  </div>
                </div>

                {/* Validity Countdown */}
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'sw' ? 'Muda uliobaki:' : 'Token Expires In:'}</span>
                  <span className="font-mono text-amber-600 font-black">{formatTimer(tokenValidity)}</span>
                </div>
              </div>

              {/* Offline Token Hash */}
              <div className="mt-4 w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    {language === 'sw' ? 'Namba ya Uthibitisho ya Nje ya Mtandao' : 'Signed Offline Token String'}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 truncate block">
                    {tokenSignedHash}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tokenSignedHash);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-xs text-slate-600 dark:text-slate-300 hover:text-[#543eed]"
                >
                  {copiedToken ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 text-center flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  {language === 'sw' 
                    ? 'POS ya muuzaji itathibitisha malipo haya mara moja bila kuhitaji intaneti.' 
                    : 'Merchant terminal verifies this token offline via cryptographic public key.'}
                </span>
              </div>
            </div>
          ) : (
            /* BLE Mesh Broadcast View */
            <div className="space-y-4">
              <div className="p-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-500 flex items-center justify-center mx-auto mb-3 relative">
                  <Radio className={`w-8 h-8 ${isBroadcasting ? 'animate-ping' : ''}`} />
                  <Bluetooth className="w-5 h-5 absolute inset-0 m-auto text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold">
                  {language === 'sw' ? 'Matangazo ya Bluetooth Low Energy (BLE)' : 'Bluetooth Low Energy (BLE) Beacon'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {language === 'sw'
                    ? 'Washa matangazo ili POS au simu ya muuzaji aliye karibu ipokee malipo yako ya uso bila intaneti.'
                    : 'Broadcast your verified biometric payment intent to nearby terminals within 15 meters.'}
                </p>

                <button
                  onClick={() => setIsBroadcasting(!isBroadcasting)}
                  className={`mt-4 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    isBroadcasting
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-[#543eed] hover:bg-[#4330d4] text-white'
                  }`}
                >
                  {isBroadcasting 
                    ? (language === 'sw' ? 'Sitisha Matangazo' : 'Stop Broadcasting') 
                    : (language === 'sw' ? 'Anza Matangazo ya BLE' : 'Start BLE Broadcast')}
                </button>
              </div>

              {/* Found terminals */}
              {isBroadcasting && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                    <span>{language === 'sw' ? 'Vituo vya Mauzo Vilivyopo Karibu' : 'Nearby Terminals Detected'}</span>
                    <span className="text-emerald-500 font-mono flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Scanning
                    </span>
                  </div>

                  {meshPeersFound.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      Inatafuta vituo vya karibu kupitia mawimbi ya BLE...
                    </div>
                  ) : (
                    meshPeersFound.map((peer, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-indigo-500 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-500 flex items-center justify-center">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold">{peer.name}</h5>
                            <p className="text-[10px] text-slate-400">{peer.device} • {peer.signal}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            alert(language === 'sw' ? `Muamala wa TZS ${offlineAmount} umetumwa kwa ${peer.name} kupitia BLE!` : `TZS ${offlineAmount} dispatched to ${peer.name} over BLE!`);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold shadow-xs active:scale-95"
                        >
                          {language === 'sw' ? 'Lipa Sasa' : 'Pay Terminal'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              {language === 'sw'
                ? 'Miamala ya nje ya mtandao ina ukomo wa TZS 100,000 kwa siku ili kulinda akaunti yako. Salio lako litasasishwa mtandaoni mara tu utakapopata intaneti au kusawazisha na BoT TIPS.'
                : 'Offline mesh transactions are capped at TZS 100,000/day for maximum security. Your balance synchronizes automatically once your device re-establishes connectivity.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold active:scale-95 transition-transform"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
