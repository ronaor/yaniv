import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

function RoomLobbyScreen() {
  return (
    <View style={styles.body}>
      <Text style={styles.title}>{'אנא המתן'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 50,
    color: '#D55500FF',
    padding: 5,
    fontWeight: 'bold',
    flex: 0.5,
  },
});

export default RoomLobbyScreen;
