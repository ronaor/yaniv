import {Dimensions} from 'react-native';
import {Card, DirectionName, Position} from '~/types/cards';
import {CARD_WIDTH, directions, OVERLAP_AMOUNT} from './constants';

const {width, height} = Dimensions.get('screen');

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function calculateCardsPositions(
  cardsLen: number,
  direction: DirectionName,
  spread: number = CARD_WIDTH,
): Position[] {
  // normalize spread into [0..1] where 0 = CARD_WIDTH, 1 = OVERLAP_AMOUNT
  const denom = Math.max(1, CARD_WIDTH - OVERLAP_AMOUNT);
  const t = clamp((CARD_WIDTH - spread) / denom, 0, 1);

  // rotation per step: 3deg..20deg as spread shrinks
  const tiltStep = lerp(3, 20, t);

  // gently morph the curvature/offsets to match your two previous variants
  const arcScale = 2;
  const arcBias = lerp(0, CARD_WIDTH * 0.5, t); // hidden had +CARD_WIDTH*0.5
  const upXExtra = -lerp(CARD_WIDTH, CARD_WIDTH * 0.5, t); // -CARD_WIDTH → -CARD_WIDTH*0.5
  const downYExtra = -lerp(0, CARD_WIDTH, t); // 0 → -CARD_WIDTH

  return Array.from({length: cardsLen}, (_, index) => {
    const centerIndex = (cardsLen - 1) / 2;
    const shift = index - centerIndex;
    const arcOffset = Math.pow(shift, 2) * arcScale + arcBias;

    switch (direction) {
      case 'down': // bottom, pointing up
        return {
          x: width / 2 - (cardsLen / 2) * spread + index * spread,
          y: height - 145 + arcOffset + downYExtra,
          deg: shift * tiltStep,
        };

      case 'up': // top, pointing down
        return {
          x:
            width / 2 -
            (cardsLen / 2) * spread +
            (cardsLen - index) * spread +
            upXExtra,
          y: 125 - arcOffset,
          deg: 180 + shift * tiltStep,
        };

      case 'right': // right side, pointing left
        return {
          x: width - 150 + arcOffset + CARD_WIDTH * 1.5,
          y: height / 2 + (cardsLen / 2) * spread - index * spread - 135,
          deg: -90 + shift * tiltStep,
        };

      case 'left': // left side, pointing right
        return {
          x: 25 - arcOffset,
          y: height / 2 - (cardsLen / 2) * spread + index * spread - 125,
          deg: 90 + shift * tiltStep,
        };

      default:
        return {
          x: width / 2 - (cardsLen / 2) * spread + index * spread,
          y: height - 150 + arcOffset,
          deg: shift * tiltStep,
        };
    }
  });
}

export const calculateRevealCardsPositions = (
  cardsLen: number,
  direction: DirectionName,
): Position[] =>
  calculateCardsPositions(cardsLen, direction, CARD_WIDTH * 0.45);

export const calculateHiddenCardsPositions = (
  cardsLen: number,
  direction: DirectionName,
): Position[] => calculateCardsPositions(cardsLen, direction, OVERLAP_AMOUNT);

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
        playerStatus: 'active',
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

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

type TargetEvent = {shooter: string; target: string};
export const ballThrownEvent = (
  remaining: string[],
  losers: string[],
): TargetEvent[] => {
  if (losers.length === 0) {
    return [];
  }

  let actualThrowers = remaining;

  // Case: No remaining players (all are losers)
  if (remaining.length === 0) {
    if (losers.length === 1) {
      // Edge case: only one loser, no one to throw at them
      return [];
    }

    // Some losers become throwers - pick roughly half, minimum 1
    const shuffledLosers = [...losers].sort(() => Math.random() - 0.5);
    const throwerCount = Math.max(1, Math.floor(losers.length / 2));
    actualThrowers = shuffledLosers.slice(0, throwerCount);
  }

  // PRESERVE ORIGINAL BEHAVIOR: Each thrower throws at each loser
  const events: TargetEvent[] = [];

  for (const shooter of actualThrowers) {
    for (const target of losers) {
      // Skip self-throws when losers are acting as throwers
      if (shooter === target) {
        continue;
      }

      events.push({
        shooter,
        target,
      });
    }
  }

  return events;
};
