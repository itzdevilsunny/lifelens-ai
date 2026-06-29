import React, { useState, useEffect, useRef } from 'react';
import { 
  SearchCode, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Award, 
  Landmark, 
  Bot, 
  Send, 
  User, 
  Sparkles,
  HelpCircle as QuestionIcon
} from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

interface Scheme {
  id: number;
  title: string;
  description: string;
  eligibility: string;
  benefit: string;
  state: string;
  apply_url?: string;
}

interface SchemeFinderProps {
  schemes: Scheme[];
  globalLanguage: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

// Client-side Gemini REST API call
async function callGeminiForSchemes(prompt: string, history: { role: string; parts: { text: string }[] }[]): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const contents = [
    ...history,
    { role: "user", parts: [{ text: prompt }] }
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `API error ${res.status}`;
    const err: any = new Error(errMsg);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I could not generate a response. Please try again.";
}

export const SchemeFinder: React.FC<SchemeFinderProps> = ({ schemes, globalLanguage }) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'chat'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-translate welcome message
  useEffect(() => {
    const fetchWelcome = async () => {
      if (!GEMINI_API_KEY) {
        setChatMessages([{
          sender: 'assistant',
          text: `Hello! I am your Government Scheme Helper. Please configure VITE_GEMINI_API_KEY for queries in ${globalLanguage}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        return;
      }
      setChatLoading(true);
      try {
        const welcomePrompt = `Generate a warm, friendly welcome greeting in 2 sentences as "LifePilot Scheme Finder Helper". Introduce yourself, say you can match them with schemes from the database, and ask them to share their age, state, or occupation. The greeting MUST be entirely in the selected language: ${globalLanguage} (using its native script/alphabet).`;
        const welcomeText = await callGeminiForSchemes(welcomePrompt, []);
        setChatMessages([{
          sender: 'assistant',
          text: welcomeText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch {
        setChatMessages([{
          sender: 'assistant',
          text: `Namaste! I am your Government Scheme Helper. Ask me anything in ${globalLanguage}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setChatLoading(false);
      }
    };
    fetchWelcome();
  }, [globalLanguage]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, activeSubTab]);

  const filteredSchemes = schemes.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.eligibility.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chat send action
  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // User message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');
    setChatLoading(true);

    try {
      // Build context of all database schemes so AI knows what schemes exist
      const systemInstruction = `You are "LifePilot Scheme Finder Helper". You help everyday Indian citizens find and apply to government schemes.
Here is the official list of schemes available in our database:
${JSON.stringify(schemes, null, 2)}

Instructions:
1. Analyze the user's details or queries.
2. Recommend the best matching scheme(s) from the list above.
3. State clearly WHY they match and what the BENEFIT is (using Rs / ₹).
4. If details are missing (like state or occupation), politely ask for them to narrow down the search.
5. You MUST respond entirely in the selected language: ${globalLanguage} (using its native script/alphabet, e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, Bengali script for Bengali, etc.). Use bullet points for readability.`;

      // Build message history
      const history = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Call direct Gemini REST API
      const reply = await callGeminiForSchemes(`${systemInstruction}\n\nUser Question: "${query}"`, history);

      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      console.error(err);
      // If quota/rate limit exceeded, show a clear message and still provide keyword-based help
      const isQuota = err?.status === 429;
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes('business') || q.includes('loan') || q.includes('start') || q.includes('मुद्रा') || q.includes('लोन')) {
        reply = "Based on your query, you might be eligible for the **Pradhan Mantri Mudra Yojana (PMMY)** which offers collateral-free loans up to Rs. 10 Lakh. You can apply at your nearest commercial, regional, or rural bank.";
      } else if (q.includes('zero') || q.includes('account') || q.includes('bank') || q.includes('खाता')) {
        reply = "Check out the **Pradhan Mantri Jan Dhan Yojana (PMJDY)**. It offers zero-balance savings accounts, a free RuPay debit card, and Rs. 2 Lakh accidental insurance. You can open an account at any bank branch.";
      } else if (q.includes('health') || q.includes('hospital') || q.includes('medical') || q.includes('आयुष्मान')) {
        reply = "Look into **Ayushman Bharat (PM-JAY)**. It provides free health coverage up to Rs. 5 Lakh per family per year for secondary and tertiary care hospitalizations.";
      } else if (q.includes('pension') || q.includes('old') || q.includes('बुढ़ापा') || q.includes('पेंशन')) {
        reply = "You might match the **Atal Pension Yojana (APY)** (for age 18-40, provides ₹1k-5k monthly pension after age 60) or **PM Shram Yogi Maan-dhan (PM-SYM)** (pension of ₹3,000/month for unorganized workers).";
      } else if (q.includes('farmer') || q.includes('kisan') || q.includes('agriculture') || q.includes('किसान')) {
        reply = "For farmers, check **PM-KISAN**: ₹6,000/year direct benefit transfer in 3 instalments. Also see **PM Fasal Bima Yojana** for crop insurance at subsidized premium rates.";
      } else {
        reply = "Please share your age, occupation, and state (e.g. 'I am a 32-year-old small business owner in Maharashtra') so I can match you with the best government schemes from our database.";
      }

      if (isQuota) {
        reply += "\n\n*(AI quota limit reached for today. Showing pre-loaded scheme information. The AI advisor will be available again tomorrow.)*";
      }

      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const starterPrompts = [
    "What schemes can a small business owner get?",
    "Show me schemes for zero-balance bank accounts",
    "Are there any medical/health insurance schemes?",
    "Pension schemes for people in the unorganized sector"
  ];

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-3 border-b border-orange-50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Landmark size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 text-lg">Indian Government Schemes</h3>
            <p className="text-xs text-gray-400">Discover benefits, criteria, and apply with ease</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex bg-orange-50/50 p-1 rounded-xl border border-orange-100/50 self-end sm:self-center">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-orange-600'
            }`}
          >
            All Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'chat'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-orange-600'
            }`}
          >
            <Sparkles size={12} />
            AI Scheme Matcher
          </button>
        </div>
      </div>

