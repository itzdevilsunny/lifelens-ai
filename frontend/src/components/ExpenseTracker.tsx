import React, { useState } from 'react';
import { Plus, Trash2, Receipt, Sparkles, AlertTriangle, CheckCircle, HeartPulse, Send, MessageSquare, Bot, X } from 'lucide-react';
import { t } from '../utils/translations';

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

interface UserProfile {
  name: string;
  age: number;
  state: string;
  occupation: string;
  monthly_budget: number;
}

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (title: string, amount: number, category: string) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
  analytics: Analytics | null;
  budget: number;
  globalLanguage: string;
  user: UserProfile | null;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  analytics,
  budget,
  globalLanguage,
  user
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Advisor Chat states
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [adviceResponse, setAdviceResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    setIsSubmitting(true);
    try {
      await onAddExpense(title, parseFloat(amount), category);
      setTitle('');
      setAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const budgetPct = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const clampedPct = Math.min(100, budgetPct);

  // Financial Health Score Calculation
  let healthScore = 100;
  if (expenses.length > 0) {
    if (budgetPct > 100) {
      healthScore -= Math.min(50, Math.round((budgetPct - 100) * 0.5) + 30);
    } else if (budgetPct > 80) {
      healthScore -= 20;
    } else if (budgetPct > 50) {
      healthScore -= 10;
    }
    
    if (analytics?.overage_warning) {
      healthScore -= 15;
    }
    
    // Add positive points for categories like medicine if within budget
    const medSpend = expenses
      .filter(e => e.category.toLowerCase() === 'medicine')
      .reduce((sum, curr) => sum + curr.amount, 0);
    if (medSpend > 0 && budgetPct <= 80) {
      healthScore += 5; // Healthy healthcare spending prioritisation
    }
    
    healthScore = Math.max(10, Math.min(100, healthScore));
  }

  // Group by category for chart
  const categories = ['Grocery', 'Electricity', 'Medicine', 'Rent', 'Other'];
  const categoryTotals = categories.reduce((acc, cat) => {
    acc[cat] = expenses
      .filter(e => e.category.toLowerCase() === cat.toLowerCase())
      .reduce((sum, curr) => sum + curr.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const maxCategoryTotal = Math.max(...Object.values(categoryTotals), 1);

  // SVG Radial Donut Dimensions
  const radius = 50;

  // Consult AI Budget Advisor Logic
  const getAIAdvice = async () => {
    if (!GEMINI_API_KEY) {
      setAdviceResponse("Please set VITE_GEMINI_API_KEY in Vercel settings to unlock AI Budget Advisor recommendations.");
      return;
    }
    setLoadingAdvice(true);
    setAdviceResponse(null);

    const expenseListStr = expenses.map(e => `- ${e.title}: Rs. ${e.amount} (${e.category})`).join("\n");
    const userProfileStr = user 
      ? `User: ${user.name}, Age: ${user.age}, State: ${user.state}, Occupation: ${user.occupation}, Budget Limit: Rs. ${user.monthly_budget}`
      : "User Profile details unavailable.";

    const systemPrompt = `You are a certified financial advisor for Indian households. Translate and answer in ${globalLanguage} script.
    Analyze the user's monthly budget sheet and provide 3 brief, extremely actionable bullet points to improve their Financial Health Score (currently ${healthScore}/100).
    Be realistic, specific, and friendly. Reference PMBJP (Janaushadhi) generic stores if they spend on medicines. Refer to local cost-saving alternatives in India.
    
    Context:
    ${userProfileStr}
    Logged Expenses:
    ${expenseListStr}
    Total spent: Rs. ${totalSpent} out of budget limit: Rs. ${budget}
    
    User Query: "${query || "What changes can I make to improve my Financial Health Score?"}"`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        }),
      });
      const data = await res.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to retrieve advice. Please try again.";
      setAdviceResponse(answer);
    } catch (err) {
      console.error(err);
      setAdviceResponse("Error connecting to AI Advisor service. Please try again later.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Row: Budget Donut, Financial Health Score, & Predictive Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Radial Progress Donut */}
        <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-gray-800 text-[11px] mb-3 uppercase tracking-wider">{t('monthly_budget_used', globalLanguage)}</h3>
          
          <div className="relative w-32 h-32 flex items-center justify-center mb-3">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={ radius - 8 }
                className="stroke-orange-100"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={ radius - 8 }
                className={`transition-all duration-1000 ${
                  budgetPct > 100 ? 'stroke-rose-500' : budgetPct > 85 ? 'stroke-amber-500' : 'stroke-orange-500'
                }`}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * (radius - 8)}
                strokeDashoffset={(2 * Math.PI * (radius - 8)) - (clampedPct / 100) * (2 * Math.PI * (radius - 8))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-black text-gray-800">{Math.round(budgetPct)}%</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Rs. {totalSpent.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">Limit: Rs. {budget.toLocaleString()}</p>
        </div>

        {/* Financial Health Score (Gauge Card) */}
        <div className="bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <h3 className="font-bold text-gray-800 text-[11px] mb-2 uppercase tracking-wider flex items-center gap-1">
            <HeartPulse size={12} className="text-orange-500" />
            Financial Health
          </h3>

          <div className="relative w-32 h-20 flex items-center justify-center mt-2">
            <svg className="w-full h-full overflow-visible">
              {/* Semi-circle track */}
              <path
                d="M 16,80 A 48,48 0 0 1 112,80"
                fill="none"
                className="stroke-gray-100"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Semi-circle value indicator */}
              <path
                d="M 16,80 A 48,48 0 0 1 112,80"
                fill="none"
                className={`transition-all duration-1000 ${
                  healthScore >= 80 ? 'stroke-emerald-500' : healthScore >= 60 ? 'stroke-amber-500' : 'stroke-rose-500'
                }`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="151"
                strokeDashoffset={151 - (healthScore / 100) * 151}
              />
            </svg>
            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="text-2xl font-black text-gray-800 leading-none">{healthScore}</span>
              <span className={`text-[9px] font-bold uppercase mt-0.5 tracking-wider ${
                healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Fair' : 'Critical'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setAdvisorOpen(true)}
            className="mt-3.5 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare size={10} />
            Consult Advisor
          </button>
        </div>

        {/* Predictive Spending Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-orange-50 p-5 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2 mb-3">
              <Sparkles className="text-orange-500" size={16} />
              <h3 className="font-bold text-gray-800 text-sm">Predictive Spending & Optimization</h3>
            </div>
            
            {analytics ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-orange-50/20 rounded-xl border border-orange-100/50 text-left">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{t('forecasted_bill', globalLanguage)}</span>
                    <span className="text-sm font-extrabold text-gray-700">Rs. {analytics.predicted_spending.toLocaleString()}</span>
                  </div>
                  
                  {analytics.overage_warning ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-left">
                      <AlertTriangle className="text-rose-500 shrink-0" size={16} />
                      <div>
                        <span className="text-[9px] text-rose-800 font-bold uppercase block">{t('budget_overage', globalLanguage)}</span>
                        <span className="text-xs font-extrabold text-rose-600">Rs. {analytics.overage_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2 text-left">
                      <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                      <div>
                        <span className="text-[9px] text-emerald-800 font-bold uppercase block">Status</span>
                        <span className="text-xs font-extrabold text-emerald-600">{t('on_budget', globalLanguage)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="text-left">
                  <span className="text-[9px] text-orange-600 font-bold uppercase tracking-wider block mb-1.5">
                    💡 {t('optimization_recommendations', globalLanguage)}
                  </span>
                  <ul className="space-y-1">
                    {analytics.recommendations.map((rec, i) => (
                      <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                        <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-xs">Collecting expense logs to forecast spending...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Budget Advisor Modal Overlay */}
      {advisorOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium max-w-lg w-full mx-4 relative text-left animate-scale-in">
            <button
              onClick={() => {
                setAdvisorOpen(false);
                setQuery('');
                setAdviceResponse(null);
              }}
              aria-label="Close Advisor"
              title="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 border-b border-orange-50 pb-3.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Bot size={16} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">AI Budget Advisor</h4>
                <p className="text-[10px] text-gray-400">Personalized savings strategy & recommendations</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50/20 border border-orange-100/40 p-4 rounded-xl max-h-[220px] overflow-y-auto">
                {adviceResponse ? (
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{adviceResponse}</p>
                ) : loadingAdvice ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <span className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-[10px] font-bold text-gray-500">Formulating custom savings strategy...</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Ask the advisor how to optimize your budget limits or find cheaper generic medicine alternatives!</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. How can I lower my electricity costs?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && getAIAdvice()}
                  className="flex-1 px-3 py-2 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={getAIAdvice}
                  disabled={loadingAdvice}
                  aria-label="Send Query"
                  title="Send"
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lower Row: Add Expense + Expense List & Category Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Expense (Left) */}
        <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium h-fit">
          <h3 className="font-bold text-gray-800 text-base border-b border-orange-50 pb-4 mb-4">{t('add_expense', globalLanguage)}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{t('item_title', globalLanguage)}</label>
              <input
                type="text"
                placeholder={t('item_placeholder', globalLanguage)}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{t('amount_rs', globalLanguage)}</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{t('category', globalLanguage)}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2.5 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 bg-white text-gray-600 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all duration-300 shadow-md shadow-orange-500/10 cursor-pointer text-sm"
            >
              <Plus size={16} />
              <span>{t('record_expense', globalLanguage)}</span>
            </button>
          </form>
        </div>

        {/* Expense List (Center & Right) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-orange-50 p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-orange-50 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Receipt className="text-orange-500" size={18} />
                <h3 className="font-bold text-gray-800 text-base">{t('expense_log', globalLanguage)}</h3>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            {expenses.length > 0 && (
              <div className="mb-6 p-4 border border-orange-100/50 rounded-xl bg-orange-50/10">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-3">
                  📊 {t('spends_by_category', globalLanguage)}
                </span>
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const total = categoryTotals[cat] || 0;
                    const barWidth = Math.max(4, Math.round((total / maxCategoryTotal) * 100));
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-18 text-xs text-gray-600 font-semibold truncate">{cat}</span>
                        <div className="flex-1 h-3.5 bg-gray-100 rounded-md overflow-hidden relative">
                          <div 
                            className="h-full bg-orange-500 rounded-md transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-xs font-bold text-gray-700">Rs. {total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ledger list */}
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-left">
                <p className="text-sm">{t('no_expenses', globalLanguage)}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-white border border-orange-100/30 rounded-xl hover:border-orange-100 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {exp.category[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-700 leading-snug">{exp.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span className="font-semibold text-orange-500">{exp.category}</span>
                          {exp.doc_id && (
                            <>
                              <span>•</span>
                              <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded">OCR Scan</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-gray-700">Rs. {exp.amount.toLocaleString()}</span>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        aria-label="Delete Expense"
                        title="Delete"
                        className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer animate-fade-in"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
