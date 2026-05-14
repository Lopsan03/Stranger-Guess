import { useEffect } from 'react';
import { motion } from 'motion/react';
import { GameRoom, Answer, Player, GameStatus } from '../../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getPlayerData } from '../../lib/gameUtils';
import { cn } from '../../lib/utils';

interface ScreenRevealProps {
  room: GameRoom;
  answers: Answer[];
  players: Player[];
}

export default function ScreenReveal({ room, answers, players }: ScreenRevealProps) {
  const currentRoundAnswers = answers.filter(a => a.round_number === room.current_round);
  const currentAnswer = currentRoundAnswers.find(a => a.reveal_order === room.current_answer_index);
  const totalAnswers = currentRoundAnswers.length;
  const currentPlayerData = getPlayerData();
  const isHost = currentPlayerData?.isHost && currentPlayerData.roomCode === room.room_code;

  useEffect(() => {
    if (!isHost) return;

    const timer = window.setTimeout(() => {
      const roomRef = doc(db, 'rooms', room.id!);
      void updateDoc(roomRef, {
        status: GameStatus.GUESSING,
        phase_started_at: new Date().toISOString(),
        guesses_submitted: 0
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isHost, room.id]);

  if (!currentAnswer) return <div>Loading answer...</div>;

  return (
    <div className="w-full max-w-5xl space-y-12 flex flex-col items-center">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-4">
          {Array.from({ length: totalAnswers }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === room.current_answer_index ? "w-12 bg-primary neon-glow-purple" : i < room.current_answer_index ? "w-4 bg-primary/40" : "w-4 bg-white/10"
              )} 
            />
          ))}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-60">Answer {room.current_answer_index + 1} of {totalAnswers}</span>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12 }}
        className="relative w-full"
      >
        <div className="glass-strong p-20 rounded-[4rem] text-center relative z-10 border-white/20 shadow-2xl">
          <div className="absolute top-8 left-12 text-8xl font-display text-white/5 select-none leading-none">“</div>
          <p className="font-display text-5xl sm:text-7xl leading-tight text-white mb-4 italic px-4">
            {currentAnswer.answer_text}
          </p>
          <div className="absolute bottom-8 right-12 text-8xl font-display text-white/5 select-none leading-none rotate-180">“</div>
        </div>
        
        <div className="absolute inset-0 bg-primary/20 blur-[120px] -z-10 rounded-full opacity-50" />
      </motion.div>

      <div className="space-y-8 flex flex-col items-center">
        <h2 className="font-display text-6xl text-accent neon-text-cyan tracking-tighter uppercase animate-bounce">
          WHO SAID THIS?
        </h2>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-3xl border border-white/10 font-display text-2xl tracking-wide text-muted-foreground">
            <span className="animate-pulse">⏱️</span> Guessing phase will start automatically
          </div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
            {isHost ? 'Preparing the next phase...' : 'Please wait while the game progresses'}
          </p>
        </div>
        
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em] flex items-center gap-2">
          <span>📱</span> Select your guess on your phone!
        </p>
      </div>
    </div>
  );
}
