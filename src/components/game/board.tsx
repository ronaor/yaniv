import React, {useCallback} from 'react';
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
import {Position} from '~/types/cards';
import {useYanivGameStore} from '~/store/yanivGameStore';
import {isCanPickupCard, isValidCardSet} from '~/utils/gameRules';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const CardBackRotated = ({
  rotation,
  opacity,
}: {
  rotation: number;
  opacity: number;
}) => {
  const rotationStyle: ViewStyle = {
    position: 'absolute',
    transform: [{rotate: `${rotation}deg`}],
    opacity,
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
  };
  disabled?: boolean;
  round: number;
  selectedCards: Card[];
}

function GameBoard({
  pickup,
  selectedCards,
  round,
  disabled = false,
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

  return (
    <View style={styles.gameArea}>
      <TouchableOpacity
        style={styles.deck}
        onPress={handleDrawFromDeck}
        disabled={disabled || selectedCards.length === 0}>
        <>
          <CardBackRotated rotation={10} opacity={0.5} />
          <CardBackRotated rotation={5} opacity={0.5} />
          <CardBackRotated rotation={0} opacity={0.5} />
          <CardBackRotated rotation={-5} opacity={1} />
        </>
      </TouchableOpacity>
      <View style={styles.pickup}>
        <DeckCardPointers
          cards={pickupPile}
          pickedCard={lastPickedCard}
          onPickUp={handlePickupCard}
          fromTargets={tookFrom ?? []}
          round={round}
          disabled={disabled}
        />
      </View>
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
