import { motion } from 'motion/react';
import { GameRoom, Player, GameStatus } from '../../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import PlayerAvatar from '../shared/PlayerAvatar';
import { cn } from '../../lib/utils';

interface ControllerLobbyProps {
  room: GameRoom;
  player: Player;
  players: Player[];
}

export default function ControllerLobby({ room, player, players }: ControllerLobbyProps) {
  const isHost = player.is_host;

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
    <div className="w-full space-y-8 flex flex-col items-center">
      <div className="text-center space-y-4">
        <PlayerAvatar player={player} size="xl" />
        <h2 className="font-display text-4xl text-white uppercase tracking-tight">{player.nickname}</h2>
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className={cn(
              "inline-flex items-center justify-center px-8 py-4 rounded-2xl font-display text-2xl transition-all shadow-xl",
              players.length < 2
                ? "bg-white/10 text-muted-foreground border border-white/10 cursor-not-allowed opacity-50"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            🚀 Start Game
          </button>
        ) : (
          <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-muted-foreground animate-pulse">
            You're in! Waiting for host to start...
          </div>
        )}
      </div>

      <div className="glass w-full rounded-3xl p-6 space-y-4 overflow-hidden border-white/5">
        <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground text-center block mb-2">Players ({players.length})</label>
        <div className="flex flex-wrap justify-center gap-3">
          {players.map((p) => (
            <div key={p.id} className="relative">
              <PlayerAvatar player={p} size="sm" />
              {p.id === player.id && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border border-[#050508]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-muted-foreground font-medium opacity-60">
        <span>👀</span> Watch the big screen!
      </div>
    </div>
  );
}
