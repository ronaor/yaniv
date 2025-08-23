import React, {
  forwardRef,
  useCallback,
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
  withDelay,
  withSequence,
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
  slapCardIndex?: number;
  onCardSlapped: () => void;
  fromPosition?: Position;
  direction: DirectionName;
  action?: TurnState['action'];
  isReady?: boolean;
  cardsDelay?: {delay: number; gap: number};
  disabled?: boolean;
}

export interface CardListRef {
  clearSelection: () => void;
  selectedCards: Card[];
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
      cardsDelay,
      disabled = false,
    } = props;
    const cardsPositions = useMemo(
      () => calculateCardsPositions(cards.length, direction),
      [cards.length, direction],
    );

    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [disabledCards, setDisabledCards] = useState<Card[]>([]);

    const validateDisabledCards = useCallback(
      (newSet: Card[]) => {
        if (newSet.length === 0) {
          return [];
        }
        const card = newSet.find(c => c.value !== 0);
        if (!card) {
          return [];
        }
        let dCards: Card[] = cards.filter(c => c.value !== 0);
        if (newSet.length === 1) {
          dCards = dCards.filter(
            c => c.value !== card.value && c.suit !== card.suit,
          );
          return dCards;
        }
        if (newSet.every(c => c.value === card.value || c.value === 0)) {
          dCards = dCards.filter(c => c.value !== card.value);
        }
        if (newSet.every(c => c.suit === card.suit || c.value === 0)) {
          dCards = dCards.filter(c => c.suit !== card.suit);
        }
        return dCards;
      },
      [cards],
    );

    const toggleCardSelection = useCallback(
      (card: Card) => {
        setSelectedCards(prev => {
          const isSelected = prev.includes(card);
          const newSet = isSelected
            ? prev.filter(c => c !== card)
            : [...prev, card];
          setDisabledCards(validateDisabledCards(newSet));
          return newSet;
        });
      },
      [validateDisabledCards],
    );

    const clearSelection = useCallback(() => {
      setSelectedCards([]);
      setDisabledCards([]);
    }, []);

    useImperativeHandle(ref, () => ({
      clearSelection,
      selectedCards,
    }));

    useEffect(() => {
      if (disabled) {
        clearSelection();
      }
    }, [clearSelection, disabled]);

    return (
      <View style={styles.body} pointerEvents="box-none">
        {cards.map((card, index) => (
          <CardPointer
            key={getCardKey(card)}
            index={index}
            onCardSelect={() => toggleCardSelection(card)}
            card={card}
            ready={isReady}
            isSelected={selectedCards.includes(card)}
            disabled={disabled || disabledCards.includes(card)}
            isSlap={index === slapCardIndex}
            onCardSlapped={onCardSlapped}
            from={fromPosition ?? CIRCLE_CENTER}
            dest={cardsPositions[index] ?? {x: 0, y: 0, deg: 0}}
            action={action ?? 'DRAG_FROM_DECK'}
            delay={
              fromPosition
                ? DELAY
                : cardsDelay
                ? cardsDelay.delay + index * cardsDelay.gap
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
  delay: number;
  ready: boolean;
  disabled?: boolean;
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
  ready,
  disabled = false,
}: CardPointerProps) => {
  // Position animation (reusable, resets)
  const currentPos = useSharedValue<Position>(from ?? dest);
  const destPos = useSharedValue<Position>(dest);
  const progress = useSharedValue<number>(from ? 0 : 1);

  // Draw animation (one-time, combines flip + scale)
  const drewProgress = useSharedValue(0);

  // Selection animation
  const translateInternalY = useSharedValue<number>(0);
  const translateInternalDeg = useSharedValue<number>(0);
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

  const $onCardSelect = useCallback(() => {
    if (disabled) {
      translateInternalDeg.value = withSequence(
        withTiming(-4, {duration: 60}),
        withTiming(4, {duration: 60}),
        withTiming(-3, {duration: 60}),
        withTiming(3, {duration: 60}),
        withTiming(0, {duration: 60}),
      );
    } else {
      onCardSelect();
    }
  }, [onCardSelect, disabled, translateInternalDeg]);

  // Main animation
  useEffect(() => {
    if (!ready) {
      currentPos.value = from ?? dest;
      destPos.value = dest;
      progress.value = from ? 0 : 1;
      drewProgress.value = 0;
      return;
    }
    destPos.value = dest;

    progress.value = withDelay(
      delay,
      withTiming(1, {duration: MOVE_DURATION}, finished => {
        'worklet';
        if (finished) {
          currentPos.value = destPos.value;
          progress.value = 0;
        }
      }),
    );

    drewProgress.value = withDelay(
      delay,
      withTiming(1, {duration: MOVE_DURATION}),
    );
  }, [ready, currentPos, delay, dest, destPos, drewProgress, progress, from]);

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
        {rotate: `${currentDeg + translateInternalDeg.value}deg`},
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

  const opacityStyle = {opacity: ready ? 1 : 0};
  return (
    <Animated.View style={[animatedStyle, opacityStyle]}>
      <Pressable onPress={isSlap ? onCardSlapped : $onCardSelect}>
        <Animated.View style={animatedFrontFlipStyle}>
          {isSlap && !disabled ? (
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
