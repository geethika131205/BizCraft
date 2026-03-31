import React, { useState, useEffect } from 'react';
import { UserProfile, Level, Task, LEVEL_NAMES } from '../types';
import { db } from '../firebase';
import { collection, doc, onSnapshot, updateDoc, query, writeBatch } from 'firebase/firestore';
import { generateLevelTasks, generateStartupTip } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Rocket, Loader2, Trophy, ArrowRight, Sparkles, Zap, Lock, Lightbulb, Mic2, BarChart3, Send, DollarSign, TrendingUp, Terminal } from 'lucide-react';
import FloatingChatbot from './FloatingChatbot';

interface Props {
  profile: UserProfile;
}

const LEVEL_ICONS: Record<Level, React.ReactNode> = {
  1: <Lightbulb className="w-6 h-6 text-yellow-500" />,
  2: <Mic2 className="w-6 h-6 text-zinc-600" />,
  3: <BarChart3 className="w-6 h-6 text-zinc-600" />,
  4: <Send className="w-6 h-6 text-zinc-600" />,
  5: <DollarSign className="w-6 h-6 text-zinc-600" />,
  6: <TrendingUp className="w-6 h-6 text-zinc-600" />
};

const LEVEL_LABELS: Record<Level, string> = {
  1: "Idea Lab",
  2: "Pitch Room",
  3: "Finance Hub",
  4: "Launch Pad",
  5: "Revenue Stream",
  6: "Scale Engine"
};

