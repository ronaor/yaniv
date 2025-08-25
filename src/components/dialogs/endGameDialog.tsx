import {useNavigation} from '@react-navigation/native';
import {isEmpty} from 'lodash';
import React, {useCallback, useMemo} from 'react';
import {Alert, Dimensions, StyleSheet, Text, View} from 'react-native';

import {create} from 'zustand';
import BasePressable from '~/components/basePressable';
import Dialog from '~/components/dialog';
import {useRoomStore} from '~/store/roomStore';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {colors, textStyles} from '~/theme';
import {PlayerStatus} from '~/types/player';
import {OutlinedText} from '../cartoonText';
import SimpleButton from '../menu/simpleButton';
import LinearGradient from 'react-native-linear-gradient';

const gold = ['#F9AC03', '#F19E00'];
const silver = ['#CAAE8E', '#AB9579'];
const bronze = ['#E17402', '#B84F00'];
const simple = ['#05ACC4', '#05ACC4'];
const borderColors = [gold, silver, bronze, simple];

const {width: screenWidth} = Dimensions.get('screen');

const PLAYER_ROW_HEIGHT = 65;
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

export function closeEndGameDialog() {
  useEndGameStore.getState().close();
}

const playersStats = {
  sN5hKQRukcgY4rxwAACh: {
    playerName: 'lolkk',
    playerStatus: 'active',
    score: 0,
  },
  j7E3vEMByHXiMWhZAACg: {
    playerName: 'Fff',
    playerStatus: 'leave',
    score: 0,
  },
};

function DialogFooter() {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
      }}>
      <View
        style={{
          marginTop: 4,
          aspectRatio: 1,
          backgroundColor: '#FBC400',
          padding: 3,
          borderRadius: 20,
          borderWidth: 0.25,
          borderColor: '#FAFE02',
        }}>
        <View
          style={{
            aspectRatio: 1,
            width: 15,
            backgroundColor: '#FEF400',
            borderRadius: 10,
          }}
        />
      </View>
      <OutlinedText
        text={'+100'}
        fontSize={20}
        width={50}
        height={42}
        fillColor={'#f1d900ff'}
        strokeColor={'#FAFE02'}
        strokeWidth={1}
        fontWeight={'700'}
      />
    </View>
  );
}

