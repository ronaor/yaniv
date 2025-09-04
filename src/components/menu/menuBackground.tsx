import {ImageSourcePropType, Animated, StyleSheet} from 'react-native';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';
import Waves from './waves';
import {Location} from '~/types/cards';
import ParallaxBackground from '~/backgrounds/parallaxBackground';
import React from 'react';

const ImageBG = ({source}: {source: ImageSourcePropType}) => {
  return (
    <Animated.Image
      source={source}
      style={styles.imageStyle}
      resizeMode="cover"
    />
  );
};

const layers = [
  {
    component: ImageBG,
    parallaxFactor: {x: 0.6, y: 0.55},
    props: {source: require('~/assets/images/main/st2.png')},
  },
  {
    component: Waves,
    parallaxFactor: {x: 0.6, y: 0.35},
  },
  {
    component: ImageBG,
    parallaxFactor: {x: 0.6, y: 0.4},
    props: {source: require('~/assets/images/main/sand_1.png')},
  },
  {
    component: ImageBG,
    parallaxFactor: {x: 0.3, y: 0.35},
    props: {source: require('~/assets/images/main/l24.png')},
  },
  {
    component: ImageBG,
    parallaxFactor: {x: 0.1, y: 0.05},
    props: {
      source: require('~/assets/images/main/layer_10.png'),
    },
  },
];

interface MenuBackgroundProps {
  lookPosition: Location;
}

function MenuBackground({lookPosition}: MenuBackgroundProps) {
  return <ParallaxBackground lookPosition={lookPosition} layers={layers} />;
}

const styles = StyleSheet.create({
  imageStyle: {
    width: SCREEN_WIDTH * 1.2, // Slightly larger for parallax movement
    height: SCREEN_HEIGHT * 1.2,
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.1, // Center the oversized image
    top: -SCREEN_HEIGHT * 0.1,
  },
});

export default MenuBackground;
