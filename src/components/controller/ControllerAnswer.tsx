import { useState } from 'react';
import { motion } from 'motion/react';
import { GameRoom, Player, GameStatus } from '../../types';
import { collection, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Send } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ControllerAnswerProps {
  room: GameRoom;
  player: Player;
}

export default function ControllerAnswer({ room, player }: ControllerAnswerProps) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 1. Submit Answer
      await addDoc(collection(db, 'answers'), {
        room_code: room.room_code,
        round_number: room.current_round,
        question_id: room.current_question?.id,
        player_id: player.id,
        player_session_id: player.session_id,
        answer_text: answer.trim(),
        is_revealed: false,
        reveal_order: null
      });

      // 2. Increment Answers Count in Room
      const roomRef = doc(db, 'rooms', room.id!);
      await updateDoc(roomRef, {
        answers_submitted: increment(1)
      });
    } catch (err) {
      console.error("Error submitting answer:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-accent uppercase tracking-wider">Your Turn!</h2>
        <div className="glass p-6 rounded-2xl border-white/10">
          <p className="text-white font-medium text-lg leading-snug">
            {room.current_question?.text}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder:text-white/20 resize-none text-lg"
            maxLength={150}
          />
          <div className="absolute bottom-4 right-4 text-[10px] uppercase font-bold text-muted-foreground">
            {answer.length}/150
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!answer.trim() || submitting}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-30 text-white font-display text-2xl py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group neon-glow-purple"
        >
          {submitting ? 'Submitting...' : '📨 Submit Anonymously'}
        </button>
        
        <p className="text-center text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-60">
           Nobody will know it's you... for now 😏
        </p>
      </div>
    </div>
  );
}
