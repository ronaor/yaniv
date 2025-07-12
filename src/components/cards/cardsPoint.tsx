import React, {useEffect, useRef} from 'react';
import {Card} from '~/types/cards';
import {CardComponent} from './cardVisual';
import {Dimensions, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const {width, height} = Dimensions.get('screen');

interface CardPointsListProps {
  cards: Card[];
  onCardSelect: (index: number) => void;
  slapCardIndex?: number;
  selectedCardsIndexes: number[];
  onCardSlapped: () => void;
}

const CardPointsList = ({
  cards,
  onCardSelect,
  slapCardIndex = -1,
  selectedCardsIndexes,
  onCardSlapped,
}: CardPointsListProps) => {
  const prevState = useRef<Card[]>([]);

  useEffect(() => {
    // update points
  }, [cards]);

  return (
    <View style={styles.body}>
      {cards.map((card, index) => (
        <CardPointer
          key={`${card.suit}-${card.value}`}
          cardsLen={cards.length}
          index={index}
          onCardSelect={() => onCardSelect(index)}
          card={card}
          isSelected={selectedCardsIndexes.includes(index)}
          isSlap={index === slapCardIndex}
          onCardSlapped={onCardSlapped}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    height: 100,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointers: {
    position: 'absolute',
  },
});

interface CardPointerProps {
  cardsLen: number;
  index: number;
  onCardSelect: () => void;
  card: Card;
  isSelected: boolean;
  isSlap: boolean;
  onCardSlapped: () => void;
}

const CardPointer = ({
  index,
  cardsLen,
  onCardSelect,
  card,
  isSelected,
  isSlap,
  onCardSlapped,
}: CardPointerProps) => {
  const prevStateSelection = useRef<boolean>(false);
  const prevStateIndex = useRef<boolean>(false);
  const centerIndex = (cardsLen - 1) / 2;
  const shift = index - centerIndex;
  // Rotation: each card rotates based on distance from center
  //   const cardDeg = shift * 3;

  // Vertical offset: create arc effect, but keep center card at baseline
  const cardTrY = Math.pow(shift, 2) * 2;

  const translateY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(0);
  const cardDeg = useSharedValue<number>(shift * 3);

  useEffect(() => {
    if (prevStateSelection.current !== isSelected) {
      translateY.value = withSpring(isSelected ? 1 : 0);
      prevStateSelection.current = isSelected;
    }
  });

  useEffect(() => {
    translateX.value = withTiming((index - cardsLen / 2) * 54);
    cardDeg.value = withTiming(shift * 3);
  }, [cardDeg, cardsLen, index, shift, translateX]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: cardTrY - translateY.value * 20},
      {rotate: `${cardDeg.value}deg`},
    ],
    zIndex: index,
  }));

  const cardKey = `${card.suit}-${card.value}`;

  return (
    <Animated.View
      key={cardKey}
      style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={isSlap ? onCardSlapped : onCardSelect}>
          <CardComponent card={card} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export default CardPointsList;
