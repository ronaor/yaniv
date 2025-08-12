import {Pressable, StyleSheet} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';

interface XButtonProps {
  onPress: () => void;
}

const XButton = ({onPress}: XButtonProps) => {
  const gradientColors = ['#FF9C1E', '#A21D03'];
  const internalGradientColors = ['#E64E08', '#D02A07'];

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.container, pressed && styles.pressed]}>
      <LinearGradient style={styles.gradient} colors={gradientColors}>
        <LinearGradient colors={internalGradientColors} style={styles.content}>
          <Svg width="26" height="26" viewBox="0 0 29 29">
            <Path
              d="M26.9039 7.90635C23.7244 11.3614 20.9439 14.4686 20.9439 14.4686C20.9439 14.4686 23.8843 17.5744 26.9039 20.9064C29.9235 24.2383 23.6133 30.1274 19.9039 26.4064C16.1945 22.6853 14.5851 21.1132 14.5851 21.1132C14.5851 21.1132 12.8482 22.9511 9.40392 26.4064C5.95961 29.8616 -1.59622 23.4062 1.90392 19.9064L7.4041 14.4065C7.4041 14.4065 6.4041 13.4065 2.4041 8.90649C-1.5959 4.40649 5.09995 -1.68582 9.40392 2.40649C13.7079 6.4988 14.5851 7.55839 14.5851 7.55839C14.5851 7.55839 18.1177 4.36894 20.9439 1.71127C23.77 -0.946403 30.0834 4.45133 26.9039 7.90635Z"
              fill="#FFFFFF"
              stroke="#582200"
              strokeWidth="2"
            />
          </Svg>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#9C1C04',
    borderRadius: 30,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#1A1208',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    borderRadius: 30,
    padding: 3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BC5810',
    borderRadius: 30,
    padding: 11,
  },
  contentDisabled: {
    backgroundColor: '#CCCCCC',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'transparent',
    textAlign: 'center',
  },
  textDisabled: {
    color: '#F0F0F0',
  },
  pressed: {
    transform: [{scale: 0.9}],
  },
});

export default XButton;
