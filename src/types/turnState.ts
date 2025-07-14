import {Card, Position} from './cards';

export interface TurnState {
  round: number;
  step: number;
  playerId: string;
  // שים את הקלפים בדלפק
  discard: {
    cards: Card[];
    cardsPositions: Position[];
  };
  // משוך את הקלף מהקופה או מהדלפק
  draw?: {
    card: Card;
    cardPosition: Position;
  };
  pickupCards: Card[];
  action: 'DRAG_FROM_DECK' | 'DRAG_FROM_PICKUP' | 'SLAP_DOWN';
}
