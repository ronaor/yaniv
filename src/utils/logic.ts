import {Dimensions} from 'react-native';
import {DirectionName, Position} from '~/types/cards';
import {CARD_WIDTH} from './constants';

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
