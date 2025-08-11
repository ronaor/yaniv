import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useRoomStore} from '~/store/roomStore';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
};

function RoomTimer() {
  const {players, canStartTimer} = useRoomStore();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeActive, setTimeActive] = useState(false);

  useEffect(() => {
    if (players.length < 2) {
      setTimeRemaining(0);
      setTimeActive(false);
      return;
    }

    setTimeActive(true);
    let targetSeconds = 0;
    if (players.length === 2) {
      targetSeconds = 3; //15;
    } else if (players.length === 3) {
      targetSeconds = 10;
    } else if (players.length >= 4) {
      targetSeconds = 7;
    }

    const startTime = Date.now();
    const endTime = startTime + targetSeconds * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Let the backend handle game start
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [players.length, canStartTimer]);

  return (
    <View style={[styles.container, timeActive ? {} : styles.transparent]}>
      <Text style={styles.text}>{'Game start in: '}</Text>
      <View style={styles.timer}>
        <Text style={styles.text}>{`${formatTime(timeRemaining)}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingHorizontal: 14,
    backgroundColor: '#3618189b',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    position: 'absolute',
    bottom: 15,
  },
  transparent: {opacity: 0.5},
  text: {color: 'white', fontWeight: '800', fontSize: 18},
  timer: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#3b0c0c9f',
  },
});
export default RoomTimer;
