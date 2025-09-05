import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, StatusBar, StyleSheet, View} from 'react-native';
import {isUndefined} from 'lodash';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useShallow} from 'zustand/react/shallow';
import {colors} from '~/theme';

import {useRoomStore} from '~/store/roomStore';
import {useUser} from '~/store/userStore';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';

import {getHandValue, isCanPickupCard, isValidCardSet} from '~/utils/gameRules';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  directions,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SMALL_DELAY,
} from '~/utils/constants';

import AssafBubble from '~/components/bubbles/assaf';
import YanivBubble from '~/components/bubbles/yaniv';
import CardPointsList, {CardListRef} from '~/components/cards/cardsPoint';
import HiddenCardPointsList from '~/components/cards/hiddenCards';

import GameBoard from '~/components/game/board';
import LightAround from '~/components/user/lightAround';
import UserAvatar from '~/components/user/userAvatar';
import YanivButton from '~/components/yanivButton';
import GameTimer from '~/components/game/timer';
import SimpleButton from '~/components/menu/simpleButton';
import LoadingOverlay from '~/components/game/loadingOverlay';
import PlayerHand from '~/components/user/playerHand';
import {Card, DirectionName} from '~/types/cards';

import EndGameDialog, {
  EndGameDialogRef,
} from '~/components/dialogs/endGameDialog';
import RandomBackground from '~/backgrounds/randomBGPicker';
import BallsOverlay, {BallsOverlayRef} from '~/components/effects/ballsOverlay';
import UserLostDialog, {
  UserLostDialogRef,
} from '~/components/dialogs/userLostDialog';
import {ballThrownEvent} from '~/utils/logic';
import EmojisButton from '~/components/game/emojisButton';
import {useSongPlayer} from '~/store/songPlayerStore';
import useSound from '~/hooks/useSound';
import {ERROR_SOUND} from '~/sounds';
import SafeAreaTopBar from '~/components/safeAreaTopBar';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

