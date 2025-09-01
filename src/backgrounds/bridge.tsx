import React, {useEffect} from 'react';
import {Dimensions, StyleSheet} from 'react-native';

import {Canvas, Image, useImage} from '@shopify/react-native-skia';

import {isNull} from 'lodash';

const dimension = Dimensions.get('screen');

interface BridgeBackgroundProp {
  setReady?: () => void;
}

const BridgeBackground = ({setReady}: BridgeBackgroundProp) => {
  const image = useImage(require('~/assets/images/bridge.png'));

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
    backgroundColor: '#A05D0B',
  },
});

export default BridgeBackground;
