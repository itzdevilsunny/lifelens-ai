import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, VolumeX, Bot, User, Languages, Zap } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Gemini API key for direct client-side calls (exposed intentionally for frontend-only use)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface VoiceAssistantProps {
  onDataUpdate: () => void;
}

// Call Gemini REST API directly from the browser — no backend needed!
async function callGeminiDirect(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onDataUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am LifePilot AI — powered by Gemini 2.5 Flash ⚡. You can speak or type to me in English or Hindi.\n\nAsk me about your budget, medicine schedule, government schemes (PMJDY, Mudra, Ayushman), or anything else!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [aiMode, setAiMode] = useState<'direct' | 'backend'>('direct');
  const [micError, setMicError] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'listening' | 'error'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Detect which mode to use on mount
  useEffect(() => {
    if (GEMINI_API_KEY) {
      setAiMode('direct');
    } else {
      setAiMode('backend');
    }
  }, []);

  const speakText = (text: string) => {
    if (!speechEnabled) return;
    const cleanText = text.replace(/[*#_`]/g, '').replace(/-\s/g, '').substring(0, 500);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const targetedLang = selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN';
    const voice = voices.find(v => v.lang.includes(targetedLang)) ||
                  voices.find(v => v.lang.includes('en-US')) ||
                  voices.find(v => v.lang.includes('en-GB'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const buildGeminiPrompt = (query: string): string => {
    const langNote = selectedLang === 'hi-IN'
      ? "The user prefers Hindi. Respond naturally in a mix of Hindi and English (Hinglish is fine)."
      : "Respond in clear Indian English.";
    return `You are LifePilot AI, an expert personal assistant built specifically for everyday Indians. You help with:
- Daily task planning and productivity
- Medicine reminders and health schedules
- Budget tracking and expense optimization (use ₹ / Rs.)
- Indian government scheme eligibility (PMJDY, PM-JAY, Mudra, APY, PM-KISAN, etc.)
- Smart savings and financial advice tailored to Indian households
- General life management queries

${langNote}

Keep answers concise, actionable, and specific to India. Use real scheme names, real prices (Rs.), and practical advice.

User Query: "${query}"

Provide a helpful, context-aware response:`;
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    let replyText = '';

    try {
      if (aiMode === 'direct' && GEMINI_API_KEY) {
        // ⚡ Call Gemini directly from the browser — FASTEST path, works without backend
        const prompt = buildGeminiPrompt(query);
        replyText = await callGeminiDirect(prompt);
      } else {
        // Fallback: call backend API
        const res = await axios.post(`${API_BASE}/api/chat`, { message: query });
        replyText = res.data.reply;
      }
    } catch (directErr) {
      console.warn("Direct Gemini call failed, trying backend:", directErr);
      try {
        const res = await axios.post(`${API_BASE}/api/chat`, { message: query });
        replyText = res.data.reply;
      } catch (backendErr) {
        console.error("Both AI engines failed:", backendErr);
        // Intelligent local fallback
        const q = query.toLowerCase();
        if (q.includes('budget') || q.includes('expense') || q.includes('spend') || q.includes('खर्च')) {
          replyText = "I'm currently offline but here's what I know: track all expenses by category (Grocery, Medicine, Electricity, Rent, Other). Keep grocery below 30% of budget, medicine below 10%. For a ₹30,000 budget, aim for ₹9,000 grocery, ₹3,000 medicine, ₹5,000 utilities. Set up auto-debit for recurring bills to avoid late fees.";
        } else if (q.includes('scheme') || q.includes('govt') || q.includes('government') || q.includes('yojana')) {
          replyText = "Key government schemes:\n• PMJDY: Zero-balance bank account + ₹2L insurance\n• PM-JAY (Ayushman): ₹5L health cover for low-income\n• PM Mudra: Business loans up to ₹10L (no collateral)\n• Atal Pension Yojana: Pension from age 60 (₹1k-5k/month)\n• PM-KISAN: ₹6,000/year for farmers\n\nCheck eligibility at pmjdy.gov.in or your nearest bank.";
        } else if (q.includes('medicine') || q.includes('remind') || q.includes('tablet') || q.includes('दवा')) {
          replyText = "For medicine management:\n• Set daily reminders at fixed times (08:00 AM, 02:00 PM, 08:00 PM)\n• Use the Smart Reminders module to track doses\n• Save 60-90% on chronic meds at Jan Aushadhi Kendras\n• Keep a weekly pill organizer for accuracy";
        } else if (q.includes('task') || q.includes('planner') || q.includes('todo') || q.includes('काम')) {
          replyText = "Productivity tip: Use the 3-task priority rule — identify your 3 most important tasks each morning. Use the Daily Planner module to track them with time slots. Batch similar tasks together (e.g., all calls in one hour) to reduce context switching by 40%.";
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('नमस्ते')) {
          replyText = "Namaste! 🙏 I'm LifePilot AI. I'm currently in offline mode but I can still help with budgeting advice, government schemes, medicine tips, and daily planning. What would you like to know?";
        } else {
          replyText = `I received your question: "${query}". I'm currently in fallback mode. For full AI responses, ensure the VITE_GEMINI_API_KEY is configured in your Vercel environment variables, or the backend is running.`;
        }
      }
    }

    const assistantMsg: Message = {
      sender: 'assistant',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, assistantMsg]);
    speakText(replyText);

    // Refresh data if user did an action query
    const queryLower = query.toLowerCase();
    if (
      queryLower.includes('add') || queryLower.includes('delete') ||
      queryLower.includes('complete') || queryLower.includes('task') ||
      queryLower.includes('expense') || queryLower.includes('जोड़') ||
      queryLower.includes('खत्म') || queryLower.includes('काम') ||
      queryLower.includes('खर्च')
    ) {
      setTimeout(() => onDataUpdate(), 1000);
    }

    setLoading(false);
  };

  const toggleListening = async () => {
    // Stop if already listening
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setMicStatus('idle');
      return;
    }

    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Voice recognition needs Chrome, Edge, or Safari.');
      setMicStatus('error');
      return;
    }

    // Step 1 — Explicitly request mic permission via getUserMedia first
    // This shows the browser's native permission dialog on first use
    setMicStatus('requesting');
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted — stop the test stream immediately
      stream.getTracks().forEach(t => t.stop());
    } catch (permErr: any) {
      setMicStatus('error');
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setMicError('Microphone blocked. Click the 🔒 lock icon in your browser address bar → allow microphone → try again.');
      } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
        setMicError('No microphone found. Plug in a mic and try again.');
      } else if (permErr.name === 'NotReadableError') {
        setMicError('Microphone is in use by another app. Close other apps using the mic.');
      } else {
        setMicError(`Mic error: ${permErr.message}. Try typing your question instead.`);
      }
      return;
    }

    // Step 2 — Start Speech Recognition
    window.speechSynthesis.cancel();
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = selectedLang;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setMicStatus('listening');
      setMicError(null);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        setInputText(transcript);
        handleSend(transcript);
      }
    };

    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error, e);
      setIsListening(false);
      setMicStatus('error');
      switch (e.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setMicError('Microphone blocked. Allow mic access in your browser → 🔒 lock icon in address bar.');
          break;
        case 'no-speech':
          setMicError('No speech detected. Speak clearly closer to the mic and try again.');
          setMicStatus('idle');
          break;
        case 'audio-capture':
          setMicError('Cannot access microphone. Check that a mic is plugged in and not muted.');
          break;
        case 'network':
          setMicError('Network error during speech recognition. Check your connection.');
          break;
        case 'aborted':
          setMicError(null);
          setMicStatus('idle');
          break;
        default:
          setMicError(`Recognition failed (${e.error}). Try typing your question.`);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (micStatus === 'listening') setMicStatus('idle');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (startErr: any) {
      setMicStatus('error');
      setMicError(`Could not start microphone: ${startErr.message}`);
    }
  };

  const handleLangChange = (lang: 'en-IN' | 'hi-IN') => {
    setSelectedLang(lang);
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend();
  };

  const toggleAiMode = () => {
    setAiMode(prev => prev === 'direct' ? 'backend' : 'direct');
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover h-[640px] flex flex-col justify-between max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-3 border-b border-orange-50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Bot size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 text-base">LifePilot AI Companion</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${GEMINI_API_KEY ? 'bg-green-500' : 'bg-orange-400'}`}></div>
              <p className="text-xs text-gray-400">
                {GEMINI_API_KEY
                  ? `Gemini 2.5 Flash ⚡ (${aiMode === 'direct' ? 'Direct' : 'Backend'})`
                  : 'Fallback Mode — Set VITE_GEMINI_API_KEY'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center self-end">
          {/* AI Mode Toggle */}
          {GEMINI_API_KEY && (
            <button
              onClick={toggleAiMode}
              title={`Switch to ${aiMode === 'direct' ? 'backend' : 'direct'} mode`}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                aiMode === 'direct'
                  ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                  : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              <Zap size={11} />
              {aiMode === 'direct' ? 'Direct' : 'Backend'}
            </button>
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-orange-50 border border-orange-100/40 rounded-xl p-0.5">
            <div className="px-1.5 text-orange-400">
              <Languages size={13} />
            </div>
            <button
              onClick={() => handleLangChange('en-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLang === 'en-IN' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-orange-600'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLangChange('hi-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLang === 'hi-IN' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-orange-600'
              }`}
            >
              हिं
            </button>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => {
              setSpeechEnabled(!speechEnabled);
              if (speechEnabled) window.speechSynthesis.cancel();
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              speechEnabled
                ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
                : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
            title={speechEnabled ? "Mute voice" : "Unmute voice"}
          >
            {speechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin">
        {messages.map((msg, i) => {
          const isAI = msg.sender === 'assistant';
          return (
            <div
              key={i}
              className={`flex gap-3 max-w-[88%] ${isAI ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
            >
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs ${
                isAI ? 'bg-orange-100 text-orange-600' : 'bg-orange-500 text-white'
              }`}>
                {isAI ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${
                  isAI
                    ? 'bg-white border-orange-100 text-gray-700 rounded-tl-sm shadow-sm'
                    : 'bg-orange-500 border-orange-500 text-white rounded-tr-sm font-medium shadow-md shadow-orange-500/10'
                }`}>
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">{msg.time}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[88%] mr-auto text-left">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="px-4 py-3 bg-orange-50/30 border border-orange-100/40 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
              <span className="text-xs text-orange-400 ml-1">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mic error banner */}
      {micError && (
        <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs leading-relaxed">
          <span className="text-base shrink-0">🎙️</span>
          <span className="flex-1">{micError}</span>
          <button
            onClick={() => { setMicError(null); setMicStatus('idle'); }}
            className="shrink-0 text-red-400 hover:text-red-600 font-bold cursor-pointer"
          >✕</button>
        </div>
      )}

      {/* Input panel */}
      <div className="flex gap-2.5 items-center">
        <button
          onClick={toggleListening}
          disabled={micStatus === 'requesting'}
          className={`p-3.5 rounded-xl text-white font-bold cursor-pointer transition-all duration-200 shadow-md flex-shrink-0 ${
            micStatus === 'requesting'
              ? 'bg-yellow-400 shadow-yellow-400/20 cursor-wait'
              : isListening
              ? 'bg-red-500 shadow-red-500/20'
              : micStatus === 'error'
              ? 'bg-gray-400 hover:bg-orange-500 shadow-gray-400/10'
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10'
          }`}
          title={
            micStatus === 'requesting' ? 'Requesting mic permission...' :
            isListening ? 'Listening — click to stop' :
            micStatus === 'error' ? 'Mic error — click to retry' :
            'Click to speak'
          }
        >
          {micStatus === 'requesting' ? (
            <span className="animate-spin inline-block w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Mic size={18} />
          )}
        </button>

        <div className="flex-1 relative flex items-center">
          {isListening && (
            <div className="absolute left-3 flex gap-1 items-end z-10 h-5">
              <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '60%', animationDuration: '0.5s' }}></div>
              <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.5s', animationDelay: '0.1s' }}></div>
              <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.5s', animationDelay: '0.2s' }}></div>
              <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '80%', animationDuration: '0.5s', animationDelay: '0.3s' }}></div>
            </div>
          )}
          {micStatus === 'requesting' && !isListening && (
            <div className="absolute left-3 z-10 flex items-center gap-1.5 text-yellow-600">
              <span className="animate-pulse text-xs font-semibold">Allow mic access in browser popup...</span>
            </div>
          )}
          <input
            type="text"
            placeholder={
              micStatus === 'requesting' ? '' :
              isListening ? 'Listening...' :
              'Ask anything — budget, schemes, medicines, tasks...'
            }
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); if (micError) setMicError(null); }}
            onKeyDown={handleKeyDown}
            disabled={isListening || loading || micStatus === 'requesting'}
            className={`w-full pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-all placeholder-gray-300 disabled:bg-gray-50/50 ${
              isListening ? 'pl-16 border-orange-300 bg-orange-50/20 font-semibold text-orange-500' :
              micStatus === 'requesting' ? 'pl-4 border-yellow-200 bg-yellow-50/30' :
              'pl-4 border-orange-100'
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="absolute right-2 p-1.5 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