export default function BusinessMode({ profile }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [completingLevel, setCompletingLevel] = useState(false);
  const [editingIdea, setEditingIdea] = useState(false);
  const [tempIdea, setTempIdea] = useState(profile.startupIdea);
  const [aiTip, setAiTip] = useState<string>("");
  const [loadingTip, setLoadingTip] = useState(false);

  useEffect(() => {
    const fetchTip = async () => {
      setLoadingTip(true);
      try {
        const tip = await generateStartupTip(profile.currentLevel, profile.startupIdea);
        setAiTip(tip);
      } catch (error) {
        console.error("Failed to fetch tip:", error);
      } finally {
        setLoadingTip(false);
      }
    };
    fetchTip();
  }, [profile.currentLevel, profile.startupIdea]);

  useEffect(() => {
    const q = query(collection(db, 'userProfiles', profile.uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => doc.data() as Task);
      setTasks(taskList.filter(t => t.level === profile.currentLevel));
    });
    return unsubscribe;
  }, [profile.uid, profile.currentLevel]);

  const handleUpdateIdea = async () => {
    try {
      await updateDoc(doc(db, 'userProfiles', profile.uid), { startupIdea: tempIdea });
      setEditingIdea(false);
    } catch (error) {
      console.error("Failed to update idea:", error);
    }
  };

  const handleGenerateTasks = async () => {
    setLoadingTasks(true);
    try {
      const newTasks = await generateLevelTasks(profile.currentLevel, profile, profile.startupIdea);
      const batch = writeBatch(db);
      newTasks.forEach(task => {
        const taskRef = doc(collection(db, 'userProfiles', profile.uid, 'tasks'), task.id);
        batch.set(taskRef, task);
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to generate tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const taskRef = doc(db, 'userProfiles', profile.uid, 'tasks', task.id);
      const isCompleting = !task.isCompleted;
      await updateDoc(taskRef, { isCompleted: isCompleting });
      
      // Update XP
      const xpGain = isCompleting ? 100 : -100;
      await updateDoc(doc(db, 'userProfiles', profile.uid), { 
        xp: (profile.xp || 0) + xpGain 
      });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.isCompleted);

  const handleCompleteLevel = async () => {
    if (!allTasksCompleted || profile.currentLevel >= 6) return;
    setCompletingLevel(true);
    try {
      const nextLevel = (profile.currentLevel + 1) as Level;
      await updateDoc(doc(db, 'userProfiles', profile.uid), {
        currentLevel: nextLevel,
        isLevelCompleted: false,
        xp: (profile.xp || 0) + 500 // Level up bonus
      });
    } catch (error) {
      console.error("Failed to complete level:", error);
    } finally {
      setCompletingLevel(false);
    }
  };

  return (
    <div className="space-y-16 max-w-4xl mx-auto">
      {/* Startup Idea Input */}
      <div className="bg-zinc-900/30 border border-zinc-800 p-6 space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Your Startup Idea (Used for Personalized Mentor)</h3>
        <div className="relative">
          <input 
            type="text"
            value={tempIdea}
            onChange={(e) => setTempIdea(e.target.value)}
            onFocus={() => setEditingIdea(true)}
            onBlur={() => setTimeout(handleUpdateIdea, 200)}
            className="w-full bg-transparent border border-yellow-500/50 p-4 text-sm font-bold text-white focus:border-yellow-500 outline-none transition-all uppercase tracking-widest"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {editingIdea && <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />}
          </div>
        </div>
        <p className="text-[10px] text-zinc-700 uppercase font-bold tracking-widest">Level 1 will help you refine this - then each next level uses it for guidance.</p>
      </div>

      {/* App Branding */}
      <div className="text-center space-y-4">
        <Rocket className="w-12 h-12 text-pink-500 mx-auto" />
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-neon-green neon-glow">BizCraft</h2>
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.3em]">Learn. Build. Launch. Repeat.</p>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>XP</span>
          </div>
          <div className="text-zinc-600">
            <span className="text-white">{profile.xp || 0}</span> / {profile.currentLevel * 1000}
          </div>
        </div>
        <div className="h-3 w-full xp-bar-bg overflow-hidden p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((profile.xp || 0) / (profile.currentLevel * 1000)) * 100, 100)}%` }}
            className="h-full xp-bar-fill transition-all duration-1000" 
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
          <span className="text-zinc-700">{profile.currentLevel - 1} / 6 LEVELS COMPLETE</span>
          <span className="text-neon-green">LVL {profile.currentLevel}</span>
        </div>
      </div>

      {/* AI Tip Section */}
      <div className="game-card border-neon-blue/30 bg-neon-blue/5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-neon-blue/20 text-neon-blue">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neon-blue">Mentor Insight</h4>
            <div className="text-sm font-bold text-zinc-300 italic">
              {loadingTip ? (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>DECRYPTING GUIDANCE...</span>
                </div>
              ) : (
                `"${aiTip}"`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Level Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((lvl) => {
          const isCurrent = lvl === profile.currentLevel;
          const isLocked = lvl > profile.currentLevel;
          const isCompleted = lvl < profile.currentLevel;

          return (
            <motion.div 
              key={lvl}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 space-y-6 transition-all relative ${
                isCurrent ? 'active-border bg-zinc-900/50' : 
                'retro-border bg-zinc-900/20 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`px-2 py-1 border text-[8px] font-bold uppercase tracking-widest ${
                  isCurrent ? 'border-yellow-500 text-yellow-500' : 'border-zinc-800 text-zinc-700'
                }`}>
                  LVL {lvl}
                </div>
                {isLocked && <Lock className="w-3 h-3 text-zinc-800" />}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  {LEVEL_ICONS[lvl as Level]}
                  <div className="space-y-1">
                    <h4 className={`text-sm font-black uppercase tracking-widest ${isCurrent ? 'text-yellow-500' : 'text-zinc-700'}`}>
                      {LEVEL_LABELS[lvl as Level]}
                    </h4>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold leading-relaxed">
                      {profile.roadmap?.levels.find(l => l.level === lvl)?.description.split('.')[0] || "Discover your startup concept"}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <div className="space-y-2 pt-4">
                    <div className="flex gap-4 text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 border border-zinc-800" /> MENTOR</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 border border-zinc-800" /> SIM</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">+{lvl * 100} XP</span>
                    </div>
                  </div>
                )}

                {isLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <Lock className="w-6 h-6 text-yellow-500/50 mb-2" />
                    <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">LOCKED</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Tasks Section (Only for current level) */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 p-8 space-y-8"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
              Level {profile.currentLevel} Tasks
            </h3>
            {tasks.length === 0 && !loadingTasks && (
              <button 
                onClick={handleGenerateTasks}
                className="text-[10px] font-bold uppercase tracking-widest text-neon-green hover:neon-glow flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Initialize Tasks
              </button>
            )}
          </div>

          <div className="space-y-4">
            {loadingTasks ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-zinc-600">
                <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
                <p className="text-[10px] font-bold uppercase tracking-widest">AI is generating execution steps...</p>
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task)}
                  className={`p-4 border cursor-pointer transition-all flex items-center gap-4 ${
                    task.isCompleted ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-700 bg-zinc-800/20 hover:border-zinc-500'
                  }`}
                >
                  <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                    task.isCompleted ? 'bg-neon-green border-neon-green text-black' : 'border-zinc-700'
                  }`}>
                    {task.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold uppercase tracking-widest ${task.isCompleted ? 'text-zinc-700 line-through' : 'text-white'}`}>{task.title}</h4>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold">{task.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-zinc-700 border-2 border-dashed border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-widest">No tasks active. Click initialize above.</p>
              </div>
            )}
          </div>

          {allTasksCompleted && profile.currentLevel < 6 && (
            <button
              onClick={handleCompleteLevel}
              disabled={completingLevel}
              className="w-full py-4 border-2 border-neon-green text-neon-green font-black uppercase italic tracking-widest hover:bg-neon-green hover:text-black transition-all flex items-center justify-center gap-2"
            >
              {completingLevel ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  Advance to Level {profile.currentLevel + 1}
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      <FloatingChatbot profile={profile} tasks={tasks} />
    </div>
  );
}
