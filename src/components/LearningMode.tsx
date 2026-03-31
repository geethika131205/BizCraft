import React, { useState, useRef } from 'react';
import { askStartupQuestion, evaluatePitch, evaluateFinancials, evaluateMVP } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, PlayCircle, Send, Loader2, User, Bot, Sparkles, Lightbulb, Target, TrendingUp, Video, DollarSign, Package, Upload, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile } from '../types';

const SIMULATIONS = [
  {
    id: 'sim-pitch',
    title: "Pitch Simulation",
    icon: <Video className="w-6 h-6" />,
    scenario: "Record a 30-second pitch for your startup. AI will evaluate your delivery, clarity, and impact.",
    challenge: "Submit your pitch for feedback and a score."
  },
  {
    id: 'sim-finance',
    title: "Financial Tracker",
    icon: <DollarSign className="w-6 h-6" />,
    scenario: "Adjust the sliders to model your startup's monthly finances. Try to reach profitability!",
    challenge: "Analyze your startup's financial viability."
  },
  {
    id: 'sim-mvp',
    title: "MVP Simulation",
    icon: <Package className="w-6 h-6" />,
    scenario: "Select features for your MVP while staying within your effort budget. Aim for high value!",
    challenge: "Build a lean, effective MVP."
  }
];

const MVP_FEATURES = [
  { id: 'auth', name: 'User Login / Auth', effort: 2, value: 5, icon: '🔐' },
  { id: 'dash', name: 'Dashboard / Home Screen', effort: 3, value: 5, icon: '🖥️' },
  { id: 'core', name: 'Core Feature (main action)', effort: 4, value: 10, icon: '⭐' },
  { id: 'pay', name: 'Payment Processing', effort: 5, value: 7, icon: '💳' },
  { id: 'email', name: 'Email Notifications', effort: 2, value: 3, icon: '📧' },
  { id: 'analytics', name: 'Analytics Dashboard', effort: 4, value: 2, icon: '📊' },
  { id: 'social', name: 'Social Sharing', effort: 3, value: 3, icon: '📱' },
  { id: 'ai', name: 'AI-Powered Recommendations', effort: 6, value: 4, icon: '🤖' },
  { id: 'export', name: 'Data Export (CSV/PDF)', effort: 2, value: 2, icon: '📄' },
  { id: 'onboard', name: 'Onboarding Flow', effort: 3, value: 6, icon: '🎯' },
  { id: 'search', name: 'Search Functionality', effort: 3, value: 4, icon: '🔍' },
  { id: 'mobile', name: 'Mobile App (iOS/Android)', effort: 8, value: 6, icon: '📲' },
];