function GameScreen({navigation}: any) {
  const {players, leaveRoom} = useRoomStore(
    useShallow(s => ({players: s.players, leaveRoom: s.leaveRoom})),
  );

  const [
    game,
    gamePlayers,
    board,
    roundResults,
    error,
    clearGame,
    clearError,
    resetSlapDown,
    emit,
    gameId,
    gameResults,
    humanLost,
    emojiTriggers,
    prevRoundPositions,
  ] = useYanivGameStore(
    useShallow(s => [
      s.game,
      s.players,
      s.board,
      s.roundResults,
      s.error,
      s.clearGame,
      s.clearError,
      s.resetSlapDown,
      s.emit,
      s.gameId,
      s.gameResults,
      s.humanLost,
      s.emojiTriggers,
      s.board.prevRoundPositions,
    ]),
  );

  const {user} = useUser();
  const cardsListRef = useRef<CardListRef>(null);
  const endGameDialogRef = useRef<EndGameDialogRef>(null);
  const userLostDialogRef = useRef<UserLostDialogRef>(null);
  const ballEventsRef = useRef<BallsOverlayRef>(null);

  const {duckVolume, restoreVolume} = useSongPlayer();

  const handValue = useMemo(
    () => getHandValue(gamePlayers.all[user.id]?.hand ?? []),
    [gamePlayers.all, user.id],
  );

  useEffect(() => {
    duckVolume();
    return () => {
      clearGame();
      restoreVolume();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameResults) {
      endGameDialogRef.current?.open({
        places: gameResults.places,
        playersStats: game.playersStats,
      });
      setRoundReadyFor(-1);
    } else {
      endGameDialogRef.current?.close();
    }
  }, [gameResults, game.playersStats]);

  const isMyTurn = game.currentTurn?.playerId === user.id;
  useEffect(() => {
    if (!isMyTurn) {
      cardsListRef.current?.clearSelection();
    }
  }, [isMyTurn]);

  const handleDrawFromDeck = useCallback(() => {
    const selectedCards = cardsListRef.current?.selectedCards;
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
      const selectedCards = cardsListRef.current?.selectedCards;
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
    [emit, board.pickupPile.length],
  );

  const handlePlayAgain = useCallback(() => emit.playAgain(), [emit]);

  const handleLeave = useCallback(() => {
    const leave = () => {
      leaveRoom(user);
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    };
    if (humanLost || players.length < 2) {
      leave();
    } else {
      Alert.alert('Leave Room', 'Are you sure you want to leave?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: leave,
        },
      ]);
    }
  }, [humanLost, leaveRoom, navigation, players, user]);

  const {playSound: playError} = useSound(ERROR_SOUND);
  // Handle game errors
  useEffect(() => {
    if (error) {
      playError();
      Alert.alert('שגיאת משחק', error, [{text: 'סגור', onPress: clearError}]);
    }
  }, [error, clearError, playError]);

  const [playersRevealing, setPlayersRevealing] = useState<
    Record<PlayerId, boolean>
  >({});
  const [playersResultedScores, setPlayersResultedScores] = useState<
    Record<PlayerId, number[]>
  >({});
  const [playersKilling, setPlayersKilling] = useState<
    Record<PlayerId, boolean>
  >({});

  const {activePlayers, cardsDelay} = useMemo(() => {
    const $activePlayers = gamePlayers.order.filter(
      pId => game.playersStats[pId].playerStatus === 'active',
    );
    let activeIndex = 0;
    const $cardsDelay = gamePlayers.order.map(pId =>
      game.playersStats[pId].playerStatus === 'active'
        ? {
            delay: activeIndex++ * SMALL_DELAY,
            gap: $activePlayers.length * SMALL_DELAY,
          }
        : undefined,
    );
    return {
      activePlayers: $activePlayers,
      cardsDelay: $cardsDelay,
    };
  }, [game.playersStats, gamePlayers.order]);

  const [yanivCall, setYanivCall] = useState<DirectionName | undefined>();
  const [assafCall, setAssafCall] = useState<DirectionName | undefined>();
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [roundReadyFor, setRoundReadyFor] = useState<number>(-1);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (humanLost) {
      userLostDialogRef.current?.open();
    }
  }, [humanLost]);

  useEffect(() => {
    setPlayersKilling({});
  }, [gameId]);

  useEffect(() => {
    if (!roundResults || game.phase !== 'round-end') {
      setPlayersRevealing({});
      setPlayersResultedScores({});
      setYanivCall(undefined);
      setAssafCall(undefined);
      return;
    }

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
        if (roundResults.losers.length > 0) {
          const remainingPlayers = gamePlayers.order.filter(
            p =>
              roundResults.roundPlayers.includes(p) &&
              !roundResults.losers.includes(p),
          );
          const losers = [...roundResults.losers];

          // Shuffle losers for randomness
          for (let i = losers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [losers[i], losers[j]] = [losers[j], losers[i]];
          }

          const timeoutId = setTimeout(() => {
            const throwBallEvents = ballThrownEvent(
              remainingPlayers,
              losers,
            ).map(({shooter, target}) => ({
              from: directions[gamePlayers.order.indexOf(shooter)],
              to: directions[gamePlayers.order.indexOf(target)],
            }));
            ballEventsRef.current?.throwBalls(throwBallEvents);
            const innerTimeoutId = setTimeout(() => {
              setPlayersKilling(prev => ({
                ...prev,
                ...losers.reduce<Record<string, boolean>>((res, loser) => {
                  res[loser] = true;
                  return res;
                }, {}),
              }));
            }, 900);
            timeoutsRef.current.push(innerTimeoutId);
          }, LOOK_MOMENT);
          timeoutsRef.current.push(timeoutId);
        }
      } else {
        const timeoutId = setTimeout(() => {
          const extraDelay = executeReveal(index);
          scheduleReveal(index + 1, LOOK_MOMENT + extraDelay);
        }, accumulatedDelay);

        timeoutsRef.current.push(timeoutId);
      }
    };

    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.length = 0;

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
  }, [activePlayers, game.phase, gamePlayers.order, roundResults]);

  const lastPickedCard = game.currentTurn?.prevTurn?.draw?.card;
  const pickupEvent = useMemo(
    () => ({
      pickupPile: board.pickupPile,
      lastPickedCard,
      tookFrom: game.currentTurn?.prevTurn?.discard.cardsPositions,
      wasPlayer: game.currentTurn?.prevTurn?.playerId === gamePlayers.current,
      layerHistory: board.layerHistory,
    }),
    [
      board.layerHistory,
      board.pickupPile,
      game.currentTurn?.prevTurn?.discard.cardsPositions,
      game.currentTurn?.prevTurn?.playerId,
      gamePlayers,
      lastPickedCard,
    ],
  );
  const slapCardIndex = useMemo(() => {
    const currentUserStats = gamePlayers.all[gamePlayers.current];
    return currentUserStats?.slapDownAvailable && lastPickedCard
      ? currentUserStats.hand.findIndex(
          card =>
            lastPickedCard?.suit === card.suit &&
            lastPickedCard?.value === card.value,
        )
      : -1;
  }, [gamePlayers, lastPickedCard]);

  useEffect(() => {
    if (slapCardIndex < 0) {
      return;
    }
    const timer = setTimeout(resetSlapDown, 3000);
    return () => clearTimeout(timer);
  }, [resetSlapDown, slapCardIndex]);

  const onSlapCard = useCallback(
    (card: Card) => {
      emit.slapDown(card);
    },
    [emit],
  );

  const setReady = useCallback(() => setMapLoaded(true), []);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <RandomBackground setReady={setReady} />

      <SafeAreaView style={styles.surface}>
        <View style={styles.body} pointerEvents={'box-none'}>
          {/* Header */}
          <View style={styles.header}>
            <SimpleButton
              text={'Leave'}
              onPress={handleLeave}
              colors={['#E64E08', '#db300eff', '#D02A07']}
              size="small"
            />
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

        {roundReadyFor !== game.round && <LoadingOverlay />}

        {/* Game Area */}
        <GameBoard
          pickup={pickupEvent}
          round={game.round}
          gameId={gameId}
          disabled={!isMyTurn}
          onReady={setRoundReadyFor}
          handlePickupCard={handlePickupCard}
          handleDrawFromDeck={handleDrawFromDeck}
          prevRoundPositions={prevRoundPositions}
          numActivePlayers={activePlayers.length}
        />
        <View style={styles.actionButtons}>
          <View style={styles.avatarHolder} />
          <YanivButton
            onPress={emit.callYaniv}
            disabled={handValue > game.rules.canCallYaniv || !isMyTurn}
          />
        </View>
        <CardPointsList
          ref={cardsListRef}
          key={`${user.id}-${game.round}`}
          isReady={roundReadyFor === game.round}
          cards={gamePlayers.all[user.id]?.hand ?? []}
          slapCardIndex={slapCardIndex}
          onCardSlapped={onSlapCard}
          // fromPosition + action group
          fromPosition={
            user.id === game.currentTurn?.prevTurn?.playerId
              ? game.currentTurn?.prevTurn?.draw?.cardPosition
              : undefined
          }
          action={
            user.id === game.currentTurn?.prevTurn?.playerId
              ? game.currentTurn?.prevTurn?.action
              : undefined
          }
          direction={'down'}
          cardsDelay={cardsDelay[0]}
          disabled={!!roundResults}
        />
      </SafeAreaView>
      {gamePlayers.order.slice(1).map((playerId, i) => (
        <View key={playerId} style={styles.absolute}>
          <HiddenCardPointsList
            key={`${playerId}-${game.round}`}
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
          <UserAvatar
            name={game.playersStats[playerId].playerName}
            avatarIndex={game.playersStats[playerId].avatarIndex}
            score={gamePlayers.all[playerId]?.stats?.score ?? 0}
            roundScore={playersResultedScores[playerId]}
            isActive={game.currentTurn?.playerId === playerId}
            timePerPlayer={game.rules.timePerPlayer}
            status={game.playersStats[playerId].playerStatus}
            kill={
              playersKilling[playerId] ||
              game.playersStats[playerId]?.playerStatus === 'lost'
            }
            direction={directions[i + 1]}
            emoji={emojiTriggers[playerId]}
          />
        </View>
      ))}

      <PlayerHand
        hidden={roundReadyFor !== game.round}
        handValue={playersResultedScores[user.id] ? undefined : handValue}
      />

      <UserAvatar
        name={user.nickName}
        avatarIndex={user.avatarIndex}
        score={gamePlayers.all[user.id]?.stats?.score ?? 0}
        roundScore={playersResultedScores[user.id]}
        isActive={isMyTurn}
        timePerPlayer={game.rules.timePerPlayer}
        isUser
        status={game.playersStats[user.id]?.playerStatus ?? 'active'}
        kill={
          playersKilling[user.id] ||
          game.playersStats[user.id]?.playerStatus === 'lost'
        }
        direction={directions[0]}
        emoji={emojiTriggers[user.id]}
      />

      {/* Yaniv/Assaf Overlay */}
      <YanivBubble direction={yanivCall} />
      <AssafBubble direction={assafCall} />

      <BallsOverlay round={game.round} ref={ballEventsRef} />
      <EndGameDialog
        ref={endGameDialogRef}
        handlePlayAgain={handlePlayAgain}
        handleLeave={handleLeave}
      />
      <UserLostDialog
        ref={userLostDialogRef}
        handleContinue={() => userLostDialogRef.current?.close()}
        handleLeave={handleLeave}
      />
      <View style={styles.emojis}>
        <EmojisButton onEmojiSelect={emit.shareEmoji} />
      </View>
      <SafeAreaTopBar color={'#000000ff'} />
      {!mapLoaded && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.background}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  surface: {flex: 1},
  body: {
    flex: 1,
    padding: 12,
    zIndex: 99,
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
    top: SCREEN_HEIGHT / 2 - 2 * CARD_HEIGHT,
    left: SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5,
  },
  pickup: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    top: SCREEN_HEIGHT / 2 - 1.5 * CARD_HEIGHT,
    left: SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5,
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
  absolute: {position: 'absolute', width: SCREEN_WIDTH},
  avatarHolder: {aspectRatio: 1, width: 80},
  emojis: {
    position: 'absolute',
    bottom: 175,
    right: 15,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffffb0',
    zIndex: 200,
  },
});

export default GameScreen;
