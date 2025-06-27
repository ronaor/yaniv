import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import MenuButton from '~/components/menuButton';
import {HomeScreenProps} from '~/types/navigation';

function HomeScreen({navigation}: HomeScreenProps) {
  const quickGame = () => {};
  const gameWithFriends = () => navigation.navigate('GameWithFriends');
  const gameWithAI = () => {};

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <Text style={styles.title}>{'יניב'}</Text>
        <View style={styles.menuButtons}>
          <MenuButton text={'משחק מהיר'} onPress={quickGame} />
          <MenuButton text={'משחק עם חברים'} onPress={gameWithFriends} />
          <MenuButton text={'משחק עם מחשב'} onPress={gameWithAI} />
        </View>
      </View>
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
  container: {
    flexDirection: 'column',
    height: '75%',
  },
  title: {
    fontSize: 50,
    color: '#D55500FF',
    padding: 5,
    fontWeight: 'bold',
    flex: 0.5,
    alignSelf: 'center',
  },
  menuButtons: {
    padding: 20,
    borderRadius: 20,
    flex: 1,
    backgroundColor: 'yellow',
    gap: 10,
  },
});

export default HomeScreen;
