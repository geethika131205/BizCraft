import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { generateStartupRoadmap } from '../services/geminiService';
import { motion } from 'motion/react';
import { Rocket, Loader2, Sparkles } from 'lucide-react';

interface Props {
  user: User;
}

export default function ProfileSetup({ user }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    experience: '',
    budget: '',
    time: '',
    industry: '',
    goal: '',
    startupIdea: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const roadmap = await generateStartupRoadmap(formData, formData.startupIdea);
      const profile: UserProfile = {
        uid: user.uid,
        ...formData,
        currentLevel: 1,
        xp: 0,
        completedTasks: [],
        isLevelCompleted: false,
        roadmap
      };
      await setDoc(doc(db, 'userProfiles', user.uid), profile);
    } catch (error) {
      console.error("Setup failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-retro-bg text-white flex items-center justify-center p-4 font-mono">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full game-card space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-neon-green/30" />
        
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 border-2 border-neon-green/20 flex items-center justify-center mx-auto mb-4 rotate-45">
            <Rocket className="w-8 h-8 text-neon-green -rotate-45" />
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-neon-green neon-glow">Character Creation</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Define your startup attributes</p>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Experience Attribute</label>
                  <select 
                    value={formData.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm font-bold uppercase tracking-widest text-white focus:border-neon-green outline-none transition-all"
                  >
                    <option value="">Select level...</option>
                    <option value="Beginner">Noob (First Startup)</option>
                    <option value="Intermediate">Player (Some Experience)</option>
                    <option value="Expert">Pro (Serial Founder)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Gold Reserves (Budget)</label>
                  <select 
                    value={formData.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm font-bold uppercase tracking-widest text-white focus:border-neon-green outline-none transition-all"
                  >
                    <option value="">Select budget...</option>
                    <option value="Zero">Zero ($0)</option>
                    <option value="Low">Low ($100 - $1,000)</option>
                    <option value="Medium">Medium ($1,000 - $10,000)</option>
                    <option value="High">High ($10,000+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Stamina (Time Commitment)</label>
                  <select 
                    value={formData.time}
                    onChange={(e) => updateField('time', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm font-bold uppercase tracking-widest text-white focus:border-neon-green outline-none transition-all"
                  >
                    <option value="">Select time...</option>
                    <option value="Side Project">Side Quest (5-10 hrs/week)</option>
                    <option value="Part Time">Part Time (20 hrs/week)</option>
                    <option value="Full Time">Main Quest (40+ hrs/week)</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.experience || !formData.budget || !formData.time}
                className="w-full game-button border-2 border-white text-white hover:bg-white hover:text-black disabled:opacity-30"
              >
                Next Phase
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Industry Realm</label>
                  <input 
                    type="text"
                    placeholder="e.g. SaaS, AI, Health"
                    value={formData.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm font-bold uppercase tracking-widest text-white focus:border-neon-green outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Main Quest Objective (Idea)</label>
                  <textarea 
                    placeholder="Describe your vision..."
                    value={formData.startupIdea}
                    onChange={(e) => updateField('startupIdea', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 h-32 text-sm font-bold uppercase tracking-widest text-white focus:border-neon-green outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Victory Condition (Goal)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Financial Freedom"
                    value={formData.goal}
                    onChange={(e) => updateField('goal', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm font-bold uppercase tracking-widest text-white focus:border-neon-green outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 game-button border border-zinc-800 text-zinc-500 hover:text-white"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !formData.industry || !formData.startupIdea || !formData.goal}
                  className="flex-[2] game-button border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Roadmap
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