export default function LearningMode({ profile }: { profile: UserProfile }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "SYSTEM INITIALIZED. I am your startup mentor. Ask me anything about building a business." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSim, setActiveSim] = useState<typeof SIMULATIONS[0] | null>(null);
  
  // Pitch Sim State
  const [pitchFeedback, setPitchFeedback] = useState<{ feedback: string; score: number } | null>(null);
  const [pitchLoading, setPitchLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Financial Sim State (Sliders)
  const [pricePerUser, setPricePerUser] = useState(29);
  const [monthlyUsers, setMonthlyUsers] = useState(100);
  const [salaries, setSalaries] = useState(15000);
  const [marketing, setMarketing] = useState(3000);
  const [hosting, setHosting] = useState(500);
  const [financeFeedback, setFinanceFeedback] = useState<string | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  // MVP Sim State
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [mvpFeedback, setMvpFeedback] = useState<string | null>(null);
  const [mvpLoading, setMvpLoading] = useState(false);
  const MAX_EFFORT = 12;

  const totalEffort = MVP_FEATURES.filter(f => selectedFeatures.includes(f.id)).reduce((sum, f) => sum + f.effort, 0);
  const totalValue = MVP_FEATURES.filter(f => selectedFeatures.includes(f.id)).reduce((sum, f) => sum + f.value, 0);

  const revenue = pricePerUser * monthlyUsers;
  const totalCosts = salaries + marketing + hosting;
  const netProfit = revenue - totalCosts;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const runway = netProfit < 0 ? Math.floor(100000 / Math.abs(netProfit)) : Infinity;

  const toggleFeature = (id: string) => {
    const feature = MVP_FEATURES.find(f => f.id === id);
    if (!feature) return;
    
    if (selectedFeatures.includes(id)) {
      setSelectedFeatures(selectedFeatures.filter(fid => fid !== id));
    } else if (totalEffort + feature.effort <= MAX_EFFORT) {
      setSelectedFeatures([...selectedFeatures, id]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const response = await askStartupQuestion(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "ERROR: Connection to mentor lost." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPitchLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await evaluatePitch(base64, file.type, profile.startupIdea || "a new startup");
        setPitchFeedback(result);
        setPitchLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setPitchFeedback({ feedback: "Failed to analyze video. Please try again.", score: 0 });
      setPitchLoading(false);
    }
  };

  const handleFinanceAnalysis = async () => {
    setFinanceLoading(true);
    try {
      const analysis = await evaluateFinancials({
        revenue,
        totalCosts,
        netProfit,
        margin,
        runway,
        breakdown: { pricePerUser, monthlyUsers, salaries, marketing, hosting }
      });
      setFinanceFeedback(analysis);
    } catch (error) {
      setFinanceFeedback("Financial analysis failed. Check your inputs.");
    } finally {
      setFinanceLoading(false);
    }
  };

  const handleMvpAnalysis = async () => {
    setMvpLoading(true);
    try {
      const features = MVP_FEATURES.filter(f => selectedFeatures.includes(f.id)).map(f => f.name);
      const analysis = await evaluateMVP(features, profile.startupIdea || "a new startup");
      setMvpFeedback(analysis);
    } catch (error) {
      setMvpFeedback("MVP analysis failed. Try selecting different features.");
    } finally {
      setMvpLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono">
      {/* Simulations */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-neon-pink neon-glow-pink">Simulations</h2>
          <div className="px-3 py-1 border border-neon-pink/30 text-[10px] font-bold uppercase tracking-widest text-neon-pink">Interactive</div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {SIMULATIONS.map((sim) => (
            <motion.div 
              key={sim.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveSim(sim)}
              className={`game-card cursor-pointer transition-all ${
                activeSim?.id === sim.id ? 'border-neon-pink bg-neon-pink/10' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 border ${activeSim?.id === sim.id ? 'border-neon-pink text-neon-pink' : 'border-zinc-800 text-zinc-600'}`}>
                  {sim.icon}
                </div>
                <div className="space-y-1">
                  <h3 className={`font-black uppercase tracking-widest ${activeSim?.id === sim.id ? 'text-white' : 'text-zinc-400'}`}>{sim.title}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${activeSim?.id === sim.id ? 'text-neon-pink' : 'text-zinc-600'}`}>{sim.challenge}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeSim && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="game-card border-neon-pink/50 bg-zinc-900 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-neon-pink">Scenario: {activeSim.title}</h3>
                <p className="text-sm font-bold text-zinc-300 leading-relaxed uppercase tracking-widest">{activeSim.scenario}</p>
              </div>

              {/* Pitch Sim UI */}
              {activeSim.id === 'sim-pitch' && (
                <div className="space-y-4">
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleVideoUpload}
                  />
                  {!pitchFeedback && !pitchLoading && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-zinc-700 hover:border-neon-pink transition-all flex flex-col items-center gap-2 text-zinc-500 hover:text-neon-pink"
                    >
                      <Upload className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Upload Pitch Video</span>
                    </button>
                  )}
                  {pitchLoading && (
                    <div className="py-8 flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">AI Analyzing Pitch...</span>
                    </div>
                  )}
                  {pitchFeedback && (
                    <div className="space-y-4 p-4 border border-neon-pink/30 bg-neon-pink/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pitch Score:</span>
                        <span className="text-2xl font-black text-neon-pink neon-glow-pink">{pitchFeedback.score}/100</span>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-[10px] font-bold uppercase tracking-widest leading-loose text-zinc-300">
                        <ReactMarkdown>{pitchFeedback.feedback}</ReactMarkdown>
                      </div>
                      <button 
                        onClick={() => { setPitchFeedback(null); }}
                        className="w-full py-2 border border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
                      >
                        [ Try Again ]
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Sim UI */}
              {activeSim.id === 'sim-finance' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-zinc-500">Price per User</span>
                        <span className="text-neon-pink">${pricePerUser}</span>
                      </div>
                      <input 
                        type="range" min="5" max="500" step="5"
                        value={pricePerUser}
                        onChange={(e) => setPricePerUser(Number(e.target.value))}
                        className="w-full accent-neon-pink"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-zinc-500">Monthly Users</span>
                        <span className="text-neon-pink">{monthlyUsers}</span>
                      </div>
                      <input 
                        type="range" min="10" max="5000" step="10"
                        value={monthlyUsers}
                        onChange={(e) => setMonthlyUsers(Number(e.target.value))}
                        className="w-full accent-neon-pink"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Salaries</label>
                        <input 
                          type="number" value={salaries} onChange={(e) => setSalaries(Number(e.target.value))}
                          className="w-full bg-zinc-800 border border-zinc-700 p-2 text-[10px] font-bold text-white outline-none focus:border-neon-pink"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Marketing</label>
                        <input 
                          type="number" value={marketing} onChange={(e) => setMarketing(Number(e.target.value))}
                          className="w-full bg-zinc-800 border border-zinc-700 p-2 text-[10px] font-bold text-white outline-none focus:border-neon-pink"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Hosting</label>
                        <input 
                          type="number" value={hosting} onChange={(e) => setHosting(Number(e.target.value))}
                          className="w-full bg-zinc-800 border border-zinc-700 p-2 text-[10px] font-bold text-white outline-none focus:border-neon-pink"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-800 bg-black/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monthly Revenue</span>
                      <span className="text-sm font-black text-green-500">${revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Costs</span>
                      <span className="text-sm font-black text-red-500">${totalCosts.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-zinc-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Net Profit</span>
                      <span className={`text-lg font-black ${netProfit >= 0 ? 'text-green-500 neon-glow-green' : 'text-red-500 neon-glow-red'}`}>
                        ${netProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest">
                      <span className="text-zinc-600">Runway</span>
                      <span className="text-zinc-400">{runway === Infinity ? '∞ MONTHS' : `${runway} MONTHS`}</span>
                    </div>
                  </div>

                  {!financeFeedback && !financeLoading && (
                    <button 
                      onClick={handleFinanceAnalysis}
                      className="w-full py-3 bg-neon-pink/10 border border-neon-pink text-neon-pink text-[10px] font-bold uppercase tracking-widest hover:bg-neon-pink hover:text-black transition-all"
                    >
                      Analyze Financial Strategy
                    </button>
                  )}
                  {financeLoading && (
                    <div className="py-4 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-neon-pink" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Audit in progress...</span>
                    </div>
                  )}
                  {financeFeedback && (
                    <div className="p-4 border border-neon-pink/30 bg-neon-pink/5 space-y-4">
                      <div className="prose prose-invert prose-sm max-w-none text-[10px] font-bold uppercase tracking-widest leading-loose text-zinc-300">
                        <ReactMarkdown>{financeFeedback}</ReactMarkdown>
                      </div>
                      <button 
                        onClick={() => setFinanceFeedback(null)}
                        className="w-full py-2 border border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
                      >
                        [ Reset Analysis ]
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MVP Sim UI */}
              {activeSim.id === 'sim-mvp' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Effort Budget</span>
                      <div className="flex gap-1">
                        {Array.from({ length: MAX_EFFORT }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3 border ${i < totalEffort ? 'bg-neon-pink border-neon-pink' : 'border-zinc-800'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Value</span>
                      <div className="text-xl font-black text-neon-pink neon-glow-pink">{totalValue}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {MVP_FEATURES.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => toggleFeature(feature.id)}
                        disabled={!selectedFeatures.includes(feature.id) && totalEffort + feature.effort > MAX_EFFORT}
                        className={`p-3 border text-left transition-all relative overflow-hidden ${
                          selectedFeatures.includes(feature.id)
                            ? 'border-neon-pink bg-neon-pink/10'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 disabled:opacity-20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{feature.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tighter truncate">{feature.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest">
                          <span className="text-zinc-500">Effort: {feature.effort}</span>
                          <span className="text-neon-pink">Value: {feature.value}</span>
                        </div>
                        {selectedFeatures.includes(feature.id) && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-3 h-3 text-neon-pink" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {!mvpFeedback && !mvpLoading && (
                    <button 
                      onClick={handleMvpAnalysis}
                      disabled={selectedFeatures.length === 0}
                      className="w-full py-3 bg-neon-pink/10 border border-neon-pink text-neon-pink text-[10px] font-bold uppercase tracking-widest hover:bg-neon-pink hover:text-black transition-all disabled:opacity-30"
                    >
                      Evaluate MVP Strategy
                    </button>
                  )}
                  {mvpLoading && (
                    <div className="py-4 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-neon-pink" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Product Manager Audit...</span>
                    </div>
                  )}
                  {mvpFeedback && (
                    <div className="p-4 border border-neon-pink/30 bg-neon-pink/5 space-y-4">
                      <div className="prose prose-invert prose-sm max-w-none text-[10px] font-bold uppercase tracking-widest leading-loose text-zinc-300">
                        <ReactMarkdown>{mvpFeedback}</ReactMarkdown>
                      </div>
                      <button 
                        onClick={() => setMvpFeedback(null)}
                        className="w-full py-2 border border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
                      >
                        [ Refine MVP ]
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 bg-zinc-800/50 border border-zinc-700">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">"What would you do? Ask the mentor below for advice on this specific scenario."</p>
              </div>
              <button 
                onClick={() => setActiveSim(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
              >
                [ Close Simulation ]
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chatbot */}
      <div className="flex flex-col h-[calc(100vh-12rem)] game-card border-neon-blue/30 bg-zinc-900/50 overflow-hidden p-0">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-neon-blue flex items-center justify-center">
              <Bot className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-neon-blue">Startup Mentor</h3>
              <p className="text-[10px] text-green-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 border ${
                msg.role === 'user' ? 'border-neon-pink bg-neon-pink/10 text-white' : 'border-zinc-800 bg-zinc-800/50 text-zinc-300'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none text-[12px] font-bold uppercase tracking-widest">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800/50 border border-zinc-800 p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-neon-blue" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Processing...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
          <div className="relative">
            <input 
              type="text"
              placeholder="Input query..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-zinc-800 border border-zinc-700 py-4 pl-4 pr-12 focus:border-neon-blue outline-none transition-all text-sm font-bold uppercase tracking-widest"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-blue hover:text-white transition-all disabled:opacity-30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
