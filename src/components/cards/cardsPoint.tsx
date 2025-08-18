import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Card, DirectionName, Position} from '~/types/cards';
import {CardComponent, GlowingCardComponent} from './cardVisual';
import {Dimensions, Platform, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {getCardKey} from '~/utils/gameRules';
import {calculateCardsPositions} from '~/utils/logic';
import {
  CARD_SELECT_OFFSET,
  MOVE_DURATION,
  CIRCLE_CENTER,
} from '~/utils/constants';
import CardBack from './cardBack';
import {TurnState} from '~/types/turnState';
import {interpolate} from 'react-native-reanimated';

const {width, height} = Dimensions.get('screen');

interface CardPointsListProps {
  cards: Card[];
  // onCardSelect: (index: number) => void;
  slapCardIndex?: number;
  // selectedCardsIndexes: number[];
  onCardSlapped: () => void;
  fromPosition?: Position;
  direction: DirectionName;
  action?: TurnState['action'];
  isReady?: boolean;
  withDelay?: {delay: number; gap: number};
}

export interface CardListRef {
  getSelectedCards: () => Card[];
  clearSelection: () => void;
}

const CardPointsList = forwardRef<CardListRef, CardPointsListProps>(
  (props, ref) => {
    const {
      cards,
      slapCardIndex = -1,
      onCardSlapped,
      fromPosition,
      direction,
      action,
      isReady = true,
      withDelay,
    } = props;
    const cardsPositions = useMemo(
      () => calculateCardsPositions(cards.length, direction),
      [cards.length, direction],
    );

    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

    const toggleCardSelection = (index: number) => {
      setSelectedIndexes(prev => {
        const isSelected = prev.includes(index);
        if (isSelected) {
          return prev.filter(i => i !== index);
        }
        return [...prev, index];
      });
    };

    useImperativeHandle(ref, () => ({
      getSelectedCards: () => {
        return selectedIndexes.map(i => props.cards[i]);
      },
      clearSelection: () => {
        setSelectedIndexes([]);
      },
      // other methods for board operations
    }));

    return (
      <View style={styles.body} pointerEvents="box-none">
        {isReady &&
          cards.map((card, index) => (
            <CardPointer
              key={getCardKey(card)}
              index={index}
              onCardSelect={() => toggleCardSelection(index)}
              card={card}
              isSelected={selectedIndexes.includes(index)}
              isSlap={index === slapCardIndex}
              onCardSlapped={onCardSlapped}
              from={fromPosition ?? CIRCLE_CENTER}
              dest={cardsPositions[index] ?? {x: 0, y: 0, deg: 0}}
              action={action ?? 'DRAG_FROM_DECK'}
              delay={
                fromPosition
                  ? DELAY
                  : withDelay
                  ? withDelay.delay + index * withDelay.gap
                  : 0
              }
            />
          ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  body: {
    height: height,
    width: width,
    position: 'absolute',
    zIndex: 1,
  },
  pointers: {
    position: 'absolute',
  },
});

interface CardPointerProps {
  index: number;
  onCardSelect: () => void;
  card: Card;
  isSelected: boolean;
  isSlap: boolean;
  onCardSlapped: () => void;
  from?: Position;
  dest: Position;
  action?: TurnState['action'];
  delay?: number;
}

const DELAY = Platform.OS === 'android' ? MOVE_DURATION : MOVE_DURATION * 0.5;

const CardPointer = ({
  index,
  onCardSelect,
  card,
  isSelected,
  isSlap,
  onCardSlapped,
  from,
  dest,
  action,
  delay,
}: CardPointerProps) => {
  // Position animation (reusable, resets)
  const currentPos = useSharedValue<Position>(from ?? dest);
  const destPos = useSharedValue<Position>(dest);
  const progress = useSharedValue<number>(from ? 0 : 1);

  // Draw animation (one-time, combines flip + scale)
  const drewProgress = useSharedValue(0);

  // Selection animation
  const translateInternalY = useSharedValue<number>(0);
  const prevStateSelection = useRef<boolean>(false);

  // Selection animation
  useEffect(() => {
    if (prevStateSelection.current !== isSelected) {
      translateInternalY.value = withSpring(
        isSelected ? -CARD_SELECT_OFFSET : 0,
      );
      prevStateSelection.current = isSelected;
    }
  }, [isSelected, translateInternalY]);

  // Main animation
  useEffect(() => {
    destPos.value = dest;
    const timer = setTimeout(() => {
      // Position animation
      progress.value = withTiming(1, {duration: MOVE_DURATION}, finished => {
        'worklet';
        if (finished) {
          currentPos.value = destPos.value;
          progress.value = 0;
        }
      });
      drewProgress.value = withTiming(1, {duration: MOVE_DURATION});
    }, delay);

    return () => clearTimeout(timer);
  }, [action, currentPos, delay, dest, destPos, drewProgress, progress]);

  // Position style
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
        {translateY: currentY + translateInternalY.value},
        {rotate: `${currentDeg}deg`},
      ],
      zIndex: index,
    };
  });

  const flipValues = useDerivedValue(() => ({
    flipRotation: interpolate(
      drewProgress.value,
      [0, 0.5, 1],
      [action === 'DRAG_FROM_DECK' ? 1 : 0, 0, 0],
    ),
    scale: interpolate(drewProgress.value, [0, 1], [1, 1.25]),
  }));

  const animatedFrontFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX:
          flipValues.value.flipRotation > 0.5
            ? 0
            : (0.5 - flipValues.value.flipRotation) * 2,
      },
      {scale: flipValues.value.scale},
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
      {scale: flipValues.value.scale},
    ],
    position: 'absolute',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={isSlap ? onCardSlapped : onCardSelect}>
        <Animated.View style={animatedFrontFlipStyle}>
          {isSlap ? (
            <GlowingCardComponent card={card} />
          ) : (
            <CardComponent card={card} />
          )}
        </Animated.View>
        <Animated.View style={animatedBackFlipStyle}>
          <CardBack />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default CardPointsList;
