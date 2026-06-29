import React from 'react';
import { Cloud, CloudOff, Calendar, UserCheck, Pencil, Globe } from 'lucide-react';

interface HeaderProps {
  isSynced: boolean;
  user: {
    name: string;
    state: string;
    occupation: string;
    monthly_budget: number;
  } | null;
  onEditProfile: () => void;
  globalLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const INDIAN_LANGUAGES = [
  { name: 'English', native: 'English' },
  { name: 'Hindi', native: 'हिन्दी' },
  { name: 'Marathi', native: 'मराठी' },
  { name: 'Tamil', native: 'தமிழ்' },
  { name: 'Telugu', native: 'తెలుగు' },
  { name: 'Bengali', native: 'বাংলা' },
  { name: 'Gujarati', native: 'ગુજરાતી' },
  { name: 'Kannada', native: 'ಕನ್ನಡ' },
  { name: 'Malayalam', native: 'മലയാളം' },
  { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { name: 'Odia', native: 'ଓଡ଼ିଆ' }
];

export const Header: React.FC<HeaderProps> = ({ 
  isSynced, 
  user, 
  onEditProfile,
  globalLanguage,
  onLanguageChange
}) => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-orange-100 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Aarav'}</h2>
          <button
            onClick={onEditProfile}
            className="p-1.5 hover:bg-orange-50 text-orange-500 rounded-lg transition-colors cursor-pointer"
            title="Edit Profile"
            aria-label="Edit Profile"
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <Calendar size={13} className="text-orange-400" />
          <span>{today}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-200"></span>
          <UserCheck size={13} className="text-orange-400" />
          <span>{user ? `${user.occupation} (${user.state})` : 'Loading profile...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Language Selector Dropdown */}
        <div className="flex items-center bg-orange-50 border border-orange-100/40 rounded-xl px-2.5 py-1.5 shadow-sm">
          <Globe size={14} className="text-orange-500 mr-2" />
          <select
            value={globalLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-1"
            title="Select Language"
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.name} value={lang.name}>
                {lang.native} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* Sync Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
          isSynced 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {isSynced ? (
            <>
              <Cloud size={14} className="animate-pulse" />
              <span>Live Sync Active</span>
            </>
          ) : (
            <>
              <CloudOff size={14} />
              <span>Sync Offline</span>
            </>
          )}
        </div>

        {/* Quick Stats */}
        {user && (
          <div className="text-right hidden sm:block border-l border-orange-100 pl-6">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Monthly Budget</span>
            <span className="text-sm font-bold text-orange-500">Rs. {user.monthly_budget.toLocaleString()}</span>
          </div>
        )}
      </div>
    </header>
  );
};
