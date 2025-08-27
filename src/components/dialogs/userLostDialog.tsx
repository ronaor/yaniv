import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import {normalize} from '~/utils/ui';

import XButton from '../menu/xButton';
import SimpleButton from '../menu/simpleButton';
import Dialog from '../dialog';

type UserLostDialogProps = {
  handleContinue: () => void;
  handleLeave: () => void;
};

export type UserLostDialogRef = {
  open: () => void;
  close: () => void;
};

const UserLostDialog = forwardRef<UserLostDialogRef, UserLostDialogProps>(
  (props, ref) => {
    const {handleContinue, handleLeave} = props;
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsModalOpen(true),
      close: () => setIsModalOpen(false),
    }));

    return (
      <Dialog isModalOpen={isModalOpen} onBackgroundPress={handleContinue}>
        <View style={styles.dialogBody}>
          <View style={styles.body}>
            <View style={styles.xButton}>
              <XButton onPress={handleContinue} />
            </View>
            <LinearGradient
              style={styles.gradient}
              colors={[
                '#DE8216',
                '#A9500F',
                '#A9500F',
                '#A9500F',
                '#783505ff',
              ]}>
              <View style={styles.content}>
                <Text style={styles.headerTitle}>{'YOU LOST!'}</Text>

                <View style={styles.textWrap}>
                  <Text style={styles.text}>{'Do you want to continue?'}</Text>
                </View>
                <View style={styles.buttonAdjuster}>
                  <SimpleButton
                    text="Leave"
                    size="small"
                    onPress={handleLeave}
                    colors={['#FA7902', '#D33F02', '#AF3300']}
                  />
                  <SimpleButton
                    text="Continue"
                    size="small"
                    onPress={handleContinue}
                    colors={['#5BD30E', '#3FA70B', '#277502']}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Dialog>
    );
  },
);

export default UserLostDialog;

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
    borderRadius: 25,
    paddingVertical: 3,
    flexDirection: 'column',
  },
  content: {
    backgroundColor: '#A05101',
    borderRadius: 23,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FDE689',
    padding: 10,
    textAlign: 'center',
  },
  title: {
    color: '#F9F09D',
    fontSize: normalize(18),
    textAlign: 'left',
    fontWeight: '700',
  },
  buttonAdjuster: {
    justifyContent: 'space-evenly',
    padding: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  xButton: {position: 'absolute', zIndex: 10, right: -20, top: -20},

  text: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
    color: '#FFEF9C',
  },
  textWrap: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#854101',
    width: '100%',
  },
});
