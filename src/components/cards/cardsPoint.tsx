import React, {useEffect, useMemo, useRef} from 'react';
import {Card, DirectionName, Position} from '~/types/cards';
import {CardComponent} from './cardVisual';
import {Dimensions, Platform, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {getCardKey} from '~/utils/gameRules';
import {calculateCardsPositions} from '~/utils/logic';
import {
  CARD_SELECT_OFFSET,
  MOVE_DURATION,
  SMALL_DELAY,
} from '~/utils/constants';
import CardBack from './cardBack';
import {TurnState} from '~/types/turnState';

const {width, height} = Dimensions.get('screen');

interface CardPointsListProps {
  cards: Card[];
  onCardSelect: (index: number) => void;
  slapCardIndex?: number;
  selectedCardsIndexes: number[];
  onCardSlapped: () => void;
  fromPosition?: Position;
  direction: DirectionName;
  action?: TurnState['action'];
  initialState?: {
    from: Position[];
    round: number;
    delay: number;
  };
}

const CardPointsList = ({
  cards,
  onCardSelect,
  slapCardIndex = -1,
  selectedCardsIndexes,
  onCardSlapped,
  fromPosition,
  direction,
  action,
  initialState,
}: CardPointsListProps) => {
  const cardsPositions = useMemo(
    () => calculateCardsPositions(cards.length, direction),
    [cards.length, direction],
  );

  return (
    <View style={styles.body} pointerEvents="box-none">
      {initialState &&
        cards.map((card, index) => (
          <CardPointer
            key={getCardKey(card)}
            index={index}
            onCardSelect={() => onCardSelect(index)}
            card={card}
            isSelected={selectedCardsIndexes.includes(index)}
            isSlap={index === slapCardIndex}
            onCardSlapped={onCardSlapped}
            from={fromPosition ?? initialState.from[index]}
            dest={cardsPositions[index] ?? {x: 0, y: 0, deg: 0}}
            action={action ?? 'DRAG_FROM_DECK'}
            delay={
              fromPosition ? DELAY : initialState.delay + index * SMALL_DELAY
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
  const prevStateSelection = useRef<boolean>(false);
  const translateY = useSharedValue<number>(from?.y ?? dest.y);
  const translateInternalY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(from?.x ?? dest.x);
  const cardDeg = useSharedValue<number>(from?.deg ?? dest.deg);

  const flipRotation = useSharedValue(action === 'DRAG_FROM_DECK' ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (prevStateSelection.current !== isSelected) {
      translateInternalY.value = withSpring(
        isSelected ? -CARD_SELECT_OFFSET : 0,
      ); //no using withSpring temporary until will fix this
      prevStateSelection.current = isSelected;
    }
  }, [dest.y, isSelected, translateInternalY]);

  // Animate to target position
  useEffect(() => {
    const targetRotation = dest.deg;
    const timer = setTimeout(() => {
      translateX.value = withTiming(dest.x, {duration: MOVE_DURATION});
      translateY.value = withTiming(dest.y, {duration: MOVE_DURATION});
      cardDeg.value = withTiming(targetRotation, {duration: MOVE_DURATION});
      flipRotation.value = withTiming(0, {duration: MOVE_DURATION / 2});
      scale.value = withTiming(1.25, {duration: MOVE_DURATION});
    }, delay);

    return () => clearTimeout(timer);
  }, [
    translateX,
    translateY,
    translateInternalY,
    cardDeg,
    dest.deg,
    dest.x,
    dest.y,
    flipRotation,
    scale,
    index,
    delay,
  ]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
    zIndex: index,
  }));

  const animatedSelectionStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateInternalY.value}],
  }));

  const animatedFrontFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: flipRotation.value > 0.5 ? 0 : (0.5 - flipRotation.value) * 2,
      },
      {scale: scale.value},
    ],
  }));

  const animatedBackFlipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: flipRotation.value <= 0.5 ? 0 : (flipRotation.value - 0.5) * 2,
      },
      {scale: scale.value},
    ],
    position: 'absolute',
  }));

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <Animated.View style={animatedSelectionStyle}>
          <Pressable onPress={isSlap ? onCardSlapped : onCardSelect}>
            <Animated.View style={animatedFrontFlipStyle}>
              <CardComponent card={card} glowing={isSlap} />
            </Animated.View>
            <Animated.View style={animatedBackFlipStyle}>
              <CardBack />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export default CardPointsList;
