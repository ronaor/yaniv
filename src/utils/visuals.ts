import {Card} from '~/types/cards';

export const getCardDisplayValue = (card: Card): string => {
  if (card.isJoker) return '🃏';
  if (card.value === 1) return 'A';
  if (card.value === 11) return 'J';
  if (card.value === 12) return 'Q';
  if (card.value === 13) return 'K';
  return card.value.toString();
};

export const getSuitSymbol = (suit: string): string => {
  switch (suit) {
    case 'hearts':
      return '♥️';
    case 'diamonds':
      return '♦️';
    case 'clubs':
      return '♣️';
    case 'spades':
      return '♠️';
    default:
      return '';
  }
};

export const getSuitColor = (suit: string): string => {
  return suit === 'hearts' || suit === 'diamonds' ? '#FF0000' : '#000000';
};
