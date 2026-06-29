import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
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
  
  // Global Language state (accessible by all modules)
  const [globalLanguage, setGlobalLanguage] = useState<string>('English');

  // App States
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  // Fetch all data from backend
  const fetchAllData = async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      
      // User Profile
      const userRes = await axios.get(`${API_BASE}/api/user`);
      setUser(userRes.data);

      // Tasks
      const tasksRes = await axios.get(`${API_BASE}/api/tasks?date=${todayDate}`);
      setTasks(tasksRes.data);

      // Reminders
      const remindersRes = await axios.get(`${API_BASE}/api/reminders`);
      setReminders(remindersRes.data);

      // Expenses
      const expensesRes = await axios.get(`${API_BASE}/api/expenses`);
      setExpenses(expensesRes.data);

      // Schemes
      const schemesRes = await axios.get(`${API_BASE}/api/schemes`);
      setSchemes(schemesRes.data);

      // Analytics (requires expenses to load first or triggers recalculation)
      const analyticsRes = await axios.get(`${API_BASE}/api/expenses/analytics`);
      setAnalytics(analyticsRes.data);

      setIsSynced(true);
    } catch (err) {
      console.warn("Could not sync with backend APIs. Running in disconnected fallback state:", err);
      setIsSynced(false);
      
      // Load mock local defaults if backend is down so dashboard never crashes
      setUser({
        name: "Aarav Sharma (Offline)",
        age: 32,
        state: "Maharashtra",
        occupation: "Small Business Owner",
        monthly_budget: 30000
      });
      setTasks([
        { id: 1, title: "Review property tax document", is_completed: false, due_time: "10:00", date: new Date().toISOString().split('T')[0] },
        { id: 2, title: "Afternoon outdoor walk", is_completed: true, due_time: "16:30", date: new Date().toISOString().split('T')[0] }
      ]);
      setReminders([
        { id: 1, title: "Telmisartan 40mg", time: "08:00", type: "medicine", details: "Dosage: 1 tablet. Before breakfast", is_active: true },
        { id: 2, title: "Electricity Bill Due", time: "18:00", type: "bill", details: "Amount due Rs. 1,850", is_active: true }
      ]);
      setExpenses([
        { id: 1, title: "Grocery staples D-Mart", amount: 2450, category: "Grocery", date: new Date().toISOString().split('T')[0], doc_id: null }
      ]);
      setAnalytics({
        total_spent: 2450,
        monthly_budget: 30000,
        predicted_spending: 2817.5,
        overage_warning: false,
        overage_amount: 0,
        recommendations: [
          "Grocery spends are high. Save 12% by opting for wholesale staples.",
          "Unplug the AC during peak afternoon to reduce electricity utility charges."
        ]
      });
      setSchemes([
        {
          id: 1,
          title: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
          description: "National Mission for Financial Inclusion to ensure access to financial services, namely, basic savings & deposit accounts, remittance, credit, insurance, pension in an affordable manner.",
          eligibility: "Any Indian citizen above 10 years of age who does not have an existing bank account.",
          benefit: "Zero-balance savings account, RuPay debit card, Rs. 2 Lakh accidental insurance cover, and overdraft facility up to Rs. 10,000.",
          state: "All"
        },
        {
          id: 2,
          title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
          description: "The largest health assurance scheme in the world which aims to provide free health cover up to secondary and tertiary care hospitalization.",
          eligibility: "Families identified in SECC (Socio-Economic Caste Census) database, mainly low-income, landless, or unorganized sector workers.",
          benefit: "Health cover of Rs. 5 Lakh per family per year for secondary and tertiary care hospitalization, covering surgery, medicines, and diagnostics.",
          state: "All"
        },
        {
          id: 3,
          title: "Sukanya Samriddhi Yojana (SSY)",
          description: "A small deposit scheme for girl child launched under 'Beti Bachao Beti Padhao' campaign to secure education and marriage expenses.",
          eligibility: "Parents or legal guardians of a girl child below the age of 10. Max 2 accounts per family.",
          benefit: "Attractive interest rate (historically 8%+, tax-exempt under Section 80C), maturity after 21 years or upon marriage after age 18.",
          state: "All"
        },
        {
          id: 4,
          title: "Atal Pension Yojana (APY)",
          description: "Pension scheme for citizens of India focused on the unorganized sector workers, allowing voluntary contributions.",
          eligibility: "All Indian citizens aged between 18 and 40 years holding a savings bank account.",
          benefit: "Guaranteed minimum monthly pension of Rs. 1,000, Rs. 2,000, Rs. 3,000, Rs. 4,000 or Rs. 5,000 after attaining the age of 60 years.",
          state: "All"
        },
        {
          id: 5,
          title: "Pradhan Mantri Mudra Yojana (PMMY)",
          description: "Scheme to provide collateral-free loans to micro and small enterprises for business expansion, startup funding, or modernization.",
          eligibility: "Small business owners, micro-enterprises, shopkeepers, and startups in manufacturing, trading, or service sectors.",
          benefit: "Collateral-free loans up to Rs. 10 Lakh under three categories: Shishu (up to Rs. 50k), Kishor (Rs. 50k - 5L), and Tarun (Rs. 5L - 10L).",
          state: "All"
        },
        {
          id: 6,
          title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
          description: "Central sector scheme that provides income support to all landholding farmer families across the country.",
          eligibility: "Farmer families who own cultivable land (subject to exclusion criteria).",
          benefit: "Direct income support of Rs. 6,000 per year, payable in three equal installments of Rs. 2,000 directly to bank accounts.",
          state: "All"
        },
        {
          id: 7,
          title: "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
          description: "Voluntary and contributory pension scheme for unorganized workers to secure their old age.",
          eligibility: "Unorganized workers (e.g. street vendors, maids, rickshaw pullers) aged 18-40 years with monthly income of Rs. 15,000 or less.",
          benefit: "Minimum assured monthly pension of Rs. 3,000 after attaining the age of 60 years, with equal matching contribution by Central Government.",
          state: "All"
        },
        {
          id: 8,
          title: "Ladli Behna Yojana (MP State)",
          description: "State-specific welfare scheme to enhance economic independence and health of women in Madhya Pradesh.",
          eligibility: "Women residents of Madhya Pradesh aged 21-60 years, belonging to families with annual income less than Rs. 2.5 Lakh.",
          benefit: "Monthly direct benefit transfer of Rs. 1,250 directly into the beneficiary's bank account.",
          state: "Madhya Pradesh"
        },
        {
          id: 9,
          title: "Sanjay Gandhi Niradhar Yojana (Maharashtra)",
          description: "State-specific financial support scheme for destitute persons, disabled individuals, widows, and people suffering from major illnesses.",
          eligibility: "Destitute, elderly (above 65), disabled persons (40%+ disability) who are residents of Maharashtra with annual family income below Rs. 21,000.",
          benefit: "Monthly financial assistance of Rs. 1,000 for single persons, and Rs. 1,200 for families with two or more beneficiaries.",
          state: "Maharashtra"
        }
      ]);
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
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleToggleTask = async (id: number, isCompleted: boolean) => {
    if (isSynced) {
      await axios.put(`${API_BASE}/api/tasks/${id}`, { is_completed: isCompleted });
      fetchAllData();
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: isCompleted } : t));
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (isSynced) {
      await axios.delete(`${API_BASE}/api/tasks/${id}`);
      fetchAllData();
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
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
      setReminders(prev => [...prev, newRem]);
    }
  };

  const handleToggleReminder = async (id: number, isActive: boolean) => {
    if (isSynced) {
      await axios.put(`${API_BASE}/api/reminders/${id}`, { is_active: isActive });
      fetchAllData();
    } else {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, is_active: isActive } : r));
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (isSynced) {
      await axios.delete(`${API_BASE}/api/reminders/${id}`);
      fetchAllData();
    } else {
      setReminders(prev => prev.filter(r => r.id !== id));
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
      
      // Calculate local mock analytics updates
      const total = updatedExpenses.reduce((acc, c) => acc + c.amount, 0);
      setAnalytics({
        total_spent: total,
        monthly_budget: user?.monthly_budget || 30000,
        predicted_spending: total * 1.15,
        overage_warning: total * 1.15 > (user?.monthly_budget || 30000),
        overage_amount: Math.max(0, (total * 1.15) - (user?.monthly_budget || 30000)),
        recommendations: [
          "Grocery limits exceeded. Buy staples in bulk to save cash.",
          "Check Jan Aushadhi generic stores for medicine discounts."
        ]
      });
    }
  };

  // User Profile Update
  const handleSaveProfile = async (updatedUser: { name: string; age: number; state: string; occupation: string; monthly_budget: number }) => {
    try {
      if (isSynced) {
        await axios.put(`${API_BASE}/api/user`, updatedUser);
        await fetchAllData();
      } else {
        setUser(updatedUser);
        if (analytics) {
          setAnalytics({
            ...analytics,
            monthly_budget: updatedUser.monthly_budget,
            overage_warning: analytics.total_spent * 1.15 > updatedUser.monthly_budget,
            overage_amount: Math.max(0, (analytics.total_spent * 1.15) - updatedUser.monthly_budget)
          });
        }
      }
    } catch (err) {
      console.warn("Could not save profile to backend. Saving locally instead.", err);
      setUser(updatedUser);
      if (analytics) {
        setAnalytics({
          ...analytics,
          monthly_budget: updatedUser.monthly_budget,
          overage_warning: analytics.total_spent * 1.15 > updatedUser.monthly_budget,
          overage_amount: Math.max(0, (analytics.total_spent * 1.15) - updatedUser.monthly_budget)
        });
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
      const total = updatedExpenses.reduce((acc, c) => acc + c.amount, 0);
      setAnalytics({
        total_spent: total,
        monthly_budget: user?.monthly_budget || 30000,
        predicted_spending: total * 1.15,
        overage_warning: total * 1.15 > (user?.monthly_budget || 30000),
        overage_amount: Math.max(0, (total * 1.15) - (user?.monthly_budget || 30000)),
        recommendations: [
          "Analyze subscription invoices to cut out unused ones.",
          "Maintain home temperatures to optimize electricity spending."
        ]
      });
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
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Today's Tasks</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {completedTasks}/{tasks.length} Completed
              </span>
              <button 
                onClick={() => setActiveTab('planner')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                Go to Daily Planner &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
          </div>

          {/* Medicine Card */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Medicines</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {pendingMeds.length} Doses Pending
              </span>
              <button 
                onClick={() => setActiveTab('reminders')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                Manage Reminders &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Pill size={20} />
            </div>
          </div>

          {/* Expense Limit Card */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Spends Limit Used</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {Math.round(clampedPct)}% Used
              </span>
              <button 
                onClick={() => setActiveTab('expenses')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                View Ledgers &rarr;
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Scheme recommendation preview */}
          <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Scheme Finder</span>
              <span className="text-xl font-black text-gray-700 mt-1 block">
                {schemes.length} Schemes Match
              </span>
              <button 
                onClick={() => setActiveTab('schemes')} 
                className="text-[10px] text-orange-500 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
              >
                Search Eligibilities &rarr;
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
                <h4 className="font-bold text-gray-800 text-base">Quick OCR Scanner</h4>
              </div>
              <DocumentScanner onScanComplete={fetchAllData} globalLanguage={globalLanguage} />
            </div>

            {/* Latest Expenses Mini log */}
            <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium text-left">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-800 text-base">Recent Transactions</h4>
                <button 
                  onClick={() => setActiveTab('expenses')}
                  className="text-xs font-semibold text-orange-500 hover:underline cursor-pointer"
                >
                  View All
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
                <h4 className="font-bold text-gray-800 text-base">LifePilot AI Mic</h4>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <div className="w-20 h-20 rounded-full bg-orange-500/5 hover:bg-orange-500/10 flex items-center justify-center transition-all cursor-pointer shadow-inner">
                  <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-md shadow-orange-500/15" onClick={() => setActiveTab('assistant')}>
                    <Mic size={24} />
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-700 mt-4">Ask Everyday AI</p>
                <p className="text-xs text-gray-400 mt-1 px-4 leading-relaxed">
                  Click the button or go to the Voice Assistant tab to chat or speak commands directly.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('assistant')}
              className="w-full mt-4 py-2.5 border border-orange-200 hover:bg-orange-50 text-orange-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Open Interactive Assistant &rarr;
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
      />
      
      {/* Main dashboard content area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Header
          isSynced={isSynced}
          user={user}
          onEditProfile={() => setIsProfileModalOpen(true)}
          globalLanguage={globalLanguage}
          onLanguageChange={setGlobalLanguage}
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
