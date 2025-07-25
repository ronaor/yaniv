import {StyleSheet, View} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Card, Position} from '~/types/cards';
import {getCardKey, isCanPickupCard} from '~/utils/gameRules';
import {DiscardPointer, PickupPointer} from './discardPoint';
import {isEqual} from 'lodash';
import {CARD_WIDTH} from '~/utils/constants';

// This Component is responsible for managing the state of the discard pile.
// it includes:
// 1. display the discard cards
// 2. animate them when a new state come's up
//    2.1. animate the cards that are moved to trash
//    2.2. remove the card that is picked

interface DeckCardPointersProps {
  cards: Card[];
  pickedCard?: Card;
  onPickUp: (index: number) => void;
  fromTargets?: (Position & {deg: number})[];
  round: number;
}

const DeckCardPointers = ({
  cards,
  pickedCard,
  onPickUp,
  fromTargets,
  round,
}: DeckCardPointersProps) => {
  const [thrownCards, setThrownCards] = useState<Card[]>([]);
  const newCards = useRef<Card[]>([]);

  useEffect(() => {
    newCards.current = [];
    return () => {
      newCards.current = [];
    };
  }, [round]);

  useEffect(() => {
    if (!isEqual(newCards.current, cards)) {
      setThrownCards(newCards.current);
    }

    newCards.current = cards;
  }, [cards]);

  const targetsDegrees = useMemo(
    () => Array.from({length: thrownCards.length}).map(_ => Math.random() * 20),
    [thrownCards.length],
  );

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
            throwTarget={{x: 0, y: 2 * CARD_WIDTH, deg: targetsDegrees[index]}}
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
      <View style={styles.discard} />
    </>
  );
};

export default DeckCardPointers;

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
  },
  discard: {
    width: CARD_WIDTH,
    height: 70,
    top: CARD_WIDTH * 2,
  },
});
