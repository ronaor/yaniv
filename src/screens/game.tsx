import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {getHandValue} from '~/utils/gameRules';

import {isNil} from 'lodash';
import CardPointsList from '~/components/cards/cardsPoint';
import HiddenCardPointsList from '~/components/cards/hiddenCards';
import {OutlinedText} from '~/components/cartoonText';
import {openEndGameDialog} from '~/components/dialogs/endGameDialog';
import GameBoard from '~/components/game/board';
import LightAround from '~/components/user/lightAround';
import UserAvatar from '~/components/user/userAvatar';
import YanivButton from '~/components/yanivButton';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {DirectionName} from '~/types/cards';
import {CARD_HEIGHT, CARD_WIDTH} from '~/utils/constants';
import WaveAnimationBackground from './waveScreen';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

function GameScreen({navigation}: any) {
  const {players, leaveRoom} = useRoomStore();
  const [selectedCardsIndexes, setSelectedCardsIndexes] = useState<number[]>(
    [],
  );

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
  } = useYanivGameStore();

  const {name: nickName} = useUser();

  const {currentPlayer, playerHand, myTurn, slapDownAvailable} = useMemo(() => {
    const $currentPlayer = gamePlayers.all[gamePlayers.current];

    return {
      currentPlayer: $currentPlayer,
      playerHand: $currentPlayer?.hand || [],
      myTurn: $currentPlayer?.isMyTurn || false,
      slapDownAvailable: $currentPlayer?.slapDownAvailable || false,
    };
  }, [gamePlayers]);

  const selectedCards = useMemo(
    () => selectedCardsIndexes.map(i => playerHand[i]),
    [playerHand, selectedCardsIndexes],
  );

  const playersName = useMemo(() => {
    return players.reduce<Record<PlayerId, string>>((res, user) => {
      res[user.id] = user.nickName;
      return res;
    }, {});
  }, [players]);

  const [timeRemaining, setTimeRemaining] = useState(0);

  const handValue = useMemo(() => getHandValue(playerHand), [playerHand]);

  useEffect(() => {
    return clearGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer for remaining time
  useEffect(() => {
    if (!myTurn || isNil(game.currentTurn)) {
      if (game.phase === 'game-end') {
        openEndGameDialog(
          'finish',
          gamePlayers.current,
          gamePlayers.order,
          game.playersStats ?? {},
        );
      }
      setSelectedCardsIndexes([]);
      return;
    }
    if (game.phase !== 'active') {
      return;
    }

    const interval = setInterval(() => {
      const startTime = game.currentTurn?.startTime;
      if (!startTime) {
        return;
      }

      const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
      const remaining = game.rules.timePerPlayer - Math.floor(elapsed);

      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    setTimeRemaining(game.rules.timePerPlayer);
    return () => clearInterval(interval);
  }, [
    myTurn,
    gamePlayers,
    game.playersStats,
    game.currentTurn,
    game.rules.timePerPlayer,
    game.phase,
  ]);

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

  const toggleCardSelection = (index: number) => {
    setSelectedCardsIndexes(prev => {
      const isSelected = prev.includes(index);
      if (isSelected) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

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

  const directions: DirectionName[] = ['up', 'right', 'down', 'left'];

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <WaveAnimationBackground />
      <SafeAreaView style={styles.surface}>
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
            </TouchableOpacity>
            {myTurn && (
              <View style={styles.timerContainer}>
                <Text style={[styles.timer]}>{timeRemaining}s</Text>
              </View>
            )}
          </View>

          {/* Yaniv/Asaf Overlay */}
          <View style={styles.overlay}>
            {roundResults?.yanivCaller && (
              <View>
                <Text style={styles.yanivText}>{'יניב!'}</Text>
              </View>
            )}
            {roundResults?.assafCaller && (
              <View>
                <Text style={styles.yanivText}>{'אסף!'}</Text>
              </View>
            )}
          </View>
        </View>
        {gamePlayers.order.map((playerId, i) => (
          <LightAround
            key={`light-${playerId}`}
            direction={directions[i]}
            isActive={game.currentTurn?.playerId === playerId}
          />
        ))}
        <View style={styles.actionButtons}>
          <UserAvatar
            name={playersName[gamePlayers.current]}
            score={currentPlayer?.stats?.score ?? 0}
            isActive={myTurn}
            timePerPlayer={game.rules.timePerPlayer}
          />
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
          {/* <Text style={styles.handTitle}>{handValue} Points</Text> */}
          <YanivButton
            onPress={emit.callYaniv}
            disabled={handValue > game.rules.canCallYaniv || !myTurn}
          />
        </View>
        {/* Game Area */}
        <GameBoard
          pickup={{
            pickupPile: board.pickupPile,
            lastPickedCard,
            tookFrom: game.currentTurn?.prevTurn?.discard.cardsPositions,
          }}
          round={game.round}
          selectedCards={selectedCards}
          disabled={!myTurn}
        />
        <CardPointsList
          key={gamePlayers.current}
          cards={playerHand}
          onCardSelect={toggleCardSelection}
          slapCardIndex={slapCardIndex}
          selectedCardsIndexes={selectedCardsIndexes}
          onCardSlapped={onSlapCard}
          fromPosition={
            gamePlayers.current === game.currentTurn?.prevTurn?.playerId
              ? game.currentTurn?.prevTurn?.draw?.cardPosition
              : undefined
          }
          action={game.currentTurn?.prevTurn?.action}
          direction={directions[0]}
        />
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
              action={game.currentTurn?.prevTurn?.action}
              reveal={!isNil(roundResults)}
            />
            <View style={recordStyle[directions[i + 1]]}>
              <UserAvatar
                name={playersName[playerId]}
                score={gamePlayers.all[playerId]?.stats?.score ?? 0}
                isActive={game.currentTurn?.playerId === playerId}
                timePerPlayer={game.rules.timePerPlayer}
              />
            </View>
          </View>
        ))}
      </SafeAreaView>
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
  timerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timer: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  up: {position: 'absolute', top: 0, left: 10},
  down: {position: 'absolute', top: 80, left: 30},
  left: {
    position: 'absolute',
    left: 10,
    top: screenHeight / 2 - 140,
  },
  right: {
    position: 'absolute',
    right: 10,
    top: screenHeight / 2 - 140,
  },
};
export default GameScreen;
