import React, {useCallback, useEffect, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import CardBack from '~/components/cards/cardBack';
import {CARD_HEIGHT, CARD_WIDTH} from '~/utils/constants';
import {Card} from 'server/cards';
import {DirectionName, Position} from '~/types/cards';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {isCanPickupCard, isValidCardSet} from '~/utils/gameRules';
import CardsSpread from './cardsSpread';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const CardBackRotated = ({position}: {position: Position}) => {
  const rotationStyle: ViewStyle = {
    position: 'absolute',
    transform: [
      {translateX: position.x},
      {translateY: position.y},
      {rotate: `${position.deg}deg`},
    ],
  };
  return (
    <View style={rotationStyle}>
      <CardBack />
    </View>
  );
};

interface GameBoardProps {
  pickup: {
    pickupPile: Card[];
    lastPickedCard?: Card;
    tookFrom?: Position[];
    wasPlayer: boolean;
  };
  disabled?: boolean;
  round: number;
  selectedCards: Card[];
  activeDirections: Record<PlayerId, DirectionName>;
  onPlayerCardsCalculated?: (playerCards: Record<string, Position[]>) => void;
}

function GameBoard({
  pickup,
  selectedCards,
  round,
  disabled = false,
  activeDirections,
  onPlayerCardsCalculated,
}: GameBoardProps) {
  const {pickupPile, lastPickedCard, tookFrom} = pickup;

  const {emit} = useYanivGameStore();

  const handleDrawFromDeck = useCallback(() => {
    if (!isValidCardSet(selectedCards, true)) {
      return false;
    }
    emit.completeTurn({choice: 'deck'}, selectedCards);
  }, [emit, selectedCards]);

  const handlePickupCard = useCallback(
    (pickupIndex: number) => {
      if (
        !isCanPickupCard(pickupPile.length, pickupIndex) ||
        !isValidCardSet(selectedCards, true)
      ) {
        return false;
      }

      emit.completeTurn({choice: 'pickup', pickupIndex}, selectedCards);
    },
    [emit, pickupPile.length, selectedCards],
  );

  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    setReady(false);
  }, [round]);

  const $onPlayerCardsCalculated = useCallback(
    (playerCards: Record<string, Position[]>) => {
      onPlayerCardsCalculated?.(playerCards);
      setReady(true);
    },
    [onPlayerCardsCalculated, setReady],
  );

  return (
    <View style={styles.gameArea}>
      {ready && (
        <TouchableOpacity
          style={styles.deck}
          onPress={handleDrawFromDeck}
          disabled={disabled || selectedCards.length === 0}>
          <>
            <CardBackRotated position={{x: 0, y: 0, deg: 10}} />
            <CardBackRotated position={{x: 0, y: 0, deg: 5}} />
            <CardBackRotated position={{x: 0, y: 0, deg: 0}} />
            <CardBackRotated position={{x: 0, y: 0, deg: -5}} />
          </>
        </TouchableOpacity>
      )}

      <View style={styles.pickup}>
        {ready && (
          <DeckCardPointers
            cards={pickupPile}
            pickedCard={lastPickedCard}
            onPickUp={handlePickupCard}
            fromTargets={tookFrom ?? [{x: 0, y: -1 * CARD_HEIGHT, deg: 0}]}
            round={round}
            disabled={disabled}
            wasPlayer={pickup.wasPlayer}
          />
        )}
      </View>
      <CardsSpread
        activeDirections={activeDirections}
        onPlayerCardsCalculated={$onPlayerCardsCalculated}
        key={round}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gameArea: {
    position: 'absolute',
  },
  deck: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    alignItems: 'center',
    top: screenHeight / 2 - 2 * CARD_HEIGHT,
    left: screenWidth / 2 - CARD_WIDTH * 0.5,
  },
  pickup: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    top: screenHeight / 2 - 1.5 * CARD_HEIGHT,
    left: screenWidth / 2 - CARD_WIDTH * 0.5,
  },
});

export default GameBoard;
