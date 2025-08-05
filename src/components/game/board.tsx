import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Dimensions, StyleSheet, TouchableOpacity, View} from 'react-native';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import CardBack from '~/components/cards/cardBack';
import {CARD_HEIGHT, CARD_WIDTH} from '~/utils/constants';
import {Card} from 'server/cards';
import {DirectionName, Position} from '~/types/cards';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {isCanPickupCard, isValidCardSet} from '~/utils/gameRules';
import CardsSpread from './cardsSpread';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const CardBackRotated = ({position}: {position: Position}) => {
  const rotation = useSharedValue<number>(0);
  const rotationStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      {translateX: position.x},
      {translateY: position.y},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  useEffect(() => {
    rotation.value = withTiming(position.deg, {duration: 300});
  }, [position.deg, rotation]);

  return (
    <Animated.View style={rotationStyle}>
      <CardBack />
    </Animated.View>
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
  gameId: string;
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
  gameId,
}: GameBoardProps) {
  const {pickupPile, lastPickedCard, tookFrom} = pickup;

  const [lastGameId, setLastGameId] = useState<string>(gameId);

  const {emit, players} = useYanivGameStore();

  const newHands = useRef<Record<PlayerId, Card[]>>({});
  const [lastHands, setLastHands] = useState<Record<PlayerId, Card[]>>({});

  useEffect(() => {
    setLastHands(newHands.current);
    newHands.current = Object.entries(players.all).reduce<
      Record<PlayerId, Card[]>
    >((res, [playerId, pConfig]) => {
      res[playerId] = pConfig.hand;
      return res;
    }, {});
  }, [players.all]);

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

  const [pickupReady, setPickupReady] = useState<boolean>(false);
  const [deckReady, setDeckReady] = useState<boolean>(false);

  useEffect(() => {
    setPickupReady(false);
    setDeckReady(false);
    setLastGameId(gameId);
  }, [round, gameId]);

  const $onPlayerCardsCalculated = useCallback(
    (playerCards: Record<string, Position[]>) => {
      onPlayerCardsCalculated?.(playerCards);
      setPickupReady(true);
    },
    [onPlayerCardsCalculated],
  );

  const $onFinish = useCallback(() => {
    setDeckReady(true);
  }, []);

  return (
    <View style={styles.gameArea}>
      <TouchableOpacity
        style={styles.deck}
        onPress={handleDrawFromDeck}
        disabled={disabled || selectedCards.length === 0 || !deckReady}>
        {deckReady && (
          <>
            <CardBackRotated position={{x: 0, y: 0, deg: 10}} />
            <CardBackRotated position={{x: 0, y: 0, deg: 5}} />
            <CardBackRotated position={{x: 0, y: 0, deg: 0}} />
            <CardBackRotated position={{x: 0, y: 0, deg: -5}} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.pickup}>
        {pickupReady && (
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
        key={`${gameId}-${round}`}
        onFinish={$onFinish}
        shouldGroupCards={lastGameId === gameId}
        lastHands={lastHands}
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
