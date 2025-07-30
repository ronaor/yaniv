import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {useUser} from '~/store/userStore';
import {colors, textStyles} from '~/theme';
import BasePressable from '~/components/basePressable';
import Dialog from '~/components/dialog';
import {create} from 'zustand';
import {PlayerId} from '~/store/yanivGameStore';
import {PlayerStatus} from '~/types/player';
import UserAvatar from '../user/userAvatar';
import {useRoomStore} from '~/store/roomStore';
import CardPointsList from '../cards/cardsPoint';
import {DirectionName} from '~/types/cards';
import {SafeAreaView} from 'react-native-safe-area-context';
import {isEmpty} from 'lodash';
import {useNavigation} from '@react-navigation/native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

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
  open: (mode, thisPlayerId, playersIds, playersStats) =>
    set({isOpen: true, mode, thisPlayerId, playersIds, playersStats}),
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
  const {isOpen, mode, thisPlayerId, playersIds, playersStats, close, open} =
    useEndGameStore();
  // console.log('🚀 ~ EndGameDialog ~ playersStats:', playersStats);
  const {players, leaveRoom} = useRoomStore();

  const activePlayers = Object.entries(playersStats).filter(
    ([, player]) => !player.lost,
  );

  const playersName = useMemo(() => {
    return players.reduce<Record<PlayerId, string>>((res, user) => {
      res[user.id] = user.nickName;
      return res;
    }, {});
  }, [players]);

  // Handle leave game
  const handleLeave = useCallback(() => {
    Alert.alert('יציאה מהמשחק', 'האם אתה בטוח שברצונך לעזוב?', [
      {text: 'ביטול', style: 'cancel'},
      {
        text: 'צא',
        style: 'destructive',
        onPress: () => {
          close();
          leaveRoom(playersName[thisPlayerId]);
          navigation.reset({index: 0, routes: [{name: 'Home'}]});
        },
      },
    ]);
  }, [navigation, leaveRoom, playersName, thisPlayerId, close]);

  // Show dialog on finish app entry
  // React.useEffect(() => {
  //   if (!isOpen) {
  //     open('finish', '');
  //   }
  // }, [isOpen, open]);

  // if (loading) {
  //   return (
  //     <Dialog isModalOpen onBackgroundPress={() => {}}>
  //       <View style={styles.loading}>
  //         <ActivityIndicator size="large" color={colors.primary} />
  //       </View>
  //     </Dialog>
  //   );
  // }
  const directions: DirectionName[] = ['up', 'right', 'down', 'left'];

  if (!isOpen || !playersStats) {
    return null;
  }

  return (
    <Dialog
      isModalOpen={isOpen}
      onBackgroundPress={() => {
        // Prevent closing if it's the finish prompt (require name)
        close();
      }}>
      <View style={styles.container}>
        {!isEmpty(activePlayers) && (
          <Text>The Winner is : {playersName[activePlayers[0][0]]}</Text>
        )}
        <View style={styles.userContainer}>
          <Text>
            name : {playersName[thisPlayerId]} - score :
            {playersStats[thisPlayerId]?.score ?? 0}
          </Text>
        </View>
        {playersIds.map((playerId, i) => {
          if (thisPlayerId !== playerId) {
            return (
              <View key={playerId} style={styles.actionButtons}>
                <View style={styles.userContainer}>
                  <Text>
                    name : {playersName[playerId]} - score :
                    {playersStats[playerId]?.score ?? 0}
                  </Text>
                </View>
              </View>
            );
          }
        })}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <BasePressable onPress={() => {}}>
            <View style={styles.playAgainBtn}>
              <Text style={[textStyles.body]}>שחק שוב</Text>
            </View>
          </BasePressable>
          <BasePressable onPress={handleLeave}>
            <View style={styles.leaveBtn}>
              <Text style={[textStyles.body]}>צא</Text>
            </View>
          </BasePressable>
        </View>
        {/* <BasePressable onPress={() => {}}>
          <View style={styles.saveButton}>
            <Text style={[textStyles.body, styles.saveText]}>שמור</Text>
          </View>
        </BasePressable> */}
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainBtn: {
    backgroundColor: colors.success,
    padding: 10,
    borderRadius: 16,
  },
  leaveBtn: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 16,
  },
  yourName: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginVertical: 12,
    color: colors.text,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    width: '90%',
    maxHeight: '80%',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    padding: 12,
  },
  absolute: {position: 'absolute', width: screenWidth},
  userContainer: {
    width: '100%',
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EndGameDialog;
