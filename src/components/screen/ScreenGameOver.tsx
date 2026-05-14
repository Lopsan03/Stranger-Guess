import { motion } from 'motion/react';
import { GameRoom, Player, Guess, GameStatus, PlayerStatus } from '../../types';
import PlayerAvatar from '../shared/PlayerAvatar';
import Confetti from '../shared/Confetti';
import { updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getPlayerData } from '../../lib/gameUtils';
import { getQuestionsForGame } from '../../lib/questions';
import { cn } from '../../lib/utils';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScreenGameOverProps {
  room: GameRoom;
  players: Player[];
  guesses: Guess[];
}

export default function ScreenGameOver({ room, players, guesses }: ScreenGameOverProps) {
  const navigate = useNavigate();
  const currentPlayerData = getPlayerData();
  const isHost = currentPlayerData?.isHost && currentPlayerData.roomCode === room.room_code;
  
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sortedPlayers[0];

  const handlePlayAgain = async () => {
    const nextQuestions = getQuestionsForGame(room.settings.category, 1, room.used_question_ids);
    const nextQ = nextQuestions[0];
    const roomRef = doc(db, 'rooms', room.id!);
    const batch = writeBatch(db);
    
    // Reset players scores
    players.forEach(p => {
      const pRef = doc(db, 'players', p.id!);
      batch.update(pRef, { score: 0, round_score: 0 });
    });

    batch.update(roomRef, {
      status: GameStatus.QUESTION,
      current_round: 1,
      current_question: nextQ,
      used_question_ids: [...room.used_question_ids, nextQ.id],
      phase_started_at: new Date().toISOString(),
      answers_submitted: 0,
      guesses_submitted: 0,
      current_answer_index: 0
    });

    // We should ideally delete old answers/guesses too, but for simplicity we keep them.
    // Real prod apps would have a cleanup job or use round-number in IDs.

    await batch.commit();
  };

  const titles = [
    { label: '🔍 Best Detective', value: players.map(p => ({ id: p.id, count: guesses.filter(g => g.guesser_player_id === p.id && g.is_correct).length })).sort((a,b) => b.count - a.count)[0] },
    { label: '🎭 Master of Disguise', value: players.map(p => ({ id: p.id, count: guesses.filter(g => g.guessed_player_id !== p.id && g.answer_id && guesses.find(gu => gu.answer_id === g.answer_id && gu.guessed_player_id === p.id && !gu.is_correct)).length })).filter(x => x.count > 0).sort((a,b) => b.count - a.count)[0] },
    { label: '⚡ Speed Demon', value: players.map(p => ({ id: p.id, speed: guesses.filter(g => g.guesser_player_id === p.id && g.is_correct).reduce((acc, curr) => acc + curr.time_taken, 0) / (guesses.filter(g => g.guesser_player_id === p.id && g.is_correct).length || 1) })).filter(x => x.speed > 0).sort((a,b) => a.speed - b.speed)[0] }
  ].filter(t => t.value !== undefined);

  return (
    <div className="w-full max-w-6xl space-y-12">
      <Confetti />
      
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
           <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
           <h2 className="font-display text-8xl gradient-text neon-text-purple tracking-tight uppercase">
            GAME OVER
          </h2>
           <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
        </div>
        <p className="text-2xl text-muted-foreground uppercase font-display tracking-widest">Congratulations to our winner!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Podium */}
        <div className="flex items-end justify-center gap-4 h-[400px] pb-12">
           {sortedPlayers[1] && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: '60%', opacity: 1 }}
               transition={{ delay: 0.5, duration: 0.8 }}
               className="w-32 bg-white/10 rounded-t-3xl flex flex-col items-center justify-end p-6 border-x border-t border-white/10"
             >
                <div className="mb-4">
                  <PlayerAvatar player={sortedPlayers[1]} size="md" showName />
                </div>
                <div className="font-display text-4xl text-white opacity-50 mb-2">2nd</div>
             </motion.div>
           )}

           {winner && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: '90%', opacity: 1 }}
               transition={{ duration: 1 }}
               className="w-40 bg-primary/20 rounded-t-4xl flex flex-col items-center justify-end p-8 border-x border-t border-primary/40 relative neon-glow-purple"
             >
                <div className="absolute -top-12">
                   <div className="bg-yellow-500 text-black font-bold p-2 px-4 rounded-full font-display text-xl animate-float">WINNER!</div>
                </div>
                <div className="mb-6 scale-125">
                  <PlayerAvatar player={winner} size="lg" showName />
                </div>
                <div className="font-display text-6xl text-white mb-2">1st</div>
                <div className="font-display text-2xl text-primary">{winner.score} pts</div>
             </motion.div>
           )}

           {sortedPlayers[2] && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: '40%', opacity: 1 }}
               transition={{ delay: 0.7, duration: 0.8 }}
               className="w-32 bg-white/5 rounded-t-3xl flex flex-col items-center justify-end p-6 border-x border-t border-white/10"
             >
                <div className="mb-4">
                  <PlayerAvatar player={sortedPlayers[2]} size="md" showName />
                </div>
                <div className="font-display text-4xl text-white opacity-30 mb-2">3rd</div>
             </motion.div>
           )}
        </div>

        {/* Full Leaderboard & Titles */}
        <div className="space-y-8">
           <div className="glass p-8 rounded-[3rem] space-y-4">
              <h3 className="font-display text-2xl text-muted-foreground uppercase opacity-60">Final Standings</h3>
              <div className="space-y-2">
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 px-6 bg-white/5 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <span className="font-display text-xl text-muted-foreground">#{i+1}</span>
                        <PlayerAvatar player={p} size="sm" />
                        <span className="font-display text-xl uppercase">{p.nickname}</span>
                     </div>
                     <span className="font-display text-xl text-white">{p.score}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {titles.map((t, i) => {
                const player = players.find(p => p.id === t.value.id);
                return (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 + i * 0.2 }}
                    className="glass p-4 rounded-3xl flex flex-col items-center gap-2 border-white/10"
                  >
                     <span className="text-xs font-bold text-accent uppercase tracking-tighter text-center">{t.label}</span>
                     <PlayerAvatar player={player} size="sm" />
                     <span className="text-[10px] uppercase font-bold text-white/40">{player?.nickname}</span>
                  </motion.div>
                );
              })}
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-6 pt-12">
        {isHost && (
          <button
            onClick={handlePlayAgain}
            className="bg-primary hover:bg-primary/90 text-white font-display text-4xl px-16 py-6 rounded-[2.5rem] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group neon-glow-purple"
          >
            🔄 Play Again
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display text-4xl px-16 py-6 rounded-[2.5rem] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group"
        >
          🏠 Return Home
        </button>

        {!isHost && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-12 py-6 rounded-[2.5rem] border border-white/10 font-display text-3xl tracking-wide text-muted-foreground">
              Waiting for host to reset...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
