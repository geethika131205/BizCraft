import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askStartupQuestion } from '../services/geminiService';
import { UserProfile, Task } from '../types';

export default function FloatingChatbot({ profile, tasks }: { profile: UserProfile, tasks: Task[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "HELLO. I am your AI Startup Agent. How can I help you build your business today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await askStartupQuestion(userMsg, profile, profile.startupIdea, tasks);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "ERROR: Connection to agent lost. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 md:w-96 h-[500px] bg-zinc-900 border border-neon-blue/50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-neon-blue flex items-center justify-center">
                  <Bot className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-widest text-xs text-neon-blue neon-glow-blue">AI Agent</h3>
                  <p className="text-[8px] text-green-500 uppercase font-bold tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    Active
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/20">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 border ${
                    msg.role === 'user' ? 'border-neon-pink bg-neon-pink/10 text-white' : 'border-zinc-800 bg-zinc-800/50 text-zinc-300'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800/50 border border-zinc-800 p-3 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-neon-blue" />
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest italic">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-zinc-800 border border-zinc-700 py-3 pl-3 pr-10 focus:border-neon-blue outline-none transition-all text-[11px] font-bold uppercase tracking-widest"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neon-blue hover:text-white transition-all disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-none border-2 flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-zinc-900 border-neon-pink text-neon-pink' : 'bg-neon-blue border-neon-blue text-black hover:neon-glow'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
      </motion.button>
    </div>
  );
}
