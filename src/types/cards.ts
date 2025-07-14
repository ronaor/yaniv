export interface Card {
  suit: CardSuit;
  value: number; // 1-13 (1=Ace, 11=Jack, 12=Queen, 13=King)
}

export type CardSuit = 'spades' | 'clubs' | 'diamonds' | 'hearts';

export type Position = {x: number; y: number};

export type ActionSource = 'pickup' | 'deck' | 'slap';

export type TurnAction =
  | {
      choice: 'deck';
    }
  | {choice: 'pickup'; pickupIndex: number};
