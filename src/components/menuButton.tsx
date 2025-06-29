import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import BasePressable from './basePressable';
interface MenuButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

const MenuButton = ({
  text,
  onPress,
  disabled = false,
}: MenuButtonProps): JSX.Element => {
  return (
    <BasePressable onPress={onPress} disabled={disabled}>
      <View style={[buttonStyles.body, disabled && buttonStyles.disabled]}>
        <Text
          style={[buttonStyles.text, disabled && buttonStyles.disabledText]}>
          {text}
        </Text>
      </View>
    </BasePressable>
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
  disabled: {
    backgroundColor: '#CCCCCC',
  },
  text: {
    fontSize: 20,
    color: 'white',
    padding: 5,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#999999',
  },
});
