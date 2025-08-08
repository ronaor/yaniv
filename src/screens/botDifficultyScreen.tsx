import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSocket} from '~/store/socketStore';
import {useUser} from '~/store/userStore';
import {BotDifficultyProps} from '~/types/navigation';

//TODO chacnge type
const BotDifficultyScreen = ({navigation}: BotDifficultyProps) => {
  const {name} = useUser();
  const {emit} = useSocket();

  const handleSelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!name) return;
    emit('create_bot_room', {nickName: name, difficulty});
    navigation.replace('Game');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>בחר רמת קושי למשחק מול מחשב</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect('easy')}>
        <Text style={styles.text}>קל</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect('medium')}>
        <Text style={styles.text}>בינוני</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect('hard')}>
        <Text style={styles.text}>קשה</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FDF6E3',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
});

export default BotDifficultyScreen;
