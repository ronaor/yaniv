import React from 'react';
import {Pressable, Text, View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface SelectionElementProps {
  value: string;
  isSelected: boolean;
  onPress: () => void;
}

function SelectionElement({value, isSelected, onPress}: SelectionElementProps) {
  const activeStyle = {
    endColor: '#247916',
    startColor: '#9BF931',
    mainColor: '#45AC27',
    fontColor: '#FFFFFF',
  };

  const inactiveStyle = {
    endColor: '#BD6E01',
    startColor: '#FFCD06',
    mainColor: '#FFAA01',
    fontColor: '#693402',
  };

  const colors = isSelected ? activeStyle : inactiveStyle;

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <LinearGradient
        style={styles.gradient}
        colors={[colors.startColor, colors.endColor]}>
        <View style={[styles.content, {backgroundColor: colors.mainColor}]}>
          <Text style={[styles.text, {color: colors.fontColor}]}>{value}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

interface SelectionBarProps {
  selectionIndex: number;
  setSelection: React.Dispatch<React.SetStateAction<number>>;
  elements: string[];
}

function SelectionBar({
  selectionIndex,
  setSelection,
  elements,
}: SelectionBarProps) {
  return (
    <View style={styles.container}>
      {elements.map((element, index) => (
        <SelectionElement
          key={element}
          value={element}
          onPress={() => setSelection(index)}
          isSelected={selectionIndex === index}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pressable: {
    padding: 2,
    backgroundColor: '#631C00',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    padding: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 12,
    padding: 3,
    minWidth: 32,
  },
  text: {
    fontSize: 23,
    textAlign: 'center',
    fontWeight: '700',
    paddingHorizontal: 2,
  },
});

export default SelectionBar;
