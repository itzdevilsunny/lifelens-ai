import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { t } from './utils/translations';
import { DailyPlanner } from './components/DailyPlanner';
import { SmartReminders } from './components/SmartReminders';
import { DocumentScanner } from './components/DocumentScanner';
import { ExpenseTracker } from './components/ExpenseTracker';
import { SchemeFinder } from './components/SchemeFinder';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ProfileModal } from './components/ProfileModal';
import { 
  TrendingUp, 
  CalendarCheck, 
  Pill, 
  Award, 
  Mic, 
  FileText 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface User {
  name: string;
  age: number;
  state: string;
  occupation: string;
  monthly_budget: number;
}

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  due_time: string | null;
  date: string;
}

interface Reminder {
  id: number;
  title: string;
  time: string;
  type: string;
  details: string | null;
  is_active: boolean;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  doc_id: number | null;
}

interface Analytics {
  total_spent: number;
  monthly_budget: number;
  predicted_spending: number;
  overage_warning: boolean;
  overage_amount: number;
  recommendations: string[];
}

interface Scheme {
  id: number;
  title: string;
  description: string;
  eligibility: string;
  benefit: string;
  state: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSynced, setIsSynced] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Global Language state (accessible by all modules, persists across refreshes)
  const [globalLanguage, setGlobalLanguage] = useState<string>(() => {
    return localStorage.getItem('lifepilot_language') || 'English';
  });

  const handleLanguageChange = (lang: string) => {
    setGlobalLanguage(lang);
    localStorage.setItem('lifepilot_language', lang);
  };

  // App States
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  // Fetch all data from backend (with offline-first localStorage cache)
  const fetchAllData = async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      
      // User Profile
      const userRes = await axios.get(`${API_BASE}/api/user`);
      setUser(userRes.data);
      localStorage.setItem('lifepilot_user', JSON.stringify(userRes.data));

      // Tasks
      const tasksRes = await axios.get(`${API_BASE}/api/tasks?date=${todayDate}`);
      setTasks(tasksRes.data);
      localStorage.setItem('lifepilot_tasks', JSON.stringify(tasksRes.data));

      // Reminders
      const remindersRes = await axios.get(`${API_BASE}/api/reminders`);
      setReminders(remindersRes.data);
      localStorage.setItem('lifepilot_reminders', JSON.stringify(remindersRes.data));

      // Expenses
      const expensesRes = await axios.get(`${API_BASE}/api/expenses`);
      setExpenses(expensesRes.data);
      localStorage.setItem('lifepilot_expenses', JSON.stringify(expensesRes.data));

      // Schemes
      const schemesRes = await axios.get(`${API_BASE}/api/schemes`);
      setSchemes(schemesRes.data);
      localStorage.setItem('lifepilot_schemes', JSON.stringify(schemesRes.data));

      // Analytics
      const analyticsRes = await axios.get(`${API_BASE}/api/expenses/analytics`);
      setAnalytics(analyticsRes.data);
      localStorage.setItem('lifepilot_analytics', JSON.stringify(analyticsRes.data));

      setIsSynced(true);
    } catch (err) {
      console.warn("Could not sync with backend APIs. Running in disconnected fallback state:", err);
      setIsSynced(false);
      
      // Load from localStorage or mock local defaults if backend is down so dashboard never crashes
      const cachedUser = localStorage.getItem('lifepilot_user');
      const cachedTasks = localStorage.getItem('lifepilot_tasks');
      const cachedReminders = localStorage.getItem('lifepilot_reminders');
      const cachedExpenses = localStorage.getItem('lifepilot_expenses');
      const cachedAnalytics = localStorage.getItem('lifepilot_analytics');
      const cachedSchemes = localStorage.getItem('lifepilot_schemes');

      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      } else {
        const defaultUser = {
          name: "Aarav Sharma (Offline)",
          age: 32,
          state: "Maharashtra",
          occupation: "Small Business Owner",
          monthly_budget: 30000
        };
        setUser(defaultUser);
        localStorage.setItem('lifepilot_user', JSON.stringify(defaultUser));
      }

      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks));
      } else {
        const defaultTasks = [
          { id: 1, title: "Review property tax document", is_completed: false, due_time: "10:00", date: new Date().toISOString().split('T')[0] },
          { id: 2, title: "Afternoon outdoor walk", is_completed: true, due_time: "16:30", date: new Date().toISOString().split('T')[0] }
        ];
        setTasks(defaultTasks);
        localStorage.setItem('lifepilot_tasks', JSON.stringify(defaultTasks));
      }

      if (cachedReminders) {
        setReminders(JSON.parse(cachedReminders));
      } else {
        const defaultReminders = [
          { id: 1, title: "Telmisartan 40mg", time: "08:00", type: "medicine", details: "Dosage: 1 tablet. Before breakfast", is_active: true },
          { id: 2, title: "Electricity Bill Due", time: "18:00", type: "bill", details: "Amount due Rs. 1,850", is_active: true }
        ];
        setReminders(defaultReminders);
        localStorage.setItem('lifepilot_reminders', JSON.stringify(defaultReminders));
      }

      if (cachedExpenses) {
        setExpenses(JSON.parse(cachedExpenses));
      } else {
        const defaultExpenses = [
          { id: 1, title: "Grocery staples D-Mart", amount: 2450, category: "Grocery", date: new Date().toISOString().split('T')[0], doc_id: null }
        ];
        setExpenses(defaultExpenses);
        localStorage.setItem('lifepilot_expenses', JSON.stringify(defaultExpenses));
      }

      if (cachedAnalytics) {
        setAnalytics(JSON.parse(cachedAnalytics));
      } else {
        const defaultAnalytics = {
          total_spent: 2450,
          monthly_budget: 30000,
          predicted_spending: 2817.5,
          overage_warning: false,
          overage_amount: 0,
          recommendations: [
            "Grocery spends are high. Save 12% by opting for wholesale staples.",
            "Unplug the AC during peak afternoon to reduce electricity utility charges."
          ]
        };
        setAnalytics(defaultAnalytics);
        localStorage.setItem('lifepilot_analytics', JSON.stringify(defaultAnalytics));
      }

      let cachedSchemesVal = cachedSchemes;
      if (cachedSchemesVal) {
        const parsed = JSON.parse(cachedSchemesVal);
        // Force upgrade if cache does not contain apply_url fields
        if (parsed.length > 0 && !parsed[0].hasOwnProperty('apply_url')) {
          localStorage.removeItem('lifepilot_schemes');
          cachedSchemesVal = null;
        }
      }

      if (cachedSchemesVal) {
        setSchemes(JSON.parse(cachedSchemesVal));
      } else {
        const defaultSchemes = [
          {
            id: 1,
            title: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
            description: "National Mission for Financial Inclusion to ensure access to financial services, namely, basic savings & deposit accounts, remittance, credit, insurance, pension in an affordable manner.",
            eligibility: "Any Indian citizen above 10 years of age who does not have an existing bank account.",
            benefit: "Zero-balance savings account, RuPay debit card, Rs. 2 Lakh accidental insurance cover, and overdraft facility up to Rs. 10,000.",
            state: "All",
            apply_url: "https://www.pmjdy.gov.in/"
          },
          {
            id: 2,
            title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
            description: "The largest health assurance scheme in the world which aims to provide free health cover up to secondary and tertiary care hospitalization.",
            eligibility: "Families identified in SECC (Socio-Economic Caste Census) database, mainly low-income, landless, or unorganized sector workers.",
            benefit: "Health cover of Rs. 5 Lakh per family per year for secondary and tertiary care hospitalization, covering surgery, medicines, and diagnostics.",
            state: "All",
            apply_url: "https://www.pmjay.gov.in/"
          },
          {
            id: 3,
            title: "Sukanya Samriddhi Yojana (SSY)",
            description: "A small deposit scheme for girl child launched under 'Beti Bachao Beti Padhao' campaign to secure education and marriage expenses.",
            eligibility: "Parents or legal guardians of a girl child below the age of 10. Max 2 accounts per family.",
            benefit: "Attractive interest rate (historically 8%+, tax-exempt under Section 80C), maturity after 21 years or upon marriage after age 18.",
            state: "All",
            apply_url: "https://www.myscheme.gov.in/schemes/ssy"
          },
          {
            id: 4,
            title: "Atal Pension Yojana (APY)",
            description: "Pension scheme for citizens of India focused on the unorganized sector workers, allowing voluntary contributions.",
            eligibility: "All Indian citizens aged between 18 and 40 years holding a savings bank account.",
            benefit: "Guaranteed minimum monthly pension of Rs. 1,000, Rs. 2,000, Rs. 3,000, Rs. 4,000 or Rs. 5,000 after attaining the age of 60 years.",
            state: "All",
            apply_url: "https://www.npscra.nsdl.co.in/"
          },
          {
            id: 5,
            title: "Pradhan Mantri Mudra Yojana (PMMY)",
            description: "Scheme to provide collateral-free loans to micro and small enterprises for business expansion, startup funding, or modernization.",
            eligibility: "Small business owners, micro-enterprises, shopkeepers, and startups in manufacturing, trading, or service sectors.",
            benefit: "Collateral-free loans up to Rs. 10 Lakh under three categories: Shishu (up to Rs. 50k), Kishor (Rs. 50k - 5L), and Tarun (Rs. 5L - 10L).",
            state: "All",
            apply_url: "https://www.mudra.org.in/"
          },
          {
            id: 6,
            title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            description: "Central sector scheme that provides income support to all landholding farmer families across the country.",
            eligibility: "Farmer families who own cultivable land (subject to exclusion criteria).",
            benefit: "Direct income support of Rs. 6,000 per year, payable in three equal installments of Rs. 2,000 directly to bank accounts.",
            state: "All",
            apply_url: "https://pmkisan.gov.in/"
          },
          {
            id: 7,
            title: "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
            description: "Voluntary and contributory pension scheme for unorganized workers to secure their old age.",
            eligibility: "Unorganized workers (e.g. street vendors, maids, rickshaw pullers) aged 18-40 years with monthly income of Rs. 15,000 or less.",
            benefit: "Minimum assured monthly pension of Rs. 3,000 after attaining the age of 60 years, with equal matching contribution by Central Government.",
            state: "All",
            apply_url: "https://maandhan.in/"
          },
          {
            id: 8,
            title: "Ladli Behna Yojana (MP State)",
            description: "State-specific welfare scheme to enhance economic independence and health of women in Madhya Pradesh.",
            eligibility: "Women residents of Madhya Pradesh aged 21-60 years, belonging to families with annual income less than Rs. 2.5 Lakh.",
            benefit: "Monthly direct benefit transfer of Rs. 1,250 directly into the beneficiary's bank account.",
            state: "Madhya Pradesh",
            apply_url: "https://cmladlibahna.mp.gov.in/"
          },
          {
            id: 9,
            title: "Sanjay Gandhi Niradhar Yojana (Maharashtra)",
            description: "State-specific financial support scheme for destitute persons, disabled individuals, widows, and people suffering from major illnesses.",
            eligibility: "Destitute, elderly (above 65), disabled persons (40%+ disability) who are residents of Maharashtra with annual family income below Rs. 21,000.",
            benefit: "Monthly financial assistance of Rs. 1,000 for single persons, and Rs. 1,200 for families with two or more beneficiaries.",
            state: "Maharashtra",
            apply_url: "https://aaplesarkar.mahaonline.gov.in/"
          }
        ];
        setSchemes(defaultSchemes);
        localStorage.setItem('lifepilot_schemes', JSON.stringify(defaultSchemes));
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // API Mutator Helpers (passed to sub-components)
  
  // Tasks
  const handleAddTask = async (title: string, dueTime: string) => {
    const todayDate = new Date().toISOString().split('T')[0];
    if (isSynced) {
      await axios.post(`${API_BASE}/api/tasks`, { title, due_time: dueTime, date: todayDate });
      fetchAllData();
    } else {
      const newTask: Task = {
        id: Date.now(),
        title,
        is_completed: false,
        due_time: dueTime,
        date: todayDate
      };
      setTasks(prev => {
        const updated = [...prev, newTask];
        localStorage.setItem('lifepilot_tasks', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleToggleTask = async (id: number, isCompleted: boolean) => {
    if (isSynced) {
      await axios.put(`${API_BASE}/api/tasks/${id}`, { is_completed: isCompleted });
      fetchAllData();
    } else {
      setTasks(prev => {
        const updated = prev.map(t => t.id === id ? { ...t, is_completed: isCompleted } : t);
        localStorage.setItem('lifepilot_tasks', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (isSynced) {
      await axios.delete(`${API_BASE}/api/tasks/${id}`);
      fetchAllData();
    } else {
      setTasks(prev => {
        const updated = prev.filter(t => t.id !== id);
        localStorage.setItem('lifepilot_tasks', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Reminders
  const handleAddReminder = async (title: string, time: string, type: string, details: string) => {
    if (isSynced) {
      await axios.post(`${API_BASE}/api/reminders`, { title, time, type, details });
      fetchAllData();
    } else {
      const newRem: Reminder = {
        id: Date.now(),
        title,
        time,
        type,
        details,
        is_active: true
      };
      setReminders(prev => {
        const updated = [...prev, newRem];
        localStorage.setItem('lifepilot_reminders', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleToggleReminder = async (id: number, isActive: boolean) => {
    if (isSynced) {
      await axios.put(`${API_BASE}/api/reminders/${id}`, { is_active: isActive });
      fetchAllData();
    } else {
      setReminders(prev => {
        const updated = prev.map(r => r.id === id ? { ...r, is_active: isActive } : r);
        localStorage.setItem('lifepilot_reminders', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (isSynced) {
      await axios.delete(`${API_BASE}/api/reminders/${id}`);
      fetchAllData();
    } else {
      setReminders(prev => {
        const updated = prev.filter(r => r.id !== id);
        localStorage.setItem('lifepilot_reminders', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Expenses
  const handleAddExpense = async (title: string, amount: number, category: string) => {
    const todayDate = new Date().toISOString().split('T')[0];
    if (isSynced) {
      await axios.post(`${API_BASE}/api/expenses`, { title, amount, category, date: todayDate });
      fetchAllData();
    } else {
      const newExp: Expense = {
        id: Date.now(),
        title,
        amount,
        category,
        date: todayDate,
        doc_id: null
      };
      const updatedExpenses = [newExp, ...expenses];
      setExpenses(updatedExpenses);
      localStorage.setItem('lifepilot_expenses', JSON.stringify(updatedExpenses));
      
      // Calculate local mock analytics updates
      const total = updatedExpenses.reduce((acc, c) => acc + c.amount, 0);
      const updatedAnalytics = {
        total_spent: total,
        monthly_budget: user?.monthly_budget || 30000,
        predicted_spending: total * 1.15,
        overage_warning: total * 1.15 > (user?.monthly_budget || 30000),
        overage_amount: Math.max(0, (total * 1.15) - (user?.monthly_budget || 30000)),
        recommendations: [
          "Grocery limits exceeded. Buy staples in bulk to save cash.",
          "Check Jan Aushadhi generic stores for medicine discounts."
        ]
      };
      setAnalytics(updatedAnalytics);
      localStorage.setItem('lifepilot_analytics', JSON.stringify(updatedAnalytics));
    }
  };

  // User Profile Update
  const handleSaveProfile = async (updatedUser: { name: string; age: number; state: string; occupation: string; monthly_budget: number }) => {
    // Save to localStorage immediately so it's always cached
    localStorage.setItem('lifepilot_user', JSON.stringify(updatedUser));
    
    try {
      if (isSynced) {
        await axios.put(`${API_BASE}/api/user`, updatedUser);
        await fetchAllData();
      } else {
        setUser(updatedUser);
        if (analytics) {
          const updatedAnalytics = {
            ...analytics,
            monthly_budget: updatedUser.monthly_budget,
            overage_warning: analytics.total_spent * 1.15 > updatedUser.monthly_budget,
            overage_amount: Math.max(0, (analytics.total_spent * 1.15) - updatedUser.monthly_budget)
          };
          setAnalytics(updatedAnalytics);
          localStorage.setItem('lifepilot_analytics', JSON.stringify(updatedAnalytics));
        }
      }
    } catch (err) {
      console.warn("Could not save profile to backend. Saving locally instead.", err);
      setUser(updatedUser);
      if (analytics) {
        const updatedAnalytics = {
          ...analytics,
          monthly_budget: updatedUser.monthly_budget,
          overage_warning: analytics.total_spent * 1.15 > updatedUser.monthly_budget,
          overage_amount: Math.max(0, (analytics.total_spent * 1.15) - updatedUser.monthly_budget)
        };
        setAnalytics(updatedAnalytics);
        localStorage.setItem('lifepilot_analytics', JSON.stringify(updatedAnalytics));
      }
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (isSynced) {
      await axios.delete(`${API_BASE}/api/expenses/${id}`);
      fetchAllData();
    } else {
      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      localStorage.setItem('lifepilot_expenses', JSON.stringify(updatedExpenses));

      const total = updatedExpenses.reduce((acc, c) => acc + c.amount, 0);
      const updatedAnalytics = {
        total_spent: total,
        monthly_budget: user?.monthly_budget || 30000,
        predicted_spending: total * 1.15,
        overage_warning: total * 1.15 > (user?.monthly_budget || 30000),
        overage_amount: Math.max(0, (total * 1.15) - (user?.monthly_budget || 30000)),
        recommendations: [
          "Analyze subscription invoices to cut out unused ones.",
          "Maintain home temperatures to optimize electricity spending."
        ]
      };
      setAnalytics(updatedAnalytics);
      localStorage.setItem('lifepilot_analytics', JSON.stringify(updatedAnalytics));
    }
  };

  // Rendering Tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'planner':
        return (
          <DailyPlanner
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'reminders':
        return (
          <SmartReminders
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
          />
        );
      case 'scanner':
        return <DocumentScanner onScanComplete={fetchAllData} globalLanguage={globalLanguage} />;
      case 'expenses':
        return (
          <ExpenseTracker
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            analytics={analytics}
            budget={user?.monthly_budget || 25000}
            globalLanguage={globalLanguage}
            user={user}
          />
        );
      case 'schemes':
        return <SchemeFinder schemes={schemes} globalLanguage={globalLanguage} />;
      case 'assistant':
        return <VoiceAssistant onDataUpdate={fetchAllData} globalLanguage={globalLanguage} />;
      default:
        return renderDashboardTab();
    }
  };

  // Dashboard Aggregator Tab
  const renderDashboardTab = () => {
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const pendingMeds = reminders.filter(r => r.type === 'medicine' && r.is_active);
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const budget = user?.monthly_budget || 25000;
    const clampedPct = Math.min(100, budget > 0 ? (totalSpent / budget) * 100 : 0);

    return (
      <div className="space-y-8 animate-fade-in text-left">
        {/* Core Quick Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Daily Schedule Card */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t('todays_tasks', globalLanguage)}</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {completedTasks}/{tasks.length} {t('completed', globalLanguage)}
              </span>
              <button 
                onClick={() => setActiveTab('planner')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                {t('go_planner', globalLanguage)} &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
          </div>

          {/* Medicine Card */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t('active_medicines', globalLanguage)}</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {pendingMeds.length} {t('doses_pending', globalLanguage)}
              </span>
              <button 
                onClick={() => setActiveTab('reminders')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                {t('manage_reminders', globalLanguage)} &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Pill size={20} />
            </div>
          </div>

          {/* Expense Limit Card */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t('spends_limit', globalLanguage)}</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {Math.round(clampedPct)}% {t('used', globalLanguage)}
              </span>
              <button 
                onClick={() => setActiveTab('expenses')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                {t('view_ledgers', globalLanguage)} &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Scheme recommendation preview */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t('scheme_finder', globalLanguage)}</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {schemes.length} {t('schemes_match', globalLanguage)}
              </span>
              <button 
                onClick={() => setActiveTab('schemes')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                {t('search_eligibility', globalLanguage)} &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
        </div>

        {/* Lower Row Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Scanner Upload widget */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium">
              <div className="flex items-center gap-2.5 mb-5">
                <FileText className="text-orange-500" size={18} />
                <h4 className="font-bold text-gray-800 text-base">{t('quick_ocr', globalLanguage)}</h4>
              </div>
              <DocumentScanner onScanComplete={fetchAllData} globalLanguage={globalLanguage} />
            </div>

            {/* Latest Expenses Mini log */}
            <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium text-left">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-800 text-base">{t('recent_tx', globalLanguage)}</h4>
                <button 
                  onClick={() => setActiveTab('expenses')}
                  className="text-xs font-semibold text-orange-500 hover:underline cursor-pointer"
                >
                  {t('view_ledgers', globalLanguage)}
                </button>
              </div>
              
              {expenses.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No recent expenses logged.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 3).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-3.5 bg-orange-50/5 border border-orange-100/20 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-700 leading-none">{exp.title}</p>
                        <span className="text-[10px] text-gray-400 font-semibold mt-1 inline-block bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded uppercase">
                          {exp.category}
                        </span>
                      </div>
                      <span className="text-sm font-black text-gray-700">Rs. {exp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Floating Assistant Widget (Voice and Typing) */}
          <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium h-full flex flex-col justify-between">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 border-b border-orange-50 pb-4">
                <Mic className="text-orange-500" size={18} />
                <h4 className="font-bold text-gray-800 text-base">{t('ask_ai', globalLanguage)}</h4>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <div className="w-20 h-20 rounded-full bg-orange-500/5 hover:bg-orange-500/10 flex items-center justify-center transition-all cursor-pointer shadow-inner">
                  <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-md shadow-orange-500/15" onClick={() => setActiveTab('assistant')}>
                    <Mic size={24} />
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-700 mt-4">{t('ask_ai', globalLanguage)}</p>
                <p className="text-xs text-gray-400 mt-1 px-4 leading-relaxed">
                  {t('click_mic', globalLanguage)}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('assistant')}
              className="w-full mt-4 py-2.5 border border-orange-200 hover:bg-orange-50 text-orange-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('open_assistant', globalLanguage)} &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onEditProfile={() => setIsProfileModalOpen(true)}
        globalLanguage={globalLanguage}
      />
      
      {/* Main dashboard content area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Header
          isSynced={isSynced}
          user={user}
          onEditProfile={() => setIsProfileModalOpen(true)}
          globalLanguage={globalLanguage}
          onLanguageChange={handleLanguageChange}
        />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

export default App;
