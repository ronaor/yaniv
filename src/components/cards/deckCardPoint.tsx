import {StyleSheet, View, ViewStyle} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
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

const findInsertionIndex = (oldCards: Card[], newCards: Card[]): number => {
  const oldCardsKeys = oldCards.map(getCardKey);
  const addedCards = newCards.filter(
    oldC => !oldCardsKeys.includes(getCardKey(oldC)),
  );
  if (addedCards.length === 0) {
    return 0;
  }
  for (let i = 0; i < newCards.length || i < oldCards.length; i++) {
    if (addedCards.includes(newCards[i])) {
      return i;
    }
  }
  return 0;
};

interface DeckCardPointersProps {
  cards: Card[];
  pickedCard?: Card;
  onPickUp: (index: number) => void;
  fromTargets?: Position[];
  round: number;
  disabled?: boolean;
  wasPlayer: boolean;
}

type CardConfig = Card & {index: number; deg: number};

const DeckCardPointers = ({
  cards,
  pickedCard,
  onPickUp,
  fromTargets,
  round,
  disabled = false,
  wasPlayer,
}: DeckCardPointersProps) => {
  const newCards = useRef<Card[]>([]);
  const [layerHistory, setLayerHistory] = useState<{
    layer1: CardConfig[];
    layer2: CardConfig[];
    layer3: CardConfig[];
  }>({
    layer1: [],
    layer2: [],
    layer3: [],
  });

  // find first index in cards that is not exists in newCards.current:
  const insertionIndex = useMemo(
    () => findInsertionIndex(newCards.current, cards),
    [cards],
  );

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
      const currentKeys = cards.map(getCardKey);
      const removedCards = newCards.current.filter(
        card => !currentKeys.includes(getCardKey(card)),
      );

      if (removedCards.length > 0) {
        const newLayer: CardConfig[] = [];
        removedCards.forEach((card, i) => {
          if (pickedCard && getCardKey(pickedCard) !== getCardKey(card)) {
            newLayer.push({...card, deg: Math.random() * 40, index: i});
          }
        });
        if (newLayer.length > 0) {
          setLayerHistory(prev => ({
            layer3: [...prev.layer2],
            layer2: [...prev.layer1],
            layer1: newLayer,
          }));
        }
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
      {layerHistory.layer1.map(card => (
        <DiscardPointer
          card={card}
          index={card.index}
          throwTarget={{
            x: 0,
            y: 2 * CARD_WIDTH,
            deg: card.deg,
          }}
          key={getCardKey(card)}
          opacity={0.7}
          totalCards={layerHistory.layer1.length}
        />
      ))}
      <View>
        {cards.map((card, index) => (
          <PickupPointer
            disabled={disabled || !isCanPickupCard(cards.length, index)}
            onPress={() => onPickUp(index)}
            index={index}
            card={card}
            fromTarget={fromTargets?.[index - insertionIndex] ?? undefined}
            key={getCardKey(card)}
            isHidden={!wasPlayer}
            totalCards={cards.length}
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
