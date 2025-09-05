import React from 'react';
import {Card, Position} from '~/types/cards';
import {getCardKey, isCanPickupCard} from '~/utils/gameRules';
import {DiscardedPointer, DiscardPointer} from './discardPoint';

import {CARD_WIDTH} from '~/utils/constants';
import PickupPointer from './pickupPoint';

// This Component is responsible for managing the state of the discard pile.
// it includes:
// 1. display the discard cards
// 2. animate them when a new state come's up
//    2.1. animate the cards that are moved to trash
//    2.2. remove the card that is picked

interface DeckCardPointersProps {
  cards: Card[];
  // pickedCard?: Card;
  onPickUp: (index: number) => void;
  fromTargets?: (Position | undefined)[];
  // round: number;
  disabled?: boolean;
  wasPlayer: boolean;
  layerHistory: {
    layer1: CardConfig[];
    layer2: CardConfig[];
    layer3: CardConfig[];
    lastLength: number;
  };
}

type CardConfig = Card & {index: number; deg: number};

const DeckCardPointers = ({
  cards,
  onPickUp,
  fromTargets,
  disabled = false,
  wasPlayer,
  layerHistory,
}: DeckCardPointersProps) => {
  return (
    <>
      {layerHistory.layer3.map(card => (
        <DiscardedPointer
          card={card}
          throwTarget={{
            x: 0,
            y: 2 * CARD_WIDTH,
            deg: card.deg,
          }}
          key={getCardKey(card)}
          opacity={{from: 0.4, to: 0.15}}
        />
      ))}
      {layerHistory.layer2.map(card => (
        <DiscardedPointer
          card={card}
          throwTarget={{
            x: 0,
            y: 2 * CARD_WIDTH,
            deg: card.deg,
          }}
          key={getCardKey(card)}
          opacity={{from: 0.7, to: 0.4}}
        />
      ))}
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
          totalCards={layerHistory.lastLength}
        />
      ))}
      {cards.map((card, index) => (
        <PickupPointer
          disabled={disabled || !isCanPickupCard(cards.length, index)}
          onPress={() => onPickUp(index)}
          index={index}
          card={card}
          fromTarget={fromTargets?.[index]}
          key={getCardKey(card)}
          isHidden={!wasPlayer}
          totalCards={cards.length}
        />
      ))}
    </>
  );
};

export default DeckCardPointers;
