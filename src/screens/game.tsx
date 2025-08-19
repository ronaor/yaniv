import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {useRoomStore} from '~/store/roomStore';
import {useUser} from '~/store/userStore';
import {colors} from '~/theme';

import {SafeAreaView} from 'react-native-safe-area-context';
import {getHandValue, isCanPickupCard, isValidCardSet} from '~/utils/gameRules';

import {isNil, isUndefined} from 'lodash';
import AssafBubble from '~/components/bubbles/assaf';
import YanivBubble from '~/components/bubbles/yaniv';
import CardPointsList, {CardListRef} from '~/components/cards/cardsPoint';
import HiddenCardPointsList from '~/components/cards/hiddenCards';
import {OutlinedText} from '~/components/cartoonText';
import EndGameDialog, {
  closeEndGameDialog,
  openEndGameDialog,
} from '~/components/dialogs/endGameDialog';
import GameBoard from '~/components/game/board';
import LightAround from '~/components/user/lightAround';
import UserAvatar from '~/components/user/userAvatar';
import YanivButton from '~/components/yanivButton';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {DirectionName} from '~/types/cards';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  directions,
  SMALL_DELAY,
} from '~/utils/constants';
import WaveAnimationBackground from './waveScreen';
import GameTimer from '~/components/game/timer';
import LoadingOverlay from '~/components/game/loadingOverlay';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

