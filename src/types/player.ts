export interface User {
  id: string;
  nickname: string;
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
  numPlayers: number;
  timePerPlayer: number; // in seconds
}
