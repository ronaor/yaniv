import React from 'react';
import {Canvas, Path} from '@shopify/react-native-skia';
import {StyleSheet, Text, View} from 'react-native';

interface CheckMarkProps {
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  value: number;
}

function CheckMark({
  size = 17,
  fillColor = '#FEFCDE',
  strokeColor = '#1F5508',
  strokeWidth = 2,
  value,
}: CheckMarkProps) {
  const pathData =
    'M6.72648 13C6.72648 13 15.2854 5.56855 15.6348 4.29997C15.9841 3.0314 13.8881 0.674892 12.84 1.03752C11.792 1.40016 6.20259 6.2938 6.20259 6.2938L4.10655 4.52171C2.70912 3.25296 -0.26039 6.65626 0.962326 7.92501L6.72648 13Z';

  const styleOpacity = {opacity: value === 0 ? 0.3 : 1};
  return (
    <View style={[styles.container, styleOpacity]}>
      <Text style={styles.text}>{value}</Text>
      <Canvas style={{width: size, height: (size * 14) / 17}}>
        <Path path={pathData} color={fillColor} style="fill" />
        <Path
          path={pathData}
          color={strokeColor}
          style="stroke"
          strokeWidth={strokeWidth}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    height: 30,
    borderWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 5,
    backgroundColor: '#63b215',
    borderColor: '#1F5508',
  },
  text: {fontWeight: '800', color: '#FFFFFF'},
});

export default CheckMark;
