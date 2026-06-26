import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, VolumeX, Bot, User } from 'lucide-react';
import axios from 'axios';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface VoiceAssistantProps {
  onDataUpdate: () => void; // Triggered if assistant tells the user it performed an action
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onDataUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am LifePilot AI, your everyday personal assistant. You can speak or type to me. Ask me about your expenses, medicine list, today's tasks, or request advice on saving money!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Indian English context is helpful for Rs. and names

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!speechEnabled) return;
    // Strip markdown or bullets before speaking
    const cleanText = text.replace(/[*#_`]/g, '').replace(/-\s/g, '');
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a nice English voice
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (engVoice) {
      utterance.voice = engVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // POST to FastAPI chat
      const res = await axios.post("http://localhost:8000/api/chat", {
        message: query
      });

      const replyText = res.data.reply;
      
      const assistantMsg: Message = {
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakText(replyText);

      // If user command implied data changes, refresh components
      if (
        query.toLowerCase().includes('add') || 
        query.toLowerCase().includes('delete') || 
        query.toLowerCase().includes('complete') ||
        query.toLowerCase().includes('task') ||
        query.toLowerCase().includes('expense')
      ) {
        // Give short delay for db transaction
        setTimeout(() => {
          onDataUpdate();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        sender: 'assistant',
        text: "Sorry, I couldn't process that query. Is the FastAPI backend running?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover h-[600px] flex flex-col justify-between max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Bot size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 text-base">LifePilot AI Companion</h3>
            <p className="text-xs text-gray-400">Context-Aware Speech Assistant</p>
          </div>
        </div>

        {/* Audio Output Settings */}
        <button
          onClick={() => {
            setSpeechEnabled(!speechEnabled);
            if (speechEnabled) window.speechSynthesis.cancel();
          }}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            speechEnabled 
              ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100/70' 
              : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
          title={speechEnabled ? "Mute AI speech output" : "Unmute AI speech output"}
        >
          {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin">
        {messages.map((msg, i) => {
          const isAI = msg.sender === 'assistant';
          return (
            <div 
              key={i} 
              className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
            >
              {/* Profile Icon */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                isAI ? 'bg-orange-100 text-orange-600' : 'bg-orange-500 text-white'
              }`}>
                {isAI ? <Bot size={14} /> : <User size={14} />}
              </div>

              {/* Speech bubble */}
              <div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                  isAI 
                    ? 'bg-white border-orange-100 text-gray-700 rounded-tl-sm' 
                    : 'bg-orange-500 border-orange-500 text-white rounded-tr-sm font-medium'
                }`}>
                  {/* Preserving structure/newlines if any */}
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">{msg.time}</span>
              </div>
            </div>
          );
        })}

        {/* Typing Loader */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto text-left">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="p-4 bg-orange-50/10 border border-orange-100/30 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce"></div>
              <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <div className="flex gap-2.5 items-center">
        {/* Voice Trigger Microphone */}
        <button
          onClick={toggleListening}
          className={`p-3.5 rounded-xl text-white font-bold cursor-pointer transition-all duration-300 shadow-md ${
            isListening 
              ? 'bg-orange-600 pulse-active shadow-orange-600/20' 
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10'
          }`}
          title={isListening ? "Listening... click to stop" : "Speak to AI"}
        >
          <Mic size={18} />
        </button>

        {/* Text Input bar */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Ask: 'Any budget updates?' or 'Tell me about PMJDY scheme'..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isListening}
            className="w-full pl-4 pr-12 py-3 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300 disabled:bg-orange-50/10"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="absolute right-2 p-1.5 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
