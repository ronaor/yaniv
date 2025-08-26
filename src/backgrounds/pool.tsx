import React, {useEffect} from 'react';
import {Dimensions, StyleSheet} from 'react-native';

import {Canvas, Image, useImage} from '@shopify/react-native-skia';

import {isNull} from 'lodash';

const dimension = Dimensions.get('screen');

interface PoolBackgroundProp {
  setReady?: () => void;
}

const PoolBackground = ({setReady}: PoolBackgroundProp) => {
  const image = useImage(require('~/assets/images/pool_3.png'));

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
        width={dimension.width}
        height={dimension.height - 50}
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
    backgroundColor: '#FDCF60',
  },
});

export default PoolBackground;
