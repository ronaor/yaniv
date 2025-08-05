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
