import React, {ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import withModalPopUpContainer from './popupContainer';

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
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
});

export default Dialog;
