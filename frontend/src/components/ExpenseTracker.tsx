import React, { useState } from 'react';
import { Plus, Trash2, Receipt, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';


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

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (title: string, amount: number, category: string) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
  analytics: Analytics | null;
  budget: number;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  analytics,
  budget
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Upper Row: Budget Radial & Predictive Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Radial Progress Donut */}
        <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-wider">Monthly Budget Used</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-orange-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`transition-all duration-1000 ${
                  budgetPct > 100 ? 'stroke-rose-500' : budgetPct > 85 ? 'stroke-amber-500' : 'stroke-orange-500'
                }`}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-gray-800">{Math.round(budgetPct)}%</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Rs. {totalSpent.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Limit: Rs. {budget.toLocaleString()}</p>
        </div>

        {/* Predictive Analytics card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-orange-50 p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-orange-50 pb-3 mb-4">
              <Sparkles className="text-orange-500" size={18} />
              <h3 className="font-bold text-gray-800 text-base">Predictive Spending & Optimization</h3>
            </div>
            
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-orange-50/20 rounded-xl border border-orange-100/50">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Forecasted Bill</span>
                    <span className="text-base font-extrabold text-gray-700">Rs. {analytics.predicted_spending.toLocaleString()}</span>
                  </div>
                  
                  {analytics.overage_warning ? (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="text-rose-500" size={20} />
                      <div className="text-left">
                        <span className="text-[10px] text-rose-800 font-bold uppercase block">Budget Overage</span>
                        <span className="text-sm font-extrabold text-rose-600">Rs. {analytics.overage_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2">
                      <CheckCircle className="text-emerald-500" size={20} />
                      <div className="text-left">
                        <span className="text-[10px] text-emerald-800 font-bold uppercase block">Status</span>
                        <span className="text-sm font-extrabold text-emerald-600">On Budget</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div>
                  <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider block mb-2">
                    💡 Optimization Recommendations
                  </span>
                  <ul className="space-y-1.5">
                    {analytics.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Collecting expense logs to forecast spending...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Add Expense + Expense List & Category Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Expense (Left) */}
        <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium h-fit">
          <h3 className="font-bold text-gray-800 text-base border-b border-orange-50 pb-4 mb-4">Add Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Item / Store Title</label>
              <input
                type="text"
                placeholder="e.g. Grocery staples, Electricity bill"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Amount (Rs.)</label>
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
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Category</label>
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
              <span>Record Expense</span>
            </button>
          </form>
        </div>

        {/* Expense List (Center & Right) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-orange-50 p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-orange-50 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Receipt className="text-orange-500" size={18} />
                <h3 className="font-bold text-gray-800 text-base">Expense Log</h3>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            {expenses.length > 0 && (
              <div className="mb-6 p-4 border border-orange-100/50 rounded-xl bg-orange-50/10">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-3">
                  📊 Spends by Category
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
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No expenses recorded for this month.</p>
                <p className="text-xs mt-1">Add expenses or upload bills via OCR to build your ledger!</p>
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
                        className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