const EndGameDialog: React.FC = () => {
  const navigation = useNavigation<any>();
  const {isOpen, thisPlayerId, close} = useEndGameStore();

  const playersIds = ['sN5hKQRukcgY4rxwAACh', 'j7E3vEMByHXiMWhZAACg'];

  const {leaveRoom} = useRoomStore();
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

  const handleLeave = useCallback(() => {
    const nickName = playersStats[thisPlayerId].playerName;
    if (playersIds.length > 1) {
      Alert.alert('Leave Room', 'Are you sure you want to leave?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom(nickName);
            navigation.reset({index: 0, routes: [{name: 'Home'}]});
          },
        },
      ]);
    } else {
      leaveRoom(nickName);
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    }
  }, [leaveRoom, navigation, playersIds.length, playersStats, thisPlayerId]);

  interface PlayerRowProps {
    playerId: string;
    index: number;
  }

  const PlayerRow = ({playerId, index}: PlayerRowProps) => {
    const player = playersStats[playerId];

    const placeNames = ['#1st', '#2nd', '#3rd', '#4th'];
    const borderColor = borderColors[index];
    const place = placeNames[index];

    return (
      <View
        key={playerId}
        style={{
          paddingStart: 5,
          paddingVertical: 10,
          alignItems: 'center',
          flexDirection: 'row',
          height: PLAYER_ROW_HEIGHT,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 2,
            borderRadius: 25,
            backgroundColor: '#914407',
            borderColor: '#6F2F00',
            flex: 1,
            paddingStart: 60 + 20,
            justifyContent: 'space-between',
            paddingEnd: 10,
            height: 50,
          }}>
          <Text
            style={{
              color: '#FFE596',
              fontSize: 20,
              fontWeight: '700',
            }}
            numberOfLines={1}>
            {player.playerName}
          </Text>
          <Text
            numberOfLines={1}
            style={{color: '#FFE596', fontSize: 30, fontWeight: '700'}}>
            {player.score ?? 0}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            justifyContent: 'center',
          }}>
          <LinearGradient
            style={{
              borderRadius: 40,
              padding: 5,
              width: 55,
              position: 'absolute',
            }}
            colors={borderColor}>
            <View
              style={[
                {
                  aspectRatio: 1,
                  borderRadius: 40,
                  backgroundColor: '#4A5D52',
                },
              ]}
            />
          </LinearGradient>
          <View
            style={{
              position: 'absolute',
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 5,
              top: 0,
              left: 30,
            }}>
            <Text
              style={{
                color: borderColor[0],
                fontSize: 15,
                fontWeight: '700',
              }}>
              {place}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // if (!isOpen || !playersStats) return null;

  return (
    <Dialog isModalOpen={true} onBackgroundPress={close}>
      <View
        style={{
          height: playersIds.length * PLAYER_ROW_HEIGHT + 80,
          marginBottom: 100,
        }}>
        <View
          style={{
            position: 'absolute',
            alignSelf: 'center',
            height: 150,
            width: 150,
            backgroundColor: '#984c00ff',
            borderRadius: 80,
            top: -60,
            transform: [{scaleY: 0.8}],
            borderWidth: 4,
            borderColor: '#b35d08ff',
          }}
        />
        <View
          style={{
            alignSelf: 'center',
            borderRadius: 13,
            zIndex: 10,
            top: 0,
          }}>
          <LinearGradient
            style={{
              padding: 3,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 15,
            }}
            colors={['#b35d08ff', '#6E2C01']}>
            <View
              style={{
                backgroundColor: '#9b4907ff',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                borderBottomLeftRadius: 15,
                borderBottomRightRadius: 20,
                paddingVertical: 10,
              }}>
              <OutlinedText
                text="GAME OVER"
                fontSize={30}
                width={screenWidth - 100}
                height={35}
                fillColor={'#FEE8A1'}
                strokeColor={'#572100'}
                strokeWidth={4}
                fontWeight={'900'}
              />
            </View>
          </LinearGradient>
        </View>
        <View style={styles.dialogArea}>
          <View style={styles.container}>
            {/* <PlayerRow playerId={thisPlayerId} /> */}
            <View
              style={{
                backgroundColor: '#7C3803',
                padding: 5,
                paddingTop: 10,
                flex: 1,
                gap: 5,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                borderWidth: 2,
                borderColor: '#7a3609ff',
              }}>
              {playersIds
                .filter(pid => pid !== thisPlayerId)
                .map((pid, i) => (
                  <PlayerRow key={pid} playerId={pid} index={i} />
                ))}
            </View>
            <DialogFooter />
          </View>
        </View>
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <SimpleButton
              size="small"
              text="Play Again"
              colors={['#86ce01ff', '#7ec200ff', '#78b900ff']}
              borderColor={'#1d0e0077'}
              onPress={() => emit.playAgain()}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <SimpleButton
              size="small"
              text="Leave"
              colors={['#E64E08', '#db300eff', '#D02A07']}
              onPress={handleLeave}
              borderColor={'#1d0e0077'}
            />
          </View>
        </View>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  safeArea: {},
  dialogArea: {
    borderRadius: 20,
    paddingVertical: 3,
    backgroundColor: 'rgba(131, 55, 0, 1)ff',
    borderColor: '#713401ff',
    borderWidth: 2,
    marginTop: -20,
    marginHorizontal: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#934504',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    paddingTop: 15,
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
    backgroundColor: '#602B02',
    borderRadius: 8,
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
    padding: 10,
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
  circle: {
    width: 50,
    aspectRatio: 1,
    borderRadius: 40,
    borderWidth: 5,
    backgroundColor: '#04a8e3ff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default EndGameDialog;
