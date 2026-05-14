import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GameRoom, Answer, Player, Guess, GameStatus } from '../../types';
import CountdownTimer from '../shared/CountdownTimer';
import PlayerAvatar from '../shared/PlayerAvatar';
import { updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getPlayerData } from '../../lib/gameUtils';
import { cn } from '../../lib/utils';

interface ScreenGuessingProps {
  room: GameRoom;
  answers: Answer[];
  players: Player[];
  guesses: Guess[];
}

export default function ScreenGuessing({ room, answers, players, guesses }: ScreenGuessingProps) {
  const currentRoundAnswers = answers.filter(a => a.round_number === room.current_round);
  const currentAnswer = currentRoundAnswers.find(a => a.reveal_order === room.current_answer_index) ?? currentRoundAnswers[room.current_answer_index];
  const author = players.find(p => p.id === currentAnswer?.player_id);
  const currentPlayerData = getPlayerData();
  const isHost = currentPlayerData?.isHost && currentPlayerData.roomCode === room.room_code;
  
  // Players who are NOT the author of this answer
  const potentialGuessers = players.filter(p => p.id !== author?.id);
  const guessesForThisAnswer = guesses.filter(g => g.answer_id === currentAnswer?.id);
  const guessedCount = guessesForThisAnswer.length;
  const totalGuessers = potentialGuessers.length;

  const handleGuessingComplete = async () => {
    if (!currentAnswer || !author) return;

    const batch = writeBatch(db);
    const roomRef = doc(db, 'rooms', room.id!);
    
    // 1. Scoring Logic
    const answerGuesses = guesses.filter(g => g.answer_id === currentAnswer.id);
    const correctGuesses = answerGuesses.filter(g => g.is_correct);
    const wrongGuesses = answerGuesses.filter(g => !g.is_correct);
    
    // Guesser Points
    answerGuesses.forEach(guess => {
      let points = 0;
      if (guess.is_correct) {
        points = 100;
        // Speed bonus
        const timerSeconds = room.settings.guess_timer;
        const bonus = Math.floor(((timerSeconds - guess.time_taken) / timerSeconds) * 50);
        points += Math.max(0, bonus);
      }
      
      const guessRef = doc(db, 'guesses', guess.id!);
      batch.update(guessRef, { points_earned: points });
      
      // Update player round_score
      const player = players.find(p => p.id === guess.guesser_player_id);
      if (player) {
        const playerRef = doc(db, 'players', player.id!);
        batch.update(playerRef, { 
          round_score: (player.round_score || 0) + points,
          score: (player.score || 0) + points
        });
      }
    });
    
    // Author Points (for staying hidden)
    let authorPoints = (wrongGuesses.length * 25);
    if (correctGuesses.length === 0 && totalGuessers > 0) {
      authorPoints += 200; // Anonymity bonus
    }
    
    if (author) {
      const authorRef = doc(db, 'players', author.id!);
      batch.update(authorRef, {
        round_score: (author.round_score || 0) + authorPoints,
        score: (author.score || 0) + authorPoints
      });
    }

    // 2. Next State Logic
    const isLastAnswer = room.current_answer_index >= (room.answers_submitted - 1);
    
    if (isLastAnswer) {
      batch.update(roomRef, {
        status: GameStatus.ROUND_RESULTS,
        phase_started_at: new Date().toISOString()
      });
    } else {
      batch.update(roomRef, {
        current_answer_index: room.current_answer_index + 1,
        status: GameStatus.REVEALING,
        phase_started_at: new Date().toISOString(),
        guesses_submitted: 0
      });
    }

    await batch.commit();
  };

  useEffect(() => {
    if (guessedCount >= totalGuessers && totalGuessers > 0) {
      const timer = setTimeout(handleGuessingComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [guessedCount, totalGuessers]);

  if (!currentAnswer) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-3xl text-white mb-3">Loading the current answer...</p>
          <p className="text-muted-foreground">Please wait while we sync the game state.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-12 flex flex-col items-center">
      <div className="space-y-4 text-center">
        <h2 className="font-display text-6xl text-accent neon-text-cyan tracking-tighter uppercase">
          WHO SAID IT?
        </h2>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-strong p-12 rounded-[3rem] text-center border-white/20 shadow-xl"
          >
             <p className="font-display text-4xl leading-tight text-white italic">
              "{currentAnswer.answer_text}"
            </p>
          </motion.div>

          <div className="flex items-center gap-8 justify-center lg:justify-start">
            <CountdownTimer 
              seconds={room.settings.guess_timer} 
              onComplete={handleGuessingComplete}
              size="md"
            />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-6">Guesses in</span>
              <div className="font-display text-5xl text-white">
                {guessedCount}<span className="text-white/20">/</span>{totalGuessers}
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/10">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
            {players.map((player) => {
              const hasGuessed = guessesForThisAnswer.some(g => g.guesser_player_id === player.id);
              return (
                <div key={player.id} className="relative">
                  <PlayerAvatar 
                    player={player} 
                    size="md" 
                    showName
                  />
                  {hasGuessed && (
                    <div className="absolute -top-1 -right-1 bg-accent text-black rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold neon-glow-cyan">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {isHost && (
          <button
            onClick={handleGuessingComplete}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display text-xl px-10 py-3 rounded-2xl transition-all"
          >
            Skip to Reveal →
          </button>
        )}
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em] flex items-center gap-2 animate-pulse">
           Lock in your guess on your phone!
        </p>
      </div>
    </div>
  );
}
