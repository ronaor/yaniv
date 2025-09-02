import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import {normalize} from '~/utils/ui';

import XButton from '../menu/xButton';
import SimpleButton from '../menu/simpleButton';
import {SCREEN_WIDTH} from '~/utils/constants';

type JoinRoomDialogProps = {
  onJoinRoom: (roomIdInput: string) => void;
  onClose: () => void;
};

export default function JoinRoomDialog({
  onJoinRoom,
  onClose,
}: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState<string>('');

  const handleJoinRoom = () => {
    console.log('onJoinRoom', roomCode);
    onJoinRoom(roomCode);
  };

  return (
    <View style={styles.dialogBody}>
      <View style={styles.body}>
        <View style={styles.xButton}>
          <XButton onPress={onClose} />
        </View>
        <LinearGradient
          style={styles.gradient}
          colors={['#DE8216', '#A9500F', '#A9500F', '#A9500F', '#783505ff']}>
          <View style={styles.content}>
            <Text style={styles.headerTitle}>{'JOIN ROOM'}</Text>
            <View style={styles.inputWrapper}>
              <LinearGradient
                style={styles.inputGradient}
                colors={['#EBD5BF', '#FFF5D5']}>
                <TextInput
                  style={styles.input}
                  value={roomCode}
                  onChangeText={setRoomCode}
                  placeholder="Room Code"
                  autoCapitalize="characters"
                  placeholderTextColor={'#A0977D'}
                />
              </LinearGradient>
            </View>
            <View style={styles.buttonAdjuster}>
              <SimpleButton
                text="JOIN"
                onPress={handleJoinRoom}
                colors={['#FFBA15', '#F5970B', '#CD6600']}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogBody: {
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    backgroundColor: '#502404',
    borderRadius: 28,
    shadowColor: '#000',
    padding: 3,
  },
  gradient: {
    backgroundColor: '#843402',
    borderRadius: 25,
    paddingHorizontal: 3,
    flexDirection: 'column',
    padding: 3,
  },
  content: {
    backgroundColor: '#A9500F',
    borderRadius: 23,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FDE689',
    padding: 10,
    textAlign: 'center',
  },
  itemOuter: {
    paddingHorizontal: 3,
  },
  itemOuterEven: {
    backgroundColor: '#702900',
  },
  itemOuterOdd: {
    backgroundColor: '#903300',
  },
  itemOuterLast: {
    borderRadius: 25,
    paddingBottom: 3,
  },
  itemInner: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  title: {
    color: '#F9F09D',
    fontSize: normalize(18),
    textAlign: 'left',
    fontWeight: '700',
  },
  buttonAdjuster: {
    width: '100%',
    justifyContent: 'center',
    padding: 5,
    paddingHorizontal: 20,
  },
  xButton: {position: 'absolute', zIndex: 10, right: -20, top: -20},
  inputWrapper: {
    width: '100%',
    borderColor: '#5B2400',
    borderWidth: 3,
    borderRadius: 20,
  },
  inputGradient: {
    padding: 3,
    borderRadius: 17,
  },
  input: {
    padding: 10,
    backgroundColor: '#FFF5D5',
    borderRadius: 16,
    fontSize: 20,
    fontWeight: '700',
    minWidth: SCREEN_WIDTH * 0.55,
    color: '#642a00',
    textAlign: 'center',
  },
});
