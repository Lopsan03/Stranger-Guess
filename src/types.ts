export enum GameStatus {
  LOBBY = 'lobby',
  QUESTION = 'question',
  ANSWERING = 'answering',
  REVEALING = 'revealing',
  GUESSING = 'guessing',
  ROUND_RESULTS = 'round_results',
  GAME_OVER = 'game_over',
}

export enum PlayerStatus {
  ACTIVE = 'active',
  KICKED = 'kicked',
}

export interface GameSettings {
  num_rounds: number;
  category: string;
  answer_timer: number;
  guess_timer: number;
}

export interface Question {
  id: string;
  category: string;
  text: string;
}

export interface GameRoom {
  id?: string;
  room_code: string;
  host_id: string;
  status: GameStatus;
  settings: GameSettings;
  current_round: number;
  current_question: Question | null;
  current_answer_index: number;
  used_question_ids: string[];
  phase_started_at: string;
  answers_submitted: number;
  guesses_submitted: number;
  total_players: number;
}

export interface Player {
  id?: string;
  room_code: string;
  nickname: string;
  avatar_color: string;
  avatar_icon: string;
  score: number;
  session_id: string;
  is_host: boolean;
  is_ready: boolean;
  status: PlayerStatus;
  round_score: number;
}

export interface Answer {
  id?: string;
  room_code: string;
  round_number: number;
  question_id: string;
  player_id: string;
  player_session_id: string;
  answer_text: string;
  is_revealed: boolean;
  reveal_order: number | null;
}

export interface Guess {
  id?: string;
  room_code: string;
  round_number: number;
  answer_id: string;
  guesser_player_id: string;
  guesser_session_id: string;
  guessed_player_id: string;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
