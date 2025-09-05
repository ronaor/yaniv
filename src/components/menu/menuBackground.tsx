import {ImageSourcePropType, Animated, StyleSheet, View} from 'react-native';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';
import Waves from './waves';
import {Location} from '~/types/cards';
import ParallaxBackground from '~/backgrounds/parallaxBackground';
import React from 'react';
import {create} from 'zustand';

interface MenuStore {
  lookPosition: Location;
  setLookPosition: (position: Location) => void;
}

export const useMenuStore = create<MenuStore>((set, _get) => ({
  lookPosition: {x: 0, y: -400},

  setLookPosition: position => {
    set({lookPosition: position});
  },
}));

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

interface MenuBackgroundProps {}

function MenuBackground({}: MenuBackgroundProps) {
  const {lookPosition} = useMenuStore();
  return (
    <View style={styles.absolute}>
      <ParallaxBackground lookPosition={lookPosition} layers={layers} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageStyle: {
    width: SCREEN_WIDTH * 1.2, // Slightly larger for parallax movement
    height: SCREEN_HEIGHT * 1.2,
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.1, // Center the oversized image
    top: -SCREEN_HEIGHT * 0.1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#25afe1',
  },
});

export default MenuBackground;
