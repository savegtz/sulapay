import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  Play, 
  Sparkles, 
  Wifi, 
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { Language } from '../types';
import { soundbox } from '../utils/soundboxAudio';
import { formatTZS } from '../utils/formatters';

interface SoundboxSpeakerProps {
  language: Language;
  lastAmount?: number;
  lastPayer?: string;
  lastRail?: string;
  onAnnounceTest?: () => void;
}

export const SoundboxSpeaker: React.FC<SoundboxSpeakerProps> = ({
  language,
  lastAmount = 15000,
  lastPayer = 'Juma Mkwawa',
  lastRail = 'Vodacom M-Pesa'
}) => {
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [recentAnnouncement, setRecentAnnouncement] = useState<string>(
    language === 'sw' 
      ? `M-Pesa: Umepokea ${formatTZS(lastAmount)} kutoka kwa ${lastPayer}`
      : `M-Pesa: Received ${formatTZS(lastAmount)} from ${lastPayer}`
  );

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundbox.setMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundbox.setVolume(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
      soundbox.setMuted(false);
    }
  };

  const handleTestSpeaker = async () => {
    setIsSpeaking(true);
    setRecentAnnouncement(
      language === 'sw'
        ? `${lastRail}: Umepokea ${formatTZS(lastAmount)} kutoka kwa ${lastPayer}`
        : `${lastRail}: Received ${formatTZS(lastAmount)} from ${lastPayer}`
    );

    await soundbox.announcePayment({
      amount: lastAmount,
      payerName: lastPayer,
      rail: lastRail,
      language: language
    });

    setTimeout(() => {
      setIsSpeaking(false);
    }, 3500);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-emerald-600/40 p-5 shadow-2xl shadow-emerald-950/40 space-y-4">
      {/* Soundbox hardware branding top */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-white font-mono">
                FACEPAY SOUNDBOX <span className="text-emerald-400">TZ</span>
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-800">
                PRO 4G/WIFI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {language === 'sw' ? 'Spika ya Sauti ya Uthibitisho wa Malipo' : 'Voice Payment Announcement Speaker'}
            </p>
          </div>
        </div>

        {/* LED Indicator Lights */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{isSpeaking ? 'SPEAKING' : 'READY'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-[10px] text-sky-400 font-mono">
            <Wifi className="w-3 h-3 text-sky-400" />
            <span>TIPS</span>
          </div>
        </div>
      </div>

      {/* Speaker Grill Simulation with animated sound waves */}
      <div className="relative h-20 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-center overflow-hidden px-4">
        {/* Honeycomb grid dots pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px]" />

        {/* Audio Equalizer Bars */}
        <div className="flex items-center gap-1.5 z-10">
          {[40, 65, 85, 100, 75, 90, 60, 45, 80, 95, 70, 50].map((heightPct, idx) => (
            <div
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                isSpeaking
                  ? 'bg-gradient-to-t from-emerald-500 to-teal-300 animate-pulse shadow-[0_0_8px_#10b981]'
                  : 'bg-slate-800'
              }`}
              style={{
                height: isSpeaking ? `${Math.max(12, heightPct * 0.55)}px` : '8px',
                animationDelay: `${idx * 0.08}s`
              }}
            />
          ))}
        </div>

        {/* Floating Center Voice Badge */}
        <div className="absolute bottom-1 text-[9px] font-mono text-emerald-400/80">
          Swahili Audio • BOT TIPS Real-Time Broadcast
        </div>
      </div>

      {/* Live Announcement Display Bar */}
      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate pr-2">
          <Volume2 className={`w-4 h-4 text-emerald-400 shrink-0 ${isSpeaking ? 'animate-bounce' : ''}`} />
          <span className="truncate text-white font-medium">{recentAnnouncement}</span>
        </div>
      </div>

      {/* Controls: Volume Slider, Mute, and Test Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Washa Sauti' : 'Zima Sauti'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 accent-emerald-500 cursor-pointer"
            />
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>

        {/* Test Speaker Button */}
        <button
          type="button"
          onClick={handleTestSpeaker}
          disabled={isSpeaking}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-98 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{language === 'sw' ? 'Pima Sauti ya Soundbox' : 'Test Soundbox Voice'}</span>
        </button>
      </div>
    </div>
  );
};
