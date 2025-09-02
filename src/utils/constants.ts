import {Dimensions} from 'react-native';
import {DirectionName} from '~/types/cards';

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;
export const OVERLAP_AMOUNT = CARD_WIDTH * 0.3;
export const CARD_SELECT_OFFSET = 20;

export const MOVE_DURATION = 500;
export const SMALL_DELAY = 100;

export const directions: DirectionName[] = ['down', 'right', 'up', 'left'];

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('screen');
export {SCREEN_WIDTH, SCREEN_HEIGHT};

export const CIRCLE_CENTER = {
  x: SCREEN_WIDTH / 2 - CARD_WIDTH / 2,
  y: SCREEN_HEIGHT / 2 - CARD_HEIGHT * 1.5,
  deg: 0,
};

// constants/gameConfig.ts
export const GAME_CONFIG = {
  DIFFICULTY: ['Easy', 'Medium', 'Hard'],
  NUMBER_OF_PLAYERS: ['2', '3', '4'],
  CALL_YANIV_OPTIONS: ['3', '5', '7'],
  MAX_SCORE_OPTIONS: ['50', '100', '200'],
  DEFAULT_VALUES: {
    Easy: {
      difficulty: 0, // E
      numberOfPlayers: 0, //4
      slapDown: false,
      callYanivIndex: 2, // '7'
      maxScoreIndex: 1, // '100'
    },
    Medium: {
      difficulty: 1, // M
      numberOfPlayers: 1, //4
      slapDown: true,
      callYanivIndex: 2, // '7'
      maxScoreIndex: 1, // '100'
    },
    Hard: {
      difficulty: 2, // H
      numberOfPlayers: 2, //4
      slapDown: true,
      callYanivIndex: 2, // '7'
      maxScoreIndex: 1, // '100'
    },
  },
};
