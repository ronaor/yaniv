import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import MenuButton from '~/components/menuButton';
import {HomeScreenProps} from '~/types/navigation';
import {colors, textStyles} from '../theme';

function HomeScreen({navigation}: HomeScreenProps) {
  const quickGame = () => {};
  const gameWithFriends = () => navigation.navigate('GameWithFriends');
  const gameWithAI = () => {};

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <Text style={[textStyles.title, styles.title]}>{'יניב'}</Text>
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
    backgroundColor: colors.background,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    marginBottom: 32,
  },
  menuButtons: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.accent,
    gap: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    width: '100%',
    alignItems: 'stretch',
  },
});

export default HomeScreen;
