import { auth, db } from './firebase';
import { OperationType, FirestoreErrorInfo } from '../types';
import { onAuthStateChanged } from 'firebase/auth';

export const AVATAR_COLORS = {
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  green: '#10B981',
  orange: '#F97316',
  yellow: '#EAB308',
  red: '#EF4444',
  blue: '#3B82F6',
  lime: '#84CC16',
  rose: '#F43F5E'
};

export const AVATAR_ICONS = ['😎', '🔥', '👻', '🤠', '🦊', '🐉', '🦋', '⚡', '🌙', '💎', '🎭', '🦁'];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getSessionId(): string {
  let sessionId = localStorage.getItem('stranger_guess_session');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('stranger_guess_session', sessionId);
  }
  return sessionId;
}

export interface PlayerData {
  playerId: string;
  sessionId: string;
  roomCode: string;
  isHost: boolean;
}

export function setPlayerData(data: PlayerData) {
  localStorage.setItem('stranger_guess_player_data', JSON.stringify(data));
}

export function getPlayerData(): PlayerData | null {
  const data = localStorage.getItem('stranger_guess_player_data');
  return data ? JSON.parse(data) : null;
}

export function clearPlayerData() {
  localStorage.removeItem('stranger_guess_player_data');
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const jsonErr = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonErr);
  throw new Error(jsonErr);
}
