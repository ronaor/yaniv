import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import BasePressable from './basePressable';

interface EnterNumberProps {
  value: number;
  range: [number, number];
  onValueChanged: (value: number) => void;
}

function EnterNumber({value, range, onValueChanged}: EnterNumberProps) {
  const onInc = () => {
    if (value + 1 <= range[1]) {
      onValueChanged(value + 1);
    }
  };
  const onDec = () => {
    if (value - 1 >= range[0]) {
      onValueChanged(value - 1);
    }
  };
  return (
    <View style={styles.body}>
      <BasePressable
        onPress={onDec}
        disabled={value === range[0]}
        style={styles.button}>
        <Text style={styles.text}> {'<'}</Text>
      </BasePressable>
      <Text style={styles.text}>{value}</Text>
      <BasePressable
        onPress={onInc}
        disabled={value === range[1]}
        style={styles.button}>
        <Text style={styles.text}>{'>'}</Text>
      </BasePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {flexDirection: 'row', alignItems: 'center'},
  button: {padding: 8, borderRadius: 20},
  text: {color: '#555555FF', fontWeight: '900'},
});

export default EnterNumber;
