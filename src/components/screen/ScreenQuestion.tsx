import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameRoom, GameStatus } from '../../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

interface ScreenQuestionProps {
  room: GameRoom;
}

export default function ScreenQuestion({ room }: ScreenQuestionProps) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const roomRef = doc(db, 'rooms', room.id!);
      await updateDoc(roomRef, {
        status: GameStatus.ANSWERING,
        phase_started_at: new Date().toISOString()
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [room.id]);

  const categoryColors = {
    mixed: 'from-purple-600/20 to-cyan-600/20',
    perception: 'from-cyan-600/20 to-blue-600/20',
    connection: 'from-orange-600/20 to-red-600/20',
    reflection: 'from-pink-600/20 to-purple-600/20'
  };

  const currentCategory = (room.current_question?.category || 'mixed') as keyof typeof categoryColors;

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <div className={cn(
          "px-6 py-2 rounded-full border border-white/10 text-[12px] uppercase font-bold tracking-[0.3em] flex items-center gap-3",
          categoryColors[currentCategory]
        )}>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
          Round {room.current_round} · {room.current_question?.category || 'Mixed'}
        </div>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative"
      >
        <div className={cn(
          "glass-strong p-16 rounded-[3rem] border border-white/20 text-center relative z-10 neon-glow-purple",
          "bg-gradient-to-br", categoryColors[currentCategory]
        )}>
          <h2 className="font-display text-5xl sm:text-7xl leading-tight text-white tracking-tight">
            {room.current_question?.text}
          </h2>
        </div>
        
        {/* Glow behind the card */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full animate-pulse-glow" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <p className="font-display text-4xl text-accent neon-text-cyan animate-pulse">
          📱 CHECK YOUR PHONE!
        </p>
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
          It's your turn to answer anonymously...
        </p>
      </motion.div>

      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mt-8">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "linear" }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}
