import React, {ReactNode, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MenuToggle from '~/components/menu/mainToggleSwitch';
import {RoomConfig} from '~/types/player';
import SelectionBar from '../menu/mainSelectionBar';
import {normalize} from '~/utils/ui';
import {GAME_CONFIG} from '~/utils/constants';
import XButton from '../menu/xButton';
import SimpleButton from '../menu/simpleButton';
import AlternatingRowsList from '~/components/menu/alternatingRowsList';

type CreateRoomDialogProps = {
  onCreateRoom: (data: RoomConfig) => void;
  onClose: () => void;
};

interface RowItemProps {
  text?: string;
  children?: ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
}

function RowItem({text, children}: RowItemProps) {
  return (
    <View style={styles.itemInner}>
      {text ? <Text style={styles.title}>{text}</Text> : null}
      {children}
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
        <AlternatingRowsList colorOdd={['#692a00', '#873D00', '#7d3301']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{'CREATE ROOM'}</Text>
          </View>
          <RowItem text={'Enable Slap-Down'}>
            <MenuToggle isOn={slapDown} setIsOn={setSlapDown} />
          </RowItem>
          <RowItem text={'Call Yaniv at'}>
            <SelectionBar
              selectionIndex={callYanivAt}
              setSelection={setCallYanivAt}
              elements={GAME_CONFIG.CALL_YANIV_OPTIONS}
            />
          </RowItem>
          <RowItem text={'Max Score'}>
            <SelectionBar
              selectionIndex={maxScoreLimit}
              setSelection={setMaxScoreLimit}
              elements={GAME_CONFIG.MAX_SCORE_OPTIONS}
            />
          </RowItem>
          <RowItem>
            <View style={styles.buttonAdjuster}>
              <SimpleButton
                text="CREATE"
                onPress={handleCreateRoom}
                colors={['#A0D72C', '#3BA209', '#2C8408']}
              />
            </View>
          </RowItem>
        </AlternatingRowsList>
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
  body: {},
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
  itemInner: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
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
