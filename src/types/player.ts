export interface User {
  id: string;
  nickName: string;
}

export type PlayerStatus = {
  score: number;
  lost: boolean;
};

export interface RoomConfig {
  slapDown: boolean;
  timePerPlayer: number;
  canCallYaniv: number;
  maxMatchPoints: number;
}
