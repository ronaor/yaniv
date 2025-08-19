import {Dimensions} from 'react-native';
import {DirectionName} from '~/types/cards';

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;
export const OVERLAP_AMOUNT = CARD_WIDTH * 0.3;
export const CARD_SELECT_OFFSET = 20;

export const MOVE_DURATION = 500;
export const SMALL_DELAY = 100;

export const directions: DirectionName[] = ['down', 'right', 'up', 'left'];

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');
export const CIRCLE_CENTER = {
  x: screenWidth / 2 - CARD_WIDTH / 2,
  y: screenHeight / 2 - CARD_HEIGHT * 1.5,
  deg: 0,
};

// constants/gameConfig.ts
export const GAME_CONFIG = {
  DIFFICULTY: ['Easy', 'Medium', 'Hard'],
  NUMBER_OF_PLAYERS: ['2', '3', '4'],
  CALL_YANIV_OPTIONS: ['3', '5', '7'],
  MAX_SCORE_OPTIONS: ['50', '100', '200'],
  DEFAULT_VALUES: {
    difficulty: 1, // M
    numberOfPlayers: 2, //4
    slapDown: true,
    callYanivIndex: 2, // '7'
    maxScoreIndex: 1, // '100'
  },
};
