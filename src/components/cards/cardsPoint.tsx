import React, {useEffect, useMemo, useRef} from 'react';
import {Card, DirectionName, Position} from '~/types/cards';
import {CardComponent} from './cardVisual';
import {Dimensions, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {getCardKey} from '~/utils/gameRules';
import {calculateCardsPositions} from '~/utils/logic';
import {MOVE_DURATION} from '~/utils/constants';

const {width, height} = Dimensions.get('screen');

interface CardPointsListProps {
  cards: Card[];
  onCardSelect: (index: number) => void;
  slapCardIndex?: number;
  selectedCardsIndexes: number[];
  onCardSlapped: () => void;
  fromPosition?: Position;
  direction: DirectionName;
}

const CardPointsList = ({
  cards,
  onCardSelect,
  slapCardIndex = -1,
  selectedCardsIndexes,
  onCardSlapped,
  fromPosition,
  direction,
}: CardPointsListProps) => {
  const cardsPositions = useMemo(
    () => calculateCardsPositions(cards.length, direction),
    [cards.length, direction],
  );

  return (
    <View style={styles.body} pointerEvents="box-none">
      {cards.map((card, index) => (
        <CardPointer
          key={getCardKey(card)}
          index={index}
          onCardSelect={() => onCardSelect(index)}
          card={card}
          isSelected={selectedCardsIndexes.includes(index)}
          isSlap={index === slapCardIndex}
          onCardSlapped={onCardSlapped}
          from={fromPosition}
          dest={cardsPositions[index] ?? {x: 0, y: 0, deg: 0}}
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

interface CardPointerProps {
  index: number;
  onCardSelect: () => void;
  card: Card;
  isSelected: boolean;
  isSlap: boolean;
  onCardSlapped: () => void;
  from?: Position;
  dest: Position;
}

const CardPointer = ({
  index,
  onCardSelect,
  card,
  isSelected,
  isSlap,
  onCardSlapped,
  from,
  dest,
}: CardPointerProps) => {
  const prevStateSelection = useRef<boolean>(false);
  const translateY = useSharedValue<number>(from?.y ?? dest.y);
  const translateInternalY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(from?.x ?? dest.x);
  const cardDeg = useSharedValue<number>(dest.deg);

  useEffect(() => {
    if (prevStateSelection.current !== isSelected) {
      translateInternalY.value = withSpring(isSelected ? -20 : 0); //no using withSpring temporary until will fix this
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
      translateInternalY.value = withSpring(0);
    }, MOVE_DURATION / 2);

    return () => clearTimeout(timer);
  }, [
    translateX,
    translateY,
    translateInternalY,
    cardDeg,
    dest.deg,
    dest.x,
    dest.y,
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
  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <Animated.View style={animatedSelectionStyle}>
          <Pressable onPress={isSlap ? onCardSlapped : onCardSelect}>
            <CardComponent card={card} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export default CardPointsList;
