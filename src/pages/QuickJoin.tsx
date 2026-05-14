import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JoinGameModal from '../components/home/JoinGameModal';

export default function QuickJoin() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center">
      <div className="space-y-6">
        <h1 className="font-display text-4xl gradient-text">STRANGER GUESS</h1>
        <p className="text-muted-foreground">Joining room: <span className="text-white font-bold tracking-widest">{roomCode}</span></p>
        <div className="animate-pulse text-accent font-display text-xl uppercase tracking-widest">Loading Game...</div>
      </div>

      <JoinGameModal 
        initialCode={roomCode} 
        onClose={() => navigate('/')} 
      />
    </div>
  );
}
