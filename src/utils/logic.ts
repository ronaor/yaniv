import {Dimensions} from 'react-native';
import {Card, DirectionName, Position} from '~/types/cards';
import {CARD_WIDTH, OVERLAP_AMOUNT} from './constants';

const {width, height} = Dimensions.get('screen');

export const calculateCardsPositions = (
  cardsLen: number,
  direction: DirectionName,
): (Position & {deg: number})[] => {
  return Array.from({length: cardsLen}, (_, index) => {
    const centerIndex = (cardsLen - 1) / 2;
    const shift = index - centerIndex;

    // Calculate arc offset - consistent for all directions
    const arcOffset = Math.pow(shift, 2) * 2;

    switch (direction) {
      case 'up': // Cards at bottom, pointing up (original behavior)
        return {
          x: width / 2 - (cardsLen / 2) * CARD_WIDTH + index * CARD_WIDTH,
          y: height - 145 + arcOffset,
          deg: shift * 3,
        };

      case 'down': // Cards at top, pointing down
        return {
          x: width / 2 - (cardsLen / 2) * CARD_WIDTH + index * CARD_WIDTH,
          y: 125 - arcOffset,
          deg: 180 - shift * 3,
        };

      case 'right': // Cards at right side, pointing left
        return {
          x: width - 150 + arcOffset + CARD_WIDTH * 1.5,
          y: height / 2 + (cardsLen / 2) * CARD_WIDTH - index * CARD_WIDTH,
          deg: -90 + shift * 3,
        };

      case 'left': // Cards at left side, pointing right
        return {
          x: 25 - arcOffset,
          y: height / 2 - (cardsLen / 2) * CARD_WIDTH + index * CARD_WIDTH,
          deg: 90 + shift * 3,
        };

      default:
        // Fallback to 'up' direction
        return {
          x: width / 2 - (cardsLen / 2) * CARD_WIDTH + index * CARD_WIDTH,
          y: height - 150 + arcOffset,
          deg: shift * 3,
        };
    }
  });
};

export const calculateHiddenCardsPositions = (
  cardsLen: number,
  direction: DirectionName,
): (Position & {deg: number})[] => {
  return Array.from({length: cardsLen}, (_, index) => {
    const centerIndex = (cardsLen - 1) / 2;
    const shift = index - centerIndex;

    // Calculate arc offset - consistent for all directions
    const arcOffset = Math.pow(shift, 2) * 2;

    switch (direction) {
      case 'up': // Cards at bottom, pointing up (original behavior)
        return {
          x:
            width / 2 -
            (cardsLen / 2) * OVERLAP_AMOUNT +
            index * OVERLAP_AMOUNT,
          y: height - 145 + arcOffset,
          deg: shift * 3,
        };

      case 'down': // Cards at top, pointing down
        return {
          x:
            width / 2 -
            (cardsLen / 2) * OVERLAP_AMOUNT +
            index * OVERLAP_AMOUNT,
          y: 125 - arcOffset,
          deg: 180 - shift * 3,
        };

      case 'right': // Cards at right side, pointing left
        return {
          x: width - 150 + arcOffset + CARD_WIDTH * 1.5,
          y:
            height / 2 +
            (cardsLen / 2) * OVERLAP_AMOUNT -
            index * OVERLAP_AMOUNT,
          deg: -90 + shift * 3,
        };

      case 'left': // Cards at left side, pointing right
        return {
          x: 25 - arcOffset,
          y:
            height / 2 -
            (cardsLen / 2) * OVERLAP_AMOUNT +
            index * OVERLAP_AMOUNT,
          deg: 90 + shift * 3,
        };

      default:
        // Fallback to 'up' direction
        return {
          x:
            width / 2 -
            (cardsLen / 2) * OVERLAP_AMOUNT +
            index * OVERLAP_AMOUNT,
          y: height - 150 + arcOffset,
          deg: shift * 3,
        };
    }
  });
};

const directions: DirectionName[] = ['up', 'right', 'down', 'left'];

export function calculateAllPlayerPositions(
  players: string[],
  currentPlayerId: string,
) {
  return directions
    .slice(0, players.length)
    .reduce<Record<string, Position[]>>((res, direction, i) => {
      const playerId = players[i];
      if (currentPlayerId === playerId) {
        res[playerId] = calculateCardsPositions(5, direction);
      } else {
        res[playerId] = calculateHiddenCardsPositions(5, direction);
      }
      return res;
    }, {});
}

export const createPlayersData = (
  playerHands: Record<string, Card[]>,
  activePlayerId: string,
) => {
  return Object.entries(playerHands).reduce<any>((res, [playerId, hand]) => {
    res[playerId] = {
      stats: {
        score: 0,
        lost: false,
      },
      hand,
      isMyTurn: activePlayerId === playerId,
      roundScore: 0,
      slapDownAvailable: false,
    };
    return res;
  }, {});
};

export function createPlayerOrder(
  playerIds: string[],
  currentPlayerId: string,
) {
  const currentPlayerIndex = playerIds.findIndex(id => id === currentPlayerId);

  const orderedPlayers: string[] = [];
  for (let i = 0; i < playerIds.length; i++) {
    const index = (currentPlayerIndex + i) % playerIds.length;
    orderedPlayers.push(playerIds[index]);
  }
  return orderedPlayers;
}
