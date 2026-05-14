import { motion } from 'motion/react';
import { GameRoom, Player, GameStatus } from '../../types';
import PlayerAvatar from '../shared/PlayerAvatar';
import QRCode from '../shared/QRCode';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getPlayerData } from '../../lib/gameUtils';
import { cn } from '../../lib/utils';

interface ScreenLobbyProps {
  room: GameRoom;
  players: Player[];
}

export default function ScreenLobby({ room, players }: ScreenLobbyProps) {
  const currentPlayerData = getPlayerData();
  const isHost = currentPlayerData?.isHost && currentPlayerData.roomCode === room.room_code;
  const joinUrl = `${window.location.origin}/join/${room.room_code}`;

  const handleStartGame = async () => {
    if (players.length < 2) return;
    const roomRef = doc(db, 'rooms', room.id!);
    await updateDoc(roomRef, {
      status: GameStatus.QUESTION,
      phase_started_at: new Date().toISOString(),
      total_players: players.length
    });
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
      {/* Left Column: Join Info */}
      <div className="lg:col-span-1 space-y-8 text-center lg:text-left order-2 lg:order-1">
        <div className="space-y-4">
          <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground ml-1 block">Join the Game</label>
          <div className="flex flex-col items-center lg:items-start gap-6">
            <QRCode value={joinUrl} size={180} />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Room Code</span>
              <h2 className="font-display text-7xl neon-text-purple tracking-widest leading-none">{room.room_code}</h2>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Scan QR or go to</span>
          <p className="text-xs font-mono text-cyan-400 break-all">{joinUrl}</p>
        </div>
      </div>

      {/* Right Column: Players & Settings */}
      <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
        <div className="flex flex-col items-center lg:items-start gap-2">
          <h1 className="font-display text-7xl sm:text-8xl gradient-text neon-text-purple tracking-tight leading-none text-center lg:text-left">
            STRANGER GUESS
          </h1>
          <p className="text-muted-foreground font-medium animate-pulse">Waiting for players to join...</p>
        </div>

        <div className="glass p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
          <div className="absolute top-4 right-8">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Players ({players.length})</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                layout
              >
                <div className="flex flex-col items-center gap-2 group">
                  <PlayerAvatar player={player} size="lg" hostBadge className="animate-float" />
                  <span className={cn(
                    "font-display text-sm uppercase tracking-wide",
                    player.id === currentPlayerData?.playerId ? "text-primary" : "text-white"
                  )}>
                    {player.nickname}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 opacity-20">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-dashed border-white/20" />
                <div className="h-2 w-12 bg-white/20 rounded" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
            {[
              { label: 'Rounds', value: room.settings.num_rounds },
              { label: 'Category', value: room.settings.category },
              { label: 'Answer Timer', value: `${room.settings.answer_timer}s` },
              { label: 'Guess Timer', value: `${room.settings.guess_timer}s` }
            ].map((s, i) => (
              <div key={i} className="glass p-3 rounded-2xl flex flex-col items-center gap-1 border-white/5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">{s.label}</span>
                <span className="font-display text-lg text-white capitalize">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className={cn(
                  "w-full max-w-md bg-primary hover:bg-primary/90 text-white font-display text-4xl py-6 rounded-3xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] neon-glow-purple",
                  players.length < 2 && "opacity-50 cursor-not-allowed contrast-50 grayscale"
                )}
              >
                🚀 Start Game!
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-3xl border border-white/10 font-display text-2xl tracking-wide text-muted-foreground">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Waiting for host to start...
              </div>
            )}
            {players.length < 2 && (
              <p className="mt-4 text-[10px] uppercase font-bold text-pink-500 tracking-widest">Min. 2 players to start</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
