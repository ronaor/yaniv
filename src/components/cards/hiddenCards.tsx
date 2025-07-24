import React, {useEffect, useMemo} from 'react';
import {Card, DirectionName, Position} from '~/types/cards';
import {Dimensions, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {calculateCardsPositions} from '~/utils/logic';
import CardBack from './cardBack';
import {getCardKey} from '~/utils/gameRules';
import {MOVE_DURATION} from '~/utils/constants';

const {width, height} = Dimensions.get('screen');

interface HiddenCardPointsListProps {
  cards: Card[];
  fromPosition?: Position;
  direction: DirectionName;
}

const HiddenCardPointsList = ({
  cards,
  fromPosition,
  direction,
}: HiddenCardPointsListProps) => {
  const cardsPositions = useMemo(
    () => calculateCardsPositions(cards.length, direction),
    [cards.length, direction],
  );

  return (
    <View style={styles.body} pointerEvents="box-none">
      {cards.map((card, index) => (
        <HiddenCardPointer
          key={getCardKey(card)}
          index={index}
          from={fromPosition}
          dest={cardsPositions[index] ?? {x: 0, y: 0, deg: 0}}
          card={card}
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
}

const HiddenCardPointer = ({index, from, dest}: HiddenCardPointerProps) => {
  const translateY = useSharedValue<number>(from?.y ?? dest.y);
  const translateX = useSharedValue<number>(from?.x ?? dest.x);
  const cardDeg = useSharedValue<number>(dest.deg);

  // Animate to target position
  useEffect(() => {
    const targetRotation = dest.deg;
    translateX.value = withTiming(dest.x, {duration: MOVE_DURATION});
    translateY.value = withTiming(dest.y, {duration: MOVE_DURATION});
    cardDeg.value = withTiming(targetRotation, {duration: MOVE_DURATION});
  }, [translateX, translateY, cardDeg, dest.deg, dest.x, dest.y]);

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

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <CardBack />
      </Animated.View>
    </Animated.View>
  );
};

export default HiddenCardPointsList;
