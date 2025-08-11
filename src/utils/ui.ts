// Same result, no dependency
import {Dimensions, PixelRatio, Platform} from 'react-native';

const {width} = Dimensions.get('window');
const scale = width / 320;

export const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};
