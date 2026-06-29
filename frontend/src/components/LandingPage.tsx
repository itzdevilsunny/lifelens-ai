import React, { useState } from 'react';
import { 
  Landmark, 
  Sparkles, 
  Upload, 
  Mic, 
  Shield, 
  RefreshCw, 
  LayoutDashboard, 
  CheckCircle, 
  ArrowRight, 
  HeartPulse, 
  Bot, 
  ChevronDown,
  TrendingUp
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'ocr' | 'finance' | 'schemes' | 'voice'>('ocr');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-orange-100 selection:text-orange-800">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/10">
              <LayoutDashboard size={20} />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-lg text-gray-900 leading-none tracking-tight block">LifeLens AI</span>
              <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase block">Everyday Assistant</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors">What is LifeLens</a>
            <a href="#features" className="text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors">How it Works</a>
            <a href="#benefits" className="text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors">Benefits</a>
          </nav>

          {/* Call to Action */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onEnterDashboard}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Launch Dashboard</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-100/30 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 text-left space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={11} />
              <span>Offline-First Multilingual AI</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight">
              Your Everyday Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">AI Assistant</span>
            </h2>
            
            <p className="text-base text-gray-500 leading-relaxed">
              Bridging the gap between paper records and digital intelligence. LifeLens AI helps Indian households organize bills, medicine prescriptions, notices, and budgets—speaking 11 regional languages and working 100% of the time, even offline.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={onEnterDashboard}
                className="px-7 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Get Started for Free</span>
                <ArrowRight size={15} />
              </button>
              <a 
                href="#features" 
                className="px-7 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-colors cursor-pointer flex items-center justify-center"
              >
                Explore Features
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-2xl font-black text-gray-900">11+</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Indian Languages</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">100%</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Offline Functionality</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">1 Click</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Official Portal Apply</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual (Mock Dashboard UI) */}
          <div className="lg:col-span-6 relative">
            <div className="border border-gray-200 rounded-3xl bg-white shadow-2xl p-5 text-left border-t-4 border-t-orange-500/80 animate-fade-in relative z-10 max-w-lg mx-auto">
              {/* Mock Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <LayoutDashboard size={15} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-gray-800 leading-none">LifeLens Hub</h4>
                    <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sync Online
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400">June 2026</span>
              </div>

              {/* Mock Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Visual health score */}
                <div className="p-4 border border-orange-100/50 bg-gradient-to-br from-orange-50/20 to-amber-50/20 rounded-2xl flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Financial Health</span>
                    <HeartPulse size={14} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800">82/100</p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Excellent</span>
                  </div>
                </div>

                {/* Scanned records */}
                <div className="p-4 border border-gray-100 bg-gray-50/30 rounded-2xl flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OCR Scanned</span>
                    <Upload size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800">24</p>
                    <p className="text-[9px] text-gray-400 mt-1">Receipts & Prescription PDFs</p>
                  </div>
                </div>
              </div>

              {/* Mock Schemes Finder Card */}
              <div className="mt-4 p-4 border border-orange-100 bg-white rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Landmark size={16} />
                  </div>
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-gray-800">PM Jan Dhan Yojana (PMJDY)</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">Matched from Maharashtra Profile</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[9px] rounded-lg transition-colors cursor-pointer">
                  Apply Now
                </span>
              </div>

              {/* Chat bubble preview */}
              <div className="mt-4 flex gap-2.5 items-start bg-orange-50/20 border border-orange-100/50 p-3 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Bot size={12} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-orange-700 leading-none">LifeLens voice</p>
                  <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                    "नमस्ते! मैंने आपके पर्चे के लिए generic medicines (PMBJP) के विकल्प ढूंढ लिए हैं। आप ₹240 बचा सकते हैं।"
                  </p>
                </div>
              </div>
            </div>
            {/* Soft decorative shadow block */}
            <div className="absolute top-6 left-6 right-6 bottom-6 border border-gray-100 bg-gray-50 rounded-3xl -z-10 transform rotate-2 max-w-lg mx-auto" />
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="about" className="py-20 px-6 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-red-600 text-[10px] font-bold uppercase tracking-wider">
            <span>The Challenge</span>
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">What Problem is LifeLens Solving?</h3>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Everyday Indian households manage critical life details across paper slips, pharmacy bill packets, and diary notes. Traditional apps are built for tech-savvy users and crash when internet connections drop.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 text-left">
            {/* The Old Way */}
            <div className="bg-white border border-gray-200 p-8 rounded-3xl space-y-4">
              <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest block">The Old Way</span>
              <ul className="space-y-3.5 text-xs text-gray-500">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 text-base leading-none shrink-0 mt-0.5">✕</span>
                  <span><strong>Scattered Paper Receipts:</strong> Losing grocery bills and hospital prescriptions in drawers, leading to untracked spending.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 text-base leading-none shrink-0 mt-0.5">✕</span>
                  <span><strong>Missed Healthcare Schedules:</strong> Forgetting pill timings or running out of critical medicines without reminders.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 text-base leading-none shrink-0 mt-0.5">✕</span>
                  <span><strong>Missed Welfare Opportunities:</strong> Not knowing you are eligible for government schemes like Mudra or Jan Dhan due to complex criteria.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 text-base leading-none shrink-0 mt-0.5">✕</span>
                  <span><strong>Language & Connectivity Barriers:</strong> Apps only supporting English and freezing up when local networks go offline.</span>
                </li>
              </ul>
            </div>

            {/* The LifeLens Way */}
            <div className="bg-white border border-orange-200 p-8 rounded-3xl space-y-4 shadow-lg shadow-orange-500/[0.02]">
              <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest block">The LifeLens Way</span>
              <ul className="space-y-3.5 text-xs text-gray-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 text-base leading-none shrink-0 mt-0.5">✓</span>
                  <span><strong>Everyday OCR Scanner:</strong> Snap a photo of a bill, notice, or doctor slip. AI automatically catalogs it and lists recommendations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 text-base leading-none shrink-0 mt-0.5">✓</span>
                  <span><strong>Unified Health Reminders:</strong> Automated schedules extracted directly from prescription scans so you never skip doses.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 text-base leading-none shrink-0 mt-0.5">✓</span>
                  <span><strong>Profile-Aware Scheme Matcher:</strong> Dynamically matches schemes to your profile and lets you apply with one click.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 text-base leading-none shrink-0 mt-0.5">✓</span>
                  <span><strong>100% Fail-Safe Offline Sync:</strong> Full local storage offline compatibility. Work offline and sync to the cloud database when back online.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Details Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={11} />
            <span>Power Features</span>
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore the LifeLens Engine</h3>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A comprehensive suite of personal assistant tools engineered for high performance, ease of use, and local accessibility.
          </p>

          {/* Sub-tabs selector */}
          <div className="flex justify-center border-b border-gray-100 pt-6 max-w-md mx-auto">
            <button 
              onClick={() => setActiveFeatureTab('ocr')}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                activeFeatureTab === 'ocr' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              OCR Vision
            </button>
            <button 
              onClick={() => setActiveFeatureTab('finance')}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                activeFeatureTab === 'finance' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Budget Advisor
            </button>
            <button 
              onClick={() => setActiveFeatureTab('schemes')}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                activeFeatureTab === 'schemes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Gov Schemes
            </button>
            <button 
              onClick={() => setActiveFeatureTab('voice')}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                activeFeatureTab === 'voice' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Voice Assistant
            </button>
          </div>

          {/* Tabs Content */}
          <div className="pt-10 min-h-[300px]">
            {activeFeatureTab === 'ocr' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-fade-in text-left">
                <div className="lg:col-span-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <Upload size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Everyday Vision OCR Scanner</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Upload snapshots of your printed invoices, municipal warnings, or hand-written doctor prescriptions. The integrated AI Vision models identify text, extract items, auto-classify categories, and automatically update your files:
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Bills:</strong> Auto-logs total amount and details inside expense trackers.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Prescriptions:</strong> Populates medicine dosage, instructions, and time schedules.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Notices:</strong> Extracts deadlines and puts task reminders on your planner.</span></li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-orange-50/10 border border-orange-100 rounded-3xl p-6">
                  {/* File Upload Preview Panel Mockup */}
                  <div className="border-2 border-dashed border-orange-200 rounded-2xl p-6 bg-white text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mx-auto mb-3">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-bold text-gray-700">grocery_dmart_receipt.jpg</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">Successfully Scanned!</span>
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5 text-left">
                      <div>
                        <span className="text-[9px] font-bold text-orange-600 uppercase">Classified As</span>
                        <p className="text-xs font-bold text-gray-800">Grocery Bill (Amount: ₹2,450.00)</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-orange-600 uppercase">AI Recommendation</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          "Over 35% of this bill was spent on non-essential branded snacks. Opting for D-Mart brand staples saves up to ₹250."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'finance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-fade-in text-left">
                <div className="lg:col-span-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <TrendingUp size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">AI Budget & Savings Health Advisor</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Take control of household savings. LifeLens calculates an active **Financial Health Score (0 - 100)** measuring your month-on-month savings performance, category spending balances, and budget limit utilization.
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Dynamic Gauge:</strong> Speed-gauge visualizing budget safety margins.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Empathetic Assistant:</strong> Generates actionable tips to lower electric or grocery spending.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Advisor Chat:</strong> Consult a dedicated financial coach modal powered by AI.</span></li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-orange-50/10 border border-orange-100 rounded-3xl p-6">
                  {/* Gauge Preview Mockup */}
                  <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center">
                    <h5 className="font-extrabold text-xs text-gray-700 uppercase tracking-wider mb-4">Household Savings Health</h5>
                    <div className="relative w-40 h-24 mx-auto flex items-end justify-center overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 bottom-0 rounded-t-full border-[14px] border-gray-100" />
                      <div className="absolute top-0 left-0 right-0 bottom-0 rounded-t-full border-[14px] border-orange-500 border-b-transparent border-r-transparent transform rotate-[130deg] origin-center" />
                      <div className="z-10 text-center pb-2">
                        <p className="text-2xl font-black text-gray-800 leading-none">78%</p>
                        <span className="text-[9px] text-orange-600 font-bold uppercase tracking-wider block mt-1">Healthy</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-4 italic">
                      "Monthly budget used: ₹23,450 / ₹30,000. You have ₹6,550 safety buffer."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'schemes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-fade-in text-left">
                <div className="lg:col-span-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <Landmark size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Government Scheme Finder & Portal Sync</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Democratizing welfare access. LifeLens AI securely matches your demographic profile (Age, State, and Occupation) with available central/state government schemes, listing eligibility details and benefits in your native script.
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Direct Application:</strong> "Apply Now" buttons link straight to secure portals (Jan Dhan, Mudra, APY).</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>AI Matcher Chat:</strong> Talk to an AI helper that knows what schemes you qualify for.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>State Welfare:</strong> Covers state specific schemes like MP's Ladli Behna or MH's Sanjay Gandhi Niradhar.</span></li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-orange-50/10 border border-orange-100 rounded-3xl p-6">
                  {/* Scheme Card Detail Mockup */}
                  <div className="bg-white border border-orange-50 rounded-2xl p-5 shadow-sm text-left">
                    <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider">All India Scheme</span>
                    <h5 className="font-extrabold text-sm text-gray-800 mt-2">Pradhan Mantri Mudra Yojana (PMMY)</h5>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      Offers collateral-free business loans up to Rs. 10 Lakh for expansion or modernization.
                    </p>
                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">Eligible: Small business owners</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600 cursor-pointer">
                        Apply Now &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'voice' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-fade-in text-left">
                <div className="lg:col-span-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <Mic size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Multilingual Voice & Chat Assistant</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Voice interface designed for Indian users. Converse naturally, ask questions, or issue commands in any of 11 regional languages. The assistant transcribes, responds in your language, and reads responses aloud.
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>11 Indian Languages:</strong> Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, and more.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>High Fidelity Speech Synthesis:</strong> High-quality text-to-speech engine reading out details.</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={12} className="text-orange-500" /><span><strong>Natural Transcription:</strong> High accuracy translation of spoken dialects.</span></li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-orange-50/10 border border-orange-100 rounded-3xl p-6">
                  {/* Voice Wave Visualizer Mockup */}
                  <div className="bg-white border border-gray-100 p-6 rounded-2xl text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-500/10">
                      <Mic size={20} />
                    </div>
                    <p className="text-xs font-bold text-orange-600">Listening to Voice Command...</p>
                    <div className="flex justify-center items-center gap-1.5 h-6">
                      <span className="w-1 h-3 bg-orange-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1 h-5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-6 bg-orange-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="w-1 h-4 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-2 bg-orange-200 rounded-full animate-bounce [animation-delay:0.1s]" />
                    </div>
                    <span className="text-[10px] text-gray-400 italic font-medium block">
                      "Show schemes matching Maharashtra profile..."
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-[10px] font-bold uppercase tracking-wider">
            <span>Workflow</span>
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">How Does LifeLens AI Work?</h3>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Three simple steps to transform your household administration into an organized, automated platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
            {/* Step 1 */}
            <div className="bg-white border border-gray-200 p-6 rounded-3xl text-left space-y-3 relative">
              <span className="text-3xl font-black text-orange-100 absolute top-4 right-6">01</span>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                <Upload size={18} />
              </div>
              <h4 className="text-base font-bold text-gray-800">Scan or Speak</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Take a picture of any invoice, doctor prescription, or municipal notice. Alternatively, use the mic to state your budget query in your regional language.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-gray-200 p-6 rounded-3xl text-left space-y-3 relative">
              <span className="text-3xl font-black text-orange-100 absolute top-4 right-6">02</span>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                <Sparkles size={18} />
              </div>
              <h4 className="text-base font-bold text-gray-800">AI Visions & Extraction</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                LifeLens AI runs OCR models to extract numbers, dates, tasks, and medication times, automatically filing them under relevant database cards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-gray-200 p-6 rounded-3xl text-left space-y-3 relative">
              <span className="text-3xl font-black text-orange-100 absolute top-4 right-6">03</span>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                <LayoutDashboard size={18} />
              </div>
              <h4 className="text-base font-bold text-gray-800">Actionable Portals</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Check active doses in reminders, check your savings health scores, apply directly to government schemes, or chat with your interactive financial advisor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-[10px] font-bold uppercase tracking-wider">
            <span>Benefits</span>
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Why Choose LifeLens AI?</h3>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Designed for convenience, security, and absolute accessibility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 text-left">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">1. Safe & Secure Storage</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                All records, budget history, and documents are stored securely using Supabase cloud infrastructure, with complete local storage mirroring.
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <RefreshCw size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">2. Active Offline Resilience</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Works seamlessly in remote locations. Write, update, or scan items offline—the system safely caches edits locally and reconciles when connected.
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">3. Unified Personal Coach</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Bridges daily organization, medicine timing schedules, scheme matching, and budget coaching into a single, cohesive chatbot conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h3>
            <p className="text-xs text-gray-400">Everything you need to know about the LifeLens AI platform.</p>
          </div>

          <div className="space-y-4 pt-6 text-left">
            {[
              {
                q: "What languages are supported by LifeLens AI?",
                a: "LifeLens AI fully supports English and 10 regional Indian languages including Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Gujarati (ગુજરાતી), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), and Urdu (اردو). You can toggle the language in the header dropdown."
              },
              {
                q: "How does the offline mode work?",
                a: "When internet connectivity is down, LifeLens AI switches to disconnected fallback mode automatically (marked with a 'Sync Offline' badge). All your updates, task changes, medicine logging, and document uploads are processed locally using your browser's local storage. Once network connection is restored, the application is ready to sync back to the cloud."
              },
              {
                q: "Is my document data private and secure?",
                a: "Yes. All uploaded files and scanned receipts/prescriptions are secure. Client-side OCR and direct vision calls parse details inside safe, encrypted connections, and local fallbacks run directly on your browser without sending any files across the internet."
              },
              {
                q: "What happens when the AI quota is reached?",
                a: "To ensure absolute reliability, if the live Gemini Vision or Schemes API limits are reached, LifeLens AI immediately falls back to a smart offline matching engine. It parses keywords locally (e.g. searching 'Mudra' or uploading an invoice named 'dmart_bill.jpg') and displays correct information, ensuring the app never crashes."
              }
            ].map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className="border border-gray-200 bg-white rounded-2xl overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-xs text-gray-700 hover:text-orange-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={14} className={`transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3.5 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 px-6 bg-gradient-to-tr from-orange-500/5 to-amber-500/5 border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Simplify Your Everyday Life Today</h3>
          <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
            Experience the power of offline-first AI document parsing, budget advising, and Indian government scheme matching.
          </p>
          <div className="pt-2">
            <button 
              onClick={onEnterDashboard}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 transform active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Launch Dashboard Now</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        <p>© 2026 LifeLens AI. Bridging paper to digital intelligence. All Rights Reserved.</p>
      </footer>
    </div>
  );
};
