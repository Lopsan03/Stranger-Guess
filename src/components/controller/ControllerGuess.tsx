import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GameRoom, Player, Answer, Guess } from '../../types';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import PlayerAvatar from '../shared/PlayerAvatar';
import { cn } from '../../lib/utils';

interface ControllerGuessProps {
  room: GameRoom;
  player: Player;
  players: Player[];
}

export default function ControllerGuess({ room, player, players }: ControllerGuessProps) {
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [myGuess, setMyGuess] = useState<Guess | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Get the current answer being revealed
    const q = query(
      collection(db, 'answers'), 
      where('room_code', '==', room.room_code),
      where('round_number', '==', room.current_round),
      where('reveal_order', '==', room.current_answer_index)
    );
    const unsubscribeAnswer = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const ans = { id: snap.docs[0].id, ...snap.docs[0].data() } as Answer;
        setCurrentAnswer(ans);
        
        // 2. See if I already guessed for this answer
        const gq = query(
          collection(db, 'guesses'),
          where('answer_id', '==', ans.id),
          where('guesser_player_id', '==', player.id)
        );
        getDocs(gq).then(gsnap => {
          if (!gsnap.empty) {
             setMyGuess(gsnap.docs[0].data() as Guess);
          } else {
             setMyGuess(null);
          }
          setLoading(false);
        });
      }
    });

    return () => unsubscribeAnswer();
  }, [room.current_answer_index, room.current_round, player.id]);

  const handleGuess = async (targetPlayerId: string) => {
    if (!currentAnswer || myGuess || submitting) return;
    setSubmitting(true);
    try {
      const isCorrect = currentAnswer.player_id === targetPlayerId;
      const startTime = new Date(room.phase_started_at).getTime();
      const timeTaken = (Date.now() - startTime) / 1000;

      const guessRef = await addDoc(collection(db, 'guesses'), {
        room_code: room.room_code,
        round_number: room.current_round,
        answer_id: currentAnswer.id,
        guesser_player_id: player.id,
        guesser_session_id: player.session_id,
        guessed_player_id: targetPlayerId,
        is_correct: isCorrect,
        time_taken: Math.min(timeTaken, room.settings.guess_timer),
        points_earned: 0
      });

      await updateDoc(doc(db, 'rooms', room.id!), {
        guesses_submitted: increment(1)
      });

      setMyGuess({
        id: guessRef.id,
        room_code: room.room_code,
        round_number: room.current_round,
        answer_id: currentAnswer.id,
        guesser_player_id: player.id,
        guesser_session_id: player.session_id,
        guessed_player_id: targetPlayerId,
        is_correct: isCorrect,
        time_taken: Math.min(timeTaken, room.settings.guess_timer),
        points_earned: 0
      } as Guess);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !currentAnswer) return (
     <div className="w-full flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
     </div>
  );

  const isAuthor = currentAnswer.player_id === player.id;

  if (isAuthor) {
    return (
      <div className="w-full space-y-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
         <motion.div 
           animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="text-8xl"
         >
           😈
         </motion.div>
         <div className="space-y-4">
           <h2 className="font-display text-4xl text-white uppercase tracking-tight">That's YOUR answer!</h2>
           <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em] animate-pulse">Shhh... don't say anything! 🤫</p>
         </div>
         <div className="glass p-6 rounded-2xl border-white/10 max-w-xs italic opacity-50">
           "{currentAnswer.answer_text}"
         </div>
      </div>
    );
  }

  if (myGuess) {
    return (
      <div className="w-full space-y-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
         <div className="text-8xl">🕵️‍♂️</div>
         <div className="space-y-4">
           <h2 className="font-display text-4xl text-accent uppercase tracking-tight neon-text-cyan">Guess Locked In!</h2>
           <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Watch the screen for the reveal</p>
         </div>
         <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 font-display text-xl text-white/40">
           One guess only — choose wisely!
         </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-accent uppercase tracking-wider">Who Said It?</h2>
        <div className="glass p-5 rounded-2xl border-white/10">
          <p className="text-white italic text-lg leading-relaxed">
            "{currentAnswer.answer_text}"
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground text-center block">TAP A NAME TO GUESS</label>
        <div className="grid grid-cols-2 gap-3">
          {players.filter(p => p.id !== player.id && !p.is_host).map((p) => {
            return (
              <button
                key={p.id}
                onClick={() => handleGuess(p.id!)}
                disabled={submitting || !!myGuess}
                className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-all active:scale-95 group border-white/5"
              >
                <PlayerAvatar player={p} size="md" className="group-hover:neon-glow-cyan transition-all" />
                <span className="font-display text-lg uppercase tracking-wide text-white">{p.nickname}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
