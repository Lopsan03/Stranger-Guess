import { useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowRight, User, Hash, Globe, Clock, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, authReady } from '../../lib/firebase';
import { generateRoomCode, getSessionId, setPlayerData, handleFirestoreError } from '../../lib/gameUtils';
import { GameStatus, PlayerStatus, OperationType } from '../../types';
import { getQuestionsForGame } from '../../lib/questions';
import AvatarPicker from '../shared/AvatarPicker';
import { cn } from '../../lib/utils';

interface CreateGameModalProps {
  onClose: () => void;
}

export default function CreateGameModal({ onClose }: CreateGameModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [rounds, setRounds] = useState(5);
  const [category, setCategory] = useState('mixed');
  const [answerTimer, setAnswerTimer] = useState(45);
  const [guessTimer, setGuessTimer] = useState(20);
  const [avatarColor, setAvatarColor] = useState('purple');
  const [avatarIcon, setAvatarIcon] = useState('😎');

  const handleCreate = async () => {
    setLoading(true);
    try {
      await authReady;
      const sessionId = getSessionId();
      const roomCode = generateRoomCode();
      const questions = getQuestionsForGame(category, 1, []);
      
      // 1. Create Room with roomCode as ID
      const roomRef = doc(db, 'rooms', roomCode);
      const roomData = {
        room_code: roomCode,
        host_id: sessionId,
        status: GameStatus.LOBBY,
        settings: {
          num_rounds: rounds,
          category,
          answer_timer: answerTimer,
          guess_timer: guessTimer
        },
        current_round: 1,
        current_question: questions[0],
        current_answer_index: 0,
        used_question_ids: [questions[0].id],
        phase_started_at: new Date().toISOString(),
        answers_submitted: 0,
        guesses_submitted: 0,
        total_players: 0
      };

      try {
        await setDoc(roomRef, roomData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${roomCode}`);
      }

      // 2. Create Host Player with composite ID
      const playerId = `${sessionId}_${roomCode}`;
      const playerRef = doc(db, 'players', playerId);
      const playerData = {
        room_code: roomCode,
        nickname,
        avatar_color: avatarColor,
        avatar_icon: avatarIcon,
        score: 0,
        session_id: sessionId,
        is_host: true,
        is_ready: true,
        status: PlayerStatus.ACTIVE,
        round_score: 0
      };

      try {
        await setDoc(playerRef, playerData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `players/${playerId}`);
      }

      setPlayerData({
        playerId: playerRef.id,
        sessionId,
        roomCode,
        isHost: true
      });

      navigate(`/screen/${roomCode}`);
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative glass w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-4xl gradient-text tracking-tight uppercase">
              {step === 1 ? 'CREATE GAME' : 'YOUR AVATAR'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1">Your Nickname</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type="text" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter your name..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder:text-white/20"
                      maxLength={16}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1">Number of Rounds</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 7, 10].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRounds(r)}
                        className={cn(
                          "py-3 rounded-xl font-display text-xl transition-all border",
                          rounds === r ? "bg-primary border-primary text-white shadow-lg scale-105" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1">Question Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'mixed', label: 'Mixed', icon: '🎲', desc: 'All categories' },
                      { id: 'perception', label: 'Perception', icon: '👁️', desc: 'How others see you' },
                      { id: 'connection', label: 'Connection', icon: '🤝', desc: 'Funny & personal' },
                      { id: 'reflection', label: 'Reflection', icon: '💭', desc: 'Deep & meaningful' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "p-4 rounded-2xl text-left transition-all border flex flex-col gap-1",
                          category === cat.id ? "bg-white/10 border-primary shadow-lg" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span className="font-display text-lg text-white">{cat.label}</span>
                        </div>
                        <span className="text-[10px] opacity-60 leading-tight">{cat.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1">Answer Timer</label>
                    <div className="flex gap-2">
                      {[30, 45, 60].map((t) => (
                        <button
                          key={t}
                          onClick={() => setAnswerTimer(t)}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-display text-lg transition-all border",
                            answerTimer === t ? "bg-primary border-primary text-white" : "bg-white/5 border-transparent text-muted-foreground"
                          )}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1">Guess Timer</label>
                    <div className="flex gap-2">
                      {[15, 20, 30].map((t) => (
                        <button
                          key={t}
                          onClick={() => setGuessTimer(t)}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-display text-lg transition-all border",
                            guessTimer === t ? "bg-primary border-primary text-white" : "bg-white/5 border-transparent text-muted-foreground"
                          )}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  disabled={!nickname}
                  onClick={() => setStep(2)}
                  className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed text-primary font-display text-2xl py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                >
                  Choose Avatar <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                  ← Back
                </button>

                <AvatarPicker 
                  selectedColor={avatarColor}
                  selectedIcon={avatarIcon}
                  onColorChange={setAvatarColor}
                  onIconChange={setAvatarIcon}
                  nickname={nickname}
                />

                <button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-display text-2xl py-5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group neon-glow-purple"
                >
                  {loading ? 'Creating...' : '🚀 Create Game!'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

import { AnimatePresence } from 'motion/react';