function GameScreen({navigation}: any) {
  const {players, leaveRoom} = useRoomStore();

  const {
    game,
    players: gamePlayers,
    board,
    roundResults,
    error,
    clearGame,
    clearError,
    resetSlapDown,
    emit,
    gameId,
  } = useYanivGameStore();

  const {name: nickName} = useUser();
  const cardsListRef = useRef<CardListRef>(null);

  const {currentPlayer, playerHand, myTurn, slapDownAvailable} = useMemo(() => {
    const $currentPlayer = gamePlayers.all[gamePlayers.current];
    return {
      currentPlayer: $currentPlayer,
      playerHand: $currentPlayer?.hand || [],
      myTurn: game.currentTurn?.playerId === gamePlayers.current || false,
      slapDownAvailable: $currentPlayer?.slapDownAvailable || false,
    };
  }, [game.currentTurn, gamePlayers]);

  const playersName = useMemo(() => {
    return players.reduce<Record<PlayerId, string>>((res, user) => {
      res[user.id] = user.nickName;
      return res;
    }, {});
  }, [players]);

  const handValue = useMemo(() => getHandValue(playerHand), [playerHand]);

  useEffect(() => {
    return clearGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    switch (game.phase) {
      case 'active': {
        closeEndGameDialog();
        break;
      }
      case 'game-end': {
        openEndGameDialog(
          'finish',
          gamePlayers.current,
          gamePlayers.order,
          game.playersStats ?? {},
        );
        setRoundReadyFor(-1);
        break;
      }
    }
  }, [game.phase, game.playersStats, gamePlayers]);

  useEffect(() => {
    if (!myTurn) {
      cardsListRef.current?.clearSelection();
    }
  }, [myTurn, cardsListRef]);

  const handleDrawFromDeck = useCallback(() => {
    const selectedCards = cardsListRef.current?.getSelectedCards();
    if (
      isUndefined(selectedCards) ||
      selectedCards.length === 0 ||
      !isValidCardSet(selectedCards, true)
    ) {
      return;
    }
    emit.completeTurn({choice: 'deck'}, selectedCards);
  }, [emit, cardsListRef]);

  const handlePickupCard = useCallback(
    (pickupIndex: number) => {
      const selectedCards = cardsListRef.current?.getSelectedCards();
      if (
        isUndefined(selectedCards) ||
        selectedCards.length === 0 ||
        !isCanPickupCard(board.pickupPile.length, pickupIndex) ||
        !isValidCardSet(selectedCards, true)
      ) {
        return;
      }

      emit.completeTurn({choice: 'pickup', pickupIndex}, selectedCards);
    },
    [emit, board.pickupPile.length, cardsListRef],
  );

  // Handle leave game
  const handleLeave = useCallback(() => {
    Alert.alert('יציאה מהמשחק', 'האם אתה בטוח שברצונך לעזוב?', [
      {text: 'ביטול', style: 'cancel'},
      {
        text: 'צא',
        style: 'destructive',
        onPress: () => {
          leaveRoom(nickName);
          navigation.reset({index: 0, routes: [{name: 'Home'}]});
        },
      },
    ]);
  }, [navigation, leaveRoom, nickName]);

  // Handle game errors
  useEffect(() => {
    if (error) {
      Alert.alert('שגיאת משחק', error, [{text: 'סגור', onPress: clearError}]);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!slapDownAvailable) {
      return;
    }
    const timer = setTimeout(resetSlapDown, 3000);
    return () => clearTimeout(timer);
  }, [resetSlapDown, slapDownAvailable]);

  const lastPickedCard = game.currentTurn?.prevTurn?.draw?.card;
  const slapCardIndex = useMemo(
    () =>
      slapDownAvailable && lastPickedCard
        ? playerHand.findIndex(
            card =>
              lastPickedCard?.suit === card.suit &&
              lastPickedCard?.value === card.value,
          )
        : -1,
    [lastPickedCard, playerHand, slapDownAvailable],
  );

  const [loadingOverlay, setLoadingOverlay] = useState<boolean>(true);

  const onSlapCard = useCallback(() => {
    const cardToSlap = playerHand[slapCardIndex];
    if (cardToSlap) {
      emit.slapDown(cardToSlap);
    }
  }, [playerHand, slapCardIndex, emit]);

  const [playersRevealing, setPlayersRevealing] = useState<
    Record<PlayerId, boolean>
  >({});
  const [playersResultedScores, setPlayersResultedScores] = useState<
    Record<PlayerId, number[]>
  >({});

  const activeDirections = useMemo(() => {
    return gamePlayers.order.reduce<Record<PlayerId, DirectionName>>(
      (res, playerId, i) => {
        if (game.playersStats[playerId].playerStatus === 'active') {
          res[playerId] = directions[i];
        }
        return res;
      },
      {},
    );
  }, [game.playersStats, gamePlayers.order]);

  const [yanivCall, setYanivCall] = useState<DirectionName | undefined>();
  const [assafCall, setAssafCall] = useState<DirectionName | undefined>();
  const [roundReadyFor, setRoundReadyFor] = useState<number>(-1);

  const cardsDelay = useMemo(() => {
    const playersActive = gamePlayers.order.filter(
      pId => game.playersStats[pId].playerStatus === 'active',
    );
    return playersActive.map((_, i) => ({
      delay: i * SMALL_DELAY,
      gap: playersActive.length * SMALL_DELAY,
    }));
  }, [game.playersStats, gamePlayers.order]);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!roundResults || game.phase !== 'round-end') {
      setPlayersRevealing({});
      setPlayersResultedScores({});
      setYanivCall(undefined);
      setAssafCall(undefined);
      return;
    }

    const activePlayers = gamePlayers.order.filter(playerId =>
      roundResults.roundPlayers.includes(playerId),
    );
    const startIndex = activePlayers.indexOf(roundResults.yanivCaller);

    const LOOK_MOMENT = 2000;

    const executeReveal = (i: number) => {
      const activeIndex = (startIndex + i) % activePlayers.length;
      const playerId = activePlayers[activeIndex];

      if (roundResults.yanivCaller === playerId) {
        setYanivCall(directions[gamePlayers.order.indexOf(playerId)]);
      }
      if (roundResults.assafCaller === playerId) {
        setAssafCall(directions[gamePlayers.order.indexOf(playerId)]);
      }

      setPlayersRevealing(prev => ({...prev, [playerId]: true}));
      let extraDelay = 0;

      setPlayersResultedScores(prev => {
        if (roundResults.yanivCaller === playerId) {
          return prev;
        }
        if (roundResults.assafCaller === playerId) {
          extraDelay +=
            roundResults.playersRoundScore[roundResults.yanivCaller].length - 1;
          prev[roundResults.yanivCaller] = [
            ...roundResults.playersRoundScore[roundResults.yanivCaller],
          ];
        }
        extraDelay += roundResults.playersRoundScore[playerId].length - 1;
        prev[playerId] = [...roundResults.playersRoundScore[playerId]];

        return {...prev};
      });
      return extraDelay * LOOK_MOMENT;
    };

    const scheduleReveal = (index: number, accumulatedDelay: number) => {
      if (index >= activePlayers.length) {
        return;
      }

      const timeoutId = setTimeout(() => {
        const extraDelay = executeReveal(index);
        scheduleReveal(index + 1, LOOK_MOMENT + extraDelay);
      }, accumulatedDelay);

      timeoutsRef.current.push(timeoutId);
    };

    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Start sequence
    executeReveal(0);
    if (activePlayers.length > 1) {
      scheduleReveal(1, LOOK_MOMENT);
    }

    // Cleanup
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [roundResults, game.phase, gamePlayers.order]);

  const onGameReady = useCallback(() => setLoadingOverlay(false), []);
  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <WaveAnimationBackground setReady={onGameReady} />

      <SafeAreaView style={styles.surface}>
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
            </TouchableOpacity>
            <GameTimer />
          </View>
        </View>

        {gamePlayers.order.map((playerId, i) => (
          <LightAround
            key={`light-${playerId}`}
            direction={directions[i]}
            isActive={game.currentTurn?.playerId === playerId}
          />
        ))}

        {/* Game Area */}
        <GameBoard
          pickup={{
            pickupPile: board.pickupPile,
            lastPickedCard,
            tookFrom: game.currentTurn?.prevTurn?.discard.cardsPositions,
            wasPlayer:
              game.currentTurn?.prevTurn?.playerId === gamePlayers.current,
          }}
          round={game.round}
          gameId={gameId}
          disabled={!myTurn}
          activeDirections={activeDirections}
          onReady={setRoundReadyFor}
          handlePickupCard={handlePickupCard}
          handleDrawFromDeck={handleDrawFromDeck}
        />
        <View style={styles.actionButtons}>
          <View style={{aspectRatio: 1, width: 80}} />
          {currentPlayer?.stats?.playerStatus === 'active' &&
          !isNil(game.currentTurn) ? (
            <OutlinedText
              text={`${handValue}  Points`}
              fontSize={20}
              width={125}
              height={100}
              fillColor={'#FFD61B'}
              strokeColor={'#6A3900'}
              strokeWidth={5}
              fontWeight={'900'}
            />
          ) : null}
          <YanivButton
            onPress={emit.callYaniv}
            disabled={handValue > game.rules.canCallYaniv || !myTurn}
          />
        </View>
        <CardPointsList
          ref={cardsListRef}
          key={gamePlayers.current}
          cards={playerHand}
          slapCardIndex={slapCardIndex}
          onCardSlapped={onSlapCard}
          fromPosition={
            gamePlayers.current === game.currentTurn?.prevTurn?.playerId
              ? game.currentTurn?.prevTurn?.draw?.cardPosition
              : undefined
          }
          action={game.currentTurn?.prevTurn?.action}
          direction={directions[0]}
          isReady={roundReadyFor === game.round}
          cardsDelay={cardsDelay[0]}
        />
      </SafeAreaView>
      {gamePlayers.order.slice(1).map((playerId, i) => (
        <View key={playerId} style={styles.absolute}>
          <HiddenCardPointsList
            cards={gamePlayers.all[playerId]?.hand ?? []}
            direction={directions[i + 1]}
            fromPosition={
              playerId === game.currentTurn?.prevTurn?.playerId
                ? game.currentTurn?.prevTurn?.draw?.cardPosition
                : undefined
            }
            action={
              playerId === game.currentTurn?.prevTurn?.playerId
                ? game.currentTurn?.prevTurn?.action
                : undefined
            }
            reveal={!!playersRevealing[playerId]}
            isReady={roundReadyFor === game.round}
            cardsDelay={cardsDelay[i + 1]}
          />
          <View style={recordStyle[directions[i + 1]]}>
            {/* we got reveal to trigger update score */}
            {/* score is now listened immidiatly from the store */}
            <UserAvatar
              name={playersName[playerId]}
              score={gamePlayers.all[playerId]?.stats?.score ?? 0}
              roundScore={playersResultedScores[playerId]}
              isActive={game.currentTurn?.playerId === playerId}
              timePerPlayer={game.rules.timePerPlayer}
            />
          </View>
        </View>
      ))}
      {gamePlayers.current && (
        <View style={recordStyle[directions[0]]}>
          {/* we got reveal to trigger update score */}
          {/* score is now listened immidiatly from the store */}
          <UserAvatar
            name={playersName[gamePlayers.current]}
            score={currentPlayer?.stats?.score ?? 0}
            roundScore={playersResultedScores[gamePlayers.current]}
            isActive={myTurn}
            timePerPlayer={game.rules.timePerPlayer}
          />
        </View>
      )}

      {/* Yaniv/Asaf Overlay */}
      <YanivBubble direction={yanivCall} />
      <AssafBubble direction={assafCall} />

      <EndGameDialog />
      {loadingOverlay && <LoadingOverlay />}
    </>
  );
}

const styles = StyleSheet.create({
  surface: {flex: 1},
  body: {
    flex: 1,
    padding: 12,
  },
  header: {
    gap: 8,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  leaveBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  leaveBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameArea: {
    position: 'absolute',
  },
  centerArea: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: CARD_WIDTH / 2,
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
  handTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#612602',
    textAlign: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    width: 60,
    height: 80,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 100,
    paddingHorizontal: 8,
  },
  overlay: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  yanivText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 10,
  },
  absolute: {position: 'absolute', width: screenWidth},
});

const recordStyle: Record<DirectionName, ViewStyle> = {
  down: {position: 'absolute', bottom: 98, left: 10, zIndex: 100},
  up: {position: 'absolute', top: 80, left: 30, zIndex: 100},
  left: {
    position: 'absolute',
    left: 10,
    top: screenHeight / 2 - 160,
    zIndex: 100,
  },
  right: {
    position: 'absolute',
    right: 10,
    top: screenHeight / 2 - 160,
    zIndex: 100,
  },
};

export default GameScreen;
