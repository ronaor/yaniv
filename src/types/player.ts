export interface User {
  id: string;
  nickName: string;
  avatarIndex: number;
}

type PlayerStatusType = 'active' | 'lost' | 'winner' | 'playAgain' | 'leave';

export type PlayerStatus = {
  score: number;
  playerStatus: PlayerStatusType;
  playerName: string;
  avatarIndex: number;
};

export interface RoomConfig {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  slapDown: boolean;
  timePerPlayer?: number;
  canCallYaniv: number;
  maxMatchPoints: number;
}
