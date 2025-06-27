import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import React from 'react';
interface MenuButtonProps {
  text: string;
  onPress: () => void;
}

const MenuButton = ({text, onPress}: MenuButtonProps): JSX.Element => {
  return (
    <TouchableOpacity style={buttonStyles.body} onPress={onPress}>
      <Text style={buttonStyles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

export default MenuButton;

const buttonStyles = StyleSheet.create({
  body: {
    backgroundColor: '#D55500FF',
    paddingHorizontal: 30,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  text: {
    fontSize: 20,
    color: 'white',
    padding: 5,
    fontWeight: 'bold',
  },
});
