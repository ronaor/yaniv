import {noop} from 'lodash';
import React, {forwardRef, useImperativeHandle, useState} from 'react';
import Dialog from '../dialog';
import {PlayerStatus} from '~/types/player';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {normalize} from '~/utils/ui';
import {OutlinedText} from '../cartoonText';
import LinearGradient from 'react-native-linear-gradient';
import SimpleButton from '../menu/simpleButton';
import PlayerResultRow from '../user/playerResult';
import Animated, {FadeIn} from 'react-native-reanimated';

const Header = () => (
  <View style={styles.header}>
    <View style={styles.headerTextWrapper}>
      <OutlinedText
        text="GAME OVER!"
        fontSize={normalize(27)}
        width={210}
        height={40}
        fillColor={'#FFD100'}
        strokeColor={'#4C2400'}
        strokeWidth={5}
        fontWeight={'800'}
      />
    </View>
    <View style={styles.headerDown} />
  </View>
);

const {width: screenWidth} = Dimensions.get('screen');

interface Player {
  id: string;
  name: string;
  status: PlayerStatus;
}

interface EndGameDialogProps {
  handleLeave: () => void;
  playAgain: () => void;
}

export interface EndGameDialogRef {
  open: (players: Player[]) => void;
  close: () => void;
}

const MAIN_COLORS = ['#6f3200ff', '#783e12ff'];

const EndGameDialog = forwardRef<EndGameDialogRef, EndGameDialogProps>(
  (props, ref) => {
    const {handleLeave, playAgain} = props;
    const [isOpen, setIsOpen] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);

    useImperativeHandle(ref, () => ({
      open: (playersData: Player[]) => {
        setPlayers(playersData);
        setIsOpen(true);
      },
      close: () => {
        setIsOpen(false);
      },
    }));

    const footerColor = {
      backgroundColor: MAIN_COLORS[players.length % 2],
    };

    return (
      <Dialog isModalOpen={isOpen} onBackgroundPress={noop}>
        <View style={styles.dialogBody}>
          <Header />
          <LinearGradient
            colors={['#DE7D08', '#9E4D04']}
            style={styles.gradient}>
            <View style={styles.border}>
              <View style={styles.borderEdge}>
                <View style={styles.padderUp} />
                {players.map((player, index) => (
                  <PlayerResultRow
                    index={index}
                    key={player.id}
                    {...player}
                    color={MAIN_COLORS[index % 2]}
                  />
                ))}
                <View style={[styles.footer, footerColor]}>
                  <View style={styles.footerWrapper}>
                    <Text style={styles.coinsEarn}>{'+100 COINS'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
          <Animated.View style={styles.buttons} entering={FadeIn}>
            <View style={styles.buttonWrapper}>
              <SimpleButton
                text={'Play Again'}
                borderColor="#2B4200"
                onPress={playAgain}
                colors={['#8BB501', '#418800', '#266B02']}
                size="small"
              />
            </View>
            <View style={styles.buttonWrapper}>
              <SimpleButton
                text={'Leave'}
                onPress={handleLeave}
                colors={['#FA7902', '#D33F02', '#AF3300']}
                size="small"
              />
            </View>
          </Animated.View>
        </View>
      </Dialog>
    );
  },
);

const styles = StyleSheet.create({
  dialogBody: {
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxWidth: screenWidth - 42,
  },

  header: {
    marginBottom: -40,
    paddingTop: 3,
    backgroundColor: '#D1780E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 3,
    borderColor: '#4C2400',
    zIndex: 5,
  },
  headerTextWrapper: {
    paddingTop: 5,
    paddingBottom: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#A95004',
    marginBottom: -10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 10,
  },
  headerDown: {
    height: 40,
    backgroundColor: '#803A01',
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    marginTop: -25,
    zIndex: -1,
  },

  gradient: {
    borderWidth: 3,
    borderColor: '#4C2400',
    borderRadius: 30,
    padding: 3,
    width: screenWidth - 42,
  },
  border: {
    borderRadius: 25,
    backgroundColor: '#A95402',
    padding: 10,
  },
  borderEdge: {
    borderColor: '#4C2400',
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: '#672f04ff',
    paddingTop: 3,
  },
  padderUp: {
    height: 40,
    backgroundColor: MAIN_COLORS[1],
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  footer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 50,
    paddingBottom: 5,
  },
  footerWrapper: {
    borderRadius: 20,
    backgroundColor: '#aa5200ff',
    paddingHorizontal: 8,
  },
  coinsEarn: {fontSize: 25, fontWeight: '700', color: '#FDC200'},
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingTop: 10,
    paddingHorizontal: 30,
  },
  buttonWrapper: {width: '50%'},
});

export default EndGameDialog;
