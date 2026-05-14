import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Target, Users, Play, Trophy, HelpCircle, MessageCircle, Heart, Lightbulb } from 'lucide-react';
import CreateGameModal from '../components/home/CreateGameModal';
import JoinGameModal from '../components/home/JoinGameModal';

export default function Home() {
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
      {/* Header */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <h1 className="font-display text-2xl gradient-text tracking-tighter">STRANGER GUESS</h1>
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">Party Game</span>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-12 mb-20">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>🎮</span> For 2–12 players · In-person party game
          </div>

          <h2 className="font-display text-6xl sm:text-8xl flex flex-col leading-[0.9] tracking-tight">
            <span className="gradient-text neon-text-purple">HOW WELL DO</span>
            <span className="text-white">YOUR FRIENDS</span>
            <span className="gradient-text neon-text-cyan uppercase">REALLY KNOW YOU?</span>
          </h2>

          <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto font-medium">
            Answer anonymously. Guess who said what. Expose your friends.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-display text-2xl py-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Rocket className="w-6 h-6" />
            Start Game
          </button>
          <button 
            onClick={() => setJoinModalOpen(true)}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display text-2xl py-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Target className="w-6 h-6" />
            Join Game
          </button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full"
        >
          {[
            { icon: <HelpCircle className="w-6 h-6 text-purple-400" />, title: "Answer Anonymously" },
            { icon: <MessageCircle className="w-6 h-6 text-cyan-400" />, title: "Guess Who Said It" },
            { icon: <Trophy className="w-6 h-6 text-pink-400" />, title: "Climb the Leaderboard" }
          ].map((feature, i) => (
            <div key={i} className="glass p-6 rounded-3xl flex flex-col items-center gap-3 group hover:border-white/20 transition-colors cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <span className="font-display text-xl tracking-wide uppercase">{feature.title}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* How It Works Section */}
      <div className="w-full max-w-6xl space-y-12 mb-32">
        <h3 className="font-display text-5xl text-center tracking-tight">HOW IT WORKS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
          {[
            { step: '01', icon: '🏠', title: 'Host Creates a Room', desc: 'Choose your settings, get a room code. Share it with friends in the room.' },
            { step: '02', icon: '📱', title: 'Everyone Joins on Phone', desc: 'Players scan the QR code or type the 6-digit code. Pick a name and avatar.' },
            { step: '03', icon: '✍️', title: 'Answer Anonymously', desc: 'A question appears. Everyone types their answer secretly on their phone.' },
            { step: '04', icon: '🔍', title: 'Guess Who Said What', desc: 'Answers reveal one by one on the main screen. Vote who you think wrote it.' },
            { step: '05', icon: '🏆', title: 'Score & Repeat', desc: 'Earn points for correct guesses and for fooling others. Best player wins.' }
          ].map((item, i) => (
            <div key={i} className="glass p-6 rounded-3xl space-y-4 flex flex-col items-center text-center">
              <span className="text-4xl">{item.icon}</span>
              <span className="font-display text-2xl text-primary">{item.step}</span>
              <h4 className="font-display text-xl tracking-wide">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateGameModal onClose={() => setCreateModalOpen(false)} />
        )}
        {isJoinModalOpen && (
          <JoinGameModal onClose={() => setJoinModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
