import {StyleSheet, View, ViewStyle} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Card, Position} from '~/types/cards';
import {getCardKey, isCanPickupCard} from '~/utils/gameRules';
import {DiscardedPointer, DiscardPointer} from './discardPoint';
import {isEqual} from 'lodash';
import {CARD_WIDTH} from '~/utils/constants';
import PickupPointer from './pickupPoint';

// This Component is responsible for managing the state of the discard pile.
// it includes:
// 1. display the discard cards
// 2. animate them when a new state come's up
//    2.1. animate the cards that are moved to trash
//    2.2. remove the card that is picked

const cardsShifterStyle = (cardsLen: number): ViewStyle => ({
  flexDirection: 'row',
  transform: [
    {
      translateX: -((cardsLen - 1) * CARD_WIDTH) / 2,
    },
  ],
});

interface DeckCardPointersProps {
  cards: Card[];
  pickedCard?: Card;
  onPickUp: (index: number) => void;
  fromTargets?: (Position & {deg: number})[];
  round: number;
  disabled?: boolean;
}

const DeckCardPointers = ({
  cards,
  pickedCard,
  onPickUp,
  fromTargets,
  round,
  disabled = false,
}: DeckCardPointersProps) => {
  const newCards = useRef<Card[]>([]);
  const [layerHistory, setLayerHistory] = useState<{
    layer1: (Card & {deg: number})[];
    layer2: (Card & {deg: number})[];
    layer3: (Card & {deg: number})[];
  }>({
    layer1: [],
    layer2: [],
    layer3: [],
  });

  useEffect(() => {
    newCards.current = [];
    setLayerHistory({
      layer1: [],
      layer2: [],
      layer3: [],
    });
    return () => {
      newCards.current = [];
    };
  }, [round]);

  useEffect(() => {
    if (!isEqual(newCards.current, cards)) {
      const newLayer = [
        ...newCards.current
          .filter(card =>
            pickedCard ? getCardKey(pickedCard) !== getCardKey(card) : true,
          )
          .map(card => ({
            ...card,
            deg: Math.random() * 20,
          })),
      ];
      if (newLayer.length > 0) {
        setLayerHistory(prev => ({
          layer3: [...prev.layer2],
          layer2: [...prev.layer1],
          layer1: newLayer,
        }));
      }
    }
    newCards.current = cards;
  }, [cards, pickedCard]);

  return (
    <>
      <View
        style={cardsShifterStyle(layerHistory.layer3.length)}
        pointerEvents="none">
        {layerHistory.layer3.map(card => (
          <DiscardedPointer
            card={card}
            throwTarget={{
              x: ((layerHistory.layer3.length - 1) * CARD_WIDTH) / 2,
              y: 2 * CARD_WIDTH,
              deg: card.deg,
            }}
            key={getCardKey(card)}
            opacity={{from: 0.4, to: 0.15}}
          />
        ))}
      </View>
      <View
        style={cardsShifterStyle(layerHistory.layer2.length)}
        pointerEvents="none">
        {layerHistory.layer2.map(card => (
          <DiscardedPointer
            card={card}
            throwTarget={{
              x: ((layerHistory.layer2.length - 1) * CARD_WIDTH) / 2,
              y: 2 * CARD_WIDTH,
              deg: card.deg,
            }}
            key={getCardKey(card)}
            opacity={{from: 0.7, to: 0.4}}
          />
        ))}
      </View>
      <View style={cardsShifterStyle(layerHistory.layer1.length)}>
        {layerHistory.layer1.map((card, index) => (
          <DiscardPointer
            card={card}
            index={index}
            throwTarget={{
              x: ((layerHistory.layer1.length - 1) * CARD_WIDTH) / 2,
              y: 2 * CARD_WIDTH,
              deg: card.deg,
            }}
            key={getCardKey(card)}
            opacity={0.7}
          />
        ))}
      </View>
      <View style={cardsShifterStyle(cards.length)}>
        {cards.map((card, index) => (
          <PickupPointer
            disabled={disabled || !isCanPickupCard(cards.length, index)}
            onPress={() => onPickUp(index)}
            index={index}
            card={card}
            fromTarget={fromTargets?.[index]}
            key={getCardKey(card)}
          />
        ))}
      </View>
      <View style={styles.discard} />
    </>
  );
};

export default DeckCardPointers;

const styles = StyleSheet.create({
  discard: {
    width: CARD_WIDTH,
    height: 70,
    top: CARD_WIDTH * 2,
  },
});
