import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';

import {Canvas, Image, useImage} from '@shopify/react-native-skia';

import {isNull} from 'lodash';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';

interface TempleTableBackgroundProp {
  setReady?: () => void;
}

const TempleTableBackground = ({setReady}: TempleTableBackgroundProp) => {
  const image = useImage(require('~/assets/images/templePocker2.png'));

  useEffect(() => {
    if (!isNull(image)) {
      setReady?.();
    }
  }, [image, setReady]);

  return (
    <Canvas style={styles.canvas}>
      {/* Background */}
      <Image
        image={image}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT - 50}
        fit={'cover'}
      />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    transform: [{scaleX: 1.05}],
    backgroundColor: '#D49B38',
  },
});

export default TempleTableBackground;
