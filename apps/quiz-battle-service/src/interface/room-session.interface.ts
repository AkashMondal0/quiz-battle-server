export type RoomStatus =
  | 'WAITING'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'FINISHED'
  | 'CANCELLED';

export type PlayerStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'LEFT';

export interface RoomQuestion {
  id: string;

  question: string;

  options: string[];
  correctAnswerIndex: number;

  category?: string | null;

  difficulty?: string | null;

  timeLimitSeconds: number;
}

export interface RoomSessionUser {
  userId: string;

  username: string;

  profilePicture?: string | null;

  avatarId?: string | null;

  status: PlayerStatus;

  ready: boolean;

  joinedAt: number;

  lastSeenAt: number;

  disconnectedAt?: number;

  score: number;

  correctAnswers: number;

  incorrectAnswers: number;

  answeredQuestions: number;

  rank: number;

  hasAnsweredCurrentQuestion: boolean;

  answeredQuestionIds: Set<string>;
}

export interface RoomSessionDetails {
  roomId: string;

  roomCode: string;

  hostId: string;

  topic: string;

  prompt: string;

  aiId: string;

  mode: string;

  difficulty: string;

  visibility: string;

  maxPlayers: number;

  numberOfQuestions: number;

  totalTimeSeconds: number;

  status: RoomStatus;

  currentQuestionIndex: number;

  currentQuestionId?: string;

  questionStartedAt?: number;

  questionEndsAt?: number;

  matchStartedAt?: number;

  finishedAt?: number;

  createdAt: number;
}

export interface RankingUser {
  userId: string;

  username: string;

  avatar?: string | null;

  avatarId?: string | null;

  score: number;

  correctAnswers: number;

  answeredQuestions: number;

  rank: number;

  status: PlayerStatus;
}

export interface RoomRanking {
  roomId: string;

  rankings: RankingUser[];

  updatedAt: number;
}

export interface RoomSession {
  room: RoomSessionDetails;
  users: Map<string, RoomSessionUser>;
  ranking: RoomRanking;
  questions: RoomQuestion[];
  timer?: NodeJS.Timeout;
}

export type BattlePhase =
  | 'IDLE'
  | 'LOBBY'
  | 'QUESTION'
  | 'RESULT'
  | 'FINISHED';

export interface BattleState {
  phase: BattlePhase;

  room: RoomSessionDetails | null;
  players: RoomSessionUser[];

  allReady: boolean;

  currentQuestion: RoomQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  timerSeconds: number;

  selectedOptionId: string | null;
  hasAnsweredCurrent: boolean;
  lastAnswerCorrect: boolean | null;
  lastPointsEarned: number;

  rankings: RankingUser[];

  errorEvent: string | null;
  errorMessage: string | null;
}
