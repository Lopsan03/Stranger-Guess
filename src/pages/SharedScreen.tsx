import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameRoom, Player, GameStatus, Answer, Guess } from '../types';
import ScreenLobby from '../components/screen/ScreenLobby';
import ScreenQuestion from '../components/screen/ScreenQuestion';
import ScreenAnswering from '../components/screen/ScreenAnswering';
import ScreenReveal from '../components/screen/ScreenReveal';
import ScreenGuessing from '../components/screen/ScreenGuessing';
import ScreenRoundResults from '../components/screen/ScreenRoundResults';
import ScreenGameOver from '../components/screen/ScreenGameOver';
import { AnimatePresence, motion } from 'motion/react';

export default function SharedScreen() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) return;

    // Subscribe to Room
    const roomQuery = query(collection(db, 'rooms'), where('room_code', '==', roomCode.toUpperCase()));
    const unsubscribeRoom = onSnapshot(roomQuery, (snap) => {
      if (snap.empty) {
        setLoading(false);
        navigate('/');
        return;
      }
      const roomData = { id: snap.docs[0].id, ...snap.docs[0].data() } as GameRoom;
      setRoom(roomData);
      setLoading(false);
    });

    // Subscribe to Players
    const playersQuery = query(collection(db, 'players'), where('room_code', '==', roomCode.toUpperCase()));
    const unsubscribePlayers = onSnapshot(playersQuery, (snap) => {
      const playersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersData.filter(p => p.status === 'active' && !p.is_host));
    });

    // Subscribe to Answers (only active round)
    const answersQuery = query(collection(db, 'answers'), where('room_code', '==', roomCode.toUpperCase()));
    const unsubscribeAnswers = onSnapshot(answersQuery, (snap) => {
      const answersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
      setAnswers(answersData);
    });

    // Subscribe to Guesses
    const guessesQuery = query(collection(db, 'guesses'), where('room_code', '==', roomCode.toUpperCase()));
    const unsubscribeGuesses = onSnapshot(guessesQuery, (snap) => {
      const guessesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guess));
      setGuesses(guessesData);
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
      unsubscribeAnswers();
      unsubscribeGuesses();
    };
  }, [roomCode, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  if (!room) return null;

  const renderPhase = () => {
    switch (room.status) {
      case GameStatus.LOBBY:
        return <ScreenLobby room={room} players={players} />;
      case GameStatus.QUESTION:
        return <ScreenQuestion room={room} />;
      case GameStatus.ANSWERING:
        return <ScreenAnswering room={room} players={players} answers={answers} />;
      case GameStatus.REVEALING:
        return <ScreenReveal room={room} answers={answers} players={players} />;
      case GameStatus.GUESSING:
        return <ScreenGuessing room={room} answers={answers} players={players} guesses={guesses} />;
      case GameStatus.ROUND_RESULTS:
        return <ScreenRoundResults room={room} players={players} answers={answers} guesses={guesses} />;
      case GameStatus.GAME_OVER:
        return <ScreenGameOver room={room} players={players} guesses={guesses} />;
      default:
        return <div>Unknown Status: {room.status}</div>;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={room.status}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-7xl h-full flex items-center justify-center"
        >
          {renderPhase()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
