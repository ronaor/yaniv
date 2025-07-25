import React from 'react';
import Svg, {Text} from 'react-native-svg';
import {Platform} from 'react-native';

interface OutlinedTextProps {
  text: string;
  fontSize: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth?: number;
}

export const OutlinedText = ({
  text,
  fontSize,
  width,
  height,
  fillColor,
  strokeColor,
  strokeWidth = 3,
}: OutlinedTextProps) => {
  const centerX = width / 2;
  const centerY = height / 2;

  // Safe font family with fallbacks
  const fontFamily = Platform.select({
    ios: 'LuckiestGuy-Regular',
    android: 'LuckiestGuy-Regular',
    default: 'Arial-BoldMT', // Fallback
  });

  const textProps = {
    fontSize,
    fontWeight: 'bold' as const,
    x: centerX,
    y: centerY + 5,
    textAnchor: 'middle' as const,
    alignmentBaseline: 'central' as const,
    fontFamily,
  };

  return (
    <Svg height={height} width={width}>
      {/* Stroke layer */}
      <Text
        {...textProps}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round">
        {text}
      </Text>

      {/* Fill layer */}
      <Text {...textProps} fill={fillColor}>
        {text}
      </Text>
    </Svg>
  );
};
