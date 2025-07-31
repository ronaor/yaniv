export interface User {
  id: string;
  nickName: string;
}

type PlayerStatusType = 'active' | 'lost' | 'winner' | 'playAgain' | 'leave';

export type PlayerStatus = {
  score: number;
  lost: boolean;
  playerStatus: PlayerStatusType;
  playerName: string;
};

export interface RoomConfig {
  slapDown: boolean;
  timePerPlayer: number;
  canCallYaniv: number;
  maxMatchPoints: number;
}
