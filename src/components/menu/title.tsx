import Svg, {Image} from 'react-native-svg';
import React from 'react';
import {Dimensions, View} from 'react-native';
const {width: screenWidth} = Dimensions.get('screen');
const width = 240;
const X = 17 / 24;
const height = width * X;

const titleStyle = {
  paddingVertical: 20,
  paddingHorizontal: 40,
};

function GameLogo() {
  return (
    <View style={titleStyle}>
      <Svg
        style={{transform: [{scale: (screenWidth / width) * 0.8}]}}
        width={width}
        height={height}
        viewBox={`0 0 ${3 * width} ${3 * height}`}
        fill="none">
        <Image
          width="710"
          height="500"
          href={require('~/assets/images/title.png')}
          preserveAspectRatio="xMidYMid meet"
        />
      </Svg>
    </View>
  );
}

export default GameLogo;
