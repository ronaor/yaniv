export interface User {
  id: string;
  nickName: string;
}

export interface Player extends User {
  score: number;
  isActive: boolean;
}

export interface Room {
  players: Player[];
  config: RoomConfig;
  gameState: 'waiting' | 'started';
  createdAt: Date;
}

export interface RoomConfig {
  slapDown: boolean;
  timePerPlayer: number;
  canCallYaniv: number;
  maxMatchPoints: number;
}
