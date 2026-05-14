import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Hash, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getSessionId, setPlayerData, handleFirestoreError } from '../../lib/gameUtils';
import { PlayerStatus, OperationType } from '../../types';
import AvatarPicker from '../shared/AvatarPicker';
import { cn } from '../../lib/utils';

interface JoinGameModalProps {
  onClose: () => void;
  initialCode?: string;
}

export default function JoinGameModal({ onClose, initialCode = '' }: JoinGameModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const [avatarColor, setAvatarColor] = useState('cyan');
  const [avatarIcon, setAvatarIcon] = useState('👻');

  const validateCode = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'rooms'), where('room_code', '==', code.toUpperCase()));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'rooms');
      }
      
      if (!snap || snap.empty) {
        setError('Room not found! Check the code.');
      } else {
        const roomData = snap.docs[0].data();
        if (roomData.status === 'game_over') {
          setError('This game has already ended.');
        } else {
          setStep(2);
        }
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const codeUpper = code.toUpperCase();
      
      let playerId = `${sessionId}_${codeUpper}`;
      const playerRef = doc(db, 'players', playerId);
      
      try {
        await setDoc(playerRef, {
          room_code: codeUpper,
          nickname,
          avatar_color: avatarColor,
          avatar_icon: avatarIcon,
          score: 0,
          session_id: sessionId,
          is_host: false,
          is_ready: false,
          status: PlayerStatus.ACTIVE,
          round_score: 0
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `players/${playerId}`);
      }

      setPlayerData({
        playerId,
        sessionId,
        roomCode: codeUpper,
        isHost: false
      });

      navigate(`/play/${codeUpper}`);
    } catch (err) {
      setError('Failed to join game.');
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
        className="relative glass w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-4xl gradient-text tracking-tight uppercase">
              JOIN GAME
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1">Enter Room Code</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 text-center text-4xl font-display tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-white placeholder:text-white/10"
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-destructive text-xs text-center font-medium">{error}</p>}
                </div>

                <button 
                  disabled={code.length !== 6 || loading}
                  onClick={validateCode}
                  className="w-full bg-accent text-black font-display text-2xl py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group neon-glow-cyan"
                >
                  {loading ? 'Searching...' : '🎯 Find Game'}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-white placeholder:text-white/20"
                      maxLength={16}
                    />
                  </div>
                </div>

                <AvatarPicker 
                  selectedColor={avatarColor}
                  selectedIcon={avatarIcon}
                  onColorChange={setAvatarColor}
                  onIconChange={setAvatarIcon}
                  nickname={nickname}
                />

                <button 
                  onClick={handleJoin}
                  disabled={loading || !nickname}
                  className="w-full bg-accent text-black font-display text-2xl py-5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group neon-glow-cyan"
                >
                  {loading ? 'Joining...' : '🎉 Join Game!'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
