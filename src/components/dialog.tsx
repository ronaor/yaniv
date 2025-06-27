import {StyleSheet, View} from 'react-native';
import withModalPopUpContainer from './popupContainer';
import React, {ReactNode} from 'react';

interface DialogContentProps {
  children: ReactNode;
  isModalOpen: boolean;
  onBackgroundPress: () => void;
}

const DialogContent = ({children}: DialogContentProps) => {
  return <View style={styles.body}>{children}</View>;
};

const Dialog = withModalPopUpContainer(DialogContent);

const styles = StyleSheet.create({
  body: {
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'column',
  },
});

export default Dialog;
