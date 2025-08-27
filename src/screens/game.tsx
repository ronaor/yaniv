import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Dimensions, StatusBar, StyleSheet, View} from 'react-native';
import {isUndefined} from 'lodash';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colors} from '~/theme';

import {useRoomStore} from '~/store/roomStore';
import {useUser} from '~/store/userStore';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';

import {getHandValue, isCanPickupCard, isValidCardSet} from '~/utils/gameRules';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  directions,
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
import {DirectionName} from '~/types/cards';

import EndGameDialog, {
  EndGameDialogRef,
} from '~/components/dialogs/endGameDialog';
import RandomBackground from '~/backgrounds/randomBGPicker';
import BallsOverlay, {BallsOverlayRef} from '~/components/effects/ballsOverlay';
import {ThrowBallEvent} from '~/components/effects/ballEvent';
import UserLostDialog, {
  UserLostDialogRef,
} from '~/components/dialogs/userLostDialog';

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
    gameResults,
    humanLost,
  } = useYanivGameStore();

  const {user} = useUser();
  const cardsListRef = useRef<CardListRef>(null);
  const endGameDialogRef = useRef<EndGameDialogRef>(null);
  const userLostDialogRef = useRef<UserLostDialogRef>(null);
  const ballEventsRef = useRef<BallsOverlayRef>(null);

  const {currentPlayer, playerHand, myTurn, slapDownAvailable} = useMemo(() => {
    const $currentPlayer = gamePlayers.all[gamePlayers.current];
    return {
      currentPlayer: $currentPlayer,
      playerHand: $currentPlayer?.hand || [],
      myTurn: game.currentTurn?.playerId === gamePlayers.current || false,
      slapDownAvailable: $currentPlayer?.slapDownAvailable || false,
    };
  }, [game.currentTurn, gamePlayers]);

  const handValue = useMemo(() => getHandValue(playerHand), [playerHand]);

  useEffect(() => {
    return clearGame;
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

  useEffect(() => {
    if (!myTurn) {
      cardsListRef.current?.clearSelection();
    }
  }, [myTurn, cardsListRef]);

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
    [emit, board.pickupPile.length, cardsListRef],
  );

  const handlePlayAgain = useCallback(() => emit.playAgain(), [emit]);

  const handleLeave = useCallback(() => {
    if (players.length > 1 && !humanLost) {
      Alert.alert('Leave Room', 'Are you sure you want to leave?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom(user);
            navigation.reset({index: 0, routes: [{name: 'Home'}]});
          },
        },
      ]);
    } else {
      leaveRoom(user);
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    }
  }, [players.length, leaveRoom, user, navigation, humanLost]);

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
  const [playersKilling, setPlayersKilling] = useState<
    Record<PlayerId, boolean>
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
    const activePlayers = gamePlayers.order.filter(
      pId => game.playersStats[pId].playerStatus === 'active',
    );

    let activeIndex = 0;
    return gamePlayers.order.map(pId =>
      game.playersStats[pId].playerStatus === 'active'
        ? {
            delay: activeIndex++ * SMALL_DELAY,
            gap: activePlayers.length * SMALL_DELAY,
          }
        : undefined,
    );
  }, [game.playersStats, gamePlayers.order]);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const createBallThrowEvents = useCallback(
    (remaining: PlayerId[], losers: PlayerId[]): ThrowBallEvent[] => {
      return remaining.map((shooter, index) => ({
        from: directions[gamePlayers.order.indexOf(shooter)],
        to: directions[
          gamePlayers.order.indexOf(losers[index % losers.length])
        ],
      }));
    },
    [gamePlayers.order],
  );

  // useEffect(() => {
  //   setTimeout(() => {
  //     ballEventsRef.current?.throwBalls(
  //       createBallThrowEvents([gamePlayers.order[2]], [gamePlayers.order[0]]),
  //     );
  //     setTimeout(() => setPlayersKilling(d), 500);
  //   }, 1000);
  //   const key = gamePlayers.order[0];
  //   const d: Record<string, boolean> = {};
  //   d[key] = true;
  // }, [createBallThrowEvents, gamePlayers.order]);

  useEffect(() => {
    if (humanLost) {
      userLostDialogRef.current?.open();
    }
  }, [humanLost]);

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
        if (roundResults.losers.length > 0) {
          const remainingPlayers = gamePlayers.order.filter(
            p =>
              roundResults.roundPlayers.includes(p) &&
              !roundResults.losers.includes(p),
          );
          const losers = roundResults.losers;

          // Shuffle losers for randomness
          for (let i = losers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [losers[i], losers[j]] = [losers[j], losers[i]];
          }

          setTimeout(() => {
            ballEventsRef.current?.throwBalls(
              createBallThrowEvents(remainingPlayers, losers),
            );
            setTimeout(() => {
              setPlayersKilling(prev => ({
                ...prev,
                ...losers.reduce<Record<string, boolean>>((res, loser) => {
                  res[loser] = true;
                  return res;
                }, {}),
              }));
            }, 900);
          }, LOOK_MOMENT);
        }

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
  }, [roundResults, game.phase, gamePlayers.order, createBallThrowEvents]);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <RandomBackground />

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
          <View style={styles.avatarHolder} />
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
          disabled={!!roundResults}
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
          <UserAvatar
            name={game.playersStats[playerId].playerName}
            avatarIndex={game.playersStats[playerId].avatarIndex}
            score={gamePlayers.all[playerId]?.stats?.score ?? 0}
            roundScore={playersResultedScores[playerId]}
            isActive={game.currentTurn?.playerId === playerId}
            timePerPlayer={game.rules.timePerPlayer}
            status={game.playersStats[playerId].playerStatus}
            kill={playersKilling[playerId]}
            direction={directions[i + 1]}
          />
        </View>
      ))}

      <PlayerHand
        hidden={roundReadyFor !== game.round}
        handValue={
          playersResultedScores[gamePlayers.current] ? undefined : handValue
        }
      />

      <UserAvatar
        name={user.nickName}
        avatarIndex={user.avatarIndex}
        score={currentPlayer?.stats?.score ?? 0}
        roundScore={playersResultedScores[gamePlayers.current]}
        isActive={myTurn}
        timePerPlayer={game.rules.timePerPlayer}
        isUser
        status={game.playersStats[user.id]?.playerStatus ?? 'active'}
        kill={playersKilling[user.id]}
        direction={directions[0]}
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
  avatarHolder: {aspectRatio: 1, width: 80},
});

export default GameScreen;
