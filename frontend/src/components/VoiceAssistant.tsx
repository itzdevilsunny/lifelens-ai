import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, User, Zap, Square } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface VoiceAssistantProps {
  onDataUpdate: () => void;
  globalLanguage: string;
}

const LANGUAGE_CODES: Record<string, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Marathi: 'mr-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Bengali: 'bn-IN',
  Gujarati: 'gu-IN',
  Kannada: 'kn-IN',
  Malayalam: 'ml-IN',
  Punjabi: 'pa-IN',
  Odia: 'or-IN'
};

// ─── Gemini text call ─────────────────────────────────────────────────────────
async function callGeminiText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

// ─── Gemini audio call — send recorded audio blob directly to Gemini ──────────
// Gemini 2.5 Flash natively understands speech in English, Hindi, Hinglish etc.
async function callGeminiAudio(
  audioBlob: Blob,
  languageHint: string,
  targetLanguage: string
): Promise<{ transcript: string; reply: string }> {
  if (!GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY set");

  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = '';
  uint8.forEach(b => (binary += String.fromCharCode(b)));
  const base64Audio = btoa(binary);

  const mimeType = audioBlob.type || 'audio/webm';

  const prompt = `You are LifeLens AI, a helpful personal assistant for everyday Indians.

The user just spoke in ${languageHint}. The audio recording is attached.

Step 1: Transcribe exactly what the user said (in their original language/script).
Step 2: Respond helpfully as LifeLens AI. The "reply" field MUST be written entirely in the selected language: ${targetLanguage} (using its native script/font, e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, Kannada script for Kannada, etc.).

Your response MUST be in this exact JSON format:
{
  "transcript": "what the user said verbatim",
  "reply": "your helpful response to them in ${targetLanguage}"
}

Focus on: budget tracking, expense management, government schemes (PMJDY, Mudra, PM-JAY, APY, PM-KISAN), medicine reminders, daily tasks, savings tips for Indian households. Use ₹ for currency.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Audio } },
          { text: prompt }
        ]
      }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini audio error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  // Parse JSON from Gemini's response
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        transcript: parsed.transcript || '',
        reply: parsed.reply || raw,
      };
    }
  } catch {
    // fallback — treat entire response as reply
  }
  return { transcript: '', reply: raw };
}

// ─── Helper: build text-only prompt ──────────────────────────────────────────
function buildPrompt(query: string, targetLanguage: string): string {
  return `You are LifeLens AI, a personal assistant for everyday Indians. Help with:
- Daily task planning and productivity
- Medicine reminders and health schedules  
- Budget tracking, expense optimization (use ₹/Rs.)
- Indian government schemes (PMJDY, PM-JAY, Mudra, APY, PM-KISAN, etc.)
- Smart savings for Indian households

CRITICAL requirement: You MUST respond entirely in the selected language: ${targetLanguage} (using its native script/alphabet, e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, Telugu script for Telugu, etc.).

User query: "${query}"

Give a concise, helpful, India-specific response in ${targetLanguage}:`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onDataUpdate, globalLanguage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [aiMode, setAiMode] = useState<'direct' | 'backend'>('direct');

  // Welcome message helper based on selected language
  useEffect(() => {
    const fetchWelcome = async () => {
      if (!GEMINI_API_KEY) {
        setMessages([{
          sender: 'assistant',
          text: `Hello! I am LifeLens AI. Please configure VITE_GEMINI_API_KEY for conversational AI responses in ${globalLanguage}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        return;
      }
      setLoading(true);
      try {
        const welcomePrompt = `Generate a warm, friendly 2-sentence welcome greeting as LifeLens AI (everyday helper) introducing yourself. State that the user can speak or type in any Indian language. The greeting MUST be entirely in the selected language: ${globalLanguage} (using its native script/alphabet).`;
        const welcomeText = await callGeminiText(welcomePrompt);
        setMessages([{
          sender: 'assistant',
          text: welcomeText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch {
        setMessages([{
          sender: 'assistant',
          text: `Namaste! I am LifeLens AI, your everyday companion. Currently conversing in ${globalLanguage}. Ask me anything!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setLoading(false);
      }
    };
    fetchWelcome();
  }, [globalLanguage]);

  // ── Recording state ──
  const [recState, setRecState] = useState<'idle' | 'requesting' | 'recording' | 'processing' | 'error'>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setAiMode(GEMINI_API_KEY ? 'direct' : 'backend');
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speakText = (text: string) => {
    if (!speechEnabled) return;
    const clean = text.replace(/[*#_`]/g, '').replace(/-\s/g, '').substring(0, 500);
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.05;
    
    const langCode = LANGUAGE_CODES[globalLanguage] || 'en-IN';
    utt.lang = langCode;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes(langCode))
      || voices.find(v => v.lang.includes('en-IN'))
      || voices.find(v => v.lang.includes('en'));
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  };

  // ── Send text message ─────────────────────────────────────────────────────
  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    setMessages(prev => [...prev, {
      sender: 'user', text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInputText('');
    setLoading(true);

    let replyText = '';
    try {
      if (aiMode === 'direct' && GEMINI_API_KEY) {
        replyText = await callGeminiText(buildPrompt(query, globalLanguage));
      } else {
        const res = await axios.post(`${API_BASE}/api/chat`, { message: query });
        replyText = res.data.reply;
      }
    } catch {
      try {
        const res = await axios.post(`${API_BASE}/api/chat`, { message: query });
        replyText = res.data.reply;
      } catch {
        const q = query.toLowerCase();
        if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste') || q.includes('help') || q.includes('who are you')) {
          replyText = "Namaste! I'm your LifeLens assistant. How can I help you today? You can ask me about your tasks, budget, medicine schedules, or eligible schemes!";
        } else if (q.includes('scheme') || q.includes('yojana') || q.includes('benefit') || q.includes('government')) {
          replyText = "Key schemes in our database:\n• PMJDY: Zero-balance bank account + ₹2L insurance\n• PM-JAY: ₹5L health cover\n• Mudra: Business loans up to ₹10L (no collateral)\n• APY: Pension ₹1k–5k/month from age 60\n• PM-KISAN: ₹6,000/year for farmers\n\nTo view state-specific schemes, head over to the Gov Schemes tab!";
        } else if (q.includes('budget') || q.includes('expense') || q.includes('spend') || q.includes('money') || q.includes('saving')) {
          replyText = "Budget tip: Keep grocery below 30%, rent below 40%, savings above 20% of monthly income. Use the Expense Tracker tab to log daily spends, check your savings health scores, and get optimization tips.";
        } else if (q.includes('task') || q.includes('planner') || q.includes('todo') || q.includes('schedule') || q.includes('today')) {
          replyText = "To manage your daily productivity, head over to the Daily Planner tab. There you can add new tasks, set target times, and check off completed items.";
        } else if (q.includes('medicine') || q.includes('pill') || q.includes('doctor') || q.includes('remind') || q.includes('health') || q.includes('dose')) {
          replyText = "You can track your medication timings under the Smart Reminders tab. Use the OCR Scanner tab to upload prescription images to set these schedules automatically.";
        } else {
          replyText = "I am LifeLens AI, your offline personal assistant. I can help with government schemes, health reminders, daily tasks, and household budgets. Please try asking about those, or configure VITE_GEMINI_API_KEY for conversational AI.";
        }
      }
    }

    setMessages(prev => [...prev, {
      sender: 'assistant', text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    speakText(replyText);

    const ql = query.toLowerCase();
    if (['add','delete','complete','task','expense','जोड़','खर्च','काम'].some(w => ql.includes(w))) {
      setTimeout(() => onDataUpdate(), 1000);
    }
    setLoading(false);
  };

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    setMicError(null);
    setRecState('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      });
    } catch (err: unknown) {
      setRecState('error');
      const e = err as { name?: string; message?: string };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setMicError('Microphone blocked! Click the 🔒 lock icon in your browser address bar → Site settings → Microphone → Allow → refresh page.');
      } else if (e.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a mic and try again.');
      } else if (e.name === 'NotReadableError') {
        setMicError('Microphone is busy (used by another app). Close Zoom/Teams/Meet and try again.');
      } else {
        setMicError(`Mic access failed: ${e.message || 'unknown error'}. Try typing your question instead.`);
      }
      return;
    }

    // Pick best supported mime type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : '';

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);

      const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });

      if (blob.size < 500) {
        setRecState('error');
        setMicError('Recording too short. Hold the mic button and speak for at least 1 second.');
        return;
      }

      setRecState('processing');
      const langLabel = `${globalLanguage} (Indian)`;

      try {
        const { transcript, reply } = await callGeminiAudio(blob, langLabel, globalLanguage);

        // Show what user said
        const displayText = transcript || '(voice message)';
        setMessages(prev => [...prev, {
          sender: 'user', text: `🎙️ "${displayText}"`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        setMessages(prev => [...prev, {
          sender: 'assistant', text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        speakText(reply);
      } catch (err: unknown) {
        const e = err as { message?: string };
        // Fallback: no audio key or network failed — treat as typed text
        if (!GEMINI_API_KEY) {
          setMicError('Voice-to-AI requires VITE_GEMINI_API_KEY in Vercel settings. Your speech was not processed.');
        } else {
          setMicError(`Audio processing failed: ${e.message}. Try typing your question.`);
        }
      }
      setRecState('idle');
      setRecSeconds(0);
    };

    recorder.start(100); // collect chunks every 100ms
    mediaRecorderRef.current = recorder;
    setRecState('recording');
    setRecSeconds(0);

    // Timer
    timerRef.current = setInterval(() => {
      setRecSeconds(s => {
        if (s >= 59) { stopRecording(); return 0; } // auto-stop at 60s
        return s + 1;
      });
    }, 1000);
  };

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleMic = () => {
    if (recState === 'recording') {
      stopRecording();
    } else if (recState === 'idle' || recState === 'error') {
      startRecording();
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend();
  };

  // ── Mic button style & label ──────────────────────────────────────────────
  const micBtnClass = (() => {
    switch (recState) {
      case 'requesting':  return 'bg-yellow-400 cursor-wait shadow-yellow-400/20';
      case 'recording':   return 'bg-red-500 shadow-red-500/30 ring-4 ring-red-200 animate-pulse';
      case 'processing':  return 'bg-blue-500 cursor-wait shadow-blue-500/20';
      case 'error':       return 'bg-gray-400 hover:bg-orange-500 shadow-gray-300/10';
      default:            return 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10';
    }
  })();

  const micTitle = {
    requesting: 'Requesting microphone permission...',
    recording:  `Recording... ${recSeconds}s (tap to stop & send)`,
    processing: 'Processing your voice with Gemini AI...',
    error:      'Mic error — tap to retry',
    idle:       'Tap to speak',
  }[recState];

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover h-[660px] flex flex-col justify-between max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-3 border-b border-orange-50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Bot size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 text-base">LifeLens AI Companion</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${GEMINI_API_KEY ? 'bg-green-500' : 'bg-orange-400'}`}></div>
              <p className="text-xs text-gray-400">
                {GEMINI_API_KEY ? 'Gemini 2.5 Flash ⚡ — Voice + Text' : 'Fallback Mode — Set VITE_GEMINI_API_KEY'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center self-end">
          {GEMINI_API_KEY && (
            <button
              onClick={() => setAiMode(prev => prev === 'direct' ? 'backend' : 'direct')}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                aiMode === 'direct'
                  ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                  : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              <Zap size={11} />{aiMode === 'direct' ? 'Direct' : 'Backend'}
            </button>
          )}



          {/* TTS */}
          <button
            onClick={() => { setSpeechEnabled(!speechEnabled); if (speechEnabled) window.speechSynthesis.cancel(); }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              speechEnabled ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100' : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
            title={speechEnabled ? 'Mute voice' : 'Unmute voice'}
          >
            {speechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin">
        {messages.map((msg, i) => {
          const isAI = msg.sender === 'assistant';
          return (
            <div key={i} className={`flex gap-3 max-w-[88%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs ${
                isAI ? 'bg-orange-100 text-orange-600' : 'bg-orange-500 text-white'
              }`}>
                {isAI ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={`text-${isAI ? 'left' : 'right'}`}>
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

        {(loading || recState === 'processing') && (
          <div className="flex gap-3 max-w-[88%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="px-4 py-3 bg-orange-50/30 border border-orange-100/40 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
              <span className="text-xs text-orange-400 ml-1">
                {recState === 'processing' ? 'Transcribing voice...' : 'Thinking...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mic error banner */}
      {micError && (
        <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs leading-relaxed">
          <span className="text-sm shrink-0">⚠️</span>
          <span className="flex-1">{micError}</span>
          <button onClick={() => { setMicError(null); setRecState('idle'); }}
            className="shrink-0 text-red-400 hover:text-red-600 font-bold cursor-pointer ml-1">✕</button>
        </div>
      )}

      {/* Recording indicator */}
      {recState === 'recording' && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0"></div>
          <div className="flex gap-0.5 items-end h-4">
            {[3,5,4,6,3,5,4].map((h, i) => (
              <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 0.08}s`, animationDuration: '0.5s' }}></div>
            ))}
          </div>
          <span className="text-xs font-semibold text-red-600 flex-1">Recording... {recSeconds}s</span>
          <button onClick={stopRecording}
            className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-600 transition-colors">
            <Square size={10} fill="white" /> Stop & Send
          </button>
        </div>
      )}

      {recState === 'requesting' && (
        <div className="mb-3 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full shrink-0"></span>
          <span className="text-xs font-semibold text-yellow-700">
            Waiting for microphone permission — check your browser's address bar for a popup...
          </span>
        </div>
      )}

      {/* Input panel */}
      <div className="flex gap-2.5 items-center">
        <button
          onClick={toggleMic}
          disabled={recState === 'requesting' || recState === 'processing'}
          className={`p-3.5 rounded-xl text-white font-bold transition-all duration-200 shadow-md flex-shrink-0 ${
            recState === 'requesting' || recState === 'processing' ? 'cursor-wait opacity-70' : 'cursor-pointer'
          } ${micBtnClass}`}
          title={micTitle}
        >
          {recState === 'requesting' || recState === 'processing' ? (
            <span className="inline-block w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : recState === 'recording' ? (
            <Square size={18} fill="white" />
          ) : recState === 'error' ? (
            <MicOff size={18} />
          ) : (
            <Mic size={18} />
          )}
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder={
              recState === 'recording' ? 'Speak now... tap ⬛ to stop & send' :
              recState === 'processing' ? 'Processing your voice...' :
              recState === 'requesting' ? 'Allow microphone in browser...' :
              'Type a question or tap 🎙️ to speak...'
            }
            value={inputText}
            onChange={e => { setInputText(e.target.value); if (micError) setMicError(null); }}
            onKeyDown={handleKeyDown}
            disabled={loading || recState === 'recording' || recState === 'requesting' || recState === 'processing'}
            className={`w-full pr-12 py-3 pl-4 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-all placeholder-gray-300 disabled:bg-gray-50/50 ${
              recState === 'recording' ? 'border-red-200 bg-red-50/30' :
              recState === 'requesting' ? 'border-yellow-200 bg-yellow-50/30' :
              'border-orange-100'
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading || recState !== 'idle'}
            className="absolute right-2 p-1.5 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
