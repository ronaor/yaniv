import {useNavigation} from '@react-navigation/native';
import {isEmpty} from 'lodash';
import React, {useCallback, useEffect, useMemo} from 'react';
import {Alert, Dimensions, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {create} from 'zustand';
import BasePressable from '~/components/basePressable';
import Dialog from '~/components/dialog';
import {useRoomStore} from '~/store/roomStore';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {colors, textStyles} from '~/theme';
import {PlayerStatus} from '~/types/player';

interface EndGameStore {
  isOpen: boolean;
  mode: 'finish' | 'round' | 'close';
  thisPlayerId: string;
  playersIds: PlayerId[];
  playersStats: Record<string, PlayerStatus>;
  open: (
    mode: 'finish' | 'round' | 'close',
    thisPlayerId: string,
    playersIds: PlayerId[],
    playersStats: Record<string, PlayerStatus>,
  ) => void;
  close: () => void;
}

const useEndGameStore = create<EndGameStore>(set => ({
  isOpen: false,
  mode: 'finish',
  thisPlayerId: '',
  playersIds: [],
  playersStats: {},
  open: (mode, thisPlayerId, playersIds, playersStats) => {
    return set({isOpen: true, mode, thisPlayerId, playersIds, playersStats});
  },
  //Mock data
  // open: (mode, thisPlayerId, playersIds, playersStats) => {
  //   console.log('🚀 ~ playersStats:', playersStats);
  //   console.log('🚀 ~ playersIds:', playersIds);
  //   return set({
  //     isOpen: true,
  //     mode,
  //     thisPlayerId,//: 'sN5hKQRukcgY4rxwAACh',
  //     playersIds ,://['sN5hKQRukcgY4rxwAACh', 'j7E3vEMByHXiMWhZAACg'],
  //     playersStats: {
  //       sN5hKQRukcgY4rxwAACh: {
  //         lost: false,
  //         playerName: 'lolkk',
  //         playerStatus: 'active',
  //         score: 0,
  //       },
  //       j7E3vEMByHXiMWhZAACg: {
  //         lost: true,
  //         playerName: 'Fff',
  //         playerStatus: 'leave',
  //         score: 0,
  //       },
  //     },
  //   });
  // },
  close: () => set({isOpen: false}),
}));

export function openEndGameDialog(
  mode: EndGameStore['mode'],
  thisPlayerId: string,
  playersIds: PlayerId[],
  playersStats: Record<string, PlayerStatus>,
) {
  useEndGameStore.getState().open(mode, thisPlayerId, playersIds, playersStats);
}

const EndGameDialog: React.FC = () => {
  const navigation = useNavigation<any>();
  const {isOpen, thisPlayerId, playersIds, playersStats, close} =
    useEndGameStore();
  const {players, leaveRoom} = useRoomStore();
  const {emit} = useYanivGameStore();

  const activePlayer = useMemo(
    () =>
      Object.values(playersStats).find(
        player => player?.playerStatus === 'active',
      ),
    [playersStats],
  );

  const isEveryPlayersVoted = useMemo(
    () =>
      Object.entries(playersStats)
        .filter(([playerId]) => playerId !== thisPlayerId)
        .every(
          ([, p]) =>
            p.playerStatus === 'leave' || p.playerStatus === 'playAgain',
        ),
    [playersStats, thisPlayerId],
  );

  const playAgainVotes = useMemo(() => {
    return Object.entries(playersStats).filter(
      ([playerId, p]) =>
        playerId !== thisPlayerId && p.playerStatus === 'playAgain',
    ).length;
  }, [playersStats, thisPlayerId]);

  useEffect(() => {
    const shouldClose =
      Object.values(playersStats).length > 0 &&
      Object.values(playersStats).every(
        p => p.playerStatus === 'leave' || p.playerStatus === 'playAgain',
      );
    if (shouldClose) {
      const timer = setTimeout(close, 5000); // Close dialog after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [playersStats, close]);

  // Handle leave game
  const handleLeave = useCallback(() => {
    if (activePlayer?.playerName) {
      Alert.alert('יציאה מהמשחק', 'האם אתה בטוח שברצונך לעזוב?', [
        {text: 'ביטול', style: 'cancel'},
        {
          text: 'צא',
          style: 'destructive',
          onPress: () => {
            close();
            leaveRoom(activePlayer.playerName);
            navigation.reset({index: 0, routes: [{name: 'Home'}]});
          },
        },
      ]);
    }
  }, [navigation, leaveRoom, activePlayer?.playerName, close]);

  const renderPlayer = (playerId: string) => {
    const player = playersStats[playerId];
    if (!player) return <View />;

    let statusText = '';
    if (player.playerStatus === 'leave') statusText = 'סליחה, חייב ללכת 😢';
    else if (player.playerStatus === 'playAgain')
      statusText = 'בוא נשחק שוב 😎';

    return (
      <View key={playerId} style={styles.userContainer}>
        <Text style={styles.userText}>
          name: {player.playerName} - score: {player.score ?? 0}
        </Text>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    );
  };

  if (!isOpen || !playersStats) return null;

  return (
    <Dialog isModalOpen={isOpen} onBackgroundPress={close}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {!isEmpty(activePlayer) && (
            <Text style={styles.winnerText}>
              The Winner is: {activePlayer.playerName}
            </Text>
          )}
          {renderPlayer(thisPlayerId)}
          {playersIds
            .filter(pid => pid !== thisPlayerId)
            .map(pid => renderPlayer(pid))}
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <BasePressable
              onPress={() => emit.playAgain()}
              disabled={isEveryPlayersVoted && playAgainVotes < 1}>
              <View style={styles.playAgainBtn}>
                <Text style={textStyles.body}>שחק שוב</Text>
              </View>
            </BasePressable>
          </View>
          <View style={styles.buttonWrapper}>
            <BasePressable onPress={handleLeave}>
              <View style={styles.leaveBtn}>
                <Text style={textStyles.body}>צא</Text>
              </View>
            </BasePressable>
          </View>
        </View>
      </SafeAreaView>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    height: '86%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#e5e2a9',
  },
  container: {
    flex: 1,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.primary,
  },
  userContainer: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  userText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    marginTop: 4,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  playAgainBtn: {
    backgroundColor: colors.success,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  leaveBtn: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
});

export default EndGameDialog;
