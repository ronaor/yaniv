import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Animated} from 'react-native';

interface CheckBoxProps {
  value: boolean; // true for Yes, false for No
  onChangeSelection: (value: boolean) => void;
  title: string;
}

const CheckBox: React.FC<CheckBoxProps> = ({
  value,
  onChangeSelection,
  title,
}) => {
  const translateAnim = React.useRef(new Animated.Value(value ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.timing(translateAnim, {
      toValue: value ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [value, translateAnim]);

  // Interpolate the animated value to move the selection indicator
  const translateX = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80], // Adjust this value to match button width
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title} : </Text>

      <View style={styles.container}>
        <View style={styles.buttonsRow}>
          <Animated.View
            style={[
              styles.selectionIndicator,
              {
                transform: [{translateX}],
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.button,
              value && styles.selected,
              styles.leftButton,
              {
                transform: [{scale: value ? 1.15 : 1}],
                zIndex: value ? 2 : 1,
              },
            ]}
            onPress={() => onChangeSelection(true)}
            activeOpacity={0.8}>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.text}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              !value && styles.selected,
              styles.rightButton,
              {
                transform: [{scale: !value ? 1.15 : 1}],
                zIndex: !value ? 2 : 1,
              },
            ]}
            onPress={() => onChangeSelection(false)}
            activeOpacity={0.8}>
            <Text style={styles.emoji}>❌</Text>
            <Text style={styles.text}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const BUTTON_WIDTH = 80;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    width: BUTTON_WIDTH,
    height: 34,
    backgroundColor: '#2196f3',
    borderRadius: 24,
    zIndex: 0,
    top: 0,
    left: 0,
    shadowColor: '#2196f3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_WIDTH,
    height: 34,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#888',
    backgroundColor: '#222',
    zIndex: 1,
  },
  leftButton: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  rightButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  selected: {
    borderColor: '#fff',
    backgroundColor: '#2196f3',
  },

  emoji: {
    fontSize: 16,
    marginRight: 8,
    color: '#fff',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CheckBox;
