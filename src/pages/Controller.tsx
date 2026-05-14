import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameRoom, Player, GameStatus, Answer, PlayerStatus } from '../types';
import { getPlayerData, clearPlayerData } from '../lib/gameUtils';
import ControllerLobby from '../components/controller/ControllerLobby';
import ControllerAnswer from '../components/controller/ControllerAnswer';
import ControllerGuess from '../components/controller/ControllerGuess';
import ControllerWait from '../components/controller/ControllerWait';
import { AnimatePresence, motion } from 'motion/react';

export default function Controller() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myAnswer, setMyAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pData = getPlayerData();
    if (!roomCode || !pData || pData.roomCode !== roomCode.toUpperCase()) {
      setLoading(false);
      navigate('/');
      return;
    }

    // Subscribe to Room
    const roomQuery = query(collection(db, 'rooms'), where('room_code', '==', roomCode.toUpperCase()));
    const unsubscribeRoom = onSnapshot(roomQuery, (snap) => {
      if (snap.empty) {
        navigate('/');
        return;
      }
      setRoom({ id: snap.docs[0].id, ...snap.docs[0].data() } as GameRoom);
      setLoading(false);
    });

    // Subscribe to "Me"
    const playerDoc = doc(db, 'players', pData.playerId);
    const unsubscribeMe = onSnapshot(playerDoc, (snap) => {
      if (!snap.exists()) {
        clearPlayerData();
        navigate('/');
        return;
      }
      const p = { id: snap.id, ...snap.data() } as Player;
      if (p.status === PlayerStatus.KICKED) {
        clearPlayerData();
        navigate('/');
        return;
      }
      setPlayer(p);
    });

    // Subscribe to All Players (for list in lobby)
    const playersQuery = query(collection(db, 'players'), where('room_code', '==', roomCode.toUpperCase()));
    const unsubscribePlayers = onSnapshot(playersQuery, (snap) => {
      setPlayers(snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Player))
        .filter(p => p.status === 'active' && !p.is_host));
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMe();
      unsubscribePlayers();
    };
  }, [roomCode, navigate]);

  useEffect(() => {
    if (!player || !room) return;
    
    // Subscribe to my current round answer
    const answersQuery = query(
      collection(db, 'answers'), 
      where('room_code', '==', room.room_code),
      where('player_id', '==', player.id),
      where('round_number', '==', room.current_round)
    );
    const unsubscribeAnswer = onSnapshot(answersQuery, (snap) => {
      if (!snap.empty) {
        setMyAnswer(snap.docs[0].data() as Answer);
      } else {
        setMyAnswer(null);
      }
    });

    return () => unsubscribeAnswer();
  }, [player, room?.current_round]);

  if (loading || !room || !player) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050508]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
    </div>
  );

  const renderPhase = () => {
    switch (room.status) {
      case GameStatus.LOBBY:
        return <ControllerLobby room={room} player={player} players={players} />;
      
      case GameStatus.QUESTION:
        return <ControllerWait message="Get ready!" subtitle="Watch the big screen for the question" />;
      
      case GameStatus.ANSWERING:
        if (myAnswer) return <ControllerWait message="Answer submitted!" subtitle="Wait for everyone else..." emoji="📨" progress={`${room.answers_submitted}/${players.length}`} />;
        return <ControllerAnswer room={room} player={player} />;
      
      case GameStatus.REVEALING:
        return <ControllerWait message="Watch the screen!" subtitle="The answers are being revealed..." emoji="👀" />;
      
      case GameStatus.GUESSING:
        // Need to check if I am the author of the CURRENT answer being guessed
        const currentAnswerId = room.current_answer_index;
        // In this phase, we need more info. Let's pass to component.
        return <ControllerGuess room={room} player={player} players={players} />;
      
      case GameStatus.ROUND_RESULTS:
        return <ControllerWait 
          message="Round Results" 
          subtitle={`Your score: ${player.score}`} 
          emoji="🏆"
          details={<div className="font-display text-4xl text-primary mt-4">+{player.round_score} pts</div>}
        />;
      
      case GameStatus.GAME_OVER:
        return <ControllerWait message="Game Over!" subtitle="Check the big screen for the winners!" emoji="👑" />;
        
      default:
        return <div>Unknown Status</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] p-6 flex flex-col items-center max-w-md mx-auto relative z-10">
      <div className="w-full flex items-center justify-between mb-8">
        <h1 className="font-display text-xl gradient-text tracking-tighter">STRANGER GUESS</h1>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 uppercase text-[10px] font-bold tracking-widest text-white/60">
           Room: <span className="text-primary">{room.room_code}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={room.status + (myAnswer ? 'answered' : 'unanswered')}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="w-full h-full flex flex-col items-center"
        >
          {renderPhase()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
