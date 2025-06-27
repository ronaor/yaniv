import {StyleSheet, Text, TextInput, View} from 'react-native';
import React, {useState} from 'react';
import MenuButton from '~/components/menuButton';
import Dialog from '~/components/dialog';

function GameWithFriends() {
  const [newRoomModalOpen, setNewRoomModalOpen] = useState<boolean>(false);
  const [enterRoomModalOpen, setEnterRoomModalOpen] = useState<boolean>(false);

  const createRoom = () => {
    setNewRoomModalOpen(true);
  };
  const enterARoom = () => {
    setEnterRoomModalOpen(true);
  };
  const enterRoom = () => {};
  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <Text style={styles.title}>{'משחק עם חברים'}</Text>
        <View style={styles.menuButtons}>
          <MenuButton text={'צור חדר'} onPress={createRoom} />
          <MenuButton text={'כנס לחדר'} onPress={enterARoom} />
        </View>
      </View>
      <Dialog
        isModalOpen={newRoomModalOpen}
        onBackgroundPress={() => setNewRoomModalOpen(false)}>
        <Text style={styles.dialogTitle}>{'חדר חדש'}</Text>
        <View style={styles.dialogBody}>
          <Text style={styles.dialogInput1}>{'מספר משתתפים'}</Text>
          <TextInput />
          <Text style={styles.dialogInput1}>{'מספר משתתפים'}</Text>
          <TextInput />
          <MenuButton onPress={enterRoom} text="צור חדר" />
        </View>
      </Dialog>
      <Dialog
        isModalOpen={enterRoomModalOpen}
        onBackgroundPress={() => setEnterRoomModalOpen(false)}>
        <Text style={styles.dialogTitle}>{'כניסה לחדר'}</Text>
        <View style={styles.dialogBody}>
          <Text style={styles.dialogInput1}>{'מזהה חדר'}</Text>
          <TextInput />
          <MenuButton onPress={enterRoom} text="כנס" />
        </View>
      </Dialog>
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
    fontSize: 30,
    color: '#D55500FF',
    padding: 5,
    fontWeight: 'bold',
    flex: 0.5,
  },
  menuButtons: {
    padding: 20,
    borderRadius: 20,
    flex: 1,
    backgroundColor: 'yellow',
    gap: 10,
  },
  dialogTitle: {
    color: 'red',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dialogInput1: {
    color: '#222222FF',
  },
  dialogBody: {
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 10,
  },
});

export default GameWithFriends;
