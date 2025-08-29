import {StyleSheet, Text, View} from 'react-native';
import React, {ReactNode} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Poll from './poll';
import {normalize} from '~/utils/ui';

interface MenuButtonProps {
  children?: ReactNode;
  text: string;
  activeChoices?: {id: string; choice: any}[];
  choices: any[];
}

const LogContainer = ({
  children,
  text,
  choices,
  activeChoices,
}: MenuButtonProps) => {
  return (
    <View style={styles.container}>
      <LinearGradient style={styles.gradient} colors={['#DE8216', '#702900']}>
        <View style={styles.content}>
          <View style={styles.textWrap}>
            <Text style={styles.text}>{text}</Text>
            {children}
          </View>
          <Poll choices={choices} activeChoices={activeChoices ?? []} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#502404',
    padding: 3,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
  },
  gradient: {
    backgroundColor: '#843402',
    borderRadius: 20,
    paddingHorizontal: 3,
    paddingTop: 3,
    flexDirection: 'column',
  },
  content: {
    backgroundColor: '#A9500F',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 10,
  },

  text: {
    color: '#F9F09D',
    fontSize: normalize(19),
    textAlign: 'left',
    fontWeight: '700',
    paddingBottom: 3,
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default LogContainer;
