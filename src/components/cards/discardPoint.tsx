import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
import {Pressable, StyleSheet, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Card, Position} from '~/types/cards';
import {getCardKey, isCanPickupCard} from '~/utils/gameRules';

// This Component is responsible for managing the state of the discard pile.
// it includes:
// 1. display the discard cards
// 2. animate them when a new state come's up
//    2.1. animate the cards that are moved to trash
//    2.2. remove the card that is picked

interface DiscardCardPointersProps {
  cards: Card[];
  pickedCard?: Card;
  onPickUp: (index: number) => void;
  fromTargets?: (Position & {deg: number})[];
  round: number;
}

const DiscardCardPointers = ({
  cards,
  pickedCard,
  onPickUp,
  fromTargets,
  round,
}: DiscardCardPointersProps) => {
  const [thrownCards, setThrownCards] = useState<Card[]>([]);
  const newCards = useRef<Card[]>([]);

  useEffect(() => {
    newCards.current = [];
    return () => {
      newCards.current = [];
    };
  }, [round]);

  useEffect(() => {
    setThrownCards(newCards.current);
    newCards.current = cards;
  }, [cards]);

  return (
    <>
      <View style={styles.body} pointerEvents="none">
        {thrownCards.map((card, index) => (
          <DiscardPointer
            isThrown={
              pickedCard ? getCardKey(pickedCard) !== getCardKey(card) : false
            }
            card={card}
            index={index}
            throwTarget={{x: 0, y: 2 * 54}}
            key={getCardKey(card)}
          />
        ))}
      </View>
      <View style={styles.body}>
        {cards.map((card, index) => (
          <PickupPointer
            disabled={!isCanPickupCard(cards.length, index)}
            onPress={() => onPickUp(index)}
            index={index}
            card={card}
            fromTarget={fromTargets?.[index]}
            key={getCardKey(card)}
          />
        ))}
      </View>
      <View style={styles.trash} />
    </>
  );
};

export default DiscardCardPointers;

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    flexDirection: 'row',
  },
  pointers: {
    position: 'absolute',
  },
  trash: {
    width: 54,
    height: 70,
    position: 'absolute',
    top: 54 * 2,
  },
});

interface DiscardPointerProps {
  index: number;
  isThrown: boolean;
  card: Card;
  throwTarget: Position;
}

const DiscardPointer = ({
  isThrown,
  index,
  card,
  throwTarget,
}: DiscardPointerProps) => {
  const targetX = index * 54;
  const translateY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(targetX);
  const cardDeg = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(1);

  useEffect(() => {
    if (isThrown) {
      const targetRotation = Math.random() * 20;
      translateX.value = withTiming(throwTarget.x);
      translateY.value = withTiming(throwTarget.y);
      cardDeg.value = withTiming(targetRotation);
      opacity.value = withTiming(0.75);
    }
  }, [
    translateX,
    translateY,
    cardDeg,
    throwTarget.x,
    throwTarget.y,
    isThrown,
    card,
    opacity,
  ]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
    opacity: opacity.value,
  }));

  if (!isThrown) {
    return <></>;
  }

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <CardComponent card={card} />
      </Animated.View>
    </Animated.View>
  );
};

interface PickupPointerProps {
  index: number;
  card: Card;
  fromTarget?: Position & {deg: number};
  onPress: () => void;
  disabled: boolean;
}

const PickupPointer = ({
  index,
  card,
  fromTarget,
  onPress,
  disabled,
}: PickupPointerProps) => {
  const targetX = index * 54;
  const translateY = useSharedValue<number>(fromTarget?.y ?? 0);
  const translateX = useSharedValue<number>(fromTarget?.x ?? targetX);
  const cardDeg = useSharedValue<number>(fromTarget?.deg ?? 0);

  console.log('fromTarget', fromTarget);
  useEffect(() => {
    translateX.value = withTiming(targetX);
    translateY.value = withTiming(0);
    cardDeg.value = withTiming(0);
  }, [translateX, translateY, cardDeg, card, targetX]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
  }));

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <Pressable disabled={disabled} onPress={onPress}>
          <CardComponent card={card} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};
