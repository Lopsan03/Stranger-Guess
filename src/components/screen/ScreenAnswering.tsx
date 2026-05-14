import { useEffect } from 'react';
import { motion } from 'motion/react';
import { GameRoom, Player, Answer, GameStatus } from '../../types';
import CountdownTimer from '../shared/CountdownTimer';
import PlayerAvatar from '../shared/PlayerAvatar';
import { updateDoc, doc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ScreenAnsweringProps {
  room: GameRoom;
  players: Player[];
  answers: Answer[];
}

export default function ScreenAnswering({ room, players, answers }: ScreenAnsweringProps) {
  const currentRoundAnswers = answers.filter(a => a.round_number === room.current_round);
  const answeredCount = currentRoundAnswers.length;
  const totalCount = players.length;

  const handlePhaseComplete = async () => {
    const roomRef = doc(db, 'rooms', room.id!);
    
    // Shuffle only current round answers and assign reveal order
    const shuffled = [...currentRoundAnswers].sort(() => Math.random() - 0.5);
    const batch = writeBatch(db);
    
    shuffled.forEach((ans, index) => {
      const ansRef = doc(db, 'answers', ans.id!);
      batch.update(ansRef, { reveal_order: index });
    });

    batch.update(roomRef, {
      status: GameStatus.REVEALING,
      phase_started_at: new Date().toISOString(),
      current_answer_index: 0,
      answers_submitted: answeredCount
    });

    await batch.commit();
  };

  useEffect(() => {
    if (answeredCount >= totalCount && totalCount > 0) {
      const timer = setTimeout(handlePhaseComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [answeredCount, totalCount]);

  return (
    <div className="w-full max-w-5xl space-y-12 flex flex-col items-center">
      <div className="space-y-4 text-center">
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-60">Round {room.current_round}</span>
        <h2 className="font-display text-6xl gradient-text tracking-tight uppercase">Answering Time</h2>
      </div>

      <div className="glass p-12 rounded-[2.5rem] w-full text-center relative border-white/10">
        <h3 className="font-display text-4xl text-white mb-8">
          {room.current_question?.text}
        </h3>

        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-12">
            <CountdownTimer 
              seconds={room.settings.answer_timer} 
              onComplete={handlePhaseComplete}
              size="lg"
            />
            
            <div className="space-y-4 text-left">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Answers received</span>
                <span className="font-display text-6xl text-white leading-none">
                  {answeredCount}<span className="text-white/20">/</span>{totalCount}
                </span>
              </div>
              
              <div className="w-64 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(answeredCount / totalCount) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 mt-8">
            {players.map((player) => {
              const hasAnswered = currentRoundAnswers.some(a => a.player_session_id === player.session_id);
              return (
                <div key={player.id} className="relative group">
                  <PlayerAvatar 
                    player={player} 
                    size="md" 
                    dim={!hasAnswered}
                    className="transition-all duration-500"
                  />
                  <div className="absolute -top-1 -right-1">
                    {hasAnswered ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] neon-glow-green animate-bounce">✅</div>
                    ) : (
                      <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] text-white/40">⏳</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="font-display text-2xl text-muted-foreground flex items-center gap-3 animate-pulse">
        <span>📱</span> Type your answer on your phone!
      </p>
    </div>
  );
}
