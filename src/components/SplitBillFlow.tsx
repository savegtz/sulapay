import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  X, 
  Check, 
  Plus, 
  Clock, 
  ChevronRight, 
  Camera, 
  Receipt as ReceiptIcon, 
  Edit3, 
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Language, ThemeMode } from '../types';

export interface SplitItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  assignedFriendId?: string;
}

export interface SplitFriend {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isYou?: boolean;
}

export interface SplitBillData {
  id: string;
  billName: string;
  date: string;
  totalAmount: number;
  category: string;
  friends: SplitFriend[];
  items: SplitItem[];
  splitEqually: boolean;
  status: 'REQUESTED' | 'SETTLED' | 'CANCELLED';
}

interface SplitBillFlowProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: ThemeMode;
}

const DEFAULT_FRIENDS: SplitFriend[] = [
  {
    id: 'riko',
    name: 'Riko (You)',
    phone: '+62 899-1234-6789',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isYou: true
  },
  {
    id: 'eleanor',
    name: 'Eleanor',
    phone: '+230 4312 5541',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'robert',
    name: 'Robert Fox',
    phone: '+230 5412 1234',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'syifa',
    name: 'Syifa',
    phone: '+230 6351 2312',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

const INITIAL_ORELY_ITEMS: SplitItem[] = [
  { id: 'item-1', name: 'Double Shot Espresso', price: 29.00, qty: 1 },
  { id: 'item-2', name: 'Hot Latte', price: 32.00, qty: 1 },
  { id: 'item-3', name: 'Iced Cappuccino', price: 27.00, qty: 1 },
  { id: 'item-4', name: 'Blueberry Pie', price: 31.00, qty: 1 },
];

export const SplitBillFlow: React.FC<SplitBillFlowProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'light'
}) => {
  // Screens: 'HUB' | 'CREATE_FORM' | 'ADD_ITEMS' | 'ADD_FRIENDS' | 'DETAILS' | 'SUCCESS'
  const [currentScreen, setCurrentScreen] = useState<'HUB' | 'CREATE_FORM' | 'ADD_ITEMS' | 'ADD_FRIENDS' | 'DETAILS' | 'SUCCESS'>('HUB');

  // Form states
  const [billName, setBillName] = useState('Orely Café');
  const [category, setCategory] = useState('Food & Beverages');
  const [items, setItems] = useState<SplitItem[]>(INITIAL_ORELY_ITEMS);
  const [selectedFriends, setSelectedFriends] = useState<SplitFriend[]>(DEFAULT_FRIENDS);
  const [splitEqually, setSplitEqually] = useState(false);

  // Assignment of items to friend id
  const [friendItemAssignments, setFriendItemAssignments] = useState<Record<string, string>>({
    'riko': 'item-3',     // Iced Cappuccino ($27)
    'eleanor': 'item-1',  // Double Shot Espresso ($29)
    'robert': 'item-2',   // Hot Latte ($32)
    'syifa': 'item-4'     // Blueberry Pie ($31)
  });

  // Modal for assigning item to a specific friend
  const [assigningFriendId, setAssigningFriendId] = useState<string | null>(null);

  // Active requested bill (after creation)
  const [requestedBill, setRequestedBill] = useState<SplitBillData | null>(null);
  const [showBillDetailsModal, setShowBillDetailsModal] = useState(false);

  // Friends search filter in ADD_FRIENDS
  const [searchFriend, setSearchFriend] = useState('');

  // Total amount computed from items
  const totalAmount = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  // Remaining unassigned amount
  const assignedAmount = splitEqually 
    ? totalAmount 
    : Object.entries(friendItemAssignments).reduce((sum, [_, itemId]) => {
        const item = items.find(it => it.id === itemId);
        return sum + (item ? item.price : 0);
      }, 0);

  const remainingAmount = Math.max(0, totalAmount - assignedAmount);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Handler to assign an item to the friend currently in the bottom sheet
  const handleSelectFriendItem = (itemId: string) => {
    if (!assigningFriendId) return;
    setFriendItemAssignments(prev => ({
      ...prev,
      [assigningFriendId]: itemId
    }));
    setAssigningFriendId(null);
  };

  const handleCreateBill = () => {
    const newBill: SplitBillData = {
      id: `bill-${Date.now()}`,
      billName: billName || 'Orely Café',
      date: 'Dec 18, 2024 • 04:00 PM',
      totalAmount,
      category,
      friends: selectedFriends,
      items,
      splitEqually,
      status: 'REQUESTED'
    };
    setRequestedBill(newBill);
    setCurrentScreen('SUCCESS');
  };

  // Top Cafe Illustration Component matching user screenshots
  const CafeTopBanner = () => (
    <div className="relative w-full h-48 sm:h-52 bg-gradient-to-b from-[#b8b3f8] via-[#cfcbfd] to-[#e4e2fd] overflow-hidden">
      {/* Back button and title */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-4">
        <button
          id="split-back-btn"
          onClick={() => {
            if (currentScreen === 'HUB') onClose();
            else if (currentScreen === 'CREATE_FORM') setCurrentScreen('HUB');
            else if (currentScreen === 'ADD_ITEMS' || currentScreen === 'ADD_FRIENDS') setCurrentScreen('CREATE_FORM');
            else if (currentScreen === 'DETAILS') setCurrentScreen('CREATE_FORM');
            else if (currentScreen === 'SUCCESS') setCurrentScreen('HUB');
          }}
          className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-95 transition-all hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          {language === 'sw' ? 'Gawana bili' : 'Split bill'}
        </h2>
        <div className="w-10" />
      </div>

      {/* Illustrated café scene with 3 friends at purple table */}
      <div className="absolute inset-0 pt-10 flex items-end justify-center pointer-events-none">
        <svg viewBox="0 0 400 160" className="w-full h-full max-w-md object-cover" preserveAspectRatio="xMidYMax slice">
          {/* Background wall window & menu frame */}
          <rect x="20" y="10" width="80" height="90" rx="4" fill="#a79ff5" opacity="0.3" />
          <rect x="25" y="15" width="70" height="80" rx="2" fill="#fff" opacity="0.85" />
          {/* Coffee machine */}
          <rect x="15" y="60" width="45" height="50" rx="6" fill="#303b68" />
          <rect x="20" y="70" width="35" height="15" rx="3" fill="#6d79a8" />
          <circle cx="37" cy="95" r="4" fill="#facc15" />
          {/* Menu paper on right wall */}
          <rect x="335" y="20" width="42" height="60" rx="4" fill="#3f3b7d" stroke="#5d57b5" strokeWidth="2" />
          <rect x="340" y="25" width="32" height="50" rx="2" fill="#fff" />
          <line x1="345" y1="33" x2="367" y2="33" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="345" y1="40" x2="362" y2="40" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="345" y1="47" x2="365" y2="47" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          {/* Plants */}
          <path d="M-10 130 Q10 90 25 125 Q40 90 45 140 Z" fill="#2d6a4f" opacity="0.9" />
          <path d="M370 130 Q385 85 395 125 Q410 90 415 140 Z" fill="#2d6a4f" opacity="0.9" />

          {/* Table */}
          <ellipse cx="200" cy="140" rx="140" ry="24" fill="#8169b8" />
          <ellipse cx="200" cy="138" rx="136" ry="22" fill="#9d84d6" />

          {/* Strawberry pie / dessert on table */}
          <ellipse cx="205" cy="135" rx="22" ry="7" fill="#fde047" />
          <path d="M190 133 Q205 124 220 133 Z" fill="#e11d48" />
          <circle cx="197" cy="130" r="3" fill="#ef4444" />
          <circle cx="205" cy="128" r="3.5" fill="#ef4444" />
          <circle cx="213" cy="130" r="3" fill="#ef4444" />

          {/* Drink cups */}
          <path d="M110 130 L113 142 L125 142 L128 130 Z" fill="#ef4444" />
          <path d="M260 130 L263 142 L275 142 L278 130 Z" fill="#f97316" />
          <ellipse cx="160" cy="137" rx="8" ry="4" fill="#fff" />
          <ellipse cx="160" cy="136" rx="6" ry="2.5" fill="#78350f" />

          {/* Person 1 (Left - Girl with ponytail, orange shirt) */}
          <path d="M60 115 Q95 105 125 125 L115 150 L65 150 Z" fill="#ea580c" />
          <circle cx="85" cy="90" r="16" fill="#fbcfe8" />
          {/* Hair ponytail */}
          <path d="M70 85 Q75 65 95 72 Q105 85 95 102 Q65 100 70 85 Z" fill="#1e293b" />
          <path d="M60 90 Q50 95 45 110 Q58 115 65 98 Z" fill="#1e293b" />
          {/* Arms holding phone */}
          <path d="M95 110 L120 95" stroke="#ea580c" strokeWidth="8" strokeLinecap="round" />
          <rect x="115" y="85" width="10" height="18" rx="2" fill="#1e1b4b" transform="rotate(10 115 85)" />

          {/* Person 2 (Center - Guy standing/leaning with yellow wavy knit sweater) */}
          <path d="M165 95 Q195 85 225 95 L230 150 L160 150 Z" fill="#fde047" />
          <path d="M170 108 Q195 104 220 108" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M170 120 Q195 116 220 120" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M170 132 Q195 128 220 132" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 3" />
          {/* Pants */}
          <rect x="175" y="145" width="20" height="25" fill="#6b3a2a" />
          <rect x="200" y="145" width="20" height="25" fill="#6b3a2a" />
          {/* Head & dark brown hair */}
          <circle cx="195" cy="62" r="17" fill="#fed7aa" />
          <path d="M180 58 Q195 40 212 55 Q215 68 205 70 Q180 72 180 58 Z" fill="#78350f" />
          {/* Hands holding phone */}
          <rect x="188" y="70" width="12" height="22" rx="2.5" fill="#1e1b4b" transform="rotate(-5 188 70)" />

          {/* Person 3 (Right - Guy with yellow cap and pink jacket) */}
          <path d="M265 110 Q295 100 325 112 L330 150 L260 150 Z" fill="#f43f5e" />
          <path d="M280 115 L280 150 L310 150 L310 115 Z" fill="#fff" />
          {/* Pants */}
          <rect x="265" y="140" width="55" height="25" fill="#fde047" />
          {/* Head & cap */}
          <circle cx="295" cy="85" r="15" fill="#fed7aa" />
          <path d="M282 80 Q295 68 310 78 Q305 92 290 92 Z" fill="#78350f" />
          <ellipse cx="298" cy="74" rx="14" ry="5" fill="#facc15" />
          <path d="M282 74 Q270 76 265 80" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
          {/* Arms holding phone */}
          <rect x="268" y="85" width="10" height="18" rx="2" fill="#1e1b4b" transform="rotate(-15 268 85)" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex justify-center animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md min-h-screen pb-16 flex flex-col ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}>

        {/* 1. TOP BANNER */}
        <CafeTopBanner />

        {/* 2. BODY SHEET (Rounded top overlapping the banner) */}
        <div className={`relative -mt-6 flex-1 rounded-t-[2.5rem] px-5 pt-3 transition-colors ${
          isDark ? 'bg-slate-950 border-t border-slate-800' : 'bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.06)]'
        }`}>
          {/* Small pull bar */}
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-5" />

          {/* ============================================================ */}
          {/* SCREEN 1: SPLIT BILL HUB (Action Cards + Request + History)  */}
          {/* ============================================================ */}
          {currentScreen === 'HUB' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* TWO ACTION CARDS */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* 1. Create with receipt */}
                <button
                  id="split-create-receipt-btn"
                  onClick={() => setCurrentScreen('CREATE_FORM')}
                  className={`group rounded-3xl p-3 border transition-all text-left flex flex-col active:scale-95 ${
                    isDark 
                      ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50' 
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail illustration: Hands holding receipt & scanning phone */}
                  <div className="w-full h-32 rounded-2xl bg-[#dcd7fe] overflow-hidden relative flex items-center justify-center">
                    <svg viewBox="0 0 160 130" className="w-full h-full">
                      {/* Receipt paper */}
                      <rect x="30" y="15" width="55" height="85" rx="4" fill="#fff" transform="rotate(-10 30 15)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
                      <rect x="35" y="25" width="45" height="8" rx="2" fill="#4338ca" transform="rotate(-10 35 25)" />
                      <text x="38" y="31" fill="#fff" fontSize="6" fontWeight="bold" transform="rotate(-10 38 31)">RECEIPT</text>
                      <line x1="38" y1="42" x2="68" y2="37" stroke="#cbd5e1" strokeWidth="2" />
                      <line x1="40" y1="52" x2="72" y2="47" stroke="#cbd5e1" strokeWidth="2" />
                      <line x1="42" y1="62" x2="70" y2="57" stroke="#cbd5e1" strokeWidth="2" />
                      <line x1="44" y1="72" x2="60" y2="69" stroke="#6366f1" strokeWidth="2.5" />
                      {/* Hands holding paper */}
                      <path d="M10 95 Q30 75 45 78 Q50 90 35 110 Z" fill="#fb923c" />
                      {/* Phone displaying digital receipt */}
                      <rect x="75" y="25" width="48" height="80" rx="8" fill="#1e1b4b" transform="rotate(12 75 25)" />
                      <rect x="78" y="28" width="42" height="74" rx="6" fill="#c7d2fe" transform="rotate(12 78 28)" />
                      <rect x="82" y="36" width="34" height="10" rx="2" fill="#4338ca" transform="rotate(12 82 36)" />
                      <text x="85" y="43" fill="#fff" fontSize="5" fontWeight="bold" transform="rotate(12 85 43)">RECEIPT</text>
                      <line x1="86" y1="53" x2="108" y2="58" stroke="#6366f1" strokeWidth="2" />
                      <line x1="88" y1="63" x2="112" y2="68" stroke="#6366f1" strokeWidth="2" />
                      {/* Hand holding phone */}
                      <path d="M145 90 Q120 80 115 95 Q125 115 145 120 Z" fill="#fb923c" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 px-1 text-center w-full block">
                    {language === 'sw' ? 'Tengeneza kwa risiti' : 'Create with receipt'}
                  </span>
                </button>

                {/* 2. Create manually */}
                <button
                  id="split-create-manual-btn"
                  onClick={() => setCurrentScreen('CREATE_FORM')}
                  className={`group rounded-3xl p-3 border transition-all text-left flex flex-col active:scale-95 ${
                    isDark 
                      ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50' 
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail illustration: Hands holding phone & tapping screen */}
                  <div className="w-full h-32 rounded-2xl bg-[#ffdfba] overflow-hidden relative flex items-center justify-center">
                    <svg viewBox="0 0 160 130" className="w-full h-full">
                      {/* Soft peach backdrop circle */}
                      <circle cx="80" cy="65" r="45" fill="#fed7aa" />
                      {/* Smartphone */}
                      <rect x="54" y="20" width="52" height="85" rx="9" fill="#2e1065" />
                      <rect x="57" y="24" width="46" height="77" rx="7" fill="#ede9fe" />
                      {/* Header receipt card */}
                      <rect x="62" y="32" width="36" height="12" rx="3" fill="#6366f1" />
                      <line x1="66" y1="52" x2="88" y2="52" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="66" y1="60" x2="80" y2="60" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                      <line x1="66" y1="68" x2="84" y2="68" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                      {/* Left hand holding */}
                      <path d="M30 110 Q50 70 56 80 Q52 105 38 125 Z" fill="#fb923c" />
                      {/* Right hand with index finger touching screen */}
                      <path d="M125 110 Q98 60 92 65 Q96 85 115 125 Z" fill="#fb923c" />
                      <ellipse cx="92" cy="64" rx="4" ry="4" fill="#fdba74" />
                      {/* Touch wave */}
                      <circle cx="92" cy="64" r="8" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 px-1 text-center w-full block">
                    {language === 'sw' ? 'Tengeneza mwenyewe' : 'Create manually'}
                  </span>
                </button>
              </div>

              {/* SPLIT BILL REQUEST SECTION */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {language === 'sw' ? 'Maombi ya Gawana Bili' : 'Split bill request'}
                </h3>

                {/* If NO active request: Empty state matching image 1 & 2 */}
                {!requestedBill ? (
                  <div className={`rounded-3xl p-6 text-center border transition-colors ${
                    isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/70 border-slate-100'
                  }`}>
                    {/* Illustration of 3D printer / register with question bubble */}
                    <div className="w-20 h-16 mx-auto mb-3 relative flex items-center justify-center">
                      <svg viewBox="0 0 100 80" className="w-full h-full">
                        {/* 3D Register base */}
                        <polygon points="15,45 85,45 75,70 5,70" fill="#9381ff" />
                        <polygon points="15,45 35,28 95,28 85,45" fill="#b8b8ff" />
                        {/* Keypads */}
                        <rect x="25" y="52" width="8" height="4" rx="1" fill="#fff" opacity="0.8" />
                        <rect x="37" y="52" width="8" height="4" rx="1" fill="#fff" opacity="0.8" />
                        <rect x="49" y="52" width="8" height="4" rx="1" fill="#fff" opacity="0.8" />
                        <rect x="25" y="60" width="8" height="4" rx="1" fill="#fff" opacity="0.8" />
                        <rect x="37" y="60" width="8" height="4" rx="1" fill="#fff" opacity="0.8" />
                        <rect x="49" y="60" width="8" height="4" rx="1" fill="#fff" opacity="0.8" />
                        {/* Receipt roll coming out */}
                        <path d="M40 28 L40 10 Q48 12 55 8 Q62 12 70 8 L70 28 Z" fill="#e2e8f0" />
                        <line x1="44" y1="16" x2="64" y2="16" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="44" y1="21" x2="60" y2="21" stroke="#94a3b8" strokeWidth="1.5" />
                        {/* Question mark bubble */}
                        <circle cx="78" cy="18" r="10" fill="#c4b5fd" />
                        <text x="75" y="22" fill="#fff" fontSize="12" fontWeight="bold">?</text>
                      </svg>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'sw' ? 'Hakuna ombi la gawana bili' : 'No Split bill request'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'sw' ? 'Lazima utengeneze gawana bili kwanza' : 'You must create split bill first'}
                    </p>
                  </div>
                ) : (
                  /* If ACTIVE REQUEST exists: EXACT card matching image 19! */
                  <div className={`rounded-3xl overflow-hidden border shadow-sm transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}>
                    {/* Top Amber "⏱ REQUESTED" Banner */}
                    <div className="bg-[#f59e0b] px-4 py-1.5 flex items-center justify-center gap-1.5 text-white font-extrabold text-[11px] tracking-wider uppercase">
                      <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{language === 'sw' ? 'IMEOMBWA' : 'REQUESTED'}</span>
                    </div>

                    <div className="p-4 space-y-3.5">
                      {/* Merchant Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Spiral blue merchant logo matching Orely Cafe */}
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full border-3 border-blue-600 border-t-transparent animate-spin-slow flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {requestedBill.billName}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {requestedBill.date}
                            </p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            ${requestedBill.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Avatars Stack & "View Details" Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Avatar Stack */}
                        <div className="flex items-center -space-x-2">
                          {requestedBill.friends.slice(0, 3).map((fr) => (
                            <img
                              key={fr.id}
                              src={fr.avatar}
                              alt={fr.name}
                              className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                          {requestedBill.friends.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                              +{requestedBill.friends.length - 3}
                            </div>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button
                          id="view-requested-details-btn"
                          onClick={() => setShowBillDetailsModal(true)}
                          className="px-4 py-1.5 rounded-xl bg-[#543eed] hover:bg-[#4834da] text-white text-xs font-bold shadow-sm shadow-indigo-500/20 active:scale-95 transition-transform"
                        >
                          {language === 'sw' ? 'Tazama Maelezo' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SPLIT BILL HISTORY SECTION */}
              <div className="flex items-center justify-between pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {language === 'sw' ? 'Historia ya gawana bili' : 'Split bill history'}
                </h3>
                <button
                  id="split-history-see-all-btn"
                  onClick={() => {
                    if (requestedBill) setShowBillDetailsModal(true);
                  }}
                  className="text-xs font-bold text-[#543eed] hover:text-[#432fda] flex items-center gap-1"
                >
                  <span>{language === 'sw' ? 'Tazama zote' : 'See all'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: CREATE SPLIT BILL FORM                             */}
          {/* ============================================================ */}
          {currentScreen === 'CREATE_FORM' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Bill Name Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {language === 'sw' ? 'Jina la bili' : 'Bill name'}
                </label>
                <input
                  id="split-bill-name-input"
                  type="text"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  placeholder="Billing name"
                  className="w-full text-base font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-slate-200 dark:border-slate-800 pb-2 outline-none focus:border-[#543eed]"
                />
              </div>

              {/* Add Items Row */}
              <button
                id="split-add-items-row-btn"
                onClick={() => setCurrentScreen('ADD_ITEMS')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {items.length > 0 
                    ? `${items.length}x items added` 
                    : language === 'sw' ? 'Ongeza vitu' : 'Add items'}
                </span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  {items.length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-[#543eed]" />
                  )}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* Total Amount Card */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
              }`}>
                <span className="text-[11px] font-bold text-slate-400 block">
                  {language === 'sw' ? 'Jumla ya Kiasi' : 'Total Amount'}
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block tracking-tight">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Category Pills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'sw' ? 'Kategoria' : 'Category'}
                  </span>
                  <span className="text-xs font-bold text-[#543eed] hover:underline cursor-pointer">
                    {language === 'sw' ? 'Kategoria zote' : 'All Category'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Food & Beverages', label: 'Food & Beverages', icon: '☕' },
                    { id: 'Travel', label: 'Travel', icon: '🧳' },
                    { id: 'Shopping', label: 'Shopping', icon: '🛍️' },
                    { id: 'Social Activities', label: 'Social Activities', icon: '👥' },
                  ].map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-[#543eed] bg-purple-50 dark:bg-purple-950/40 text-[#543eed]'
                            : isDark 
                              ? 'border-slate-800 bg-slate-900/40 text-slate-400' 
                              : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Friends Row */}
              <button
                id="split-add-friends-row-btn"
                onClick={() => setCurrentScreen('ADD_FRIENDS')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Friend Avatars stack */}
                  <div className="flex items-center -space-x-2">
                    {selectedFriends.slice(0, 3).map((fr) => (
                      <img
                        key={fr.id}
                        src={fr.avatar}
                        alt={fr.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'sw' ? 'Ongeza marafiki' : 'Add friends'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Proceed Button */}
              <div className="pt-4">
                <button
                  id="split-proceed-btn"
                  onClick={() => setCurrentScreen('DETAILS')}
                  className="w-full py-3.5 rounded-2xl bg-[#543eed] hover:bg-[#4834da] text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
                >
                  {language === 'sw' ? 'Endelea' : 'Proceed'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: ADD ITEMS SCREEN (Double Shot, Latte, Cappuccino...)*/}
          {/* ============================================================ */}
          {currentScreen === 'ADD_ITEMS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'sw' ? 'Ongeza Vitu' : 'Add Items'}
              </h3>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.qty}x Items
                      </p>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Item Button */}
              <button
                onClick={() => {
                  const newItemName = prompt(language === 'sw' ? 'Ingiza jina la kitu:' : 'Enter item name:');
                  if (!newItemName) return;
                  const newItemPrice = parseFloat(prompt(language === 'sw' ? 'Ingiza bei ($):' : 'Enter price ($):') || '15');
                  if (isNaN(newItemPrice)) return;
                  setItems(prev => [
                    ...prev,
                    {
                      id: `item-${Date.now()}`,
                      name: newItemName,
                      price: newItemPrice,
                      qty: 1
                    }
                  ]);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#543eed] hover:underline pt-1"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{language === 'sw' ? 'Ongeza Vitu Vingine' : 'Add Items'}</span>
              </button>

              {/* Bottom Purple Button */}
              <div className="pt-6">
                <button
                  id="split-confirm-items-btn"
                  onClick={() => setCurrentScreen('CREATE_FORM')}
                  className="w-full py-3.5 rounded-2xl bg-[#543eed] hover:bg-[#4834da] text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
                >
                  {language === 'sw' ? 'Hifadhi Vitu' : 'Add Items'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 4: ADD FRIENDS SCREEN                                */}
          {/* ============================================================ */}
          {currentScreen === 'ADD_FRIENDS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFriend}
                  onChange={(e) => setSearchFriend(e.target.value)}
                  placeholder={language === 'sw' ? 'Tafuta...' : 'Search'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none focus:border-[#543eed]"
                />
              </div>

              {/* "Split with" Selected Chips */}
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/60 border-slate-100'
              }`}>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {language === 'sw' ? 'Gawana na' : 'Split with'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFriends.map((fr) => (
                    <div
                      key={fr.id}
                      className="flex items-center justify-between p-1.5 pr-2.5 rounded-full border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={fr.avatar}
                          alt={fr.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {fr.name}
                        </span>
                      </div>
                      {!fr.isYou && (
                        <button
                          onClick={() => setSelectedFriends(prev => prev.filter(f => f.id !== fr.id))}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Friends List */}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                  {language === 'sw' ? 'Hivi karibuni' : 'Recent'}
                </span>

                <div className="space-y-2">
                  {DEFAULT_FRIENDS.filter(f => !f.isYou).map((friend) => {
                    const isSelected = selectedFriends.some(f => f.id === friend.id);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFriends(prev => prev.filter(f => f.id !== friend.id));
                          } else {
                            setSelectedFriends(prev => [...prev, friend]);
                          }
                        }}
                        className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-9 h-9 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {friend.name}
                            </h4>
                            <p className="text-[10.5px] text-slate-400 font-mono">
                              {friend.phone}
                            </p>
                          </div>
                        </div>

                        {/* Radio circle */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected 
                            ? 'bg-[#1e1b4b] border-[#1e1b4b] text-white' 
                            : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Friends Purple Button */}
              <div className="pt-4">
                <button
                  id="split-confirm-friends-btn"
                  onClick={() => setCurrentScreen('CREATE_FORM')}
                  className="w-full py-3.5 rounded-2xl bg-[#543eed] hover:bg-[#4834da] text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
                >
                  {language === 'sw' ? 'Ongeza Marafiki' : 'Add Friends'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 5: SPLIT BILL DETAILS (Assignment & Send Request)      */}
          {/* ============================================================ */}
          {currentScreen === 'DETAILS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header with "Edit friends" button */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {language === 'sw' ? 'Maelezo ya gawana bili' : 'Split bill details'}
                </h3>
                <button
                  onClick={() => setCurrentScreen('ADD_FRIENDS')}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{language === 'sw' ? 'Hariri marafiki' : 'Edit friends'}</span>
                </button>
              </div>

              {/* Remaining Bill Banner Card */}
              <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-r from-[#ece8ff] via-[#dcd5fe] to-[#ebe7ff] border border-purple-200 text-slate-900">
                <div className="relative z-10">
                  <p className="text-[11px] font-medium text-slate-600">
                    Remaining bill of {billName || 'Orely Café'}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-indigo-950">
                      ${remainingAmount.toFixed(0)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      from
                    </span>
                    <span className="text-base font-black text-indigo-950">
                      ${totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Right receipt illustration with gold coins */}
                <div className="absolute top-1 right-2 w-28 h-20 pointer-events-none">
                  <svg viewBox="0 0 100 80" className="w-full h-full">
                    <circle cx="75" cy="25" r="10" fill="#facc15" />
                    <text x="71" y="29" fill="#78350f" fontSize="10" fontWeight="bold">$</text>
                    <rect x="25" y="10" width="40" height="55" rx="3" fill="#fff" transform="rotate(-8 25 10)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                    <rect x="28" y="16" width="32" height="6" rx="1" fill="#4f46e5" transform="rotate(-8 28 16)" />
                    <circle cx="15" cy="40" r="10" fill="#f43f5e" />
                    <circle cx="15" cy="38" r="4" fill="#fff" />
                    <path d="M10 47 Q15 42 20 47" stroke="#fff" strokeWidth="2" fill="none" />
                    <path d="M30 65 Q50 45 70 70" stroke="#f97316" strokeWidth="12" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Split equally Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sw' ? 'Gawana kwa usawa' : 'Split equally'}
                </span>
                <button
                  type="button"
                  onClick={() => setSplitEqually(!splitEqually)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    splitEqually ? 'bg-[#543eed]' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    splitEqually ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Participants Breakdown List */}
              <div className="space-y-3 pt-1">
                {selectedFriends.map((friend) => {
                  const assignedItemId = friendItemAssignments[friend.id];
                  const assignedItem = items.find(it => it.id === assignedItemId);
                  const friendAmount = splitEqually 
                    ? (totalAmount / selectedFriends.length)
                    : (assignedItem ? assignedItem.price : 0);

                  return (
                    <div
                      key={friend.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Friend details */}
                        <div className="flex items-center gap-3">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {friend.name}
                            </h4>
                            <p className="text-[10.5px] text-slate-400 font-mono">
                              {friend.phone}
                            </p>
                          </div>
                        </div>

                        {/* Amount Box on right */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-500">$</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {friendAmount.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Assigned item or "+ Add Items" button if not splitting equally */}
                      {!splitEqually && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          {assignedItem ? (
                            <button
                              onClick={() => setAssigningFriendId(friend.id)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                            >
                              <span>1x {assignedItem.name}</span>
                              <Edit3 className="w-3 h-3 text-slate-400" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setAssigningFriendId(friend.id)}
                              className="flex items-center gap-1 text-[11px] font-bold text-[#543eed]"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                              <span>{language === 'sw' ? 'Ongeza Vitu' : 'Add Items'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Send Request Button */}
              <div className="pt-4">
                <button
                  id="split-send-request-btn"
                  onClick={handleCreateBill}
                  className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-all active:scale-[0.98] ${
                    remainingAmount === 0 || splitEqually
                      ? 'bg-[#543eed] hover:bg-[#4834da] text-white shadow-indigo-500/25'
                      : 'bg-indigo-300 dark:bg-indigo-900/60 text-white cursor-pointer'
                  }`}
                >
                  {language === 'sw' ? 'Tuma Ombi' : 'Send Request'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 6: SPLIT BILL CREATED SUCCESS SCREEN                  */}
          {/* ============================================================ */}
          {currentScreen === 'SUCCESS' && (
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              {/* Graphic of person holding phone showing split bill created */}
              <div className="w-full h-56 rounded-3xl bg-gradient-to-b from-[#b8b3f8] to-[#e4e2fd] overflow-hidden relative flex items-center justify-center p-2 shadow-inner">
                <svg viewBox="0 0 240 180" className="w-full h-full">
                  {/* Background window and bottles shelf */}
                  <rect x="15" y="10" width="55" height="120" rx="3" fill="#a79ff5" opacity="0.4" />
                  <rect x="20" y="15" width="45" height="110" rx="2" fill="#fff" opacity="0.85" />
                  <rect x="140" y="20" width="85" height="40" rx="4" fill="#ca8a04" opacity="0.8" />
                  {/* Bar stools */}
                  <ellipse cx="165" cy="85" rx="14" ry="6" fill="#dc2626" />
                  <ellipse cx="215" cy="85" rx="14" ry="6" fill="#dc2626" />
                  {/* Guy standing proudly holding up big phone */}
                  <circle cx="120" cy="45" r="16" fill="#fed7aa" />
                  <path d="M106 42 Q120 28 135 40 Q133 55 125 55 Q106 56 106 42 Z" fill="#78350f" />
                  <path d="M98 75 Q120 65 142 75 L145 150 L95 150 Z" fill="#fde047" />
                  {/* Phone screen facing user with split bill */}
                  <rect x="45" y="50" width="60" height="95" rx="8" fill="#1e1b4b" transform="rotate(-6 45 50)" />
                  <rect x="48" y="53" width="54" height="89" rx="6" fill="#fff" transform="rotate(-6 48 53)" />
                  <rect x="52" y="58" width="46" height="20" rx="3" fill="#818cf8" transform="rotate(-6 52 58)" />
                  <rect x="52" y="85" width="46" height="6" rx="2" fill="#e0e7ff" transform="rotate(-6 52 85)" />
                  <rect x="52" y="94" width="46" height="6" rx="2" fill="#e0e7ff" transform="rotate(-6 52 94)" />
                  <rect x="52" y="103" width="30" height="8" rx="3" fill="#4f46e5" transform="rotate(-6 52 103)" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Bili Imegawanywa Kikamilifu' : 'Split Bill Created'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'sw' ? 'Bili imetumwa kwa marafiki zako wote.' : 'The bill has been sent to your friends.'}
                </p>
              </div>

              {/* Stack of friend avatars */}
              <div className="flex items-center justify-center -space-x-2 py-1">
                {selectedFriends.map((fr) => (
                  <img
                    key={fr.id}
                    src={fr.avatar}
                    alt={fr.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>

              {/* Got it Button */}
              <div className="pt-2">
                <button
                  id="split-got-it-btn"
                  onClick={() => setCurrentScreen('HUB')}
                  className="w-full py-3.5 rounded-2xl bg-[#543eed] hover:bg-[#4834da] text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
                >
                  {language === 'sw' ? 'Nimeelewa' : 'Got it'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM SHEET: ITEM SELECTION FOR A FRIEND (Image 13 & 14)    */}
      {/* ============================================================ */}
      {assigningFriendId && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-slate-100 dark:border-slate-800">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {language === 'sw' ? 'Chagua Kitu' : 'Items'}
              </h3>
              <button
                onClick={() => setAssigningFriendId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item) => {
                const isSelected = friendItemAssignments[assigningFriendId] === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectFriendItem(item.id)}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'border-[#543eed] bg-purple-50/50 dark:bg-purple-950/30'
                        : isDark ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.qty}x • ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Radio check circle */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#1e1b4b] border-[#1e1b4b] text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: VIEW DETAILS OF REQUESTED BILL                         */}
      {/* ============================================================ */}
      {showBillDetailsModal && requestedBill && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-5 h-5 text-[#543eed]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {requestedBill.billName}
                </h3>
              </div>
              <button
                onClick={() => setShowBillDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <Clock className="w-4 h-4" />
              <span>{requestedBill.date} • {requestedBill.status}</span>
            </div>

            <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800 py-3">
              {requestedBill.friends.map((friend) => {
                const assignedItemId = friendItemAssignments[friend.id];
                const assignedItem = items.find(it => it.id === assignedItemId);
                const friendAmount = requestedBill.splitEqually 
                  ? (requestedBill.totalAmount / requestedBill.friends.length)
                  : (assignedItem ? assignedItem.price : 0);

                return (
                  <div key={friend.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={friend.avatar} alt={friend.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{friend.name}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">${friendAmount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-500">Total Bill</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">${requestedBill.totalAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowBillDetailsModal(false)}
              className="w-full py-3 rounded-xl bg-[#543eed] text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {language === 'sw' ? 'Funga' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
