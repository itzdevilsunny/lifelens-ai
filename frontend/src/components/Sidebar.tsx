import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  BellRing, 
  SearchCode, 
  Mic, 
  FileText,
  TrendingUp
} from 'lucide-react';
import { t } from '../utils/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: {
    name: string;
    occupation: string;
  } | null;
  onEditProfile: () => void;
  globalLanguage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onEditProfile, globalLanguage }) => {
  const menuItems = [
    { id: 'dashboard', label: t('dashboard', globalLanguage), icon: LayoutDashboard },
    { id: 'planner', label: t('planner', globalLanguage), icon: CalendarCheck },
    { id: 'reminders', label: t('reminders', globalLanguage), icon: BellRing },
    { id: 'scanner', label: t('scanner', globalLanguage), icon: FileText },
    { id: 'expenses', label: t('expenses', globalLanguage), icon: TrendingUp },
    { id: 'schemes', label: t('schemes', globalLanguage), icon: SearchCode },
    { id: 'assistant', label: t('assistant', globalLanguage), icon: Mic },
  ];

  return (
    <aside className="w-64 bg-white border-r border-orange-100 flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-orange-500/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-800 leading-none">LifePilot AI</h1>
          <span className="text-xs font-semibold text-orange-500 tracking-wider uppercase">Everyday Assistant</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-500/5 font-semibold border-l-4 border-orange-500 pl-3'
                  : 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-500 pl-4'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div 
        onClick={onEditProfile}
        className="p-6 border-t border-orange-500/10 bg-orange-50/30 flex items-center gap-3 cursor-pointer hover:bg-orange-50/70 transition-colors"
        title="Click to edit profile"
      >
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
          {user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AS'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-700 truncate">{user?.name || 'Aarav Sharma'}</p>
          <p className="text-[10px] text-gray-400 truncate">{user?.occupation || 'Premium Account'}</p>
        </div>
      </div>
    </aside>
  );
};
