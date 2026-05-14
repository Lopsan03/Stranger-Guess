import { motion } from 'motion/react';
import { GameRoom, Player, Answer, Guess, GameStatus } from '../../types';
import PlayerAvatar from '../shared/PlayerAvatar';
import { updateDoc, doc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getPlayerData } from '../../lib/gameUtils';
import { getQuestionsForGame } from '../../lib/questions';
import { cn } from '../../lib/utils';

interface ScreenRoundResultsProps {
  room: GameRoom;
  players: Player[];
  answers: Answer[];
  guesses: Guess[];
}

export default function ScreenRoundResults({ room, players, answers, guesses }: ScreenRoundResultsProps) {
  const currentPlayerData = getPlayerData();
  const isHost = currentPlayerData?.isHost && currentPlayerData.roomCode === room.room_code;
  
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleNextRound = async () => {
    const isGameOver = room.current_round >= room.settings.num_rounds;
    const roomRef = doc(db, 'rooms', room.id!);
    
    if (isGameOver) {
      await updateDoc(roomRef, {
        status: GameStatus.GAME_OVER,
        phase_started_at: new Date().toISOString()
      });
    } else {
      const nextQuestions = getQuestionsForGame(room.settings.category, 1, room.used_question_ids);
      const nextQ = nextQuestions[0];
      
      const batch = writeBatch(db);
      
      // Reset players round_score
      players.forEach(p => {
        const pRef = doc(db, 'players', p.id!);
        batch.update(pRef, { round_score: 0 });
      });

      // Clear answers and guesses for next round
      // (Optionally keep them but for simplicity we can delete or round-number filter)
      // Spec says "round_score updated each round", we handle that in scoring.
      
      batch.update(roomRef, {
        current_round: room.current_round + 1,
        current_question: nextQ,
        used_question_ids: [...room.used_question_ids, nextQ.id],
        status: GameStatus.QUESTION,
        phase_started_at: new Date().toISOString(),
        answers_submitted: 0,
        guesses_submitted: 0,
        current_answer_index: 0
      });

      await batch.commit();
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-12">
      <div className="text-center space-y-4">
        <h2 className="font-display text-7xl gradient-text neon-text-purple tracking-tight uppercase">
          ROUND {room.current_round} RESULTS
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Leaderboard */}
        <div className="glass p-8 rounded-[3rem] space-y-6">
          <h3 className="font-display text-3xl uppercase tracking-wider ml-2">Leaderboard</h3>
          <div className="space-y-3">
            {sortedPlayers.map((player, i) => {
              const rank = i + 1;
              const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
              return (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    rank === 1 ? "bg-primary/20 border-primary/40 shadow-lg" : "bg-white/5 border-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-2xl w-8 text-center">{rankEmoji}</span>
                    <PlayerAvatar player={player} size="sm" />
                    <span className="font-display text-2xl text-white uppercase">{player.nickname}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-green-400 font-bold text-sm">+{player.round_score}</span>
                    <span className="font-display text-2xl text-white neon-text-purple">{player.score}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Who Said What */}
        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
          <h3 className="font-display text-3xl uppercase tracking-wider ml-2">Who Said What</h3>
          <div className="space-y-4">
            {answers
              .filter(a => a.round_number === room.current_round)
              .sort((a,b) => (a.reveal_order || 0) - (b.reveal_order || 0))
              .map((ans, i) => {
              const author = players.find(p => p.id === ans.player_id);
              const correctGuessers = guesses.filter(g => g.answer_id === ans.id && g.is_correct);
              const wrongGuessers = guesses.filter(g => g.answer_id === ans.id && !g.is_correct);
              
              return (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  key={ans.id}
                  className="glass p-6 rounded-3xl space-y-4 border-white/5"
                >
                  <p className="font-medium text-white italic opacity-80">"{ans.answer_text}"</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Author:</span>
                      <PlayerAvatar player={author} size="sm" showName />
                    </div>
                    <div className="flex -space-x-2">
                      {correctGuessers.map(g => {
                        const gu = players.find(p => p.id === g.guesser_player_id);
                        return (
                          <div key={g.id} className="relative group">
                             <PlayerAvatar player={gu} size="sm" className="ring-2 ring-background" />
                             <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border border-background shadow-xs" />
                          </div>
                        );
                      })}
                      {correctGuessers.length === 0 && <span className="text-[10px] text-pink-500 uppercase font-bold">Nobody guessed right!</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        {isHost ? (
          <button
            onClick={handleNextRound}
            className="bg-primary hover:bg-primary/90 text-white font-display text-4xl px-16 py-6 rounded-[2.5rem] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group neon-glow-purple"
          >
            {room.current_round >= room.settings.num_rounds ? '🏆 See Final Results' : 'Next Round →'}
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-3xl border border-white/10 font-display text-2xl tracking-wide text-muted-foreground">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </div>
  );
}