      {activeSubTab === 'all' ? (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative flex items-center mb-4">
            <input
              type="text"
              placeholder="Search schemes by name, state, eligibility criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300 w-full"
            />
            <SearchCode size={15} className="absolute left-3 text-gray-400" />
          </div>

          {/* Schemes Grid */}
          {filteredSchemes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-orange-100/50 rounded-xl bg-orange-50/5">
              <p className="text-sm font-semibold">No matching government schemes found.</p>
              <p className="text-xs mt-1">Try modifying your search text or update your profile in the header.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((scheme) => {
                const isExpanded = expandedId === scheme.id;
                return (
                  <div 
                    key={scheme.id}
                    className={`border rounded-2xl p-5 text-left transition-all duration-300 bg-white ${
                      isExpanded 
                        ? 'border-orange-500 shadow-sm shadow-orange-500/5 ring-1 ring-orange-100' 
                        : 'border-orange-100/50 hover:border-orange-200'
                    }`}
                  >
                    {/* Upper row: Title & state */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[9px] font-bold bg-orange-100/60 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2.5 inline-block">
                          {scheme.state === 'All' ? 'All India Scheme' : `${scheme.state} State`}
                        </span>
                        <h4 className="text-sm font-bold text-gray-800 leading-snug">{scheme.title}</h4>
                      </div>
                      
                      <button 
                        onClick={() => toggleExpand(scheme.id)}
                        className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {scheme.description}
                    </p>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-orange-50 space-y-4 animate-fade-in">
                        <div>
                          <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle size={10} />
                            Eligibility Criteria
                          </span>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed pl-3.5 border-l-2 border-orange-100">
                            {scheme.eligibility}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Award size={10} />
                            Benefits & Scope
                          </span>
                          <p className="text-xs text-gray-700 font-medium mt-1 leading-relaxed pl-3.5 border-l-2 border-orange-200">
                            {scheme.benefit}
                          </p>
                        </div>

                        {scheme.apply_url && (
                          <div className="pt-2">
                            <a
                              href={scheme.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-300 transform active:scale-95 cursor-pointer no-underline"
                            >
                              Apply Now &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* AI Scheme Matcher Chatbot Interface */
        <div className="h-[520px] flex flex-col justify-between border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5 shadow-sm">
          {/* Chat Window */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {chatMessages.map((msg, i) => {
              const isAI = msg.sender === 'assistant';
              return (
                <div key={i} className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs ${
                    isAI ? 'bg-orange-100 text-orange-600' : 'bg-orange-500 text-white'
                  }`}>
                    {isAI ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div>
                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed border whitespace-pre-line ${
                      isAI 
                        ? 'bg-white border-orange-100 text-gray-700 rounded-tl-sm shadow-sm'
                        : 'bg-orange-500 border-orange-500 text-white rounded-tr-sm font-medium shadow-md shadow-orange-500/10'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 block">{msg.time}</span>
                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto text-left">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div className="px-4 py-2.5 bg-white border border-orange-100 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                  <span className="text-[10px] text-orange-400 font-semibold ml-1">Searching schemes...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Starter Questions */}
          {chatMessages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 text-left justify-start">
              {starterPrompts.map((p, index) => (
                <button
                  key={index}
                  onClick={() => handleSendChat(p)}
                  className="px-3 py-1.5 bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-200 text-[10px] text-gray-600 hover:text-orange-600 font-medium rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1"
                >
                  <QuestionIcon size={10} className="text-orange-400" />
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 bg-white border-t border-orange-100 flex gap-2.5 items-center">
            <input
              type="text"
              placeholder="Ask: 'Show schemes matching a 35yo shopkeeper' or 'Am I eligible for Mudra loan?'..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300 disabled:bg-gray-50"
            />
            <button
              onClick={() => handleSendChat()}
              disabled={!inputText.trim() || chatLoading}
              title="Send message"
              className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
