import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  CreditCard, 
  Users, 
  Gift, 
  Radio,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { Language, ThemeMode } from '../types';

interface NotificationsSoundboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: ThemeMode;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'PAYMENT' | 'SPLIT' | 'REWARD' | 'SECURITY';
  read: boolean;
}

export const NotificationsSoundboxModal: React.FC<NotificationsSoundboxModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'SOUNDBOX'>('NOTIFICATIONS');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [soundboxMuted, setSoundboxMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [selectedPhrase, setSelectedPhrase] = useState(
    'TIPS: Malipo ya shilingi elfu ishirini na tano yamepokelewa kikamilifu kupitia FacePay biometriki!'
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Eleanor amelipa gawana ya bili',
      body: 'Eleanor amekamilisha malipo ya $29.00 kwa bili ya Orely Café kupitia FacePay.',
      time: 'Dakika 5 zilizopita',
      type: 'SPLIT',
      read: false
    },
    {
      id: 'notif-2',
      title: 'Pointi 150 za Gold Member zimeingizwa',
      body: 'Hongera! Umepata pointi 150 za uaminifu baada ya malipo ya chakula cha mchana.',
      time: 'Saa 1 iliyopita',
      type: 'REWARD',
      read: false
    },
    {
      id: 'notif-3',
      title: 'Muamala wa Netflix Umelipwa',
      body: 'Kiasi cha $22.99 kimelipwa kiotomatiki kwa usajili wa Netflix Global.',
      time: 'Leo 09:00 Asubuhi',
      type: 'PAYMENT',
      read: true
    },
    {
      id: 'notif-4',
      title: 'Ulinzi wa Kibiolojia Umeimarishwa',
      body: 'Utambuzi wa sura na 3D Liveness Detection umethibitishwa kwa mafanikio.',
      time: 'Jana 16:30',
      type: 'SECURITY',
      read: true
    }
  ]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Soundbox audio synthesizer using Web Audio API + SpeechSynthesis
  const playSoundboxAudio = (textToSpeak: string) => {
    if (soundboxMuted) return;

    try {
      // 1. Play BoT chime tone with Web Audio API
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(volume / 200, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }

      // 2. Play vocal message using SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = volume / 100;

        setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Audio playback not supported in iframe', e);
      setIsPlayingAudio(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md min-h-screen sm:min-h-0 sm:my-auto sm:rounded-3xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-inherit z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {language === 'sw' ? 'Arifa & Soundbox ya Sauti' : 'Live Notifications & Soundbox'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'sw' ? 'Arifa za TIPS na sauti ya kuthibitisha malipo' : 'BoT TIPS alerts & audio confirmation voice'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-1 flex gap-2">
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-[#543eed] text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {language === 'sw' ? 'Arifa (4)' : 'Notifications (4)'}
          </button>
          <button
            onClick={() => setActiveTab('SOUNDBOX')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SOUNDBOX'
                ? 'bg-[#543eed] text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {language === 'sw' ? 'Soundbox ya TIPS' : 'BoT TIPS Soundbox'}
          </button>
        </div>

        {/* TAB 1: NOTIFICATIONS LIST */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'sw' ? 'Hivi Karibuni' : 'Recent Updates'}
              </span>
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#543eed] hover:underline"
              >
                {language === 'sw' ? 'Soma Zote' : 'Mark all read'}
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !n.read 
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#543eed] flex items-center justify-center shrink-0 mt-0.5">
                      {n.type === 'SPLIT' && <Users className="w-4 h-4" />}
                      {n.type === 'REWARD' && <Gift className="w-4 h-4" />}
                      {n.type === 'PAYMENT' && <CreditCard className="w-4 h-4" />}
                      {n.type === 'SECURITY' && <ShieldCheck className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#543eed] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {n.body}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1.5 block">
                        {n.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SOUNDBOX SIMULATOR */}
        {activeTab === 'SOUNDBOX' && (
          <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-h-[75vh]">
            
            {/* 3D Soundbox Hardware Unit Graphic */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white border border-slate-800 shadow-2xl flex flex-col items-center relative overflow-hidden">
              
              {/* Speaker Grille Patterns */}
              <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center relative shadow-inner">
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-700">
                  <Radio className={`w-8 h-8 text-[#543eed] ${isPlayingAudio ? 'animate-pulse scale-110' : ''} transition-all`} />
                </div>
                {/* Audio Soundwaves Ring */}
                {isPlayingAudio && (
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-50" />
                )}
              </div>

              {/* Status LED & BoT Logo */}
              <div className="mt-3 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlayingAudio ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-mono text-xs tracking-wider uppercase font-bold text-slate-300">
                  BoT TIPS Soundbox 4G
                </span>
              </div>

              {/* Active Audio Wave Status */}
              <div className="mt-3 w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-[11px] text-emerald-400 font-mono font-medium">
                  {isPlayingAudio 
                    ? '🔊 Inatangaza sauti ya malipo...' 
                    : '📻 Kifaa kiko tayari kuthibitisha malipo kwa sauti'}
                </p>
              </div>

              {/* Play Audio Button */}
              <button
                id="test-soundbox-voice-btn"
                onClick={() => playSoundboxAudio(selectedPhrase)}
                disabled={isPlayingAudio}
                className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{language === 'sw' ? 'Jaribu Sauti ya Soundbox' : 'Test Soundbox Voice Alert'}</span>
              </button>

            </div>

            {/* Selectable Voice Phrases */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'sw' ? 'Chagua Ujumbe wa Sauti (Voice Phrases)' : 'Choose Soundbox Voice Prompt'}
              </span>

              <div className="space-y-2">
                {[
                  'TIPS: Malipo ya shilingi elfu ishirini na tano yamepokelewa kikamilifu kupitia FacePay biometriki!',
                  'TIPS: Bili ya Orely Café imelipwa na Eleanor! Asante sana.',
                  'TIPS: Muamala wako wa kununua luku umekamilika. Salio jipya limeongezwa.',
                  'TIPS: FacePay imethibitisha sura yako. Malipo yamepitishwa!'
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPhrase(phrase);
                      playSoundboxAudio(phrase);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${
                      selectedPhrase === phrase
                        ? 'border-[#543eed] bg-purple-50 dark:bg-purple-950/40 font-bold text-[#543eed]'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="line-clamp-2 leading-relaxed">{phrase}</span>
                    <Play className="w-3.5 h-3.5 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>{language === 'sw' ? 'Sauti ya Soundbox' : 'Speaker Volume'}</span>
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{volume}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#543eed] cursor-pointer"
              />
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 active:scale-98 transition-all"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
