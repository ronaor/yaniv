import {View, ViewStyle} from 'react-native';
import React from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface SafeAreaTopBarProps {
  color?: string;
}

function SafeAreaTopBar({color = '#00515b'}: SafeAreaTopBarProps) {
  const insets = useSafeAreaInsets();
  const style: ViewStyle = {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: color,
    height: insets.top,
  };
  return <View style={style} />;
}

export default SafeAreaTopBar;
