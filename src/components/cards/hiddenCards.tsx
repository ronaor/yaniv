import React, {memo, useEffect, useMemo} from 'react';
import {Card, DirectionName, Position} from '~/types/cards';
import {Dimensions, Platform, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  calculateCardsPositions,
  calculateHiddenCardsPositions,
} from '~/utils/logic';
import CardBack from './cardBack';
import {getCardKey} from '~/utils/gameRules';
import {CIRCLE_CENTER, MOVE_DURATION} from '~/utils/constants';
import {TurnState} from '~/types/turnState';
import {CardComponent} from './cardVisual';

const {width, height} = Dimensions.get('screen');

interface HiddenCardPointsListProps {
  cards: Card[];
  fromPosition?: Position;
  direction: DirectionName;
  action?: TurnState['action'];
  reveal: boolean;
  isReady?: boolean;
  withDelay?: {delay: number; gap: number};
}

const HiddenCardPointsList = ({
  cards,
  fromPosition,
  direction,
  action,
  reveal,
  isReady = true,
  withDelay,
}: HiddenCardPointsListProps) => {
  const cardsHiddenPositions = useMemo(
    () => calculateHiddenCardsPositions(cards.length, direction),
    [cards.length, direction],
  );

  const cardsPositions = useMemo(
    () => calculateCardsPositions(cards.length, direction),
    [cards.length, direction],
  );

  return (
    <View style={styles.body} pointerEvents="box-none">
      {isReady &&
        cards.map((card, index) => (
          <HiddenCardPointer
            key={getCardKey(card)}
            index={index}
            from={fromPosition ?? CIRCLE_CENTER}
            dest={
              (reveal
                ? cardsPositions[index]
                : cardsHiddenPositions[index]) ?? {
                x: 0,
                y: 0,
                deg: 0,
              }
            }
            card={card}
            action={action}
            reveal={reveal}
            delay={
              reveal
                ? 0
                : fromPosition
                ? DELAY
                : withDelay
                ? withDelay.delay + index * withDelay.gap
                : 0
            }
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    height: height,
    width: width,
    position: 'absolute',
  },
  pointers: {
    position: 'absolute',
  },
});

interface HiddenCardPointerProps {
  index: number;
  from?: Position;
  dest: Position & {deg: number};
  card: Card;
  action?: TurnState['action'];
  reveal: boolean;
  delay?: number;
}

const DELAY = Platform.OS === 'android' ? MOVE_DURATION : MOVE_DURATION * 0.5;

const HiddenCardPointer = ({
  index,
  from,
  dest,
  card,
  action,
  reveal,
  delay = 0,
}: HiddenCardPointerProps) => {
  const translateY = useSharedValue<number>(from?.y ?? dest.y);
  const translateX = useSharedValue<number>(from?.x ?? dest.x);
  const cardDeg = useSharedValue<number>(from?.deg ?? dest.deg);

  const flipRotation = useSharedValue(action === 'DRAG_FROM_PICKUP' ? 0 : 1);

  // Animate to target position
  useEffect(() => {
    const targetRotation = dest.deg;
    const timer = setTimeout(() => {
      translateX.value = withTiming(dest.x, {duration: MOVE_DURATION});
      translateY.value = withTiming(dest.y, {duration: MOVE_DURATION});
      cardDeg.value = withTiming(targetRotation, {duration: MOVE_DURATION});
      flipRotation.value = withTiming(reveal ? 0 : 1, {
        duration: MOVE_DURATION / 2,
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [
    translateX,
    translateY,
    cardDeg,
    dest.deg,
    dest.x,
    dest.y,
    flipRotation,
    delay,
    index,
    reveal,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
    zIndex: index,
  }));

  const animatedFrontFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: flipRotation.value > 0.5 ? 0 : (0.5 - flipRotation.value) * 2,
      },
    ],
  }));

  const animatedBackFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: flipRotation.value <= 0.5 ? 0 : (flipRotation.value - 0.5) * 2,
      },
    ],
    position: 'absolute',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={animatedFrontFlipStyle}>
        <CardComponent card={card} />
      </Animated.View>
      <Animated.View style={animatedBackFlipStyle}>
        <CardBack />
      </Animated.View>
    </Animated.View>
  );
};

export default memo(HiddenCardPointsList);
