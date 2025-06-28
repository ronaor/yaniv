import React, {useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {colors, textStyles} from '~/theme';
import {useRoomStore} from '~/store/roomStore';
import {useGameStore} from '~/store/gameStore';
import {useUser} from '~/store/userStore';

function GameScreen({navigation}: any) {
  const {roomId, players, leaveRoom} = useRoomStore();
  const {
    publicState,
    playerHand,
    isMyTurn,
    selectedCards,
    isGameActive,
    finalScores,
    error,
    drawCard,
    playCards,
    callYaniv,
    toggleCardSelection,
    clearSelection,
    clearError,
  } = useGameStore();
  const {name: nickname} = useUser();

  // Handle leave game
  const handleLeave = useCallback(() => {
    Alert.alert(
      'יציאה מהמשחק',
      'האם אתה בטוח שברצונך לעזוב? פעולה זו תגרום להפסד ולא תוכל להצטרף שוב.',
      [
        {text: 'ביטול', style: 'cancel'},
        {
          text: 'צא',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            navigation.reset({index: 0, routes: [{name: 'Home'}]});
            Alert.alert('יצאת מהמשחק', 'לא תוכל להצטרף שוב לחדר זה.');
          },
        },
      ],
    );
  }, [navigation, leaveRoom]);

  // If player is removed from the room (players no longer includes them), go home
  useEffect(() => {
    if (players && !players.some(p => p.nickname === nickname)) {
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
      Alert.alert('יצאת מהמשחק', 'לא תוכל להצטרף שוב לחדר זה.');
    }
  }, [players, navigation, nickname]);

  // Handle game errors
  useEffect(() => {
    if (error) {
      Alert.alert('שגיאת משחק', error, [{text: 'סגור', onPress: clearError}]);
    }
  }, [error, clearError]);

  // Handle game end
  useEffect(() => {
    if (publicState?.gameEnded && finalScores) {
      const winnerName =
        players.find(p => p.id === publicState.winner)?.nickname || 'לא ידוע';
      Alert.alert('המשחק הסתיים!', `הזוכה: ${winnerName}`, [
        {
          text: 'חזור לבית',
          onPress: () => navigation.reset({index: 0, routes: [{name: 'Home'}]}),
        },
      ]);
    }
  }, [
    publicState?.gameEnded,
    finalScores,
    players,
    navigation,
    publicState?.winner,
  ]);

  const handlePlayCards = () => {
    if (selectedCards.length === 0) {
      Alert.alert('שגיאה', 'בחר קלפים לשחק');
      return;
    }
    playCards(selectedCards);
  };

  const getCardDisplayValue = (value: number): string => {
    if (value === 1) return 'A';
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    return value.toString();
  };

  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case 'hearts':
        return '♥️';
      case 'diamonds':
        return '♦️';
      case 'clubs':
        return '♣️';
      case 'spades':
        return '♠️';
      default:
        return '';
    }
  };

  if (!isGameActive) {
    return (
      <View style={styles.body}>
        <Text style={textStyles.title}>טוען משחק...</Text>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
        </TouchableOpacity>
        <Text style={styles.roomTitle}>חדר: {roomId}</Text>
      </View>

      {/* Game Status */}
      <View style={styles.gameStatus}>
        <Text style={styles.turnInfo}>
          {isMyTurn ? 'התור שלך!' : 'ממתין לשחקן אחר...'}
        </Text>
        {publicState?.discardPile && publicState.discardPile.length > 0 && (
          <Text style={styles.discardInfo}>
            קלף עליון:{' '}
            {getCardDisplayValue(
              publicState.discardPile[publicState.discardPile.length - 1].value,
            )}
            {getSuitSymbol(
              publicState.discardPile[publicState.discardPile.length - 1].suit,
            )}
          </Text>
        )}
      </View>

      {/* Player's Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>הקלפים שלך ({playerHand.length}):</Text>
        <FlatList
          data={playerHand}
          horizontal
          keyExtractor={(item, index) => `${item.suit}-${item.value}-${index}`}
          renderItem={({item, index}) => (
            <TouchableOpacity
              style={[
                styles.card,
                selectedCards.includes(index) && styles.selectedCard,
              ]}
              onPress={() => isMyTurn && toggleCardSelection(index)}
              disabled={!isMyTurn}>
              <Text style={styles.cardText}>
                {getCardDisplayValue(item.value)}
              </Text>
              <Text style={styles.suitText}>{getSuitSymbol(item.suit)}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          style={styles.handList}
        />
      </View>

      {/* Game Actions */}
      {isMyTurn && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.drawBtn]}
            onPress={drawCard}>
            <Text style={styles.actionBtnText}>שלוף קלף</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.playBtn,
              selectedCards.length === 0 && styles.disabledBtn,
            ]}
            onPress={handlePlayCards}
            disabled={selectedCards.length === 0}>
            <Text style={styles.actionBtnText}>
              שחק קלפים ({selectedCards.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.yanivBtn]}
            onPress={callYaniv}>
            <Text style={styles.actionBtnText}>יניב!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clear Selection */}
      {selectedCards.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearSelection}>
          <Text style={styles.clearBtnText}>נקה בחירה</Text>
        </TouchableOpacity>
      )}

      {/* Players List */}
      <View style={styles.playersSection}>
        <Text style={styles.playersTitle}>שחקנים:</Text>
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Text
              style={[
                styles.player,
                publicState?.currentPlayer !== undefined &&
                  players[publicState.currentPlayer]?.id === item.id &&
                  styles.currentPlayer,
              ]}>
              {item.nickname}
              {item.nickname === nickname ? ' (אתה)' : ''}
              {publicState?.currentPlayer !== undefined &&
              players[publicState.currentPlayer]?.id === item.id
                ? ' 🎯'
                : ''}
            </Text>
          )}
          style={styles.playerList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaveBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaveBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gameStatus: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  turnInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  discardInfo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  handSection: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  handTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  handList: {
    flexGrow: 0,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    width: 50,
    height: 70,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    transform: [{translateY: -8}],
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  suitText: {
    fontSize: 18,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  drawBtn: {
    backgroundColor: colors.info,
  },
  playBtn: {
    backgroundColor: colors.primary,
  },
  yanivBtn: {
    backgroundColor: colors.success,
  },
  disabledBtn: {
    backgroundColor: colors.border,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearBtn: {
    alignSelf: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  playersSection: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  playerList: {
    flex: 1,
  },
  player: {
    fontSize: 16,
    color: colors.text,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: 'center',
  },
  currentPlayer: {
    backgroundColor: colors.accent,
    fontWeight: 'bold',
    borderRadius: 4,
  },
});

export default GameScreen;
