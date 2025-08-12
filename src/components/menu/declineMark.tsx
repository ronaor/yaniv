import React from 'react';
import {Canvas, Path} from '@shopify/react-native-skia';
import {StyleSheet, Text, View} from 'react-native';

interface DeclineMarkProps {
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  value: number;
}

function DeclineMark({
  size = 17,
  fillColor = '#FEFCDE',
  strokeColor = '#711806ff',
  strokeWidth = 2,
  value,
}: DeclineMarkProps) {
  const pathData =
    'M4.32372 13.5654C2.91856 13.4623 2.33902 13.0584 1.82372 11.5654L4.82397 8.06537C4.82397 8.06537 2.32376 6.06537 1.32376 5.06543C0.323764 4.06549 1.82397 1.56549 3.32397 2.06543C4.82397 2.56537 7.82372 5.06543 7.82372 5.06543C7.82372 5.06543 10.824 1.56537 11.824 1.06543C12.824 0.565489 14.8237 3.06537 14.3237 4.06537C13.8237 5.06537 10.824 8.06537 10.824 8.06537L13.824 11.5654C13.4198 12.9327 12.41 13.2569 11.324 13.5654L7.82372 10.5654L4.32372 13.5654Z';

  const styleOpacity = {opacity: value === 0 ? 0.3 : 1};
  return (
    <View style={[styles.container, styleOpacity]}>
      <Text style={styles.text}>{value}</Text>
      <Canvas style={{width: size, height: size}}>
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
    backgroundColor: '#d01f00ff',
    borderColor: '#711806ff',
  },
  text: {fontWeight: '800', color: '#FFFFFF'},
});

export default DeclineMark;
