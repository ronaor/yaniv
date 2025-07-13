import React, {useEffect, useRef} from 'react';
import {Card} from '~/types/cards';
import {CardComponent} from './cardVisual';
import {Dimensions, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const {width, height} = Dimensions.get('screen');

type Position = {x: number; y: number};
interface CardPointsListProps {
  cards: Card[];
  onCardSelect: (index: number) => void;
  slapCardIndex?: number;
  selectedCardsIndexes: number[];
  onCardSlapped: () => void;
  tablePositions?: {
    deck: Position;
    bank: Position;
  };
  pick: {
    pickedCard?: Card;
    source: 'pickup' | 'deck' | 'slap';
  };
}

const getCardKey = (card: Card) => `${card.suit}-${card.value}`;

const CardPointsList = ({
  cards,
  onCardSelect,
  slapCardIndex = -1,
  selectedCardsIndexes,
  onCardSlapped,
  tablePositions,
  pick,
}: CardPointsListProps) => {
  const prevStateOfCards = useRef<Card[]>([]);

  useEffect(() => {
    prevStateOfCards.current = cards;
  }, [cards]);

  return (
    <View style={styles.body} pointerEvents="box-none">
      {tablePositions &&
        cards.map((card, index) => (
          <CardPointer
            key={getCardKey(card)}
            cardsLen={cards.length}
            index={index}
            onCardSelect={() => onCardSelect(index)}
            card={card}
            isSelected={selectedCardsIndexes.includes(index)}
            isSlap={index === slapCardIndex}
            onCardSlapped={onCardSlapped}
            deckPos={tablePositions.deck}
            bankPos={tablePositions.bank}
            pickedFrom={
              pick &&
              pick.pickedCard &&
              getCardKey(pick.pickedCard) === getCardKey(card)
                ? pick.source
                : undefined
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

interface CardPointerProps {
  cardsLen: number;
  index: number;
  onCardSelect: () => void;
  card: Card;
  isSelected: boolean;
  isSlap: boolean;
  onCardSlapped: () => void;
  deckPos: Position;
  bankPos: Position;
  pickedFrom?: 'pickup' | 'deck' | 'slap';
}

const CardPointer = ({
  index,
  cardsLen,
  onCardSelect,
  card,
  isSelected,
  isSlap,
  onCardSlapped,
  pickedFrom,
  deckPos,
  bankPos,
}: CardPointerProps) => {
  const prevStateSelection = useRef<boolean>(false);

  const cardKey = `${card.suit}-${card.value}`;
  const centerIndex = (cardsLen - 1) / 2;
  const shift = index - centerIndex;
  const cardTrY = height + Math.pow(shift, 2) * 2 - 150;

  const targetX = width / 2 - (cardsLen / 2) * 54 + index * 54;

  const translateY = useSharedValue<number>(
    pickedFrom ? (pickedFrom === 'deck' ? deckPos.y : bankPos.y) : cardTrY,
  );
  const translateX = useSharedValue<number>(
    pickedFrom ? (pickedFrom === 'deck' ? deckPos.x : bankPos.x) : targetX,
  );
  const cardDeg = useSharedValue<number>(pickedFrom ? 0 : shift * 3);

  useEffect(() => {
    if (prevStateSelection.current !== isSelected) {
      translateY.value = withSpring(isSelected ? cardTrY - 20 : cardTrY);
      prevStateSelection.current = isSelected;
    }
  }, [cardTrY, isSelected, translateY]);

  useEffect(() => {
    prevStateSelection.current = false;
  }, [pickedFrom]);

  // Animate to target position
  useEffect(() => {
    const targetRotation = shift * 3;
    translateX.value = withTiming(targetX);
    translateY.value = withTiming(cardTrY);
    cardDeg.value = withTiming(targetRotation);
  }, [
    cardsLen,
    shift,
    cardTrY,
    pickedFrom,
    translateX,
    translateY,
    cardDeg,
    targetX,
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
