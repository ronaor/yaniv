import React, {memo, useEffect, useMemo} from 'react';
import {Card, DirectionName, Position} from '~/types/cards';
import {Dimensions, Platform, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  interpolate,
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
  // Position animation (reusable, resets)
  const currentPos = useSharedValue<Position>(from ?? dest);
  const destPos = useSharedValue<Position>(dest);
  const progress = useSharedValue<number>(from ? 0 : 1);

  // Flip animation
  const flipProgress = useSharedValue(0);

  // Main animation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Update destination
      destPos.value = dest;

      // Position animation
      progress.value = withTiming(1, {duration: MOVE_DURATION}, finished => {
        'worklet';
        if (finished) {
          currentPos.value = destPos.value;
          progress.value = 0;
        }
      });

      // Flip animation
      flipProgress.value = withTiming(1, {duration: MOVE_DURATION / 2});
    }, delay);

    return () => clearTimeout(timer);
  }, [currentPos, delay, dest, destPos, flipProgress, progress]);

  // Position style with interpolation
  const animatedStyle = useAnimatedStyle(() => {
    const currentX = interpolate(
      progress.value,
      [0, 1],
      [currentPos.value.x, destPos.value.x],
    );
    const currentY = interpolate(
      progress.value,
      [0, 1],
      [currentPos.value.y, destPos.value.y],
    );
    const currentDeg = interpolate(
      progress.value,
      [0, 1],
      [currentPos.value.deg, destPos.value.deg],
    );

    return {
      position: 'absolute',
      transform: [
        {translateX: currentX},
        {translateY: currentY},
        {rotate: `${currentDeg}deg`},
      ],
      zIndex: index,
    };
  });

  // Derived flip values
  const flipValues = useDerivedValue(() => ({
    flipRotation: interpolate(
      flipProgress.value,
      [0, 1],
      [action === 'DRAG_FROM_PICKUP' ? 0 : 1, reveal ? 0 : 1],
    ),
  }));

  // Flip styles using derived values
  const animatedFrontFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX:
          flipValues.value.flipRotation > 0.5
            ? 0
            : (0.5 - flipValues.value.flipRotation) * 2,
      },
    ],
  }));

  const animatedBackFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX:
          flipValues.value.flipRotation <= 0.5
            ? 0
            : (flipValues.value.flipRotation - 0.5) * 2,
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
