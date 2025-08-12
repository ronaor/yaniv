import React, {ReactNode, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MenuToggle from '~/components/menu/mainToggleSwitch';
import {RoomConfig} from '~/types/player';
import SelectionBar from '../menu/mainSelectionBar';
import LinearGradient from 'react-native-linear-gradient';
import {normalize} from '~/utils/ui';
import {GAME_CONFIG} from '~/utils/constants';
import XButton from '../menu/xButton';
import SimpleButton from '../menu/simpleButton';

type CreateRoomDialogProps = {
  onCreateRoom: (data: RoomConfig) => void;
  onClose: () => void;
};

interface RowItemProps {
  text?: string;
  children?: ReactNode;
  index: number;
  isLast?: boolean;
}

function RowItem({text, children, index, isLast = false}: RowItemProps) {
  const isOdd = index % 2 === 1;

  return (
    <View
      style={[
        styles.itemOuter,
        isOdd ? styles.itemOuterOdd : styles.itemOuterEven,
        isLast && styles.itemOuterLast,
      ]}>
      <View
        style={[
          styles.itemInner,
          isOdd ? styles.itemInnerOdd : styles.itemInnerEven,
          isLast && styles.itemInnerLast,
        ]}>
        {text ? <Text style={styles.title}>{text}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export default function CreateRoomDialog({
  onCreateRoom,
  onClose,
}: CreateRoomDialogProps) {
  const [slapDown, setSlapDown] = useState(GAME_CONFIG.DEFAULT_VALUES.slapDown);
  const [callYanivAt, setCallYanivAt] = useState(
    GAME_CONFIG.DEFAULT_VALUES.callYanivIndex,
  );
  const [maxScoreLimit, setMaxScoreLimit] = useState(
    GAME_CONFIG.DEFAULT_VALUES.maxScoreIndex,
  );

  const handleCreateRoom = () => {
    onCreateRoom({
      slapDown,
      canCallYaniv: +GAME_CONFIG.CALL_YANIV_OPTIONS[callYanivAt],
      maxMatchPoints: +GAME_CONFIG.MAX_SCORE_OPTIONS[maxScoreLimit],
    });
  };

  return (
    <View style={styles.dialogBody}>
      <View style={styles.body}>
        <View style={styles.xButton}>
          <XButton onPress={onClose} />
        </View>
        <LinearGradient
          style={styles.gradientHeader}
          colors={['#DE8216', '#702900']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{'CREATE ROOM'}</Text>
          </View>
        </LinearGradient>
        <RowItem text={'Enable Slap-Down'} index={0}>
          <MenuToggle isOn={slapDown} setIsOn={setSlapDown} />
        </RowItem>
        <RowItem text={'Call Yaniv at'} index={1}>
          <SelectionBar
            selectionIndex={callYanivAt}
            setSelection={setCallYanivAt}
            elements={GAME_CONFIG.CALL_YANIV_OPTIONS}
          />
        </RowItem>
        <RowItem text={'Max Score'} index={2}>
          <SelectionBar
            selectionIndex={maxScoreLimit}
            setSelection={setMaxScoreLimit}
            elements={GAME_CONFIG.MAX_SCORE_OPTIONS}
          />
        </RowItem>
        <RowItem index={3} isLast={true}>
          <View style={styles.buttonAdjuster}>
            <SimpleButton
              text="CREATE"
              onPress={handleCreateRoom}
              colors={['#A0D72C', '#2C8408']}
              mainColor={'#3BA209'}
            />
          </View>
        </RowItem>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogBody: {
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    backgroundColor: '#502404',
    borderRadius: 28,
    shadowColor: '#000',
    padding: 3,
  },
  gradient: {
    backgroundColor: '#843402',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 3,
    flexDirection: 'column',
    paddingBottom: 3,
  },
  content: {
    backgroundColor: '#A9500F',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 10,
  },
  gradientHeader: {
    backgroundColor: '#843402',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 3,
    paddingTop: 3,
  },
  headerContent: {
    backgroundColor: '#A9500F',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffffff',
    padding: 10,
  },
  itemOuter: {
    paddingHorizontal: 3,
  },
  itemOuterEven: {
    backgroundColor: '#702900',
  },
  itemOuterOdd: {
    backgroundColor: '#903300',
  },
  itemOuterLast: {
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    paddingBottom: 3,
  },
  itemInner: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  itemInnerEven: {
    backgroundColor: '#873D00',
  },
  itemInnerOdd: {
    backgroundColor: '#AA4E08',
  },
  itemInnerLast: {
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  title: {
    color: '#F9F09D',
    fontSize: normalize(18),
    textAlign: 'left',
    fontWeight: '700',
  },
  buttonAdjuster: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xButton: {position: 'absolute', zIndex: 10, right: -20, top: -20},
});
