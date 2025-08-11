import React, {ReactNode, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MenuToggle from '~/components/menu/mainToggleSwitch';
import {RoomConfig} from '~/types/player';
import SelectionBar from './menu/mainSelectionBar';
import LinearGradient from 'react-native-linear-gradient';
import {normalize} from '~/utils/ui';
import CreateButton from './menu/createButton';

type StartGameDialogProps = {
  onCreateRoom: (data: RoomConfig) => void;
};

const CALL_YANIV_AVAILABLE_AT = ['3', '5', '7'];
const MAX_SCORE_LIMIT_OPTIONS = ['50', '100', '200'];

interface RowItemProps {
  text?: string;
  children?: ReactNode;
  index: number;
  isLast: boolean;
}

function RowItem({text, children, index, isLast}: RowItemProps) {
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

export default function StartGameDialog({onCreateRoom}: StartGameDialogProps) {
  const [slapDown, setSlapDown] = useState(true);
  const [callYanivAt, setCallYanivAt] = useState(2);
  const [maxScoreLimit, setMaxScoreLimit] = useState(1);

  const handleCreateRoom = () => {
    onCreateRoom({
      slapDown,
      canCallYaniv: +CALL_YANIV_AVAILABLE_AT[callYanivAt],
      maxMatchPoints: +MAX_SCORE_LIMIT_OPTIONS[maxScoreLimit],
    });
  };

  return (
    <View style={styles.dialogBody}>
      <View style={styles.body}>
        <LinearGradient
          style={styles.gradientHeader}
          colors={['#DE8216', '#702900']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{'CREATE ROOM'}</Text>
          </View>
        </LinearGradient>
        <RowItem text={'Enable Slap-Down'} index={0} isLast={false}>
          <MenuToggle isOn={slapDown} setIsOn={setSlapDown} />
        </RowItem>
        <RowItem text={'Call Yaniv at'} index={1} isLast={false}>
          <SelectionBar
            selectionIndex={callYanivAt}
            setSelection={setCallYanivAt}
            elements={CALL_YANIV_AVAILABLE_AT}
          />
        </RowItem>
        <RowItem text={'Max Score'} index={2} isLast={false}>
          <SelectionBar
            selectionIndex={maxScoreLimit}
            setSelection={setMaxScoreLimit}
            elements={MAX_SCORE_LIMIT_OPTIONS}
          />
        </RowItem>
        <RowItem index={3} isLast={true}>
          <View style={styles.buttonAdjuster}>
            <CreateButton text="CREATE" onPress={handleCreateRoom} />
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
    padding: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    width: '100%',
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
  playerAvatar: {
    aspectRatio: 1,
    width: 25,
    backgroundColor: '#F7AD02',
    borderRadius: 25,
    borderColor: '#3B1603',
    borderWidth: 2,
  },
  title: {
    color: '#F9F09D',
    fontSize: normalize(20),
    textAlign: 'left',
    fontWeight: '700',
  },
  buttonAdjuster: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
