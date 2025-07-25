import {StyleSheet, Text, View} from 'react-native';

import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

interface UserAvatarProps {
  name: string;
  score: number;
}

function UserAvatar({name, score}: UserAvatarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.circle} />
      <View style={styles.log}>
        <LinearGradient
          style={styles.gradientLeft}
          colors={['#E57D21', '#923701', '#821601']}>
          <View style={styles.logLeft}>
            <Text style={styles.name}>{name}</Text>
          </View>
        </LinearGradient>
        <LinearGradient
          style={styles.gradientRight}
          colors={['#E78229', '#E57D21', '#821601']}>
          <View style={styles.logRight}>
            <Text style={styles.score}>{score}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

export default UserAvatar;

const styles = StyleSheet.create({
  circle: {
    width: 75,
    aspectRatio: 1,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: 'white',
    backgroundColor: '#139AC8',
    marginBottom: -8,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    padding: 5,
    paddingEnd: 7.5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FDEBC0',
  },
  score: {
    padding: 5,
    paddingStart: 7.5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FDEBC0',
  },

  gradientRight: {
    paddingEnd: 3,
    paddingVertical: 3,
    borderTopEndRadius: 20,
    borderBottomEndRadius: 20,
  },
  logRight: {
    borderTopEndRadius: 22,
    borderBottomEndRadius: 22,
    backgroundColor: '#ef8e2df0',
    flexDirection: 'row',
  },
  gradientLeft: {
    paddingStart: 3,
    paddingVertical: 3,
    borderTopStartRadius: 20,
    borderBottomStartRadius: 20,
  },
  logLeft: {
    backgroundColor: '#BB550C',
    flexDirection: 'row',
    borderTopStartRadius: 22,
    borderBottomStartRadius: 22,
  },
  log: {
    flexDirection: 'row',
    backgroundColor: '#821601',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
